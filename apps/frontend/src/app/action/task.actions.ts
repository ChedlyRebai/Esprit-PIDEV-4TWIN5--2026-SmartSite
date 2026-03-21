// services/task.service.ts

import { planingApi } from "@/lib/api-client";
import { CreateTaskPayload,UpdateTaskPayload } from "../types";

export const getTasksByMilestoneId = async (milestoneId: string) => {
  const { data } = await planingApi.get(`/task/milestone/${milestoneId}`);
  return data;
};

export const createTask = async (task: CreateTaskPayload) => {
  const { data } = await planingApi.post(`/task`, task);
  return data;
};

export const updateTask = async (
  taskId: string,
  task: UpdateTaskPayload
) => {
  const { data } = await planingApi.put(`/task/${taskId}`, task);
  return data;
};

export const deleteTask = async (taskId: string) => {
  await planingApi.delete(`/task/${taskId}`);
};