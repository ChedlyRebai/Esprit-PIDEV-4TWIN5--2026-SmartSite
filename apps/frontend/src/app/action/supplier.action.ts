import axios from "axios";
import { AUTH_API_URL } from "../../lib/auth-api-url";

const API_URL = `${AUTH_API_URL}/suppliers`;

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

export interface Supplier {
  _id?: string;
  name: string;
  supplierCode: string;
  category: string;
  specialty?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: string;
  averageDeliveryDays?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getAllSuppliers = async (query?: {
  search?: string;
  category?: string;
  city?: string;
  country?: string;
  page?: number;
  limit?: number;
}): Promise<{ status: number; data: Supplier[]; total?: number; page?: number; limit?: number }> => {
  try {
    const params = new URLSearchParams();
    if (query?.search) params.append("search", query.search);
    if (query?.category) params.append("category", query.category);
    if (query?.city) params.append("city", query.city);
    if (query?.country) params.append("country", query.country);
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());

    const res = await axios.get(`${API_URL}?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return { status: res.status, data: res.data.data, total: res.data.total, page: res.data.page, limit: res.data.limit };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Get all suppliers error:", err?.response?.data);
    return {
      status: err?.response?.status ?? 500,
      data: [],
    };
  }
};

export const getSupplierById = async (id: string): Promise<{ status: number; data: Supplier }> => {
  try {
    const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Get supplier error:", err?.response?.data);
    return {
      status: err?.response?.status ?? 500,
      data: {} as Supplier,
    };
  }
};

export const createSupplier = async (supplierData: Partial<Supplier>): Promise<{ status: number; data: Supplier }> => {
  try {
    const res = await axios.post(API_URL, supplierData, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Create supplier error:", err?.response?.data);
    return {
      status: err?.response?.status ?? 500,
      data: {} as Supplier,
    };
  }
};

export const updateSupplier = async (id: string, supplierData: Partial<Supplier>): Promise<{ status: number; data: Supplier }> => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, supplierData, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Update supplier error:", err?.response?.data);
    return {
      status: err?.response?.status ?? 500,
      data: {} as Supplier,
    };
  }
};

export const deleteSupplier = async (id: string): Promise<{ status: number }> => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return { status: res.status };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    console.error("Delete supplier error:", err?.response?.data);
    return { status: err?.response?.status ?? 500 };
  }
};

export const getSupplierCategories = async (): Promise<{ status: number; data: string[] }> => {
  try {
    const res = await axios.get(`${API_URL}/categories`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Get categories error:", err?.response?.data);
    return { status: err?.response?.status ?? 500, data: [] };
  }
};

export const getSupplierCities = async (): Promise<{ status: number; data: string[] }> => {
  try {
    const res = await axios.get(`${API_URL}/cities`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Get cities error:", err?.response?.data);
    return { status: err?.response?.status ?? 500, data: [] };
  }
};