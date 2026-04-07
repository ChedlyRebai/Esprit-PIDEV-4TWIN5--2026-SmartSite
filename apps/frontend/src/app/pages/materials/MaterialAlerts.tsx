import { AlertTriangle, Package, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import materialService from '../../../services/materialService';
import { toast } from 'sonner';
import OrderMap from './OrderMap';
import { useState } from 'react';

interface MaterialAlertsProps {
  alerts: any[];
  onRefresh: () => void;
}

export default function MaterialAlerts({ alerts, onRefresh }: MaterialAlertsProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showOrderMap, setShowOrderMap] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReorder = async (materialId: string, materialName: string) => {
    try {
      setLoading(true);
      
      // Coordonnées de l'entrepôt (fournisseur)
      const warehouseLocation = {
        lat: 36.8200,
        lng: 10.2000,
        name: 'Entrepôt Central - Tunis'
      };
      
      // Coordonnées du chantier
      const siteLocation = {
        lat: 36.8065,
        lng: 10.1815,
        name: 'Chantier Central - Tunis'
      };
      
      setSelectedMaterial({ 
        id: materialId, 
        name: materialName, 
        warehouseLocation, 
        siteLocation 
      });
      setShowOrderMap(true);
      
    } catch (error) {
      console.error('Erreur lors de la préparation de la commande:', error);
      toast.error('Erreur lors de la préparation de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderConfirmed = async () => {
    if (selectedMaterial) {
      try {
        const result = await materialService.reorderMaterial(selectedMaterial.id);
        if (result.success) {
          toast.success(`✅ Commande créée! Livraison prévue: ${new Date(result.expectedDelivery).toLocaleDateString()}`, {
            duration: 5000,
            icon: '🚚',
          });
        } else {
          toast.warning(result.message || 'Commande initiée', {
            duration: 4000,
          });
        }
        onRefresh();
      } catch (error) {
        console.error('Erreur lors de la création de la commande:', error);
        toast.error('❌ Échec de la création de la commande');
      }
    }
    setShowOrderMap(false);
    setSelectedMaterial(null);
  };

  const getAlertIcon = (type: string) => {
    switch(type) {
      case 'low_stock': return <Package className="h-5 w-5 text-yellow-500" />;
      case 'out_of_stock': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'expiring': return <Calendar className="h-5 w-5 text-orange-500" />;
      case 'overstock': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityText = (severity: string) => {
    switch(severity) {
      case 'high': return 'Critique';
      case 'medium': return 'Moyen';
      case 'low': return 'Faible';
      default: return 'Info';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const groupedAlerts = {
    critical: alerts.filter(a => a.severity === 'high'),
    warning: alerts.filter(a => a.severity === 'medium'),
    info: alerts.filter(a => a.severity === 'low'),
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucune alerte</h3>
            <p className="text-sm text-gray-500">Tous les stocks sont à des niveaux normaux</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Alertes Critiques */}
        {groupedAlerts.critical.length > 0 && (
          <Card className="border-red-200 shadow-sm">
            <CardHeader className="bg-red-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Alertes Critiques ({groupedAlerts.critical.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {groupedAlerts.critical.map((alert, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{alert.message}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-600">
                            Stock: <span className="font-medium">{alert.currentQuantity}</span> / Seuil: {alert.threshold}
                          </p>
                          {alert.materialName && (
                            <Badge variant="outline" className="text-xs">
                              {alert.materialName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleReorder(alert.materialId, alert.materialName || 'Matériau')}
                      disabled={loading}
                      className="shadow-sm hover:shadow-md transition-all"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Chargement...
                        </div>
                      ) : (
                        'Commander'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alertes Moyennes */}
        {groupedAlerts.warning.length > 0 && (
          <Card className="border-yellow-200 shadow-sm">
            <CardHeader className="bg-yellow-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-5 w-5" />
                Alertes à surveiller ({groupedAlerts.warning.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {groupedAlerts.warning.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {new Date(alert.date).toLocaleString()}
                          </p>
                          {alert.materialName && (
                            <span className="text-xs text-gray-400">• {alert.materialName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getSeverityBadge(alert.severity)}>
                      {getSeverityText(alert.severity)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alertes Informatives */}
        {groupedAlerts.info.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <Package className="h-5 w-5" />
                Informations ({groupedAlerts.info.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupedAlerts.info.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <span className="text-gray-700">{alert.message}</span>
                        {alert.materialName && (
                          <p className="text-xs text-gray-400 mt-1">Matériau: {alert.materialName}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">Info</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Résumé des stocks */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">État des stocks</p>
                <p className="text-xs text-blue-600 mt-1">
                  {groupedAlerts.critical.length} alerte{groupedAlerts.critical.length > 1 ? 's' : ''} critique{groupedAlerts.critical.length > 1 ? 's' : ''} • 
                  {groupedAlerts.warning.length} à surveiller
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-700">
                  {alerts.length}
                </p>
                <p className="text-xs text-blue-600">alertes totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Composant de carte pour la commande */}
      {showOrderMap && selectedMaterial && (
        <OrderMap
          open={showOrderMap}
          onClose={() => {
            setShowOrderMap(false);
            setSelectedMaterial(null);
          }}
          materialName={selectedMaterial.name}
          siteLocation={selectedMaterial.siteLocation}
          warehouseLocation={selectedMaterial.warehouseLocation}
          onOrderConfirmed={handleOrderConfirmed}
        />
      )}
    </>
  );
}