import { useState, useEffect } from 'react';
import { Plus, MapPin, Search, Filter, Trash2, Edit, ChevronRight, AlertCircle, CheckCircle2, Clock, PauseCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { mockSites } from '../../utils/mockData';
import { toast } from 'sonner';
import type { Site } from '../../types';
import { fetchSites, createSite, updateSite, deleteSite } from '../../action/site.action';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Tunisia center coordinates
const TUNISIA_CENTER = { lat: 33.8869, lng: 9.5375 };

// Status configuration for consistent styling
const STATUS_CONFIG = {
  planning: {
    label: 'Planification',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-blue-600 bg-blue-50',
    progressColor: 'bg-blue-600'
  },
  in_progress: {
    label: 'En cours',
    variant: 'default' as const,
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-50',
    progressColor: 'bg-green-600'
  },
  on_hold: {
    label: 'En pause',
    variant: 'destructive' as const,
    icon: PauseCircle,
    color: 'text-amber-600 bg-amber-50',
    progressColor: 'bg-amber-600'
  },
  completed: {
    label: 'Terminé',
    variant: 'secondary' as const,
    icon: CheckCircle2,
    color: 'text-gray-600 bg-gray-50',
    progressColor: 'bg-gray-600'
  }
};

// Map picker component
function MapPicker({ position, setPosition }: { position: { lat: number; lng: number } | null; setPosition: (pos: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

export default function Sites() {
  const user = useAuthStore((state) => state.user);
  const canManageSites = true;
  const [searchTerm, setSearchTerm] = useState('');
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [newSite, setNewSite] = useState({ name: '', address: '', area: '', budget: '' });
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [manageData, setManageData] = useState({ status: '', progress: 0, name: '', address: '', area: 0, budget: 0 });
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [editMapPosition, setEditMapPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; address?: string; area?: string; budget?: string }>({});

  // Fetch sites from API
  useEffect(() => {
    loadSites();
  }, [selectedStatus]);

  const loadSites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchSites({ 
        limit: 100,
        status: selectedStatus === 'all' ? undefined : selectedStatus
      });
      console.log('Sites loaded from API:', response.data);
      setSites(response.data);
      setUseMockData(false);
    } catch (err) {
      console.error('Error loading sites, using mock data:', err);
      setError('Backend not available, using mock data');
      setSites(mockSites);
      setUseMockData(true);
      toast.warning('Mode hors ligne - données de démonstration');
    } finally {
      setLoading(false);
    }
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Format budget in Tunisian Dinar
  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('fr-TN', { 
      style: 'currency', 
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(budget);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-TN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Validate new site form
  const validateForm = () => {
    const newErrors: { name?: string; address?: string; area?: string; budget?: string } = {};
    
    if (!newSite.name.trim()) {
      newErrors.name = 'Le nom du site est requis';
    }
    
    if (!newSite.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    }
    
    if (!newSite.area) {
      newErrors.area = 'La surface est requise';
    } else if (parseInt(newSite.area) <= 0) {
      newErrors.area = 'La surface doit être supérieure à 0';
    }
    
    if (!newSite.budget) {
      newErrors.budget = 'Le budget est requis';
    } else if (parseInt(newSite.budget) <= 0) {
      newErrors.budget = 'Le budget doit être supérieur à 0';
    }
    
    if (!mapPosition) {
      toast.error('Veuillez sélectionner l\'emplacement sur la carte');
      return false;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate edit form
  const validateEditForm = () => {
    const newErrors: { name?: string; address?: string; area?: string; budget?: string } = {};
    
    if (!manageData.name.trim()) {
      newErrors.name = 'Le nom du site est requis';
    }
    
    if (!manageData.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    }
    
    if (!manageData.area || manageData.area <= 0) {
      newErrors.area = 'La surface doit être supérieure à 0';
    }
    
    if (!manageData.budget || manageData.budget <= 0) {
      newErrors.budget = 'Le budget doit être supérieur à 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSite = async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }
    
    try {
      if (useMockData) {
        const site: Site = {
          id: String(sites.length + 1),
          name: newSite.name,
          address: newSite.address,
          status: 'planning',
          area: parseInt(newSite.area),
          budget: parseInt(newSite.budget),
          progress: 0,
          workStartDate: new Date().toISOString(),
          projectId: String(sites.length + 1),
          coordinates: mapPosition || { lat: 0, lng: 0 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSites([...sites, site]);
        resetAddForm();
        toast.success('Site ajouté avec succès!');
      } else {
        const site: Partial<Site> = {
          name: newSite.name,
          address: newSite.address,
          area: parseInt(newSite.area),
          budget: parseInt(newSite.budget),
          status: 'planning',
          progress: 0,
          workStartDate: new Date().toISOString(),
          projectId: String(sites.length + 1),
          coordinates: mapPosition || { lat: 0, lng: 0 },
        };
        
        const createdSite = await createSite(site);
        setSites([...sites, createdSite]);
        resetAddForm();
        toast.success('Site ajouté avec succès!');
      }
    } catch (error) {
      console.error('Error creating site:', error);
      toast.error('Erreur lors de la création du site');
    }
  };

  const resetAddForm = () => {
    setNewSite({ name: '', address: '', area: '', budget: '' });
    setMapPosition(null);
    setErrors({});
    setAddDialogOpen(false);
  };

  const handleViewDetails = (site: Site) => {
    setSelectedSite(site);
    setViewDetailsOpen(true);
  };

  const handleManageSite = (site: Site) => {
    setSelectedSite(site);
    setManageData({ 
      status: site.status, 
      progress: site.progress, 
      name: site.name, 
      address: site.address, 
      area: site.area, 
      budget: site.budget 
    });
    setEditMapPosition(site.coordinates || null);
    setErrors({});
    setManageDialogOpen(true);
  };

  const handleDeleteSite = (site: Site) => {
    setSelectedSite(site);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSite) return;
    
    try {
      if (useMockData) {
        setSites(sites.filter(s => s.id !== selectedSite.id));
        toast.success('Site supprimé avec succès!');
      } else {
        await deleteSite(selectedSite.id);
        setSites(sites.filter(s => s.id !== selectedSite.id));
        toast.success('Site supprimé avec succès!');
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      toast.error('Erreur lors de la suppression du site');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedSite(null);
    }
  };

  const handleSaveManage = async () => {
    if (!validateEditForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }
    
    try {
      if (useMockData) {
        setSites(sites.map(s => 
          s.id === selectedSite.id 
            ? { 
                ...s, 
                status: manageData.status as 'planning' | 'in_progress' | 'on_hold' | 'completed', 
                progress: manageData.progress,
                name: manageData.name,
                address: manageData.address,
                area: manageData.area,
                budget: manageData.budget,
                coordinates: editMapPosition || s.coordinates
              }
            : s
        ));
        setManageDialogOpen(false);
        toast.success('Site modifié avec succès!');
      } else {
        const updatedSite = await updateSite(selectedSite!.id, {
          status: manageData.status as 'planning' | 'in_progress' | 'on_hold' | 'completed',
          progress: manageData.progress,
          name: manageData.name,
          address: manageData.address,
          area: manageData.area,
          budget: manageData.budget,
          coordinates: editMapPosition || undefined,
        });
        
        setSites(sites.map(s => 
          s.id === selectedSite.id 
            ? updatedSite
            : s
        ));
        setManageDialogOpen(false);
        toast.success('Site modifié avec succès!');
      }
    } catch (error) {
      console.error('Error updating site:', error);
      toast.error('Erreur lors de la modification du site');
    }
  };

  // Get status icon component
  const StatusIcon = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planning;
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color.split(' ')[0]}`} />;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chantiers</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {filteredSites.length} chantier{filteredSites.length !== 1 ? 's' : ''} • 
            <span className="ml-1">
              {sites.filter(s => s.status === 'in_progress').length} en cours
            </span>
          </p>
        </div>
        {canManageSites ? (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau chantier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Ajouter un nouveau chantier</DialogTitle>
                <DialogDescription>
                  Remplissez les informations ci-dessous pour créer un nouveau chantier
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="site-name" className="text-sm font-medium">
                      Nom du chantier <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="site-name"
                      placeholder="ex: Tour de bureaux Centre-ville"
                      value={newSite.name}
                      onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                      className={errors.name ? 'border-red-500 focus:ring-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      Adresse <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address"
                      placeholder="ex: 123 Avenue Habib Bourguiba, Tunis"
                      value={newSite.address}
                      onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                      className={errors.address ? 'border-red-500 focus:ring-red-500' : ''}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="area" className="text-sm font-medium">
                        Surface (m²) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="area"
                        type="number"
                        min="1"
                        placeholder="ex: 5000"
                        value={newSite.area}
                        onChange={(e) => setNewSite({ ...newSite, area: e.target.value })}
                        className={errors.area ? 'border-red-500 focus:ring-red-500' : ''}
                      />
                      {errors.area && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.area}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="budget" className="text-sm font-medium">
                        Budget (TND) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="budget"
                        type="number"
                        min="1"
                        placeholder="ex: 2500000"
                        value={newSite.budget}
                        onChange={(e) => setNewSite({ ...newSite, budget: e.target.value })}
                        className={errors.budget ? 'border-red-500 focus:ring-red-500' : ''}
                      />
                      {errors.budget && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.budget}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Emplacement sur la carte <span className="text-red-500">*</span>
                    </Label>
                    <div className="h-64 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors">
                      <MapContainer
                        center={[TUNISIA_CENTER.lat, TUNISIA_CENTER.lng]}
                        zoom={7}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        <MapPicker position={mapPosition} setPosition={setMapPosition} />
                      </MapContainer>
                    </div>
                    {mapPosition ? (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Position sélectionnée: {mapPosition.lat.toFixed(4)}, {mapPosition.lng.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Cliquez sur la carte pour sélectionner l'emplacement
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAddDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    onClick={handleAddSite}
                  >
                    Créer le chantier
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau chantier
          </Button>
        )}
      </div>

      {/* Search and Filter Card */}
      <Card className="border-none shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom ou adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="sm:w-auto w-full border-gray-200">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                  {selectedStatus !== 'all' && (
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                      1
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filtrer les chantiers</DialogTitle>
                  <DialogDescription>
                    Sélectionnez un statut pour filtrer la liste
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                  {[
                    { value: 'all', label: 'Tous les chantiers', icon: MapPin },
                    { value: 'planning', label: 'Planification', icon: Clock },
                    { value: 'in_progress', label: 'En cours', icon: CheckCircle2 },
                    { value: 'on_hold', label: 'En pause', icon: PauseCircle },
                    { value: 'completed', label: 'Terminé', icon: CheckCircle2 }
                  ].map((status) => {
                    const Icon = status.icon;
                    const isSelected = selectedStatus === status.value;
                    return (
                      <Button
                        key={status.value}
                        variant={isSelected ? 'default' : 'ghost'}
                        className={`w-full justify-start gap-2 ${
                          isSelected ? 'bg-gradient-to-r from-blue-600 to-green-600' : ''
                        }`}
                        onClick={() => setSelectedStatus(status.value)}
                      >
                        <Icon className="h-4 w-4" />
                        {status.label}
                        {isSelected && <ChevronRight className="h-4 w-4 ml-auto" />}
                      </Button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Sites Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Chargement des chantiers...</p>
            <p className="text-sm text-gray-400 mt-1">Veuillez patienter</p>
          </div>
        </div>
      ) : error ? (
        <Card className="border-none shadow-md">
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-800 font-medium mb-2">{error}</p>
              <p className="text-sm text-gray-500 mb-4">Mode démonstration actif</p>
              <Button onClick={loadSites} variant="outline" className="gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredSites.length === 0 ? (
        <Card className="border-none shadow-md">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="bg-gray-50 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun chantier trouvé</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'Aucun résultat ne correspond à vos critères'
                  : 'Commencez par ajouter votre premier chantier'}
              </p>
              {(searchTerm || selectedStatus !== 'all') && (
                <div className="flex gap-3 justify-center">
                  {searchTerm && (
                    <Button 
                      variant="outline"
                      onClick={() => setSearchTerm('')}
                    >
                      Effacer la recherche
                    </Button>
                  )}
                  {selectedStatus !== 'all' && (
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedStatus('all')}
                    >
                      Effacer les filtres
                    </Button>
                  )}
                </div>
              )}
              {!searchTerm && selectedStatus === 'all' && canManageSites && (
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-green-600"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un chantier
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredSites.map((site) => {
            const statusConfig = STATUS_CONFIG[site.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planning;
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card 
                key={site.id} 
                className="group hover:shadow-xl transition-all duration-300 border-none shadow-md overflow-hidden"
              >
                <div className={`h-1 ${statusConfig.progressColor}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${statusConfig.color}`}>
                        <MapPin className={`h-5 w-5 ${statusConfig.color.split(' ')[0]}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {site.name}
                        </CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(site.workStartDate)}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={statusConfig.variant}
                      className={`flex items-center gap-1 px-2 py-1 ${statusConfig.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span className="text-xs font-medium">{statusConfig.label}</span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-gray-600 line-clamp-2">{site.address}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Surface</p>
                      <p className="font-semibold text-gray-900">
                        {site.area.toLocaleString()} <span className="text-xs font-normal text-gray-500">m²</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budget</p>
                      <p className="font-semibold text-gray-900">{formatBudget(site.budget)}</p>
                    </div>
                  </div>

                  {/* Barre de progression personnalisée */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progression</span>
                      <span className="font-semibold text-gray-900">{site.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${statusConfig.progressColor} transition-all duration-300`}
                        style={{ width: `${site.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      onClick={() => handleViewDetails(site)}
                    >
                      Détails
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors"
                      onClick={() => handleManageSite(site)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="hover:bg-red-600 transition-colors"
                      onClick={() => handleDeleteSite(site)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Modifier le chantier</DialogTitle>
            <DialogDescription>
              Mettre à jour les informations du chantier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Nom du chantier <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={manageData.name}
                  onChange={(e) => setManageData({ ...manageData, name: e.target.value })}
                  className={errors.name ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-address" className="text-sm font-medium">
                  Adresse <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-address"
                  value={manageData.address}
                  onChange={(e) => setManageData({ ...manageData, address: e.target.value })}
                  className={errors.address ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.address}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-area" className="text-sm font-medium">
                    Surface (m²) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-area"
                    type="number"
                    min="1"
                    value={manageData.area}
                    onChange={(e) => setManageData({ ...manageData, area: parseInt(e.target.value) || 0 })}
                    className={errors.area ? 'border-red-500 focus:ring-red-500' : ''}
                  />
                  {errors.area && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.area}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-budget" className="text-sm font-medium">
                    Budget (TND) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-budget"
                    type="number"
                    min="1"
                    value={manageData.budget}
                    onChange={(e) => setManageData({ ...manageData, budget: parseInt(e.target.value) || 0 })}
                    className={errors.budget ? 'border-red-500 focus:ring-red-500' : ''}
                  />
                  {errors.budget && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.budget}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-sm font-medium">Statut</Label>
                <select
                  id="edit-status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={manageData.status}
                  onChange={(e) => setManageData({ ...manageData, status: e.target.value })}
                >
                  <option value="planning">Planification</option>
                  <option value="in_progress">En cours</option>
                  <option value="on_hold">En pause</option>
                  <option value="completed">Terminé</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-progress" className="text-sm font-medium">Progression (%)</Label>
                <Input
                  id="edit-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={manageData.progress}
                  onChange={(e) => setManageData({ ...manageData, progress: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Emplacement sur la carte</Label>
                <div className="h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                  <MapContainer
                    center={editMapPosition ? [editMapPosition.lat, editMapPosition.lng] : [TUNISIA_CENTER.lat, TUNISIA_CENTER.lng]}
                    zoom={editMapPosition ? 15 : 7}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapPicker position={editMapPosition} setPosition={setEditMapPosition} />
                  </MapContainer>
                </div>
                {editMapPosition && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Position: {editMapPosition.lat.toFixed(4)}, {editMapPosition.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setManageDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={handleSaveManage}
              >
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Détails du chantier</DialogTitle>
          </DialogHeader>
          {selectedSite && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Nom du chantier</p>
                    <p className="font-semibold text-gray-900 text-lg">{selectedSite.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Adresse</p>
                    <p className="text-gray-900">{selectedSite.address}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Surface</p>
                      <p className="font-semibold text-gray-900">
                        {selectedSite.area.toLocaleString()} m²
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Budget</p>
                      <p className="font-semibold text-gray-900">
                        {formatBudget(selectedSite.budget)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Statut</p>
                    <Badge className={`${STATUS_CONFIG[selectedSite.status as keyof typeof STATUS_CONFIG]?.color}`}>
                      {STATUS_CONFIG[selectedSite.status as keyof typeof STATUS_CONFIG]?.label}
                    </Badge>
                  </div>
                  
                  {/* Barre de progression personnalisée dans les détails */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Progression</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${STATUS_CONFIG[selectedSite.status as keyof typeof STATUS_CONFIG]?.progressColor} transition-all duration-300`}
                          style={{ width: `${selectedSite.progress}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 min-w-[3rem]">
                        {selectedSite.progress}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date de début</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(selectedSite.workStartDate)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedSite.coordinates && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Emplacement</p>
                  <div className="h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                    <MapContainer
                      center={[selectedSite.coordinates.lat, selectedSite.coordinates.lng]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[selectedSite.coordinates.lat, selectedSite.coordinates.lng]} />
                    </MapContainer>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setViewDetailsOpen(false)}
                >
                  Fermer
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  onClick={() => {
                    setViewDetailsOpen(false);
                    handleManageSite(selectedSite);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-600">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-gray-600">
              Cette action est irréversible. Toutes les données associées à ce chantier seront définitivement supprimées.
            </DialogDescription>
          </DialogHeader>
          {selectedSite && (
            <div className="space-y-4 py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">Chantier à supprimer :</p>
                <p className="text-gray-700"><span className="font-medium">Nom:</span> {selectedSite.name}</p>
                <p className="text-gray-700"><span className="font-medium">Adresse:</span> {selectedSite.address}</p>
                <p className="text-gray-700"><span className="font-medium">Budget:</span> {formatBudget(selectedSite.budget)}</p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1 hover:bg-red-600"
                  onClick={confirmDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}