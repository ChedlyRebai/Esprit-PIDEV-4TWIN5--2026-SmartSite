import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Package, AlertTriangle, AlertCircle } from 'lucide-react';
import materialService, { Material, CreateMaterialData } from '../../../services/materialService';
import { siteService, fournisseurService, Site, Fournisseur } from '../../../services/siteFournisseurService';

interface FormErrors {
  name?: string;
  code?: string;
  category?: string;
  unit?: string;
  quantity?: string;
  minimumStock?: string;
  maximumStock?: string;
  reorderPoint?: string;
  siteId?: string;
}

interface MaterialFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Material | null;
}

export default function MaterialForm({ open, onClose, onSuccess, initialData }: MaterialFormProps) {
  const [formData, setFormData] = useState<CreateMaterialData>({
    name: '',
    code: '',
    category: '',
    unit: '',
    quantity: 0,
    minimumStock: 10,
    maximumStock: 100,
    reorderPoint: 20,
    location: '',
    manufacturer: '',
    expiryDate: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);

  const categories = [
    'béton', 'fer', 'acier', 'électricité', 'plomberie', 
    'bois', 'sable', 'gravier', 'ciment', 'brique', 
    'carrelage', 'peinture', 'isolation', 'toiture', 'autre'
  ];

  const units = ['kg', 'm³', 'm²', 'ml', 'pièces', 'tonnes', 'sac', 'autre'];

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') return 'Le nom est obligatoire';
        if (value.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
        if (value.trim().length > 100) return 'Le nom ne peut pas dépasser 100 caractères';
        break;
      case 'code':
        if (!value || value.trim() === '') return 'Le code est obligatoire';
        if (!/^[A-Za-z0-9-_]+$/.test(value)) return 'Le code ne peut contenir que des lettres, chiffres, tirets et underscores';
        break;
      case 'category':
        if (!value || value === '') return 'La catégorie est obligatoire';
        break;
      case 'unit':
        if (!value || value === '') return 'L\'unité est obligatoire';
        break;
      case 'quantity':
        if (value === undefined || value === null || value === '') return 'La quantité est obligatoire';
        if (isNaN(Number(value))) return 'La quantité doit être un nombre';
        if (Number(value) < 0) return 'La quantité ne peut pas être négative';
        if (Number(value) > 1000000) return 'La quantité maximale est 1 000 000';
        break;
      case 'minimumStock':
        if (value === undefined || value === null || value === '') return 'Le stock minimum est obligatoire';
        if (isNaN(Number(value))) return 'Doit être un nombre';
        if (Number(value) < 0) return 'Ne peut pas être négatif';
        if (Number(value) > 1000000) return 'Valeur maximale: 1 000 000';
        break;
      case 'maximumStock':
        if (value === undefined || value === null || value === '') return 'Le stock maximum est obligatoire';
        if (isNaN(Number(value))) return 'Doit être un nombre';
        if (Number(value) < 0) return 'Ne peut pas être négatif';
        if (Number(value) > 1000000) return 'Valeur maximale: 1 000 000';
        if (formData.minimumStock && Number(value) < formData.minimumStock) {
          return 'Doit être supérieur ou égal au stock minimum';
        }
        break;
      case 'reorderPoint':
        if (value === undefined || value === null || value === '') return 'Le point de commande est obligatoire';
        if (isNaN(Number(value))) return 'Doit être un nombre';
        if (Number(value) < 0) return 'Ne peut pas être négatif';
        if (Number(value) > 1000000) return 'Valeur maximale: 1 000 000';
        if (formData.minimumStock && Number(value) > formData.minimumStock) {
          return 'Ne doit pas dépasser le stock minimum';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate all fields
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof CreateMaterialData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    // Validate site for new materials
    if (!initialData && !selectedSiteId) {
      newErrors.siteId = 'Le chantier est obligatoire';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field as keyof CreateMaterialData]);
    if (error) {
      setErrors({ ...errors, [field]: error });
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    // Reset form state when opening/closing
    if (!open) {
      setErrors({});
      setTouched({});
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        category: initialData.category || '',
        unit: initialData.unit || '',
        quantity: initialData.quantity || 0,
        minimumStock: initialData.minimumStock || 10,
        maximumStock: initialData.maximumStock || 100,
        reorderPoint: initialData.reorderPoint || 20,
        location: initialData.location || '',
        manufacturer: initialData.manufacturer || '',
        expiryDate: initialData.expiryDate ? initialData.expiryDate.split('T')[0] : '',
      });
      
      // Handle siteId - could be string or object
      const getSiteId = (sid: any): string => {
        if (!sid) return '';
        if (typeof sid === 'string') return sid;
        if (sid && typeof sid === 'object' && sid._id) return sid._id;
        if (sid && typeof sid === 'object' && sid.toString) return sid.toString();
        return '';
      };
      
      // Set the site from the material
      const materialSiteId = getSiteId(initialData.siteId);
      if (materialSiteId) {
        setSelectedSiteId(materialSiteId);
        console.log('🎯 Material siteId set to:', materialSiteId);
      } else {
        // No site assigned yet - allow selection
        setSelectedSiteId('');
      }
    } else {
      // Reset for new material - site is required
      setFormData({
        name: '',
        code: '',
        category: '',
        unit: '',
        quantity: 0,
        minimumStock: 10,
        maximumStock: 100,
        reorderPoint: 20,
        location: '',
        manufacturer: '',
        expiryDate: '',
      });
      setSelectedSiteId('');
    }
  }, [initialData, sites]);

  const loadSites = async () => {
    setLoadingSites(true);
    try {
      console.log('🔍 Loading sites from API...');
      const sitesData = await siteService.getSites();
      console.log('📍 Sites loaded:', sitesData.length, sitesData);
      console.log('📍 First few sites:', sitesData.slice(0, 3).map(s => ({ id: s._id, nom: s.nom })));
      setSites(sitesData);
    } catch (error: any) {
      console.error('❌ Erreur chargement sites:', error.message, error.response?.data);
    } finally {
      setLoadingSites(false);
    }
  };

  const getStockStatus = () => {
    if (formData.quantity === 0) return 'out_of_stock';
    if (formData.quantity <= formData.reorderPoint) return 'low_stock';
    return 'in_stock';
  };

  const getStockStatusLabel = () => {
    const status = getStockStatus();
    switch (status) {
      case 'out_of_stock':
        return <Badge className="bg-red-500">Rupture de stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-500">Stock bas</Badge>;
      default:
        return <Badge className="bg-green-500">En stock</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    if (!initialData) {
      allTouched['siteId'] = true;
    }
    setTouched(allTouched);
    
    // Validate form
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs avant de soumettre');
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      if (initialData && initialData._id) {
        console.log('Updating material:', initialData._id, formData);
        
        // Only include fields that have values and are valid for update
        const updateData: any = {};
        
        if (formData.name) updateData.name = formData.name;
        if (formData.code) updateData.code = formData.code;
        if (formData.category) updateData.category = formData.category;
        if (formData.unit) updateData.unit = formData.unit;
        if (formData.quantity !== undefined && formData.quantity !== null) updateData.quantity = formData.quantity;
        if (formData.minimumStock !== undefined && formData.minimumStock !== null) updateData.minimumStock = formData.minimumStock;
        if (formData.maximumStock !== undefined && formData.maximumStock !== null) updateData.maximumStock = formData.maximumStock;
        if (formData.reorderPoint !== undefined && formData.reorderPoint !== null) updateData.reorderPoint = formData.reorderPoint;
        if (formData.location) updateData.location = formData.location;
        if (formData.manufacturer) updateData.manufacturer = formData.manufacturer;
        if (formData.expiryDate) updateData.expiryDate = formData.expiryDate;
        
        // Include siteId if changed - use assign endpoint
        const siteChanged = selectedSiteId && selectedSiteId !== initialData?.siteId;
        if (siteChanged) {
          console.log('🔄 Site changed from', initialData?.siteId, 'to', selectedSiteId);
          try {
            await materialService.assignMaterialToSite(initialData._id, selectedSiteId);
            console.log('✅ Site assignation successful');
          } catch (error) {
            console.error('❌ Erreur assignation site:', error);
            toast.error('Erreur lors du changement de site');
          }
        }
        
        console.log('Update data to send:', updateData);
        
        // Allow update even if only site changed
        if (Object.keys(updateData).length === 0 && !siteChanged) {
          toast.error('Aucune donnée à mettre à jour');
          setLoading(false);
          return;
        }
        
        await materialService.updateMaterial(initialData._id, updateData);
        toast.success('Matériau modifié avec succès!');
      } else {
        if (!selectedSiteId) {
          toast.error('Veuillez sélectionner un chantier');
          setLoading(false);
          return;
        }
        console.log('Creating material with site:', formData, selectedSiteId);
        await materialService.createMaterialWithSite(formData, selectedSiteId);
        toast.success('Matériau ajouté avec succès!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur complète:', error);
      console.error('Error response data:', error.response?.data);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Opération échouée';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Modifier le matériau' : 'Ajouter un matériau'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Modifiez les informations ci-dessous.' 
              : 'Remplissez les détails du matériau et associez-le à un chantier.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Chantier / Site {initialData ? '' : '*'}
              </Label>
              {loadingSites ? (
                <p className="text-sm text-gray-500">Chargement des sites...</p>
              ) : sites.length === 0 ? (
                <p className="text-sm text-red-500">Aucun site trouvé. Créez d'abord un site.</p>
              ) : (
                <>
                  <select
                    className={`w-full px-3 py-2 border rounded-md ${errors.siteId && touched.siteId ? 'border-red-500' : ''}`}
                    value={selectedSiteId}
                    onChange={(e) => {
                      setSelectedSiteId(e.target.value);
                      if (errors.siteId) setErrors({ ...errors, siteId: undefined });
                    }}
                    required={!initialData}
                  >
                    <option value="">Sélectionner un chantier...</option>
                    {sites.map((site) => (
                      <option key={site._id} value={site._id}>
                        {site.nom} - {site.adresse}
                      </option>
                    ))}
                  </select>
                  {errors.siteId && touched.siteId && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.siteId}
                    </p>
                  )}
                </>
              )}
              {selectedSiteId && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {sites.find(s => s._id === selectedSiteId)?.adresse}
                </div>
              )}
              {initialData && initialData.siteName && !selectedSiteId && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Site actuel: {initialData.siteName}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={errors.name && touched.name ? 'border-red-500' : ''}
                />
                {errors.name && touched.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('code')}
                  className={errors.code && touched.code ? 'border-red-500' : ''}
                />
                {errors.code && touched.code && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.code}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <select
                  id="category"
                  className={`w-full px-3 py-2 border rounded-md ${errors.category && touched.category ? 'border-red-500' : ''}`}
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  onBlur={() => handleBlur('category')}
                >
                  <option value="">Sélectionner...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && touched.category && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.category}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unité *</Label>
                <select
                  id="unit"
                  className={`w-full px-3 py-2 border rounded-md ${errors.unit && touched.unit ? 'border-red-500' : ''}`}
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  onBlur={() => handleBlur('unit')}
                >
                  <option value="">Sélectionner...</option>
                  {units.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                {errors.unit && touched.unit && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.unit}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                  onBlur={() => handleBlur('quantity')}
                  className={errors.quantity && touched.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && touched.quantity && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.quantity}
                  </p>
                )}
                {getStockStatusLabel()}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Emplacement</Label>
                <Input
                  id="location"
                  placeholder="Entrepôt A, Étagère 1"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumStock">Stock minimum</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  min="0"
                  value={formData.minimumStock}
                  onChange={(e) => handleChange('minimumStock', parseInt(e.target.value) || 0)}
                  onBlur={() => handleBlur('minimumStock')}
                  className={errors.minimumStock && touched.minimumStock ? 'border-red-500' : ''}
                />
                {errors.minimumStock && touched.minimumStock && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.minimumStock}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maximumStock">Stock maximum</Label>
                <Input
                  id="maximumStock"
                  type="number"
                  min="0"
                  value={formData.maximumStock}
                  onChange={(e) => handleChange('maximumStock', parseInt(e.target.value) || 0)}
                  onBlur={() => handleBlur('maximumStock')}
                  className={errors.maximumStock && touched.maximumStock ? 'border-red-500' : ''}
                />
                {errors.maximumStock && touched.maximumStock && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.maximumStock}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Point de commande</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  min="0"
                  value={formData.reorderPoint}
                  onChange={(e) => handleChange('reorderPoint', parseInt(e.target.value) || 0)}
                  onBlur={() => handleBlur('reorderPoint')}
                  className={errors.reorderPoint && touched.reorderPoint ? 'border-red-500' : ''}
                />
                {errors.reorderPoint && touched.reorderPoint && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.reorderPoint}
                  </p>
                )}
              </div>
            </div>

            {formData.quantity <= formData.reorderPoint && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">Alerte stock</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Ce matériau est en rupture de stock. Pensez à passer une commande.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricant</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Date d'expiration</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : (initialData ? 'Mettre à jour' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}