import axios from "axios";
import { Milestone } from "../types";


const baseUrl = (import.meta.env as any).PLANNING_URL || 'http://localhost:3002';

export const getMilestonesByProjectId = async (projectId:string):Promise<Milestone[]> =>{
    try {
        //http://localhost:3002/milestone/project/69bc6b4219254da8217aaadf
        const response = await axios.get(`${baseUrl}/milestone/project/${projectId}`);
        return Promise.resolve({status:response.status,data:response.data})
    } catch (error) {
        console.log('Error fetching milestones:', error);
        return Promise.reject(error);
    }
}


export const createMilestone=async (milestone : Milestone) =>{
    try {
        const response = await axios.post(`${baseUrl}/milestone`,milestone);
        return Promise.resolve({status:response.status,data:response.data})
    } catch (error) {
        console.log('Error creating milestone:', error);
        return Promise.reject(error);
    }
}

export const getMilestoneDetails=async (milestoneId:string) =>{
    try {
        const response = await axios.get(`${baseUrl}/milestone/${milestoneId}`);
        return Promise.resolve({status:response.status,data:response.data})
    }
        catch (error) {
        console.log('Error fetching milestone details:', error);
        return Promise.reject(error);
    }
}

export const updateMilestone = async (milestoneId:string,milestone:Milestone) =>{
    try {
        const response =await axios.patch(`${baseUrl}/milestone/${milestoneId}`,milestone);
        return Promise.resolve({status:response.status,data:response.data})

    } catch (error) {
        console.log('Error updating milestone:', error);
        return Promise.reject(error);
    }
}


export const deleteMilestone = async (milestoneId:string) =>{
    try {
        const response = await axios.delete(`${baseUrl}/milestone/${milestoneId}`);
        return Promise.resolve({status:response.status,data:response.data})
    } catch (error) {
        console.log('Error deleting milestone:', error);
        return Promise.reject(error);
    }
}

export const getAllMilestones = async () =>{
    try {
        const response = await axios.get(`${baseUrl}/milestone`);
        return Promise.resolve({status:response.status,data:response.data})
    } catch (error) {
        console.log('Error fetching milestones:', error);
        return Promise.reject(error);
    }
}

export const getMilestoneTasks = async (milestoneId:string) =>{
    try {
        const response = await axios.get(`${baseUrl}/milestone/${milestoneId}`);
        return Promise.resolve({status:response.status,data:response.data.tasks})
    } catch (error) {
        console.log('Error fetching milestone tasks:', error);
        return Promise.reject(error);
    }
}

export const getMilestoneProgress = async (milestoneId:string) =>{
    try {
        const response = await axios.get(`${baseUrl}/milestone/${milestoneId}`);
        return Promise.resolve({status:response.status,data:response.data.progress})
     }
        catch (error) {
        console.log('Error fetching milestone progress:', error);
        return Promise.reject(error);
     }
}