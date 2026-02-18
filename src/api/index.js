import axios from "axios";
const BASE_URL = "https://wangyiyunnode.vercel.app"
const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true
});
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token")
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)
instance.interceptors.response.use(
    (response) =>{
        const res = response.data
        return res
    },
    (error) =>{
        return Promise.reject(error)
    }
)
export function get(url,params = {},config = {}){
    return instance.get(url,{params,...config})
}
export function post(url,data={},config={}){
    return instance.post(url,data,config)
}
const api = {
    get,
    post
}
export default api