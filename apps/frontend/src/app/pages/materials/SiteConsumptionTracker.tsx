import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { toast } from 'sonner';
import {
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Building2,
  CheckCircle,
  Clock,
  History,
  Brain,
} from 'lucide-react';
import consumptionService, { MaterialRequirement, SiteConsumptionStats } from '../../../services/consumptionService';
import materialService, { Material } from '../../../services/materialService';
import { siteService, Site } from '../../../services/siteFournisseurService';
import MaterialRequirementForm from './MaterialRequirementForm';
import ConsumptionHistory from './ConsumptionHistory';
import ConsumptionAIReport from './ConsumptionAIReport';

interface SiteConsumptionTrackerProps {
  siteId?: string;
  siteName?: string;
  onClose?: () => void;
}

export default function SiteConsumptionTracker({ siteId: initialSiteId, siteName: initialSiteName, onClose }: SiteConsumptionTrackerProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId || '');
  const [selectedSiteName, setSelectedSiteName] = useState<string>(initialSiteName || '');
  const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);
  const [stats, setStats] = useState<SiteConsumptionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<MaterialRequirement | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [formData, setFormData] = useState({
    materialId: '',
    initialQuantity: 0,
    notes: '',
  });
  const [updateQuantity, setUpdateQuantity] = useState(0);
  const [updateNotes, setUpdateNotes] = useState('');
  const [addQuantityByRequirement, setAddQuantityByRequirement] = useState<Record<string, number>>({});
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [showAIReport, setShowAIReport] = useState(false);
  const [selectedMaterialForReport, setSelectedMaterialForReport] = useState<{ materialId: string; materialName: string } | null>(null);

  useEffect(() => {
    loadSites();
    loadMaterials();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadRequirements();
      loadStats();
    }
  }, [selectedSiteId]);

  const loadSites = async () => {
    try {
      const sitesData = await siteService.getSites();
      setSites(sitesData);
      if (!initialSiteId && sitesData.length > 0 && !selectedSiteId) {
        setSelectedSiteId(sitesData[0]._id);
        setSelectedSiteName(sitesData[0].nom);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      const materialsData = await materialService.getMaterials({ page: 1, limit: 1000 });
      const materialsList = Array.isArray(materialsData) ? materialsData : materialsData.data || [];
      setMaterials(materialsList);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  // ✅ Filtrer les matériaux par site sélectionné
  const getFilteredMaterials = () => {
    if (!selectedSiteId) return materials;
    return materials.filter(m => m.siteId === selectedSiteId);
  };

  const loadRequirements = async () => {
    if (!selectedSiteId) return;
    setLoading(true);
    try {
      const data = await consumptionService.getRequirementsBySite(selectedSiteId);
      setRequirements(data);
    } catch (error) {
      console.error('Error loading requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedSiteId) return;
    try {
      const data = await consumptionService.getSiteStats(selectedSiteId, selectedSiteName);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAddRequirement = async () => {
    if (!formData.materialId) {
      toast.error('Please select a material');
      return;
    }
    if (formData.initialQuantity <= 0) {
      toast.error('Initial quantity must be greater than 0');
      return;
    }
    if (!selectedSiteId) {
      toast.error('No site selected');
      return;
    }

    try {
      console.log('📤 Sending createRequirement request:', {
        siteId: selectedSiteId,
        materialId: formData.materialId,
        initialQuantity: formData.initialQuantity,
        notes: formData.notes,
      });
      
      await consumptionService.createRequirement({
        siteId: selectedSiteId,
        materialId: formData.materialId,
        initialQuantity: formData.initialQuantity,
        notes: formData.notes,
      });
      toast.success('Requirement added successfully');
      setShowAddDialog(false);
      setFormData({ materialId: '', initialQuantity: 0, notes: '' });
      loadRequirements();
      loadStats();
      setHistoryRefreshKey(prev => prev + 1); // Refresh history
    } catch (error: any) {
      console.error('❌ Error createRequirement:', error.response?.data);
      
      // Display detailed error message from backend
      const errorMessage = error.response?.data?.message || error.message || "Error adding requirement";
      
      // If it's a validation error
      if (Array.isArray(error.response?.data?.message)) {
        toast.error(`Validation error: ${error.response.data.message.join(', ')}`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleUpdateConsumption = async () => {
    if (!selectedRequirement) return;
    if (updateQuantity < 0 || updateQuantity > selectedRequirement.initialQuantity) {
      toast.error(`Consumption must be between 0 and ${selectedRequirement.initialQuantity}`);
      return;
    }

    try {
      // 🔥 FIX: Extract ID if materialId is an object
      const materialId = typeof selectedRequirement.materialId === 'object' 
        ? (selectedRequirement.materialId as any)._id 
        : selectedRequirement.materialId;
      
      await consumptionService.updateConsumption(selectedSiteId, materialId, {
        consumedQuantity: updateQuantity,
        notes: updateNotes,
      });
      toast.success('Consumption updated');
      setShowUpdateDialog(false);
      setSelectedRequirement(null);
      setUpdateQuantity(0);
      setUpdateNotes('');
      loadRequirements();
      loadStats();
      setHistoryRefreshKey(prev => prev + 1); // Refresh history
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating consumption');
    }
  };

  const handleAddConsumption = async (requirement: MaterialRequirement, quantity: number) => {
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (requirement.consumedQuantity + quantity > requirement.initialQuantity) {
      toast.error(`Total consumption cannot exceed ${requirement.initialQuantity}`);
      return;
    }

    try {
      // 🔥 FIX: Extract ID if materialId is an object
      const materialId = typeof requirement.materialId === 'object' 
        ? (requirement.materialId as any)._id 
        : requirement.materialId;
      
      await consumptionService.addConsumption(selectedSiteId, materialId, quantity);
      toast.success(`${quantity} ${requirement.materialUnit} consumed`);
      setAddQuantityByRequirement((prev) => ({ ...prev, [requirement._id]: 0 }));
      loadRequirements();
      loadStats();
      setHistoryRefreshKey(prev => prev + 1); // Refresh history
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error adding consumption");
    }
  };

  const handleDeleteRequirement = async (requirement: MaterialRequirement) => {
    if (!window.confirm(`Delete requirement for ${requirement.materialName}?`)) return;

    try {
      // 🔥 FIX: Extract ID if materialId is an object
      const materialId = typeof requirement.materialId === 'object' 
        ? (requirement.materialId as any)._id 
        : requirement.materialId;
      
      await consumptionService.deleteRequirement(selectedSiteId, materialId);
      toast.success('Requirement deleted');
      loadRequirements();
      loadStats();
      setHistoryRefreshKey(prev => prev + 1); // Refresh history
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error deleting requirement');
    }
  };

  const openUpdateDialog = (requirement: MaterialRequirement) => {
    setSelectedRequirement(requirement);
    setUpdateQuantity(requirement.consumedQuantity);
    setUpdateNotes('');
    setShowUpdateDialog(true);
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (percentage >= 70) return <Clock className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Building2 className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold">Site Consumption Tracking</h2>
            <p className="text-sm text-gray-500">Intelligent material management by site</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSiteId} onValueChange={(value) => {
            setSelectedSiteId(value);
            setSelectedSiteName(sites.find(s => s._id === value)?.nom || '');
          }}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a site" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site._id} value={site._id}>
                  {site.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadRequirements} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            className="bg-purple-50 hover:bg-purple-100 text-purple-700"
            onClick={() => {
              if (requirements.length > 0) {
                const firstReq = requirements[0];
                // ✅ FIX: Vérifier que materialId existe avant d'accéder à _id
                let materialId: string;
                if (typeof firstReq.materialId === 'object' && firstReq.materialId !== null) {
                  materialId = (firstReq.materialId as any)._id || '';
                } else {
                  materialId = firstReq.materialId || '';
                }
                
                if (!materialId) {
                  toast.error('Material ID not found');
                  return;
                }
                
                setSelectedMaterialForReport({
                  materialId,
                  materialName: firstReq.materialName
                });
                setShowAIReport(true);
              } else {
                toast.error('No material available for report');
              }
            }}
            disabled={requirements.length === 0}
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Report
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {stats && stats.materialsCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total Quantity</p><p className="text-2xl font-bold">{stats.totalInitialQuantity.toLocaleString()}</p><p className="text-xs text-gray-400">planned</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Consumed</p><p className="text-2xl font-bold text-green-600">{stats.totalConsumedQuantity.toLocaleString()}</p><p className="text-xs text-gray-400">{stats.totalInitialQuantity > 0 ? ((stats.totalConsumedQuantity / stats.totalInitialQuantity) * 100).toFixed(1) : '0.0'}%</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Remaining</p><p className="text-2xl font-bold text-yellow-600">{stats.totalRemainingQuantity.toLocaleString()}</p><p className="text-xs text-gray-400">to consume</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Overall Progress</p><p className="text-2xl font-bold">{stats.overallProgress.toFixed(1)}%</p><p className="text-xs text-gray-400">{stats.materialsCount} materials</p></CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="consumption" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consumption" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Consumption
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consumption">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Site Materials {selectedSiteName && `- ${selectedSiteName}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2 text-gray-500">Loading...</p>
                </div>
              ) : requirements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No materials defined for this site</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requirements.map((req) => (
                    <div key={req._id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(req.progressPercentage)}
                          <div>
                            <h3 className="font-semibold">{req.materialName}</h3>
                            <p className="text-sm text-gray-500">{req.materialCode} • {req.materialCategory}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={req.progressPercentage >= 90 ? 'destructive' : req.progressPercentage >= 70 ? 'secondary' : 'default'}>
                            {req.progressPercentage.toFixed(1)}%
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => openUpdateDialog(req)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteRequirement(req)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div><p className="text-xs text-gray-500">Planned Quantity</p><p className="font-medium">{req.initialQuantity} {req.materialUnit}</p></div>
                        <div><p className="text-xs text-gray-500">Consumed</p><p className="font-medium text-green-600">{req.consumedQuantity} {req.materialUnit}</p></div>
                        <div><p className="text-xs text-gray-500">Remaining</p><p className="font-medium text-yellow-600">{req.remainingQuantity} {req.materialUnit}</p></div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{req.progressPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={req.progressPercentage} />
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Consumed quantity"
                          className="w-40 text-sm"
                          min={0}
                          max={req.remainingQuantity}
                          value={addQuantityByRequirement[req._id] || ''}
                          onChange={(e) =>
                            setAddQuantityByRequirement((prev) => ({
                              ...prev,
                              [req._id]: parseInt(e.target.value, 10) || 0,
                            }))
                          }
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddConsumption(req, addQuantityByRequirement[req._id] || 0)}
                          disabled={(addQuantityByRequirement[req._id] || 0) <= 0}
                        >
                          Add Consumption
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <ConsumptionHistory key={historyRefreshKey} siteId={selectedSiteId} />
        </TabsContent>
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Material to Site</DialogTitle>
          </DialogHeader>
          <MaterialRequirementForm
            materials={getFilteredMaterials()}
            materialId={formData.materialId}
            initialQuantity={formData.initialQuantity}
            notes={formData.notes}
            onMaterialIdChange={(v) => setFormData({ ...formData, materialId: v })}
            onInitialQuantityChange={(v) => setFormData({ ...formData, initialQuantity: v })}
            onNotesChange={(v) => setFormData({ ...formData, notes: v })}
            onCancel={() => setShowAddDialog(false)}
            onSubmit={handleAddRequirement}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Consumption - {selectedRequirement?.materialName}
            </DialogTitle>
          </DialogHeader>
          {selectedRequirement && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-2 bg-gray-50 rounded"><p className="text-xs text-gray-500">Planned</p><p className="font-medium">{selectedRequirement.initialQuantity} {selectedRequirement.materialUnit}</p></div>
                <div className="p-2 bg-green-50 rounded"><p className="text-xs text-gray-500">Consumed</p><p className="font-medium text-green-600">{updateQuantity} / {selectedRequirement.initialQuantity}</p></div>
                <div className="p-2 bg-yellow-50 rounded"><p className="text-xs text-gray-500">Remaining</p><p className="font-medium text-yellow-600">{selectedRequirement.initialQuantity - updateQuantity}</p></div>
              </div>
              <div>
                <Label>New Consumed Quantity</Label>
                <Input
                  type="number"
                  min={0}
                  max={selectedRequirement.initialQuantity}
                  value={updateQuantity}
                  onChange={(e) => setUpdateQuantity(parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Reason for update..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>Cancel</Button>
                <Button onClick={handleUpdateConsumption}>Update</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Report Dialog */}
      {showAIReport && selectedMaterialForReport && (
        <ConsumptionAIReport
          materialId={selectedMaterialForReport.materialId}
          siteId={selectedSiteId}
          materialName={selectedMaterialForReport.materialName}
          open={showAIReport}
          onClose={() => {
            setShowAIReport(false);
            setSelectedMaterialForReport(null);
          }}
        />
      )}
    </div>
  );
}