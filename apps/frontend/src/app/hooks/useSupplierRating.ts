import { useState, useEffect } from 'react';
import axios from 'axios';

interface SupplierRatingCheck {
  needed: boolean;
  consumptionPercentage: number;
  material?: {
    _id: string;
    name: string;
    supplierId?: string;
    supplierName?: string;
    siteId?: string;
  };
  alreadyRated: boolean;
}

export const useSupplierRating = (userId: string) => {
  const [pendingRatings, setPendingRatings] = useState<SupplierRatingCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const checkSupplierRatingNeeded = async (materialId: string): Promise<SupplierRatingCheck> => {
    try {
      // Appeler le nouveau endpoint qui vérifie côté backend
      const response = await axios.get(`/api/supplier-ratings/should-show/${materialId}`, {
        params: { userId },
        timeout: 5000 // Timeout de 5 secondes
      });
      
      const data = response.data;
      
      // Si le dialog doit être affiché, marquer comme affiché
      if (data.shouldShow) {
        await axios.post('/api/supplier-ratings/mark-shown', {
          materialId,
          userId
        }).catch(err => console.warn('Error marking dialog as shown:', err));
      }
      
      return {
        needed: data.shouldShow,
        consumptionPercentage: data.consumptionPercentage,
        material: data.material,
        alreadyRated: !data.shouldShow && data.reason?.includes('Déjà noté')
      };
    } catch (error: any) {
      // Gérer l'erreur gracieusement sans bloquer l'application
      if (error.response?.status === 500 || error.response?.status === 404) {
        console.warn(`Supplier rating endpoint not available for material ${materialId}`);
      } else {
        console.error('Error checking supplier rating:', error);
      }
      return { needed: false, consumptionPercentage: 0, alreadyRated: false };
    }
  };

  const checkAllMaterials = async (materials: any[]) => {
    if (!materials.length || !userId) return;
    
    setLoading(true);
    try {
      const checks = await Promise.all(
        materials.map(async (material) => {
          // Vérifier si ce matériau a été ignoré par l'utilisateur
          if (isIgnored(material._id)) {
            return null;
          }
          
          const check = await checkSupplierRatingNeeded(material._id);
          if (check.needed) {
            return {
              ...check,
              material: {
                _id: material._id,
                name: material.name,
                supplierId: material.supplierId,
                supplierName: material.supplierName,
                siteId: material.siteId,
              }
            };
          }
          return null;
        })
      );
      
      const validChecks = checks.filter(Boolean) as SupplierRatingCheck[];
      setPendingRatings(validChecks);
      
      return validChecks;
    } catch (error) {
      console.error('Error checking all materials for rating:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const markAsRated = (materialId: string) => {
    setPendingRatings(prev => prev.filter(rating => rating.material?._id !== materialId));
  };

  const markAsIgnored = (materialId: string) => {
    // Marquer comme ignoré dans le localStorage pour cette session
    const ignoredRatings = JSON.parse(localStorage.getItem('ignoredSupplierRatings') || '[]');
    if (!ignoredRatings.includes(materialId)) {
      ignoredRatings.push(materialId);
      localStorage.setItem('ignoredSupplierRatings', JSON.stringify(ignoredRatings));
    }
    // Retirer de la liste des ratings en attente
    setPendingRatings(prev => prev.filter(rating => rating.material?._id !== materialId));
  };

  const isIgnored = (materialId: string): boolean => {
    const ignoredRatings = JSON.parse(localStorage.getItem('ignoredSupplierRatings') || '[]');
    return ignoredRatings.includes(materialId);
  };

  return {
    pendingRatings,
    loading,
    checkSupplierRatingNeeded,
    checkAllMaterials,
    markAsRated,
    markAsIgnored,
    isIgnored,
  };
};