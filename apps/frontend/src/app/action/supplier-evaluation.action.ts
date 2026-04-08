import axios from "axios";
import { AUTH_API_URL } from "../../lib/auth-api-url";

const API_URL = `${AUTH_API_URL}/supplier-evaluations`;

function getAuthHeaders(): { Authorization?: string } {
  const authData = localStorage.getItem("smartsite-auth");
  const token =
    localStorage.getItem("access_token") ||
    (authData
      ? (() => {
          try {
            return JSON.parse(authData)?.state?.user?.access_token;
          } catch {
            return null;
          }
        })()
      : null);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface SupplierEvaluation {
  _id?: string;
  supplierId: string | { _id: string; name: string; category: string };
  qualityRating: number;
  priceRating: number;
  deliveryRating: number;
  communicationRating: number;
  overallRating?: number;
  comment?: string;
  evaluatedBy: string;
  projectName?: string;
  deliveryDays?: number;
  priceRange?: string;
  createdAt?: string;
}

export interface SupplierStats {
  avgQuality: number;
  avgPrice: number;
  avgDelivery: number;
  avgCommunication: number;
  avgOverall: number;
  avgDeliveryDays: number;
  count: number;
}

export const createEvaluation = async (data: {
  supplierId: string;
  qualityRating: number;
  priceRating: number;
  deliveryRating: number;
  communicationRating: number;
  comment?: string;
  evaluatedBy: string;
  projectName?: string;
  deliveryDays?: number;
  priceRange?: string;
}): Promise<{ status: number; data: SupplierEvaluation }> => {
  try {
    const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Create evaluation error:", err?.response?.data);
    return { status: err?.response?.status ?? 500, data: {} as SupplierEvaluation };
  }
};

export const getEvaluationsBySupplier = async (supplierId: string): Promise<{ status: number; data: SupplierEvaluation[] }> => {
  try {
    const res = await axios.get(`${API_URL}/supplier/${supplierId}`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Get evaluations error:", err?.response?.data);
    return { status: err?.response?.status ?? 500, data: [] };
  }
};

export const getSupplierStats = async (supplierId: string): Promise<{ status: number; data: SupplierStats | null }> => {
  try {
    const res = await axios.get(`${API_URL}/supplier/${supplierId}/stats`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Get stats error:", err?.response?.data);
    return { status: err?.response?.status ?? 500, data: null };
  }
};

export const getComparisonData = async (category?: string): Promise<{ status: number; data: any[] }> => {
  try {
    const params = category ? `?category=${category}` : "";
    const res = await axios.get(`${API_URL}/comparison${params}`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Get comparison error:", err?.response?.data);
    return { status: err?.response?.status ?? 500, data: [] };
  }
};

export const getAllEvaluations = async (query?: {
  supplierId?: string;
  page?: number;
  limit?: number;
}): Promise<{ status: number; data: SupplierEvaluation[]; total?: number }> => {
  try {
    const params = new URLSearchParams();
    if (query?.supplierId) params.append("supplierId", query.supplierId);
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());

    const res = await axios.get(`${API_URL}?${params.toString()}`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data.data, total: res.data.total };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Get all evaluations error:", err?.response?.data);
    return { status: err?.response?.status ?? 500, data: [] };
  }
};

export const updateEvaluation = async (id: string, data: Partial<SupplierEvaluation>): Promise<{ status: number; data: SupplierEvaluation }> => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Update evaluation error:", err?.response?.data);
    return { status: err?.response?.status ?? 500, data: {} as SupplierEvaluation };
  }
};

export const deleteEvaluation = async (id: string): Promise<{ status: number }> => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return { status: res.status };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    console.error("Delete evaluation error:", err?.response?.data);
    return { status: err?.response?.status ?? 500 };
  }
};
