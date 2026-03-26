import { NotificationApi } from "@/lib/api-client"



export const getMyNotifications= async ()=>{
    const {data} = await NotificationApi.get('/mynotifications')
    return data;
}

export const getUnreadNotifications= async ()=>{
    const {data} = await NotificationApi.get('/unread')
    return data;
}

export const getReadNotifications= async ()=>{
    const {data} = await NotificationApi.get('/read')
    return data;
}

export const getUnreadNotificationCount= async ()=>{
    const {data} = await NotificationApi.get('/unread-count')
    return data;
}