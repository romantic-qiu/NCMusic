<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginKey = ref('')
const qrImg = ref('')
// 二维码检查定时器
const qrCheckTimer = ref(null)

const handleOverlayClick = (event) => {
  // 只在点击遮罩层（而不是弹出框本身）时关闭
  if (event.target === event.currentTarget) {
    router.push('/')
  }
}

// 获取二维码登录的 key
const fetchLoginKey = async () => {
  try {
    // 对应接口：http://localhost:3000/login/qr/key
    const res = await api.get('/login/qr/key')
    // 常见返回结构：{ code: 200, data: { unikey: '...' } }
    loginKey.value = res.data?.unikey || ''
  } catch (err) {
    console.error('获取二维码登录 key 失败', err)
    loginKey.value = ''
  }
}

// 根据 key 获取二维码图片
const fetchQrImage = async (key) => {
  if (!key) return
  try {
    // 对应接口：http://localhost:3000/login/qr/create?key=xxx&qrimg=true&timestamp=xxx&ua=pc
    const res = await api.get('/login/qr/create', {
      key,
      qrimg: true,
      timestamp: Date.now(),
      ua: 'pc',
    })
    // 常见返回结构：{ code: 200, data: { qrimg: 'data:image/png;base64,...' } }
    qrImg.value = res.data?.qrimg || ''
  } catch (err) {
    console.error('获取二维码图片失败', err)
    qrImg.value = ''
  }
}

watch(
  () => loginKey.value,
  (val) => {
    if (val) {
      fetchQrImage(val)
    }
  },
)

// 轮询二维码状态，成功后保存用户信息
const startQrCheck = (key) => {
  if (!key) return
  if (qrCheckTimer.value) {
    clearInterval(qrCheckTimer.value)
  }
  qrCheckTimer.value = setInterval(async () => {
    try {
      const res = await api.get('/login/qr/check', {
        key,
        timestamp: Date.now(),
        ua: 'pc',
      })
      // 常见状态：800 二维码过期，801 等待扫码，802 已扫码待确认，803 授权成功
      if (res.code === 803) {
        clearInterval(qrCheckTimer.value)
        qrCheckTimer.value = null

        // 授权成功后再调用 login/status 获取完整用户信息
        try {
          const statusRes = await api.get('/login/status', {
            timestamp: Date.now(),
            ua: 'pc',
          })
          const profile = statusRes.data?.profile || statusRes.profile || statusRes.account
          console.log(profile);
          
          if (profile) {
            userStore.setUser({
              id: profile.userId || profile.id,
              nickname: profile.nickname || profile.name,
              avatar: profile.avatarUrl,
            })
          }
        } catch (e) {
          console.error('获取登录状态失败', e)
        }

        router.push('/')
      }
    } catch (err) {
      console.error('检查二维码登录状态失败', err)
    }
  }, 3000)
}

watch(
  () => qrImg.value,
  (val) => {
    // 有二维码图片且有 key 时开始轮询
    if (val && loginKey.value) {
      startQrCheck(loginKey.value)
    }
  },
)

onMounted(() => {
  fetchLoginKey()
})

onBeforeUnmount(() => {
  if (qrCheckTimer.value) {
    clearInterval(qrCheckTimer.value)
    qrCheckTimer.value = null
  }
})
</script>

<template>
  <div class="login-overlay" @click="handleOverlayClick">
    <div class="login-modal">
      <div class="login-header">
        <h2>扫码登录网易云音乐</h2>
        <p>使用网易云音乐 APP 扫码登录，更安全更快捷</p>
      </div>

      <div class="login-body">
        <div class="qrcode-box">
          <div class="qrcode-placeholder">
            <template v-if="qrImg">
              <img :src="qrImg" alt="登录二维码" />
            </template>
            <template v-else>
              <span>二维码加载中...</span>
            </template>
          </div>
          <p class="qrcode-tip">打开网易云音乐 APP，扫一扫登录</p>
        </div>

        <ul class="login-features">
          <li>同步收藏的歌单、歌曲和播放记录</li>
          <li>多端同步，随时随地畅听音乐</li>
          <li>更安全的扫码登录方式</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.login-modal {
  width: 420px;
  padding: 24px 32px 32px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
}

.login-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.login-header p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #666;
}

.login-body {
  margin-top: 20px;
  display: flex;
  gap: 20px;
}

.qrcode-box {
  text-align: center;
}

.qrcode-placeholder {
  width: 140px;
  height: 140px;
  border-radius: 4px;
  background: #f5f5f5;
  border: 1px solid #e1e1e1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

.qrcode-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.qrcode-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.login-features {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  color: #555;
}

.login-features li + li {
  margin-top: 8px;
}
</style>