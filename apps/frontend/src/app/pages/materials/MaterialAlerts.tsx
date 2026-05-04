import { AlertTriangle, Package, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import materialService from '../../../services/materialService';
import { toast } from 'sonner';

interface MaterialAlertsProps {
  alerts: any[];
  onRefresh: () => void;
}

export default function MaterialAlerts({ alerts, onRefresh }: MaterialAlertsProps) {
  const handleReorder = async (materialId: string) => {
    try {
      const result = await materialService.reorderMaterial(materialId);
      if (result.success) {
        toast.success(`Order created! Expected delivery: ${new Date(result.expectedDelivery).toLocaleDateString()}`);
      } else {
        toast.warning(result.message || 'Order initiated');
      }
      onRefresh();
    } catch (error) {
      toast.error('Failed to create order');
    }
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
      case 'high': return 'Critical';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Info';
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
        <CardContent className="py-8 text-center text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No alerts at this time</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groupedAlerts.critical.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Critical Alerts ({groupedAlerts.critical.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {groupedAlerts.critical.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-500">
                        Stock: {alert.currentQuantity} | Threshold: {alert.threshold}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleReorder(alert.materialId)}
                  >
                    Order Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {groupedAlerts.warning.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              Alerts ({groupedAlerts.warning.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {groupedAlerts.warning.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <p>{alert.message}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(alert.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {getSeverityText(alert.severity)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {groupedAlerts.info.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Information ({groupedAlerts.info.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {groupedAlerts.info.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <span>{alert.message}</span>
                  </div>
                  <Badge variant="outline">Info</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}