import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    "process.env": {},
  },
  server: {
    port: 5173,
    proxy: {
      // ========== CHAT ROUTES (materials-service port 3002) ==========
      '/api/chat': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      
      // ========== CONSUMPTION ROUTES (materials-service port 3002) ==========
      '/api/consumption': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      
      // ========== SITE CONSUMPTION ROUTES (materials-service port 3002) ==========
      '/api/site-consumption': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      
      // ========== MATERIAL FLOW ROUTES (materials-service port 3002) ==========
      // NOUVEAU - Pour le suivi des entrées/sorties et anomalies
      '/api/flows': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      
      // ========== MATERIALS ROUTES (materials-service port 3002) ==========
      '/api/materials': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/api/site-materials': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/api/orders': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      
      // ========== FOURNISSEURS ROUTES (port 3005) ==========
      '/api/fournisseurs': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
      },
      '/fournisseurs': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
      },
      
      // ========== SITES ROUTES (port 3001) ==========
      '/api/gestion-sites': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/gestion-sites': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      
      // ========== AUTH ROUTES (port 3000 ou 3007) ==========
      // Note: Votre auth tourne sur le port 3000 d'après votre .env backend
      '/api/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      
      // ========== USERS ROUTES (auth service port 3000) ==========
      '/api/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      
      // Fallback pour les autres routes /api
      // Note: Le fallback doit être après les routes spécifiques
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      
      // ========== UPLOADS STATIC FILES ==========
      '/uploads': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})