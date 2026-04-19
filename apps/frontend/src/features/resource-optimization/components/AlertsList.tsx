import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface AlertItemProps {
  alert: {
    _id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    isRead: boolean;
    status: string;
    createdAt: string;
  };
  onMarkAsRead: (id: string) => void;
  onMarkAsResolved: (id: string) => void;
}

export const AlertCard: React.FC<AlertItemProps> = ({
  alert,
  onMarkAsRead,
  onMarkAsResolved,
}) => {
  const severityConfig = {
    critical: { icon: AlertTriangle, bgColor: 'bg-red-50', borderColor: 'border-red-300', badgeVariant: 'destructive' },
    high: { icon: AlertCircle, bgColor: 'bg-orange-50', borderColor: 'border-orange-300', badgeVariant: 'default' },
    medium: { icon: Info, bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', badgeVariant: 'secondary' },
    low: { icon: Info, bgColor: 'bg-blue-50', borderColor: 'border-blue-300', badgeVariant: 'outline' },
  };

  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <Alert className={`${config.bgColor} border-l-4 ${config.borderColor}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 mt-0.5" />
          <div className="flex-1">
            <AlertTitle className="flex items-center gap-2">
              {alert.title}
              <Badge variant={config.badgeVariant as any}>{alert.severity.toUpperCase()}</Badge>
            </AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
            <div className="mt-2 flex gap-2">
              {!alert.isRead && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkAsRead(alert._id)}
                >
                  Marquer comme lue
                </Button>
              )}
              {alert.status !== 'resolved' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkAsResolved(alert._id)}
                >
                  Résolu
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Alert>
  );
};

interface AlertsListProps {
  alerts: AlertItemProps['alert'][];
  onMarkAsRead: (id: string) => void;
  onMarkAsResolved: (id: string) => void;
  loading?: boolean;
}

export const AlertsList: React.FC<AlertsListProps> = ({
  alerts,
  onMarkAsRead,
  onMarkAsResolved,
  loading,
}) => {
  if (loading) {
    return <div className="text-center py-4">Chargement des alertes...</div>;
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
        <p className="text-gray-500">Aucune alerte actuellement</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {alerts.map((alert) => (
        <AlertCard
          key={alert._id}
          alert={alert}
          onMarkAsRead={onMarkAsRead}
          onMarkAsResolved={onMarkAsResolved}
        />
      ))}
    </div>
  );
};
