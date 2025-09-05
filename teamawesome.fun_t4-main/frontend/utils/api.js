import axios from "axios";
import { setCookie, getCookie } from "./cookie.js";

const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = getCookie("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        const token = response.data?.data?.token;
        if (token) {
            setCookie("token", token);
        }
        return response;
    },
);

export default api;