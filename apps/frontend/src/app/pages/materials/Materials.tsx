import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Search, 
  Barcode, 
  Edit, 
  Trash2, 
  Plus, 
  Filter, 
  X,
  Upload,
  Eye,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Loader2,
  Printer,
  FileText,
  Settings
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { toast } from 'sonner';
import materialService, { Material, CreateMaterialData, BulkImportResponse } from '../../../services/materialService';
import MaterialForm from './MaterialForm';
import MaterialAlerts from './MaterialAlerts';
import MaterialForecast from './MaterialForecast';
import MaterialDetails from './MaterialDetails';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";

export default function Materials() {
  const canManageMaterials = true;
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showQRMenu, setShowQRMenu] = useState(false);
  const qrMenuRef = useRef<HTMLDivElement>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [qrResult, setQrResult] = useState<{
    material?: Material;
    text?: string;
    type: 'material' | 'text' | 'unknown';
  } | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (qrMenuRef.current && !qrMenuRef.current.contains(event.target as Node)) {
        setShowQRMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [materialsData, dashboardData, alertsData] = await Promise.all([
        materialService.getMaterials({ 
          limit: pagination.limit,
          page: pagination.page,
          search: searchTerm || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined
        }),
        materialService.getDashboard(),
        materialService.getAlerts(),
      ]);
      
      console.log('📦 Données chargées:', materialsData);
      
      setMaterials(materialsData.data || []);
      setPagination(prev => ({
        ...prev,
        total: materialsData.total || 0,
        totalPages: materialsData.totalPages || 1
      }));
      setDashboardStats(dashboardData);
      setAlerts(alertsData);
      
      const uniqueCategories = [...new Set((materialsData.data || []).map((m: Material) => m.category))];
      setCategories(uniqueCategories);
    } catch (error: any) {
      console.error('❌ Error loading materials:', error);
      toast.error(error.message || 'Erreur lors du chargement des matériaux');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchTerm === '' || 
      material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'instock' && material.quantity > material.reorderPoint) ||
      (selectedStatus === 'lowstock' && material.quantity <= material.reorderPoint && material.quantity > 0) ||
      (selectedStatus === 'outofstock' && material.quantity === 0) ||
      (selectedStatus === 'expiring' && material.expiryDate && 
        new Date(material.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ========== FONCTIONS D'EXPORT ==========
  
  // Fonction d'export Excel serveur
  const exportToExcelServer = async () => {
    try {
      const blob = await materialService.exportToExcel();
      
      materialService.downloadFile(
        blob,
        `materiaux_${Date.now()}.xlsx`
      );

      toast.success("Export Excel réussi !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur export Excel");
    }
  };

  // Fonction d'export PDF serveur
  const exportToPDFServer = async () => {
    try {
      const blob = await materialService.exportToPDF();
      
      await materialService.downloadFile(
        blob,
        `materiaux_${Date.now()}.pdf`
      );

      toast.success("PDF exporté depuis le serveur !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur export PDF serveur");
    }
  };

  // ========== FONCTIONS D'IMPORT ==========

  // Fonction d'import Excel
  const handleImportExcel = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setScanLoading(true);
      try {
        const result = await materialService.importFromExcel(file) as BulkImportResponse;
        
        if (result.success) {
          toast.success(`Import réussi! ${result.imported} matériaux importés, ${result.failed} échecs`);
          
          if (result.errors && result.errors.length > 0) {
            console.warn('Erreurs d\'import:', result.errors);
            toast.warning(`${result.errors.length} erreurs détectées. Voir console pour détails.`);
          }
          
          loadData();
        } else {
          toast.error('Échec de l\'import');
        }
      } catch (error: any) {
        console.error('Erreur import:', error);
        toast.error('Erreur lors de l\'import: ' + (error.response?.data?.message || error.message));
      } finally {
        setScanLoading(false);
      }
    };
    input.click();
  };

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
        toast.info('Scan du QR code en cours...', { duration: 2000 });
        
        const result = await materialService.scanQRCode(file);
        
        console.log('📸 Résultat scan QR:', result);
        
        if (result.success) {
          if (result.material) {
            setQrResult({
              material: result.material,
              type: 'material'
            });
            
            toast.success(`Matériau trouvé: ${result.material.name}`, { 
              duration: 3000 
            });
            
            setSelectedMaterial(result.material);
            
          } else {
            let qrText = result.qrData;
            let materialInfo = null;
            
            try {
              const parsed = JSON.parse(result.qrData);
              if (parsed.code || parsed.id) {
                materialInfo = parsed;
                qrText = parsed.code || parsed.id || result.qrData;
              }
            } catch {
              // Pas du JSON
            }
            
            setQrResult({
              text: qrText,
              type: 'text'
            });
            
            toast.info(`QR code scanné: "${qrText.substring(0, 30)}..." - Aucun matériau associé`, {
              duration: 8000,
              action: {
                label: 'Créer matériau',
                onClick: () => {
                  setMaterialToEdit({
                    _id: '',
                    name: materialInfo?.name || '',
                    code: materialInfo?.code || qrText,
                    category: materialInfo?.category || '',
                    unit: '',
                    quantity: 0,
                    minimumStock: 10,
                    maximumStock: 100,
                    reorderPoint: 20,
                    location: '',
                    manufacturer: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    createdBy: 'user-id',
                    status: 'active'
                  } as Material);
                  setShowForm(true);
                }
              }
            });
          }
        } else {
          toast.error('QR code non reconnu');
        }
        
      } catch (error: any) {
        console.error('❌ Erreur scan QR:', error);
        
        if (error.response?.status === 400) {
          toast.error('Image invalide ou sans QR code', {
            duration: 4000,
            description: 'Veuillez réessayer avec une autre image'
          });
        } else {
          toast.error('Erreur lors du scan QR', {
            duration: 4000,
            description: error.message || 'Veuillez réessayer'
          });
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
      toast.info('Analyse du QR code...', { duration: 2000 });
      
      const result = await materialService.scanQRCodeText(qrText);
      
      if (result.success) {
        if (result.material) {
          setQrResult({
            material: result.material,
            type: 'material'
          });
          setSelectedMaterial(result.material);
          toast.success(`Matériau trouvé: ${result.material.name}`);
        } else {
          setQrResult({
            text: qrText,
            type: 'text'
          });
          
          toast.info(`QR code: "${qrText}" - Aucun matériau associé`, {
            duration: 5000,
            action: {
              label: 'Créer matériau',
              onClick: () => {
                setMaterialToEdit({
                  _id: '',
                  name: '',
                  code: qrText,
                  category: '',
                  unit: '',
                  quantity: 0,
                  minimumStock: 10,
                  maximumStock: 100,
                  reorderPoint: 20,
                  location: '',
                  manufacturer: '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: 'user-id',
                  status: 'active'
                } as Material);
                setShowForm(true);
              }
            }
          });
        }
      }
    } catch (error) {
      toast.error('Erreur lors de l\'analyse du QR code');
    } finally {
      setScanLoading(false);
    }
  };

  const handleScanBarcode = async () => {
    setShowQRMenu(false);
    const barcode = prompt('Entrez le code-barres:');
    if (!barcode) return;
    
    setScanLoading(true);
    setQrResult(null);
    
    try {
      const material = await materialService.findByBarcode(barcode);
      
      setSelectedMaterial(material);
      toast.success(`Matériau trouvé: ${material.name}`);
      
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Aucun matériau trouvé avec ce code-barres', {
          duration: 4000,
          action: {
            label: 'Créer',
            onClick: () => {
              setMaterialToEdit({
                _id: '',
                name: '',
                code: barcode,
                category: '',
                unit: '',
                quantity: 0,
                minimumStock: 10,
                maximumStock: 100,
                reorderPoint: 20,
                location: '',
                manufacturer: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'user-id',
                status: 'active'
              } as Material);
              setShowForm(true);
            }
          }
        });
      } else {
        toast.error('Erreur lors de la recherche');
      }
    } finally {
      setScanLoading(false);
    }
  };

  const handleGenerateQR = async (material: Material) => {
    try {
      const result = await materialService.generateQRCode(material._id);
      toast.success('QR code généré avec succès');
      
      const link = document.createElement('a');
      link.href = result.qrCode;
      link.download = `qr-${material.code}.png`;
      link.click();
      
      setMaterials(prev => prev.map(m => 
        m._id === material._id ? { ...m, qrCode: result.qrCode } : m
      ));
      
    } catch (error) {
      toast.error('Erreur lors de la génération du QR code');
    }
  };

  const handleUpdateStock = async (materialId: string, quantity: number, operation: 'add' | 'remove') => {
    try {
      await materialService.updateStock(materialId, {
        quantity,
        operation,
        reason: 'Mise à jour manuelle',
      });
      toast.success(`Stock ${operation === 'add' ? 'augmenté' : 'diminué'}!`);
      loadData();
    } catch (error) {
      toast.error('Échec de la mise à jour du stock');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await materialService.deleteMaterial(id);
      toast.success('Matériau supprimé avec succès');
      setShowDeleteConfirm(null);
      loadData();
    } catch (error) {
      toast.error('Échec de la suppression');
    }
  };

  const handleReorder = async (materialId: string) => {
    try {
      const result = await materialService.reorderMaterial(materialId);
      if (result.success) {
        toast.success(`Commande créée! Livraison prévue: ${new Date(result.expectedDelivery).toLocaleDateString()}`);
      } else {
        toast.warning(result.message || 'Commande initiée');
      }
      loadData();
    } catch (error) {
      toast.error('Échec de la commande');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventaire des matériaux</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 12px; }
          .in-stock { background: #d4edda; color: #155724; }
          .low-stock { background: #fff3cd; color: #856404; }
          .out-stock { background: #f8d7da; color: #721c24; }
          .footer { margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Inventaire des matériaux</h1>
        <p>Date: ${new Date().toLocaleDateString()}</p>
         <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Quantité</th>
              <th>Unité</th>
              <th>Statut</th>
              <th>Emplacement</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMaterials.map(m => `
              <tr>
                <td>${m.code}</td>
                <td>${m.name}</td>
                <td>${m.category}</td>
                <td>${m.quantity}</td>
                <td>${m.unit}</td>
                <td>
                  <span class="status-badge ${
                    m.quantity === 0 ? 'out-stock' :
                    m.quantity <= m.reorderPoint ? 'low-stock' : 'in-stock'
                  }">
                    ${m.quantity === 0 ? 'Rupture' :
                      m.quantity <= m.reorderPoint ? 'Stock bas' : 'En stock'}
                  </span>
                </td>
                <td>${m.location || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Total matériaux: ${filteredMaterials.length}</p>
          <p>Généré par SmartSite</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusBadge = (material: Material) => {
    if (material.quantity === 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    }
    if (material.quantity <= material.reorderPoint) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Stock bas</Badge>;
    }
    if (material.expiryDate && new Date(material.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">Expire bientôt</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">En stock</Badge>;
  };

  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleEdit = (material: Material) => {
    setMaterialToEdit(material);
    setShowForm(true);
  };

  const showQRResultDetails = () => {
    if (!qrResult) return;
    
    if (qrResult.type === 'material' && qrResult.material) {
      setSelectedMaterial(qrResult.material);
    } else if (qrResult.type === 'text') {
      toast.info(`Texte QR: ${qrResult.text}`, {
        duration: 5000,
        action: {
          label: 'Créer matériau',
          onClick: () => {
            setMaterialToEdit({
              _id: '',
              name: '',
              code: qrResult.text || '',
              category: '',
              unit: '',
              quantity: 0,
              minimumStock: 10,
              maximumStock: 100,
              reorderPoint: 20,
              location: '',
              manufacturer: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: 'user-id',
              status: 'active'
            } as Material);
            setShowForm(true);
          }
        }
      });
    }
  };

  useEffect(() => {
    showQRResultDetails();
  }, [qrResult]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des matériaux</h1>
          <p className="text-gray-500 mt-1">Suivi et gestion en temps réel</p>
        </div>
        <div className="flex gap-2">
          {/* Export Excel Serveur */}
          <Button variant="outline" onClick={exportToExcelServer} title="Exporter en Excel" disabled={scanLoading}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          
          {/* Export PDF Serveur */}
          <Button variant="outline" onClick={exportToPDFServer} title="Exporter en PDF" disabled={scanLoading}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          
          {/* Imprimer */}
          <Button variant="outline" onClick={handlePrint} title="Imprimer" disabled={scanLoading}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          
          {/* Import Excel */}
          <Button variant="outline" onClick={handleImportExcel} title="Import Excel" disabled={scanLoading}>
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          
          {/* Menu QR Code */}
          <div className="relative" ref={qrMenuRef}>
            <Button 
              variant="outline" 
              className="relative"
              onClick={() => setShowQRMenu(!showQRMenu)}
              disabled={scanLoading}
            >
              {scanLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              {scanLoading ? 'Scan...' : 'QR Code'}
            </Button>
            {showQRMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border">
                <button
                  onClick={handleScanQR}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Scanner QR (image)
                </button>
                <button
                  onClick={handleScanQRText}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Scanner QR (texte)
                </button>
                <button
                  onClick={handleScanBarcode}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Scanner code-barres
                </button>
              </div>
            )}
          </div>

          {/* Actualiser */}
          <Button variant="outline" onClick={loadData} disabled={scanLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          
          {/* Ajouter */}
          {canManageMaterials && (
            <Button 
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              onClick={() => {
                setMaterialToEdit(null);
                setShowForm(true);
              }}
              disabled={scanLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{dashboardStats.totalMaterials || 0}</div>
              <p className="text-sm text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{dashboardStats.healthyStockCount || 0}</div>
              <p className="text-sm text-gray-500">Sain</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{dashboardStats.lowStockCount || 0}</div>
              <p className="text-sm text-gray-500">Stock bas</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{dashboardStats.outOfStockCount || 0}</div>
              <p className="text-sm text-gray-500">Rupture</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{dashboardStats.totalValue?.toLocaleString() || 0} TND</div>
              <p className="text-sm text-gray-500">Valeur totale</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-sm text-gray-500">Catégories</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, code, catégorie..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>

          {filterOpen && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-600">Catégorie</label>
                <select
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Toutes catégories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Statut</label>
                <select
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">Tous</option>
                  <option value="instock">En stock</option>
                  <option value="lowstock">Stock bas</option>
                  <option value="outofstock">Rupture</option>
                  <option value="expiring">Expire bientôt</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Tri par</label>
                <select className="w-full px-3 py-2 border rounded-md mt-1">
                  <option>Nom</option>
                  <option>Quantité</option>
                  <option>Date d'expiration</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Par page</label>
                <select
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={pagination.limit}
                  onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventaire ({filteredMaterials.length})</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertes
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">{alerts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="forecast">Prévisions</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Liste des matériaux</span>
                <span className="text-sm font-normal text-gray-500">
                  {pagination.total} matériaux au total • Page {pagination.page}/{pagination.totalPages}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Chargement...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucun matériau trouvé</p>
                  {canManageMaterials && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setMaterialToEdit(null);
                        setShowForm(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un matériau
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {filteredMaterials.map((material) => (
                      <div
                        key={material._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">{material.name}</h3>
                            <span className="text-sm text-gray-500">({material.code})</span>
                            {getStatusBadge(material)}
                          </div>
                          
                          <div className="grid grid-cols-5 gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-gray-500">Qté:</span>{' '}
                              <span className="font-medium">{material.quantity} {material.unit}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Stock min:</span>{' '}
                              <span className="font-medium">{material.minimumStock}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Stock max:</span>{' '}
                              <span className="font-medium">{material.maximumStock}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Emplacement:</span>{' '}
                              <span className="font-medium">{material.location || '-'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Catégorie:</span>{' '}
                              <span className="font-medium">{material.category}</span>
                            </div>
                          </div>

                          {material.expiryDate && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Expire le:</span>{' '}
                              <span className={new Date(material.expiryDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                                {new Date(material.expiryDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex border rounded-md mr-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="px-2 rounded-r-none border-r h-8"
                              onClick={() => handleUpdateStock(material._id, 1, 'remove')}
                              disabled={!canManageMaterials || material.quantity === 0}
                            >
                              -
                            </Button>
                            <span className="px-2 py-1 text-sm bg-gray-50 min-w-[40px] text-center h-8 flex items-center justify-center">
                              {material.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="px-2 rounded-l-none border-l h-8"
                              onClick={() => handleUpdateStock(material._id, 1, 'add')}
                              disabled={!canManageMaterials}
                            >
                              +
                            </Button>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateQR(material)}
                            title="Générer QR code"
                            className="h-8 w-8 p-0"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>

                          {canManageMaterials && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(material)}
                              title="Modifier"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMaterial(material)}
                            title="Voir détails"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {canManageMaterials && (
                            <>
                              {showDeleteConfirm === material._id ? (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(material._id)}
                                    className="h-8 px-2"
                                  >
                                    Oui
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="h-8 px-2"
                                  >
                                    Non
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setShowDeleteConfirm(material._id)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}

                          {material.quantity <= material.reorderPoint && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-yellow-500 text-white hover:bg-yellow-600 h-8"
                              onClick={() => handleReorder(material._id)}
                            >
                              Commander
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="min-w-[32px]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <MaterialAlerts alerts={alerts} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="forecast">
          <MaterialForecast materials={materials} />
        </TabsContent>
      </Tabs>

      {showForm && (
        <MaterialForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setMaterialToEdit(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setMaterialToEdit(null);
            loadData();
            toast.success(materialToEdit ? 'Matériau modifié avec succès' : 'Matériau ajouté avec succès');
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
    </div>
  );
}