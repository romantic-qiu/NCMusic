import { ref,computed } from "vue"
import { defineStore } from "pinia"

// 本地存储的Key
const STORAGE_KEY = "nc_user"

export const useUserStore = defineStore('user',() =>{
    const user = ref(null)

    // 判断是否已经登录
    const isLoggedIn = computed(() => !!user.value)

    // 状态管理的存储，不仅要在pinia，也要存储在本地
    const setUser = (payload) =>{
        if(!payload) return 
        const normalized = {
            id:payload.id,
            nickname:payload.nickname,
            avatar:payload.avatar
        }
        user.value = normalized
        localStorage.setItem(STORAGE_KEY,JSON.stringify(normalized))
    }

    const clearUser = () =>{
        user.value = null
        localStorage.removeItem(STORAGE_KEY)
    }

    // 从本地存储中初始化用户信息
    const initFromLocal = () =>{
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        if(parsed && parsed.id){
            user.value = parsed
        }
    }

    initFromLocal()

    return {
        user,
        isLoggedIn,
        setUser,
        clearUser
    }

})