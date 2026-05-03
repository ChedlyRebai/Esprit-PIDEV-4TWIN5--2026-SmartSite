import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { AlertTriangle, Package, Calendar, TrendingUp, XCircle, CheckCircle, Shield, Trash2, RefreshCw } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import materialService from '../../../services/materialService';
import materialFlowService, { AnomalyType } from '../../../services/materialFlowService';

interface Anomaly {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'overstock' | 'high_consumption' | 'theft' | 'waste' | 'flow_anomaly';
  severity: 'critical' | 'high' | 'medium' | 'low';
  materialName: string;
  materialCode?: string;
  siteName?: string;
  message: string;
  value?: number;
  threshold?: number;
  date: Date;
  resolved?: boolean;
  deviation_percentage?: number;
  current_consumption?: number;
  average_consumption?: number;
  recommended_action?: string;
  risk_level?: string;
}

export default function AnomaliesList() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [mlAvailable, setMlAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    loadAnomalies();
    const interval = setInterval(loadAnomalies, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const newAnomalies: Anomaly[] = [];

      // 1. Try ML-powered anomaly detection from FastAPI
      try {
        const mlResponse = await fetch('/api/materials/anomalies/detect');
        if (mlResponse.ok) {
          const mlData = await mlResponse.json();
          setMlAvailable(mlData.success !== false);

          if (mlData.success) {
            // Theft risk anomalies
            mlData.theft_risk?.forEach((anomaly: any) => {
              newAnomalies.push({
                id: `${anomaly.material_id}-theft`,
                type: 'theft',
                severity: anomaly.severity || 'high',
                materialName: anomaly.material_name,
                materialCode: anomaly.material_id,
                siteName: anomaly.site_name,
                message: anomaly.message,
                deviation_percentage: anomaly.deviation_percentage,
                current_consumption: anomaly.current_consumption,
                average_consumption: anomaly.average_consumption,
                recommended_action: anomaly.recommended_action,
                risk_level: anomaly.risk_level,
                date: new Date(),
              });
            });

            // Waste risk anomalies
            mlData.waste_risk?.forEach((anomaly: any) => {
              newAnomalies.push({
                id: `${anomaly.material_id}-waste`,
                type: 'waste',
                severity: anomaly.severity || 'medium',
                materialName: anomaly.material_name,
                materialCode: anomaly.material_id,
                siteName: anomaly.site_name,
                message: anomaly.message,
                deviation_percentage: anomaly.deviation_percentage,
                current_consumption: anomaly.current_consumption,
                average_consumption: anomaly.average_consumption,
                recommended_action: anomaly.recommended_action,
                risk_level: anomaly.risk_level,
                date: new Date(),
              });
            });

            // Over-consumption anomalies
            mlData.over_consumption?.forEach((anomaly: any) => {
              newAnomalies.push({
                id: `${anomaly.material_id}-overcons`,
                type: 'high_consumption',
                severity: anomaly.severity || 'medium',
                materialName: anomaly.material_name,
                materialCode: anomaly.material_id,
                siteName: anomaly.site_name,
                message: anomaly.message,
                deviation_percentage: anomaly.deviation_percentage,
                current_consumption: anomaly.current_consumption,
                average_consumption: anomaly.average_consumption,
                recommended_action: anomaly.recommended_action,
                risk_level: anomaly.risk_level,
                date: new Date(),
              });
            });
          }
        } else {
          setMlAvailable(false);
        }
      } catch (mlError) {
        console.warn('ML service not available, using flow log anomalies:', mlError);
        setMlAvailable(false);
      }

      // 2. Always get flow log anomalies (IN/OUT imbalance detection)
      try {
        const flowAnomalies = await materialFlowService.getAnomalies();
        flowAnomalies.forEach((flow: any) => {
          if (flow.anomalyDetected && flow.anomalyDetected !== AnomalyType.NONE) {
            const severityMap: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
              EXCESSIVE_OUT: 'critical',
              EXCESSIVE_IN: 'medium',
              BELOW_SAFETY_STOCK: 'high',
              UNEXPECTED_MOVEMENT: 'medium',
            };
            newAnomalies.push({
              id: `flow-${flow._id}`,
              type: 'flow_anomaly',
              severity: severityMap[flow.anomalyDetected] || 'medium',
              materialName: flow.materialName || 'Unknown Material',
              materialCode: flow.materialCode,
              siteName: flow.siteName,
              message: flow.anomalyMessage || `Flow anomaly: ${flow.anomalyDetected}`,
              value: flow.quantity,
              date: new Date(flow.timestamp),
              recommended_action: flow.anomalyDetected === 'EXCESSIVE_OUT'
                ? 'Verify stock movement — possible theft or waste'
                : 'Review stock movement',
            });
          }
        });
      } catch (flowError) {
        console.warn('Could not load flow anomalies:', flowError);
      }

      // 3. Stock-based anomalies from materials list
      try {
        const materialsResult = await materialService.getMaterials({ limit: 200 });
        const materialList = Array.isArray(materialsResult)
          ? materialsResult
          : (materialsResult as any).data || [];

        for (const material of materialList) {
          const threshold = (material as any).stockMinimum || material.reorderPoint || material.minimumStock || 0;

          // Out of stock
          if (!material.quantity || material.quantity === 0) {
            newAnomalies.push({
              id: `${material._id}-out`,
              type: 'out_of_stock',
              severity: 'critical',
              materialName: material.name,
              materialCode: material.code,
              siteName: material.siteName,
              message: `Out of stock! Urgent order needed.`,
              value: 0,
              threshold,
              date: new Date(),
            });
          } else if (material.quantity <= threshold) {
            // Low stock
            newAnomalies.push({
              id: `${material._id}-low`,
              type: 'low_stock',
              severity: 'high',
              materialName: material.name,
              materialCode: material.code,
              siteName: material.siteName,
              message: `Low stock: ${material.quantity}/${threshold} ${material.unit}`,
              value: material.quantity,
              threshold,
              date: new Date(),
            });
          }

          // Expiring soon
          if (material.expiryDate) {
            const daysToExpiry = Math.ceil(
              (new Date(material.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            if (daysToExpiry <= 30 && daysToExpiry > 0) {
              newAnomalies.push({
                id: `${material._id}-exp`,
                type: 'expiring',
                severity: daysToExpiry <= 7 ? 'critical' : 'high',
                materialName: material.name,
                materialCode: material.code,
                siteName: material.siteName,
                message: `Expires in ${daysToExpiry} days (${new Date(material.expiryDate).toLocaleDateString()})`,
                value: daysToExpiry,
                threshold: 30,
                date: new Date(),
              });
            }
          }

          // Overstock
          if (material.maximumStock && material.quantity > material.maximumStock * 1.2) {
            newAnomalies.push({
              id: `${material._id}-over`,
              type: 'overstock',
              severity: 'medium',
              materialName: material.name,
              materialCode: material.code,
              siteName: material.siteName,
              message: `Overstock: ${material.quantity} > ${material.maximumStock} ${material.unit}`,
              value: material.quantity,
              threshold: material.maximumStock,
              date: new Date(),
            });
          }
        }
      } catch (matError) {
        console.warn('Could not load material anomalies:', matError);
      }

      // Deduplicate and sort by severity
      const seen = new Set<string>();
      const unique = newAnomalies.filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });

      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      unique.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

      setAnomalies(unique);
    } catch (error) {
      console.error('Error loading anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-300 text-red-900';
      case 'high': return 'bg-orange-50 border-orange-300 text-orange-900';
      case 'medium': return 'bg-yellow-50 border-yellow-300 text-yellow-900';
      default: return 'bg-blue-50 border-blue-300 text-blue-900';
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#3b82f6';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'theft': return <Shield className="h-4 w-4 text-red-600" />;
      case 'waste': return <Trash2 className="h-4 w-4 text-orange-600" />;
      case 'flow_anomaly': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'low_stock': return <Package className="h-4 w-4 text-orange-500" />;
      case 'out_of_stock': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expiring': return <Calendar className="h-4 w-4 text-yellow-600" />;
      case 'overstock': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'theft': return '🚨 Theft Risk';
      case 'waste': return '📉 Waste Risk';
      case 'flow_anomaly': return '⚡ Flow Anomaly';
      case 'low_stock': return '📦 Low Stock';
      case 'out_of_stock': return '❌ Stockout';
      case 'expiring': return '📅 Expiring';
      case 'overstock': return '📈 Overstock';
      case 'high_consumption': return '📊 Over-consumption';
      default: return '⚠️ Anomaly';
    }
  };

  const filteredAnomalies = filter === 'all'
    ? anomalies
    : anomalies.filter(a => a.type === filter);

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const highCount = anomalies.filter(a => a.severity === 'high').length;
  const mlAnomalyCount = anomalies.filter(a => a.type === 'theft' || a.type === 'waste' || a.type === 'high_consumption').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Anomalies & Alerts</span>
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} critical</Badge>
            )}
            {highCount > 0 && (
              <Badge className="bg-orange-500 text-white">{highCount} high</Badge>
            )}
            {mlAnomalyCount > 0 && (
              <Badge className="bg-purple-500 text-white">🤖 {mlAnomalyCount} ML</Badge>
            )}
            {mlAvailable === false && (
              <Badge variant="outline" className="text-gray-500 text-xs">ML offline</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border rounded-md px-2 py-1"
            >
              <option value="all">All ({anomalies.length})</option>
              <option value="theft">🚨 Theft Risk</option>
              <option value="waste">📉 Waste Risk</option>
              <option value="high_consumption">📊 Over-consumption</option>
              <option value="flow_anomaly">⚡ Flow Anomaly</option>
              <option value="out_of_stock">❌ Stockouts</option>
              <option value="low_stock">📦 Low Stock</option>
              <option value="expiring">📅 Expirations</option>
              <option value="overstock">📈 Overstock</option>
            </select>
            <Button variant="ghost" size="sm" onClick={loadAnomalies} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Analyzing anomalies...</p>
          </div>
        ) : filteredAnomalies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">No anomalies detected</p>
            <p className="text-sm">All stocks are within normal limits</p>
            {mlAvailable === false && (
              <p className="text-xs text-gray-400 mt-2">
                ⚠️ ML service offline — showing stock-based anomalies only
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredAnomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className={`p-3 rounded-lg border-l-4 ${getSeverityColor(anomaly.severity)}`}
                style={{ borderLeftColor: getSeverityBorderColor(anomaly.severity) }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    {getTypeIcon(anomaly.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{anomaly.materialName}</p>
                        {anomaly.materialCode && (
                          <span className="text-xs text-gray-500">({anomaly.materialCode})</span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(anomaly.type)}
                        </Badge>
                        {anomaly.risk_level && (
                          <Badge variant="destructive" className="text-xs">
                            {anomaly.risk_level}
                          </Badge>
                        )}
                      </div>

                      {anomaly.siteName && (
                        <p className="text-xs text-gray-500 mt-0.5">📍 {anomaly.siteName}</p>
                      )}

                      <p className="text-sm mt-1">{anomaly.message}</p>

                      {/* ML anomaly details */}
                      {(anomaly.type === 'theft' || anomaly.type === 'waste' || anomaly.type === 'high_consumption') &&
                        anomaly.current_consumption !== undefined && (
                          <div className="mt-2 p-2 bg-white bg-opacity-60 rounded border-l-2 border-purple-400">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Current:</span>
                                <span className="ml-1 font-bold text-red-600">
                                  {anomaly.current_consumption?.toFixed(2)}/day
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Average:</span>
                                <span className="ml-1 font-medium">
                                  {anomaly.average_consumption?.toFixed(2)}/day
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Deviation:</span>
                                <span className="ml-1 font-bold text-red-600">
                                  +{anomaly.deviation_percentage?.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Recommended action */}
                      {anomaly.recommended_action && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs border-l-2 border-blue-400">
                          <span className="font-medium text-blue-700">🤖 Action:</span>
                          <span className="text-blue-600 ml-1">{anomaly.recommended_action}</span>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(anomaly.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                      anomaly.severity === 'critical' ? 'bg-red-200 text-red-800' :
                      anomaly.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {anomaly.severity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
