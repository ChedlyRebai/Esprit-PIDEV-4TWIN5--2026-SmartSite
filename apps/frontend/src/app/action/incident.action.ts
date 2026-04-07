import axios from "axios";
import type { Incident } from "../types";

const api = axios.create({
  baseURL: "http://localhost:3002",
});

export const fetchIncidents = async (): Promise<Incident[]> => {
  const res = await api.get("/incidents");
  return res.data;
};

export const createIncident = async (payload: {
  type: Incident["type"];
  title: string;
  description: string;
  severity: Incident["severity"];
  reporterName?: string;
  reporterPhone?: string;
  imageUrl?: string;
  assignedToCin?: string;
}): Promise<Incident> => {
  const res = await api.post("/incidents", {
    type: payload.type,
    severity: payload.severity,
    title: payload.title,
    description: payload.description,
    reporterName: payload.reporterName,
    reporterPhone: payload.reporterPhone,
    imageUrl: payload.imageUrl,
    assignedToCin: payload.assignedToCin,
  });
  return res.data;
};

export const resolveIncident = async (id: string): Promise<Incident> => {
  const res = await api.put(`/incidents/${id}`, {
    status: "resolved",
  });
  return res.data;
};

