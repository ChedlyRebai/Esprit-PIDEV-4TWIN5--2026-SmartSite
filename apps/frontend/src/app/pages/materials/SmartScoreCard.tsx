import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { TrendingUp, Package, AlertTriangle, Award, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface SmartScoreCardProps {
  siteId: string;
  siteName: string;
  score: number;
  level: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  progress: number;
  stockHealth: number;
  anomalies: number;
  details: {
    totalMaterials: number;
    lowStockCount: number;
    outOfStockCount: number;
    anomalyCount: number;
    averageConsumptionRate: number;
    criticalMaterials: Array<{
      id: string;
      name: string;
      code: string;
      quantity: number;
      reorderPoint: number;
    }>;
  };
  recommendations: string[];
  onViewDetails?: () => void;
}

export default function SmartScoreCard({ 
  siteName, 
  score, 
  level, 
  progress,
  stockHealth,
  anomalies,
  details,
  recommendations,
  onViewDetails 
}: SmartScoreCardProps) {
  
  const getLevelColor = () => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getLevelIcon = () => {
    switch (level) {
      case 'excellent': return '🏆';
      case 'good': return '👍';
      case 'average': return '📊';
      case 'poor': return '⚠️';
      case 'critical': return '🚨';
      default: return '📈';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className={`pb-3 ${getLevelColor().split(' ')[1]} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getLevelIcon()}</span>
            <CardTitle className="text-lg">{siteName}</CardTitle>
          </div>
          <Badge className={getLevelColor()}>
            {level === 'excellent' ? 'Excellent' :
             level === 'good' ? 'Bon' :
             level === 'average' ? 'Moyen' :
             level === 'poor' ? 'Faible' : 'Critique'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="text-center mb-4">
          <div className={`text-5xl font-bold ${getScoreColor()}`}>
            {Math.round(score)}
          </div>
          <div className="text-sm text-gray-500">Score Santé</div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Avancement</div>
            <div className="font-bold text-lg">{Math.round(progress)}%</div>
            <div className="text-xs text-gray-400">Poids: 40%</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Stock</div>
            <div className="font-bold text-lg">{Math.round(stockHealth)}%</div>
            <div className="text-xs text-gray-400">Poids: 30%</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Anomalies</div>
            <div className="font-bold text-lg">{Math.round(anomalies)}%</div>
            <div className="text-xs text-gray-400">Poids: 30%</div>
          </div>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <Package className="h-4 w-4" />
              Matériaux:
            </span>
            <span className="font-medium">{details.totalMaterials}</span>
          </div>
          {details.lowStockCount > 0 && (
            <div className="flex justify-between text-yellow-600">
              <span>⚠️ Stock bas:</span>
              <span className="font-medium">{details.lowStockCount}</span>
            </div>
          )}
          {details.outOfStockCount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>🚨 Rupture:</span>
              <span className="font-medium">{details.outOfStockCount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Consommation moyenne:
            </span>
            <span className="font-medium">{details.averageConsumptionRate.toFixed(1)}/h</span>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="font-semibold text-sm text-blue-800 mb-2 flex items-center gap-1">
              <Award className="h-4 w-4" />
              Recommandations
            </div>
            <ul className="space-y-1">
              {recommendations.slice(0, 2).map((rec, idx) => (
                <li key={idx} className="text-xs text-blue-700 flex items-start gap-1">
                  <span>•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {details.criticalMaterials.length > 0 && (
          <div className="mb-4">
            <div className="font-semibold text-sm text-red-600 mb-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Matériaux critiques
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {details.criticalMaterials.slice(0, 3).map(mat => (
                <div key={mat.id} className="flex justify-between text-xs p-1 bg-red-50 rounded">
                  <span className="font-medium">{mat.name}</span>
                  <span className="text-red-600">Stock: {mat.quantity}/{mat.reorderPoint}</span>
                </div>
              ))}
              {details.criticalMaterials.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{details.criticalMaterials.length - 3} autres
                </div>
              )}
            </div>
          </div>
        )}

        {onViewDetails && (
          <Button variant="outline" className="w-full mt-2" onClick={onViewDetails}>
            Voir détails
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}