import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { AlertTriangle, Package, Calendar, TrendingUp, XCircle, CheckCircle, Shield, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import materialService from '../../../services/materialService';

interface Anomaly {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'overstock' | 'high_consumption' | 'theft' | 'waste';
  severity: 'critical' | 'high' | 'medium' | 'low';
  materialName: string;
  materialCode?: string;
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

  useEffect(() => {
    loadAnomalies();
    // Refresh every 30 seconds
    const interval = setInterval(loadAnomalies, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnomalies = async () => {
    try {
      // Get ML-powered anomaly detection from FastAPI via materialService
      console.log('🔍 Loading anomalies from /api/materials/anomalies/detect');
      const mlAnomaliesResponse = await fetch('/api/materials/anomalies/detect');
      
      if (!mlAnomaliesResponse.ok) {
        console.error('❌ Anomalies API error:', mlAnomaliesResponse.status, mlAnomaliesResponse.statusText);
        throw new Error(`HTTP error! status: ${mlAnomaliesResponse.status}`);
      }
      
      const mlAnomaliesData = await mlAnomaliesResponse.json();
      console.log('✅ Anomalies data received:', mlAnomaliesData);
      
      // Get existing alerts for stock issues
      const alerts = await materialService.getAlerts();
      
      // Get all materials for additional analysis
      const materials = await materialService.getMaterials({ limit: 100 });
      const materialList = Array.isArray(materials) ? materials : (materials as any).data || [];
      
      const newAnomalies: Anomaly[] = [];
      
      // Add ML-detected anomalies (theft, waste, over-consumption)
      if (mlAnomaliesData.success) {
        console.log('🤖 ML Anomalies detected:', mlAnomaliesData);
        
        // Theft risk anomalies
        mlAnomaliesData.theft_risk?.forEach((anomaly: any) => {
          newAnomalies.push({
            id: `${anomaly.material_id}-theft`,
            type: 'theft',
            severity: anomaly.severity,
            materialName: anomaly.material_name,
            materialCode: anomaly.material_id,
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
        mlAnomaliesData.waste_risk?.forEach((anomaly: any) => {
          newAnomalies.push({
            id: `${anomaly.material_id}-waste`,
            type: 'waste',
            severity: anomaly.severity,
            materialName: anomaly.material_name,
            materialCode: anomaly.material_id,
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
        mlAnomaliesData.over_consumption?.forEach((anomaly: any) => {
          newAnomalies.push({
            id: `${anomaly.material_id}-overcons`,
            type: 'high_consumption',
            severity: anomaly.severity,
            materialName: anomaly.material_name,
            materialCode: anomaly.material_id,
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
      
      // Analyze each material for stock-related anomalies
      for (const material of materialList) {
        // Anomaly: low stock
        if (material.quantity <= material.reorderPoint && material.quantity > 0) {
          newAnomalies.push({
            id: `${material._id}-low`,
            type: 'low_stock',
            severity: 'high',
            materialName: material.name,
            materialCode: material.code,
            message: `Low stock: ${material.quantity}/${material.reorderPoint} ${material.unit}`,
            value: material.quantity,
            threshold: material.reorderPoint,
            date: new Date(),
          });
        }
        
        // Anomaly: out of stock
        if (material.quantity === 0) {
          newAnomalies.push({
            id: `${material._id}-out`,
            type: 'out_of_stock',
            severity: 'critical',
            materialName: material.name,
            materialCode: material.code,
            message: `Out of stock! Urgent order needed.`,
            value: 0,
            threshold: material.reorderPoint,
            date: new Date(),
          });
        }
        
        // Anomaly: expiring soon
        if (material.expiryDate) {
          const daysToExpiry = Math.ceil((new Date(material.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysToExpiry <= 30 && daysToExpiry > 0) {
            newAnomalies.push({
              id: `${material._id}-exp`,
              type: 'expiring',
              severity: daysToExpiry <= 7 ? 'critical' : 'high',
              materialName: material.name,
              materialCode: material.code,
              message: `Expires in ${daysToExpiry} days (${new Date(material.expiryDate).toLocaleDateString()})`,
              value: daysToExpiry,
              threshold: 30,
              date: new Date(),
            });
          }
        }
        
        // Anomaly: overstock
        if (material.maximumStock && material.quantity > material.maximumStock * 1.2) {
          newAnomalies.push({
            id: `${material._id}-over`,
            type: 'overstock',
            severity: 'medium',
            materialName: material.name,
            materialCode: material.code,
            message: `Overstock: ${material.quantity} > ${material.maximumStock} ${material.unit}`,
            value: material.quantity,
            threshold: material.maximumStock,
            date: new Date(),
          });
        }
      }
      
      setAnomalies(newAnomalies.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }));
    } catch (error) {
      console.error('Error loading anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'theft': return <Shield className="h-4 w-4 text-red-600" />;
      case 'waste': return <Trash2 className="h-4 w-4 text-orange-600" />;
      case 'low_stock': return <Package className="h-4 w-4" />;
      case 'out_of_stock': return <AlertTriangle className="h-4 w-4" />;
      case 'expiring': return <Calendar className="h-4 w-4" />;
      case 'overstock': return <TrendingUp className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'theft': return 'Theft Risk';
      case 'waste': return 'Waste Risk';
      case 'low_stock': return 'Low stock';
      case 'out_of_stock': return 'Stockout';
      case 'expiring': return 'Expiring';
      case 'overstock': return 'Overstock';
      case 'high_consumption': return 'Over-consumption';
      default: return 'Anomaly';
    }
  };

  const filteredAnomalies = filter === 'all' 
    ? anomalies 
    : anomalies.filter(a => a.type === filter);

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const highCount = anomalies.filter(a => a.severity === 'high').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Anomalies & Alerts
            {criticalCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {criticalCount} critical{criticalCount > 1 ? 's' : ''}
              </Badge>
            )}
            {highCount > 0 && (
              <Badge variant="secondary" className="bg-orange-500 text-white ml-1">
                {highCount} high{highCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border rounded-md px-2 py-1"
            >
              <option value="all">All</option>
              <option value="theft">🚨 Theft Risk</option>
              <option value="waste">📉 Waste Risk</option>
              <option value="high_consumption">📊 Over-consumption</option>
              <option value="out_of_stock">Stockouts</option>
              <option value="low_stock">Low stock</option>
              <option value="expiring">Expirations</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : filteredAnomalies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>No anomalies detected</p>
            <p className="text-sm">All stocks are within normal limits</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAnomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className={`p-3 rounded-lg border-l-4 ${getSeverityColor(anomaly.severity)}`}
                style={{ borderLeftColor: anomaly.severity === 'critical' ? '#ef4444' : anomaly.severity === 'high' ? '#f97316' : '#eab308' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    {getTypeIcon(anomaly.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{anomaly.materialName}</p>
                        {anomaly.materialCode && <span className="text-xs text-gray-500">({anomaly.materialCode})</span>}
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(anomaly.type)}
                        </Badge>
                        {anomaly.risk_level && (
                          <Badge variant="destructive" className="text-xs">
                            {anomaly.risk_level}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mt-1">{anomaly.message}</p>
                      
                      {/* Show consumption details for ML anomalies */}
                      {(anomaly.type === 'theft' || anomaly.type === 'waste' || anomaly.type === 'high_consumption') && (
                        <div className="mt-2 p-2 bg-white rounded border-l-2 border-purple-400">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Current:</span>
                              <span className="ml-1 font-medium text-red-600">{anomaly.current_consumption?.toFixed(2)}/day</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Average:</span>
                              <span className="ml-1 font-medium">{anomaly.average_consumption?.toFixed(2)}/day</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Deviation:</span>
                              <span className="ml-1 font-bold text-red-600">{anomaly.deviation_percentage?.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show recommended action for ML anomalies */}
                      {anomaly.recommended_action && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs border-l-2 border-blue-400">
                          <span className="font-medium text-blue-700">🤖 Recommended Action:</span>
                          <p className="text-blue-600 mt-1">{anomaly.recommended_action}</p>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(anomaly.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <span className="text-xs font-medium uppercase">{anomaly.severity}</span>
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