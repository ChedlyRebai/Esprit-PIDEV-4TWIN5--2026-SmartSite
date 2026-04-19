import axios from "axios";
import { AUTH_API_URL } from "../../lib/auth-api-url";

const API_URL = `${AUTH_API_URL}/catalog`;

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

export interface CatalogItem {
  _id?: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  technicalSpec?: string;
  description?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getAllCatalogItems = async (query?: {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ status: number; data: CatalogItem[]; total?: number; page?: number; limit?: number }> => {
  try {
    const params = new URLSearchParams();
    if (query?.search) params.append("search", query.search);
    if (query?.category) params.append("category", query.category);
    if (query?.status) params.append("status", query.status);
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());

    const res = await axios.get(`${API_URL}?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return { status: res.status, data: res.data.data, total: res.data.total, page: res.data.page, limit: res.data.limit };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Get all catalog items error:", err?.response?.data);
    return {
      status: err?.response?.status ?? 500,
      data: [],
    };
  }
};

export const getCatalogItemById = async (id: string): Promise<{ status: number; data: CatalogItem }> => {
  try {
    const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Get catalog item error:", err?.response?.data);
    return {
      status: err?.response?.status ?? 500,
      data: {} as CatalogItem,
    };
  }
};

export const createCatalogItem = async (itemData: Partial<CatalogItem>): Promise<{ status: number; data: CatalogItem }> => {
  try {
    const res = await axios.post(API_URL, itemData, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Create catalog item error:", err?.response?.data);
    return {
      status: err?.response?.status ?? 500,
      data: {} as CatalogItem,
    };
  }
};

export const updateCatalogItem = async (id: string, itemData: Partial<CatalogItem>): Promise<{ status: number; data: CatalogItem }> => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, itemData, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Update catalog item error:", err?.response?.data);
    return {
      status: err?.response?.status ?? 500,
      data: {} as CatalogItem,
    };
  }
};

export const deleteCatalogItem = async (id: string): Promise<{ status: number }> => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return { status: res.status };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    console.error("Delete catalog item error:", err?.response?.data);
    return { status: err?.response?.status ?? 500 };
  }
};

export const getCatalogCategories = async (): Promise<{ status: number; data: string[] }> => {
  try {
    const res = await axios.get(`${API_URL}/categories`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Get categories error:", err?.response?.data);
    return { status: err?.response?.status ?? 500, data: [] };
  }
};