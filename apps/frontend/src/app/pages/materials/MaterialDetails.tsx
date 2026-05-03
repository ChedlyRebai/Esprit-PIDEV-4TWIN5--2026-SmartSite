import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Package, Calendar, MapPin, Factory, Barcode, TrendingUp,
  Truck, AlertTriangle, ArrowDownCircle, ArrowUpCircle,
  Activity, Navigation, RefreshCw
} from 'lucide-react';
import { useState, useEffect } from 'react';
import materialService, { Material } from '../../../services/materialService';
import materialFlowService, { AnomalyType } from '../../../services/materialFlowService';
import AIPredictionWidget from '../../components/materials/AIPredictionWidget';
import MaterialWeatherWidget from '../../components/materials/MaterialWeatherWidget';
import { toast } from 'sonner';

interface MaterialDetailsProps {
  material: Material;
  onClose: () => void;
  onUpdate: () => void;
  onOrder?: (
    materialId: string,
    materialName: string,
    materialCode: string,
    materialCategory: string,
    siteId?: string,
    siteName?: string,
    siteCoordinates?: { lat: number; lng: number }
  ) => void;
}

export default function MaterialDetails({ material, onClose, onUpdate, onOrder }: MaterialDetailsProps) {
  const [flowLogs, setFlowLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aggregateStats, setAggregateStats] = useState<{
    totalEntries: number;
    totalExits: number;
    netFlow: number;
    totalAnomalies: number;
  } | null>(null);

  useEffect(() => {
    loadFlowLogs();
    loadAggregateStats();
  }, [material._id]);

  const loadFlowLogs = async () => {
    setLoading(true);
    try {
      // Use enriched flows to get material/site names and anomaly info
      const result = await materialFlowService.getEnrichedFlows({
        materialId: material._id,
        limit: 20,
      });
      setFlowLogs(result.data || []);
    } catch (error) {
      // Fallback to basic movements
      try {
        const data = await materialService.getMovements(material._id);
        setFlowLogs(data || []);
      } catch (e) {
        console.error('Error loading movements:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAggregateStats = async () => {
    try {
      const stats = await materialFlowService.getAggregateStats(material._id, material.siteId);
      setAggregateStats(stats);
    } catch (error) {
      console.error('Error loading aggregate stats:', error);
    }
  };

  const handleReorder = () => {
    if (onOrder) {
      onOrder(
        material._id,
        material.name,
        material.code,
        material.category,
        material.siteId,
        material.siteName,
        material.siteCoordinates
      );
      onClose();
    } else {
      toast.error('Order function not available');
    }
  };

  const shouldShowOrderButton = () => {
    const threshold = (material as any).stockMinimum || material.reorderPoint || material.minimumStock || 0;
    return material.quantity === 0 || material.quantity <= threshold;
  };

  const getStatusBadge = () => {
    const threshold = (material as any).stockMinimum || material.reorderPoint || material.minimumStock || 0;
    if (material.quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (material.quantity <= threshold) return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  const getFlowIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t === 'IN' || t === 'RETURN') return <ArrowDownCircle className="h-4 w-4 text-green-500" />;
    if (t === 'OUT' || t === 'DAMAGE') return <ArrowUpCircle className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-400" />;
  };

  const getFlowColor = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t === 'IN' || t === 'RETURN') return 'text-green-600';
    if (t === 'OUT' || t === 'DAMAGE') return 'text-red-600';
    return 'text-gray-600';
  };

  const getFlowSign = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t === 'IN' || t === 'RETURN') return '+';
    if (t === 'OUT' || t === 'DAMAGE') return '-';
    return '';
  };

  const getFlowLabel = (type: string) => {
    const labels: Record<string, string> = {
      IN: 'Entry', OUT: 'Exit', DAMAGE: 'Damaged',
      RESERVE: 'Reserved', RETURN: 'Return', ADJUSTMENT: 'Adjustment',
      in: 'Entry', out: 'Exit', damage: 'Damaged', reserve: 'Reserved',
    };
    return labels[type] || type;
  };

  const hasAnomaly = (flow: any) =>
    flow.anomalyDetected && flow.anomalyDetected !== 'NONE' && flow.anomalyDetected !== AnomalyType.NONE;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-5 w-5" />
            {material.name}
            <span className="text-sm font-normal text-gray-500">({material.code})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ===== BASIC INFO GRID ===== */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                  <Barcode className="h-3 w-3" />Code
                </div>
                <p className="font-bold">{material.code}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                  <Factory className="h-3 w-3" />Category
                </div>
                <p className="font-bold capitalize">{material.category}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                  <Package className="h-3 w-3" />Quantity
                </div>
                <p className="font-bold text-lg">{material.quantity} <span className="text-sm font-normal text-gray-500">{material.unit}</span></p>
                <div className="mt-1">{getStatusBadge()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />Assigned Site
                </div>
                <p className="font-bold">{material.siteName || 'Not assigned'}</p>
                {material.siteCoordinates && (
                  <div className="flex items-center gap-1 mt-1">
                    <Navigation className="h-3 w-3 text-blue-500" />
                    <p className="text-xs text-blue-600 font-mono">
                      {material.siteCoordinates.lat.toFixed(5)}, {material.siteCoordinates.lng.toFixed(5)}
                    </p>
                  </div>
                )}
                {(material as any).siteAddress && (
                  <p className="text-xs text-gray-400 mt-0.5">{(material as any).siteAddress}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ===== WEATHER WIDGET ===== */}
          {(material.siteCoordinates || (material as any).siteAddress || material.siteName) && (
            <MaterialWeatherWidget
              siteCoordinates={material.siteCoordinates}
              siteAddress={(material as any).siteAddress}
              siteName={material.siteName}
              materialCategory={material.category}
              onWeatherUpdate={(weather) => console.log('Weather:', weather)}
            />
          )}

          {/* ===== AI PREDICTION ===== */}
          <AIPredictionWidget
            material={{
              _id: material._id,
              name: material.name,
              quantity: material.quantity,
              category: material.category,
              siteId: material.siteId,
              siteName: material.siteName,
              siteCoordinates: material.siteCoordinates,
              siteAddress: (material as any).siteAddress,
            }}
            onPredictionUpdate={(p) => console.log('Prediction:', p)}
          />

          {/* ===== STOCK LEVELS ===== */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />Stock Levels
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Current:</span>
                  <span className="font-bold">{material.quantity} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Minimum:</span>
                  <span>{material.minimumStock} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Maximum:</span>
                  <span>{material.maximumStock} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reorder Point:</span>
                  <span>{(material as any).stockMinimum || material.reorderPoint} {material.unit}</span>
                </div>
                {material.expiryDate && (
                  <div className="flex justify-between col-span-2">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />Expiry:
                    </span>
                    <span className={new Date(material.expiryDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                      {new Date(material.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ===== FLOW AGGREGATE STATS ===== */}
          {aggregateStats && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4" />Movement Summary (All Time)
                </h3>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{aggregateStats.totalEntries}</p>
                    <p className="text-xs text-gray-500">Total Entries</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{aggregateStats.totalExits}</p>
                    <p className="text-xs text-gray-500">Total Exits</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${aggregateStats.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {aggregateStats.netFlow >= 0 ? '+' : ''}{aggregateStats.netFlow}
                    </p>
                    <p className="text-xs text-gray-500">Net Balance</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${aggregateStats.totalAnomalies > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {aggregateStats.totalAnomalies}
                    </p>
                    <p className="text-xs text-gray-500">Anomalies</p>
                  </div>
                </div>
                {/* Anomaly warning if exits >> entries */}
                {aggregateStats.totalExits > aggregateStats.totalEntries * 1.5 && aggregateStats.totalEntries > 0 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>⚠️ Exits significantly exceed entries — possible theft or waste risk!</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== RECENT FLOW LOG ===== */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4" />Recent Movements (Entries & Exits)
                </h3>
                <Button variant="ghost" size="sm" onClick={loadFlowLogs} disabled={loading}>
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {loading ? (
                <p className="text-center py-4 text-gray-400 text-sm">Loading...</p>
              ) : flowLogs.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No movements recorded yet</p>
                  <p className="text-xs mt-1">Use Add/Update material to record stock movements</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {flowLogs.slice(0, 10).map((flow, index) => (
                    <div
                      key={flow._id || index}
                      className={`flex items-center justify-between p-2.5 rounded-lg border ${
                        hasAnomaly(flow) ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFlowIcon(flow.type)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold text-sm ${getFlowColor(flow.type)}`}>
                              {getFlowSign(flow.type)}{flow.quantity} {material.unit}
                            </span>
                            <Badge variant="outline" className="text-xs py-0">
                              {getFlowLabel(flow.type)}
                            </Badge>
                            {hasAnomaly(flow) && (
                              <Badge className="bg-red-100 text-red-700 text-xs py-0">
                                ⚠️ Anomaly
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                            <span>{new Date(flow.timestamp || flow.date).toLocaleString()}</span>
                            {flow.siteName && <span>• {flow.siteName}</span>}
                            {flow.reason && <span>• {flow.reason}</span>}
                          </div>
                          {flow.anomalyMessage && (
                            <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {flow.anomalyMessage}
                            </p>
                          )}
                        </div>
                      </div>
                      {(flow.previousStock !== undefined && flow.newStock !== undefined) && (
                        <div className="text-right text-xs text-gray-400 flex-shrink-0 ml-2">
                          <span>{flow.previousStock}</span>
                          <span className="mx-1">→</span>
                          <span className={flow.newStock < flow.previousStock ? 'text-red-500 font-medium' : 'text-green-500 font-medium'}>
                            {flow.newStock}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== ACTIONS ===== */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {shouldShowOrderButton() && (
              <Button
                onClick={handleReorder}
                className={`${
                  material.quantity === 0
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-yellow-500 hover:bg-yellow-600'
                } text-white flex items-center gap-2`}
              >
                {material.quantity === 0 ? (
                  <><AlertTriangle className="h-4 w-4" />Urgent Order</>
                ) : (
                  <><Truck className="h-4 w-4" />Order</>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
