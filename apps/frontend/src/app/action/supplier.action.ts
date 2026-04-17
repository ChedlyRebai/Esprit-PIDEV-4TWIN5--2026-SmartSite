import axios from 'axios';

// Configuration de l'API base URL (supplier-management microservice sur port 3005)
const api = axios.create({
  baseURL: 'http://localhost:3005',
  timeout: 10000,
});

// Fonction pour récupérer le token (Zustand store ou localStorage)
function getAuthToken(): string | null {
  const directToken = localStorage.getItem('access_token');
  if (directToken) return directToken;
  
  const persisted = localStorage.getItem('smartsite-auth');
  if (!persisted) return null;
  
  try {
    const parsed = JSON.parse(persisted);
    return parsed?.state?.user?.access_token || null;
  } catch {
    return null;
  }
}

// Interceptor pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Supplier {
  _id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  quality_score: number;
  avg_delivery_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const getSuppliers = async (includeInactive = false): Promise<Supplier[]> => {
  const response = await api.get(`/suppliers?includeInactive=${includeInactive}`);
  return response.data;
};

export const getSupplierById = async (id: string): Promise<Supplier> => {
  const response = await api.get(`/suppliers/${id}`);
  return response.data;
};

export const createSupplier = async (supplierData: Partial<Supplier>): Promise<Supplier> => {
  const response = await api.post('/suppliers', supplierData);
  return response.data;
};

export const updateSupplier = async (id: string, supplierData: Partial<Supplier>): Promise<Supplier> => {
  const response = await api.patch(`/suppliers/${id}`, supplierData);
  return response.data;
};

export const deleteSupplier = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/suppliers/${id}`);
  return response.data;
};

export const reactivateSupplier = async (id: string): Promise<Supplier> => {
  const response = await api.post(`/suppliers/${id}/reactivate`);
  return response.data;
};
