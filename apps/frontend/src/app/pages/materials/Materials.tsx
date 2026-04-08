import { 
  Package, 
  Download, 
  RefreshCw, 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  Filter, 
  Eye,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Loader2,
  FileText,
  Upload,
  ScanLine,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Boxes,
  Brain,
  Clock
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { toast } from 'sonner';
import materialService, { Material } from '../../../services/materialService';
import MaterialForm from './MaterialForm';
import MaterialDetails from './MaterialDetails';
import MaterialMLTraining from './MaterialMLTraining';
import CreateOrderDialog from './CreateOrderDialog';

// AI Prediction interface
interface StockPrediction {
  materialId: string;
  materialName: string;
  currentStock: number;
  consumptionRate: number;
  hoursToLowStock: number;
  hoursToOutOfStock: number;
  status: 'safe' | 'warning' | 'critical';
  recommendedOrderQuantity: number;
  predictionModelUsed: boolean;
  confidence: number;
  message: string;
}

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedMaterialForPrediction, setSelectedMaterialForPrediction] = useState<Material | null>(null);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [showQRMenu, setShowQRMenu] = useState(false);
  const [qrResult, setQrResult] = useState<{ material?: Material; text?: string; type: 'material' | 'text' | 'unknown' } | null>(null);
  const qrMenuRef = useRef<HTMLDivElement>(null);

  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [materialToOrder, setMaterialToOrder] = useState<{ id: string; name: string; code: string; category: string; siteId?: string; siteName?: string; siteCoordinates?: { lat: number; lng: number } } | null>(null);

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalMaterials: 0,
    totalQuantity: 0,
    lowStock: 0,
    outOfStock: 0,
    categoriesCount: 0
  });
  const [alerts, setAlerts] = useState<Material[]>([]);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // AI Predictions
  const [predictions, setPredictions] = useState<Map<string, StockPrediction>>(new Map());
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  // Close QR menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (qrMenuRef.current && !qrMenuRef.current.contains(event.target as Node)) {
        setShowQRMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let materialsData: any[] = [];
      
      try {
        console.log('📡 Fetching materials from API...');
        const result = await materialService.getMaterials({ page: 1, limit: 100 });
        console.log('📡 getMaterials result:', result);
        if (Array.isArray(result)) {
          materialsData = result;
        } else if (result && result.data) {
          materialsData = result.data;
        }
      } catch (e: any) {
        console.error('❌ getMaterials failed:', e.message);
        try {
          console.log('📡 Trying getMaterialsWithSites...');
          materialsData = await materialService.getMaterialsWithSites();
          console.log('📡 getMaterialsWithSites result:', materialsData);
        } catch (e2: any) {
          console.error('❌ getMaterialsWithSites failed:', e2.message);
        }
      }
      
      console.log('📦 Materials data loaded:', materialsData.length, 'items');
      console.log('📦 Sample material:', materialsData[0]);
      
      setMaterials(materialsData || []);
      setPagination(prev => ({
        ...prev,
        total: materialsData.length,
        totalPages: Math.ceil(materialsData.length / prev.limit)
      }));
      
      const uniqueCategories = [...new Set((materialsData || []).map((m: Material) => m.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      // Calculate dashboard stats
      const totalQty = (materialsData || []).reduce((sum: number, m: Material) => sum + (m.quantity || 0), 0);
      const lowStockItems = (materialsData || []).filter((m: Material) => m.quantity > 0 && m.quantity <= (m.reorderPoint || 0)).length;
      const outOfStockItems = (materialsData || []).filter((m: Material) => !m.quantity || m.quantity === 0).length;
      
      setDashboardStats({
        totalMaterials: materialsData.length,
        totalQuantity: totalQty,
        lowStock: lowStockItems,
        outOfStock: outOfStockItems,
        categoriesCount: uniqueCategories.length
      });
      
      // Extract alerts (low stock + out of stock)
      const alertMaterials = (materialsData || []).filter((m: Material) => 
        !m.quantity || m.quantity === 0 || m.quantity <= (m.reorderPoint || 0)
      );
      setAlerts(alertMaterials);
      
      // Show notification alerts
      if (alertMaterials.length > 0) {
        if (outOfStockItems > 0) {
          toast.error(`${outOfStockItems} matériau(x) en rupture de stock!`, { duration: 5000 });
        } else if (lowStockItems > 0) {
          toast.warning(`${lowStockItems} matériau(x) en stock bas`, { duration: 5000 });
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading materials:', error);
      toast.error(error.message || 'Erreur chargement matériaux');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load AI predictions for all materials
  const loadPredictions = useCallback(async () => {
    if (materials.length === 0) return;
    
    setLoadingPredictions(true);
    const newPredictions = new Map<string, StockPrediction>();
    
    try {
      // Load prediction for each material (in parallel with limit)
      const predictionPromises = materials.slice(0, 20).map(async (material) => {
        try {
          const prediction = await materialService.getStockPrediction(material._id);
          newPredictions.set(material._id, prediction);
          
          // Auto-alert if critical
          if (prediction.status === 'critical') {
            toast.error(`🚨 ${prediction.materialName}: Rupture dans ${prediction.hoursToOutOfStock}h!`, { duration: 5000 });
          }
        } catch (error) {
          console.warn(`Prediction failed for ${material._id}`);
        }
      });
      
      await Promise.all(predictionPromises);
      setPredictions(newPredictions);
    } catch (error) {
      console.error('❌ Error loading predictions:', error);
    } finally {
      setLoadingPredictions(false);
    }
  }, [materials]);

  useEffect(() => {
    if (materials.length > 0) {
      loadPredictions();
    }
  }, [materials.length]);

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchTerm === '' || 
      material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    
    // Stock filter
    let matchesStock = true;
    if (stockFilter === 'out') {
      matchesStock = !material.quantity || material.quantity === 0;
    } else if (stockFilter === 'low') {
      matchesStock = material.quantity > 0 && material.quantity <= (material.reorderPoint || 0);
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });
  
  const paginatedMaterials = filteredMaterials.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(filteredMaterials.length / pagination.limit);
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const goToPage = handlePageChange;

  const handleEdit = (material: Material) => {
    setMaterialToEdit(material);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await materialService.deleteMaterial(id);
      toast.success('Matériau supprimé');
      setShowDeleteConfirm(null);
      loadData();
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      toast.error(error.response?.data?.message || 'Échec suppression');
    }
  };

  const handleReorder = (
    materialId: string, 
    materialName: string, 
    materialCode: string, 
    materialCategory: string,
    materialSiteId?: string,
    materialSiteName?: string,
    materialSiteCoordinates?: { lat: number; lng: number }
  ) => {
    setMaterialToOrder({ 
      id: materialId, 
      name: materialName, 
      code: materialCode, 
      category: materialCategory,
      siteId: materialSiteId,
      siteName: materialSiteName,
      siteCoordinates: materialSiteCoordinates
    });
    setShowOrderDialog(true);
  };

  const handleGenerateQR = async (material: Material) => {
    try {
      const result = await materialService.generateQRCode(material._id);
      toast.success('QR généré');
      const link = document.createElement('a');
      link.href = result.qrCode;
      link.download = `qr-${material.code}.png`;
      link.click();
    } catch (error) {
      toast.error('Erreur génération QR');
    }
  };

  // ========== IMPORT / EXPORT FUNCTIONS ==========
  const handleImportExcel = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setScanLoading(true);
      try {
        console.log('📤 Starting import for file:', file.name);
        const result = await materialService.importFromExcel(file);
        console.log('📥 Import result:', result);
        
        if (result && result.success) {
          toast.success(`Import réussi! ${result.imported || 0} matériaux importés`);
          loadData();
        } else if (result && result.imported > 0) {
          toast.success(`Import réussi! ${result.imported} matériaux importés`);
          loadData();
        } else {
          toast.error(result?.message || 'Échec de l\'import');
        }
      } catch (error: any) {
        console.error('❌ Erreur import:', error);
        console.error('❌ Error response:', error.response?.data);
        toast.error(error.response?.data?.message || error.message || 'Erreur lors de l\'import');
      } finally {
        setScanLoading(false);
      }
    };
    input.click();
  };

  const handleExportExcel = async () => {
    try {
      console.log('📤 Starting Excel export...');
      const blob = await materialService.exportToExcel();
      console.log('📥 Excel blob received:', blob);
      await materialService.downloadFile(blob, `materiaux_${Date.now()}.xlsx`);
      toast.success('Export Excel réussi!');
    } catch (error: any) {
      console.error('❌ Erreur export Excel:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Erreur export Excel');
    }
  };

  const handleExportPDF = async () => {
    try {
      console.log('📤 Starting PDF export...');
      const blob = await materialService.exportToPDF();
      console.log('📥 PDF blob received:', blob);
      await materialService.downloadFile(blob, `materiaux_${Date.now()}.pdf`);
      toast.success('Export PDF réussi!');
    } catch (error: any) {
      console.error('❌ Erreur export PDF:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Erreur export PDF');
    }
  };

  // ========== QR / BARCODE SCAN FUNCTIONS ==========
  const handleScanQR = async () => {
    setShowQRMenu(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setScanLoading(true);
      setQrResult(null);
      
      try {
        console.log('📸 Starting QR scan for file:', file.name);
        toast.info('Analyse du QR code...', { duration: 2000 });
        const result = await materialService.scanQRCode(file);
        console.log('📸 QR scan result:', result);
        
        if (result && result.success && result.material) {
          setQrResult({ material: result.material, type: 'material' });
          setSelectedMaterial(result.material);
          toast.success(`Matériau trouvé: ${result.material.name}`);
        } else if (result && result.qrData) {
          setQrResult({ text: result.qrData, type: 'text' });
          toast.info(`QR scanné: "${result.qrData.substring(0, 30)}..." - Aucun matériau associé`);
        } else {
          toast.error('QR code non reconnu');
        }
      } catch (error: any) {
        console.error('❌ Erreur scan QR:', error);
        console.error('❌ Error response:', error.response?.data);
        if (error.response?.status === 400) {
          toast.error('Image invalide ou pas de QR code');
        } else if (error.response?.status === 500) {
          toast.error('Erreur serveur lors de l\'analyse');
        } else {
          toast.error(error.response?.data?.message || 'Erreur lors de l\'analyse du QR code');
        }
      } finally {
        setScanLoading(false);
      }
    };
    input.click();
  };

  const handleScanQRText = async () => {
    setShowQRMenu(false);
    const qrText = prompt('Entrez le texte du QR code:');
    if (!qrText) return;
    
    setScanLoading(true);
    setQrResult(null);
    
    try {
      console.log('📝 Starting QR text scan for:', qrText);
      const result = await materialService.scanQRCodeText(qrText);
      console.log('📝 QR text result:', result);
      
      if (result && result.success && result.material) {
        setQrResult({ material: result.material, type: 'material' });
        setSelectedMaterial(result.material);
        toast.success(`Matériau trouvé: ${result.material.name}`);
      } else {
        setQrResult({ text: qrText, type: 'text' });
        toast.info(`QR: "${qrText}" - Aucun matériau associé`);
      }
    } catch (error: any) {
      console.error('❌ Erreur scan QR texte:', error);
      toast.error(error.response?.data?.message || 'Erreur analyse QR');
    } finally {
      setScanLoading(false);
    }
  };

  const handleScanBarcode = async () => {
    const barcode = prompt('Entrez le code-barres:');
    if (!barcode) return;
    
    setScanLoading(true);
    setQrResult(null);
    
    try {
      console.log('📊 Searching for barcode:', barcode);
      const material = await materialService.findByBarcode(barcode);
      console.log('📊 Barcode result:', material);
      setQrResult({ material, type: 'material' });
      setSelectedMaterial(material);
      toast.success(`Matériau trouvé: ${material.name}`);
    } catch (error: any) {
      console.error('❌ Erreur barcode:', error);
      console.error('❌ Error response:', error.response?.data);
      if (error.response?.status === 404) {
        toast.error('Aucun matériau avec ce code-barres');
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de la recherche');
      }
    } finally {
      setScanLoading(false);
    }
  };

  const getStatusBadge = (material: Material) => {
    if (material.quantity === 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    }
    if (material.quantity <= material.reorderPoint) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Stock bas</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">En stock</Badge>;
  };

  const renderPredictionBadge = (materialId: string) => {
    const prediction = predictions.get(materialId);
    
    if (loadingPredictions && !prediction) {
      return (
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Analyse...
        </span>
      );
    }
    
    if (!prediction) {
      return <span className="text-xs text-gray-400">-</span>;
    }
    
    const getBadgeStyle = () => {
      switch (prediction.status) {
        case 'critical':
          return 'bg-red-100 text-red-700 border-red-300';
        case 'warning':
          return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        case 'safe':
          return 'bg-green-100 text-green-700 border-green-300';
      }
    };
    
    const getIcon = () => {
      switch (prediction.status) {
        case 'critical':
          return <AlertTriangle className="h-3 w-3" />;
        case 'warning':
          return <Clock className="h-3 w-3" />;
        case 'safe':
          return <Brain className="h-3 w-3" />;
      }
    };
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getBadgeStyle()}`}>
              {getIcon()}
              {prediction.status === 'safe' 
                ? `OK ${prediction.hoursToOutOfStock}h`
                : prediction.status === 'warning'
                  ? `Bas ${prediction.hoursToOutOfStock}h`
                  : `Rupture ${prediction.hoursToOutOfStock}h`
              }
            </span>
          </TooltipTrigger>
          <TooltipContent className="w-64">
            <div className="space-y-2">
              <div className="font-semibold">{prediction.materialName}</div>
              <div className="text-sm">
                <p>🔋 Stock actuel: {prediction.currentStock}</p>
                <p>📦 Stock prédit (24h): {prediction.predictedStock}</p>
                <p>📉 Consommation: {prediction.consumptionRate}/h</p>
                <p>⏰ Stock bas dans: {prediction.hoursToLowStock}h</p>
                <p>🚨 Rupture dans: {prediction.hoursToOutOfStock}h</p>
                <p>📦 Qté recommandée: {prediction.recommendedOrderQuantity}</p>
                {prediction.predictionModelUsed && (
                  <p className="text-blue-600">🤖 Modèle ML utilisé (confiance: {Math.round(prediction.confidence * 100)}%)</p>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Matériaux</h1>
          <p className="text-gray-500 mt-1">Suivi et gestion en temps réel</p>
        </div>
        <div className="flex gap-2">
          {/* Import Excel */}
          <Button variant="outline" onClick={handleImportExcel} disabled={scanLoading} title="Importer Excel">
            {scanLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Import
          </Button>
          
          {/* Export Excel */}
          <Button variant="outline" onClick={handleExportExcel} title="Exporter Excel">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          
          {/* Export PDF */}
          <Button variant="outline" onClick={handleExportPDF} title="Exporter PDF">
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          
          {/* QR/Barcode Scan Menu */}
          <div className="relative" ref={qrMenuRef}>
            <Button 
              variant="outline" 
              onClick={() => setShowQRMenu(!showQRMenu)}
              disabled={scanLoading}
              title="Scanner QR/Barcode"
            >
              {scanLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ScanLine className="h-4 w-4 mr-2" />}
              Scanner
            </Button>
            {showQRMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border">
                <button onClick={handleScanQR} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Scanner QR (image)
                </button>
                <button onClick={handleScanQRText} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Scanner QR (texte)
                </button>
                <button onClick={handleScanBarcode} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Scanner Code-barres
                </button>
              </div>
            )}
          </div>
          
          {/* Refresh */}
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          {/* Add Material */}
          <Button onClick={() => { setMaterialToEdit(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <Card className={dashboardStats.outOfStock > 0 ? 'border-red-500 border-2' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Matériaux</p>
                <p className="text-2xl font-bold">{dashboardStats.totalMaterials}</p>
              </div>
              <Boxes className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Quantité Totale</p>
                <p className="text-2xl font-bold">{dashboardStats.totalQuantity.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={dashboardStats.lowStock > 0 ? 'border-yellow-500 border-2' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Stock Bas</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboardStats.lowStock}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={dashboardStats.outOfStock > 0 ? 'border-red-500 border-2' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rupture Stock</p>
                <p className="text-2xl font-bold text-red-600">{dashboardStats.outOfStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Catégories</p>
                <p className="text-2xl font-bold">{dashboardStats.categoriesCount}</p>
              </div>
              <Filter className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts Banner */}
      {alerts.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="font-semibold text-red-700">Alertes de Stock ({alerts.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.slice(0, 5).map(alert => (
              <span 
                key={alert._id} 
                className={`px-2 py-1 rounded text-xs ${!alert.quantity || alert.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
              >
                {alert.name} ({alert.quantity || 0})
              </span>
            ))}
            {alerts.length > 5 && (
              <span className="px-2 py-1 text-xs text-gray-500">+{alerts.length - 5} autres</span>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des Matériaux</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" onClick={() => setFilterOpen(!filterOpen)}>
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>
          {filterOpen && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Catégorie</label>
                <select className="w-full px-3 py-2 border rounded-md mt-1" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">Toutes</option>
                  {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Par page</label>
                <select className="w-full px-3 py-2 border rounded-md mt-1" value={pagination.limit} onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
<div className="flex items-end">
                  <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
                {alerts.length > 0 && (
                  <div className="flex items-end gap-2">
                    <Button 
                      variant={stockFilter === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setStockFilter('all')}
                    >
                      Tous ({materials.length})
                    </Button>
                    <Button 
                      variant={stockFilter === 'low' ? 'default' : 'outline'}
                      size="sm"
                      className={stockFilter === 'low' ? 'bg-yellow-500' : ''}
                      onClick={() => setStockFilter('low')}
                    >
                      Stock Bas ({dashboardStats.lowStock})
                    </Button>
                    <Button 
                      variant={stockFilter === 'out' ? 'default' : 'outline'}
                      size="sm"
                      className={stockFilter === 'out' ? 'bg-red-500' : ''}
                      onClick={() => setStockFilter('out')}
                    >
                      Rupture ({dashboardStats.outOfStock})
                    </Button>
                  </div>
                )}
              </div>
            )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-gray-500">Chargement...</p>
            </div>
          ) : paginatedMaterials.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Aucun matériau trouvé</p>
              <Button variant="outline" className="mt-4" onClick={() => { setMaterialToEdit(null); setShowForm(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un matériau
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedMaterials.map((material) => (
                  <div key={material._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{material.name}</h3>
                        <span className="text-sm text-gray-500">({material.code})</span>
                        {getStatusBadge(material)}
                      </div>
                      <div className="grid grid-cols-7 gap-4 mt-2 text-sm">
                        <div><span className="text-gray-500">Qté:</span> <span className="font-medium">{material.quantity} {material.unit}</span></div>
                        <div><span className="text-gray-500">Min:</span> <span className="font-medium">{material.minimumStock}</span></div>
                        <div><span className="text-gray-500">Max:</span> <span className="font-medium">{material.maximumStock}</span></div>
                        <div><span className="text-gray-500">Emplacement:</span> <span className="font-medium">{material.location || '-'}</span></div>
                        <div><span className="text-gray-500">Catégorie:</span> <span className="font-medium">{material.category}</span></div>
                        <div><span className="text-gray-500">Site:</span> <span className="font-medium">{material.siteName || '-'}</span></div>
                        <div>
                          <span className="text-gray-500">Prédiction IA:</span>
                          <div className="mt-1">
                            {renderPredictionBadge(material._id)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedMaterial(material)} title="Détails du matériau">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedMaterialForPrediction(material)} title="Prédiction IA">
                        <Brain className="h-4 w-4 text-purple-600" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(material)} title="Modifier">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {showDeleteConfirm === material._id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(material._id)} className="h-8 px-2">Oui</Button>
                          <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(null)} className="h-8 px-2">Non</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600" onClick={() => setShowDeleteConfirm(material._id)} title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {material.quantity <= material.reorderPoint && (
                        <Button size="sm" variant="secondary" className="bg-yellow-500 text-white" onClick={() => handleReorder(material._id, material.name, material.code, material.category, material.siteId, material.siteName, material.siteCoordinates)}>
                          Commander
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleGenerateQR(material)} title="Générer QR">
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {Math.ceil(filteredMaterials.length / pagination.limit) > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button variant="outline" size="sm" onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, Math.ceil(filteredMaterials.length / pagination.limit)) }, (_, i) => {
                    const totalPages = Math.ceil(filteredMaterials.length / pagination.limit);
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (pagination.page <= 3) pageNum = i + 1;
                    else if (pagination.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = pagination.page - 2 + i;
                    return (<Button key={pageNum} variant={pagination.page === pageNum ? "default" : "outline"} size="sm" onClick={() => goToPage(pageNum)} className="min-w-[32px]">{pageNum}</Button>);
                  })}
                  <Button variant="outline" size="sm" onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page >= Math.ceil(filteredMaterials.length / pagination.limit)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <MaterialForm 
          open={showForm} 
          onClose={() => { setShowForm(false); setMaterialToEdit(null); }} 
          onSuccess={() => { 
            setShowForm(false); 
            setMaterialToEdit(null); 
            loadData(); 
            toast.success(materialToEdit ? 'Matériau modifié!' : 'Matériau ajouté!'); 
          }} 
          initialData={materialToEdit} 
        />
      )}

      {selectedMaterial && (
        <MaterialDetails 
          material={selectedMaterial} 
          onClose={() => setSelectedMaterial(null)} 
          onUpdate={loadData} 
        />
      )}

      {selectedMaterialForPrediction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">Prédiction IA - {selectedMaterialForPrediction.name}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMaterialForPrediction(null)}>
                ✕
              </Button>
            </div>
            <div className="p-4">
              <MaterialMLTraining
                materialId={selectedMaterialForPrediction._id}
                materialName={selectedMaterialForPrediction.name}
                currentStock={selectedMaterialForPrediction.quantity}
                reorderPoint={selectedMaterialForPrediction.reorderPoint}
              />
            </div>
          </div>
        </div>
      )}

      {showOrderDialog && materialToOrder && (
        <CreateOrderDialog
          open={showOrderDialog}
          onClose={() => {
            setShowOrderDialog(false);
            setMaterialToOrder(null);
          }}
          materialId={materialToOrder.id}
          materialName={materialToOrder.name}
          materialCode={materialToOrder.code}
          materialCategory={materialToOrder.category}
          materialSiteId={materialToOrder.siteId}
          materialSiteName={materialToOrder.siteName}
          materialSiteCoordinates={materialToOrder.siteCoordinates}
          onOrderCreated={() => {
            loadData();
            toast.success('Commande créée! Cliquez sur "Démarrer livraison" pour suivre le truck');
          }}
        />
      )}
    </div>
  );
}