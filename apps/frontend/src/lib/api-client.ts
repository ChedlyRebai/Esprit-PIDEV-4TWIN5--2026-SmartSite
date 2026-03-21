import axios from "axios"

export const planingApi= axios.create({
    baseURL: process.env.PLANNING_URL || "http://localhost:3002",
    headers: { "Content-Type": "application/json"}
})



export const userApi=axios.create({
    baseURL: process.env.LOGIN_API_URL || "http://localhost:3001",
    headers: { "Content-Type": "application/json" }
})

