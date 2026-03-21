import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User, RegisterData } from "../types";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      /**
       * ====================================================
       * LOGIN - AVEC reCAPTCHA
       * ====================================================
       */
      login: async (cin: string, password: string, recaptchaToken: string) => {
        try {
          console.log('🔐 Tentative de connexion:', { cin });
          console.log('🔐 Token reCAPTCHA présent:', !!recaptchaToken);
          
          const res = await api.post("/auth/login", {
            cin,
            password,
            recaptchaToken,
          });

          console.log('✅ Réponse du serveur:', res.data);
          
          const token = res.data.access_token;
          
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          
          const userData = {
            access_token: res.data.access_token,
            id: res.data.id,
            cin: res.data.cin,
            firstname: res.data.firstname,
            lastname: res.data.lastname,
            role: res.data.role,
          };
          
          console.log('👤 Utilisateur connecté:', userData);
          
          set({
            user: userData,
            isAuthenticated: true,
          });
          
          return res.data;
          
        } catch (error: any) {
          console.error('❌ Erreur de connexion détaillée:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            data: error.response?.data,
            error: error.message
          });
          
          set({
            user: null,
            isAuthenticated: false,
          });
          
          delete api.defaults.headers.common["Authorization"];
          
          throw error;
        }
      },

      /**
       * ====================================================
       * LOGIN AVEC GOOGLE
       * ====================================================
       */
      loginWithGoogle: (user: any, token: string) => {
        console.log('🔐 Connexion Google:', { user, token });
        
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        set({
          user: {
            access_token: token,
            id: user.id,
            cin: user.cin || '',
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
          },
          isAuthenticated: true,
        });
      },

      /**
       * ====================================================
       * REGISTER
       * ====================================================
       */
      register: async (
        cin: string,
        password: string,
        firstname: string,
        lastname: string,
        email: string,
        telephone: string,
        departement: string,
        adresse: string,
        role: string,
      ) => {
        try {
          console.log('📝 Tentative d\'inscription:', { cin, firstname, lastname, email });
          
          const res = await api.post("/auth/register", {
            cin,
            password,
            firstname,
            lastname,
            email,
            telephone,
            departement,
            adresse,
            role,
          });
          
          console.log('✅ Inscription réussie:', res.data);
          return res.data;
          
        } catch (error: any) {
          console.error('❌ Erreur d\'inscription:', error.response?.data?.message || error.message);
          throw error;
        }
      },

      /**
       * ====================================================
       * CHANGER LE MOT DE PASSE
       * ====================================================
       */
      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          const token = get().user?.access_token;
          if (!token) {
            throw new Error('Non authentifié');
          }

          console.log('🔐 Changement de mot de passe...');
          
          const res = await api.put(
            "/auth/change-password",
            {
              currentPassword,
              newPassword,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          console.log('✅ Mot de passe changé avec succès');
          return res.data;
          
        } catch (error: any) {
          console.error('❌ Erreur changement de mot de passe:', error.response?.data?.message || error.message);
          throw error;
        }
      },

      /**
       * ====================================================
       * RÉCUPÉRER LES UTILISATEURS EN ATTENTE
       * ====================================================
       */
      getPendingUsers: async () => {
        try {
          const res = await api.get("/users/pending");
          return res.data;
        } catch (error: any) {
          console.error('❌ Erreur récupération utilisateurs en attente:', error.response?.data?.message || error.message);
          throw error;
        }
      },

      /**
       * ====================================================
       * APPROUVER UN UTILISATEUR
       * ====================================================
       */
      approveUser: async (userId: string, password: string) => {
        try {
          const res = await api.post(`/auth/approve-user/${userId}`, {
            password,
          });
          return res.data;
        } catch (error: any) {
          console.error('❌ Erreur approbation utilisateur:', error.response?.data?.message || error.message);
          throw error;
        }
      },

      /**
       * ====================================================
       * REJETER UN UTILISATEUR
       * ====================================================
       */
      rejectUser: async (userId: string) => {
        try {
          const res = await api.delete(`/users/${userId}`);
          return res.data;
        } catch (error: any) {
          console.error('❌ Erreur rejet utilisateur:', error.response?.data?.message || error.message);
          throw error;
        }
      },

      /**
       * ====================================================
       * DÉCONNEXION
       * ====================================================
       */
      logout: () => {
        console.log('🚪 Déconnexion utilisateur');
        delete api.defaults.headers.common["Authorization"];
        set({ 
          user: null, 
          isAuthenticated: false 
        });
      },
      
      /**
       * ====================================================
       * VÉRIFIER SI L'UTILISATEUR EST AUTHENTIFIÉ
       * ====================================================
       */
      checkAuth: () => {
        const state = useAuthStore.getState();
        console.log('🔍 Vérification authentification:', {
          isAuthenticated: state.isAuthenticated,
          hasUser: !!state.user,
          hasToken: !!state.user?.access_token
        });
        return state.isAuthenticated && !!state.user?.access_token;
      },
      
      /**
       * ====================================================
       * RÉCUPÉRER LE TOKEN
       * ====================================================
       */
      getToken: () => {
        const state = useAuthStore.getState();
        return state.user?.access_token || null;
      },
      
    }),
    {
      name: "smartsite-auth",
      onRehydrateStorage: () => (state) => {
        console.log('🔄 Réhydratation du store auth...');
        if (state?.user?.access_token) {
          console.log('✅ Token trouvé lors de la réhydratation');
          api.defaults.headers.common["Authorization"] =
            `Bearer ${state.user.access_token}`;
        } else {
          console.log('⚠️ Aucun token trouvé lors de la réhydratation');
        }
      },
    },
  ),
);