import axios from "axios";
import { AUTH_API_URL } from "../../lib/auth-api-url";

const API_URL = `${AUTH_API_URL}/users`;

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

export const getAllUsers = async (): Promise<{
  status: number;
  data: unknown[];
}> => {
  try {
    const res = await axios.get(API_URL, { headers: getAuthHeaders() });
    const body = res.data;
    const list = Array.isArray(body) ? body : body?.data ?? [];
    return { status: res.status, data: list };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    console.error("Get all users error:", err?.response?.data);
    return {
      status: err?.response?.status ?? 500,
      data: [],
    };
  }
};

export const getUserById = async (id: string) => {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Get user error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const createUser = async (userData: {
  cin: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  companyName?: string;
  departement?: string;
  role?: string;
}) => {
  try {
    const res = await axios.post(
      `${API_URL}/create-with-temp-password`,
      userData,
    );
    if (res.status === 201) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Create user error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const updateUser = async (
  id: string,
  userData: {
    cin: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
  },
) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, userData);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Update user error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const deleteUser = async (id: string) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Delete user error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const assignRoleToUser = async (userId: string, roleId: string) => {
  try {
    const res = await axios.post(`${API_URL}/${userId}/roles/${roleId}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Assign role error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const removeRoleFromUser = async (userId: string, roleId: string) => {
  try {
    const res = await axios.delete(`${API_URL}/${userId}/roles/${roleId}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Remove role error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const banUser = async (userId: string, data: boolean) => {
  try {
    const res = await axios.put(`${API_URL}/ban/${userId}`, { data });
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Ban user eror,", error);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.reponse?.data?.message,
    });
  }
};

export const getAllClients = async (token?: string) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${API_URL}/clients`, { headers });
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Get clients error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const createClient = async (
  clientData: {
    cin: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    telephone?: string;
    address?: string;
    companyName?: string;
  },
  token?: string,
) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(
      `${API_URL}/create-with-temp-password`,
      {
        ...clientData,
        role: "client", // Set role as client
      },
      { headers },
    );
    if (res.status === 201) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Create client error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const updateClient = async (
  id: string,
  clientData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    telephone?: string;
    address?: string;
    companyName?: string;
  },
  token?: string,
) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.put(`${API_URL}/${id}`, clientData, { headers });
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Update client error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const deleteClient = async (id: string, token?: string) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.delete(`${API_URL}/${id}`, { headers });
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Delete client error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};
