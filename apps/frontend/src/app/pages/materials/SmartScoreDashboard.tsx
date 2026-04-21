import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { RefreshCw, TrendingUp, AlertTriangle, Package, Award } from 'lucide-react';
import { toast } from 'sonner';
import SmartScoreCard from './SmartScoreCard';
import materialService from '../../../services/materialService';

interface SiteScore {
  siteId: string;
  siteName: string;
  progress: number;
  stockHealth: number;
  anomalies: number;
  score: number;
  level: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
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
}

export default function SmartScoreDashboard() {
  const [sitesScores, setSitesScores] = useState<SiteScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteScore | null>(null);

  const getSitesData = useCallback(async () => {
    try {
      const mockSites = [
        { id: '1', name: 'Chantier A - Centre Commercial', progress: 65 },
        { id: '2', name: 'Chantier B - Résidence Les Palmiers', progress: 30 },
        { id: '3', name: 'Chantier C - Pont Hassan II', progress: 85 },
        { id: '4', name: 'Chantier D - École Primaire', progress: 15 },
      ];
      const response = await materialService.calculateMultipleSitesScores(mockSites);
      return response;
    } catch (error) {
      console.error('Erreur chargement scores:', error);
      throw error;
    }
  }, []);

  const loadScores = async () => {
    setLoading(true);
    try {
      const scores = await getSitesData();
      setSitesScores(scores);
      
      const criticalSites = scores.filter(s => s.level === 'critical');
      if (criticalSites.length > 0) {
        criticalSites.forEach(site => {
          toast.error(`🚨 ${site.siteName}: Score critique (${site.score})! Action immédiate requise.`, {
            duration: 10000,
          });
        });
      }
    } catch (error: any) {
      toast.error('Erreur chargement des scores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScores();
    const interval = setInterval(loadScores, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getOverallStats = () => {
    if (sitesScores.length === 0) return null;
    const avgScore = sitesScores.reduce((sum, s) => sum + s.score, 0) / sitesScores.length;
    const totalMaterials = sitesScores.reduce((sum, s) => sum + s.details.totalMaterials, 0);
    const totalLowStock = sitesScores.reduce((sum, s) => sum + s.details.lowStockCount, 0);
    const totalOutOfStock = sitesScores.reduce((sum, s) => sum + s.details.outOfStockCount, 0);
    return { avgScore, totalMaterials, totalLowStock, totalOutOfStock };
  };

  const stats = getOverallStats();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="h-8 w-8 text-blue-600" />
            Smart Score Chantier
          </h1>
          <p className="text-gray-500 mt-1">
            Score de santé des chantiers basé sur la consommation des matériaux
          </p>
        </div>
        <Button onClick={loadScores} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Score Moyen</p>
                  <p className={`text-2xl font-bold ${
                    stats.avgScore >= 80 ? 'text-green-600' :
                    stats.avgScore >= 60 ? 'text-blue-600' :
                    stats.avgScore >= 40 ? 'text-yellow-600' :
                    stats.avgScore >= 20 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {stats.avgScore.toFixed(1)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Matériaux</p>
                  <p className="text-2xl font-bold">{stats.totalMaterials}</p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Stock Bas</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.totalLowStock}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Rupture Stock</p>
                  <p className="text-2xl font-bold text-red-600">{stats.totalOutOfStock}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Calcul des scores...</p>
        </div>
      ) : sitesScores.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Aucun chantier trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sitesScores.map((site) => (
            <SmartScoreCard
              key={site.siteId}
              siteId={site.siteId}
              siteName={site.siteName}
              score={site.score}
              level={site.level}
              progress={site.progress}
              stockHealth={site.stockHealth}
              anomalies={site.anomalies}
              details={site.details}
              recommendations={site.recommendations}
              onViewDetails={() => setSelectedSite(site)}
            />
          ))}
        </div>
      )}

      {selectedSite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="font-bold text-xl">Détails - {selectedSite.siteName}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSite(null)}>
                ✕
              </Button>
            </div>
            <div className="p-4">
              <SmartScoreCard
                {...selectedSite}
                onViewDetails={undefined}
              />
              {selectedSite.details.criticalMaterials.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">📦 Liste des matériaux critiques</h3>
                  <div className="space-y-2">
                    {selectedSite.details.criticalMaterials.map(mat => (
                      <div key={mat.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{mat.name}</p>
                          <p className="text-sm text-gray-500">Code: {mat.code}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${mat.quantity === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                            Stock: {mat.quantity}/{mat.reorderPoint}
                          </p>
                          {mat.quantity === 0 && <p className="text-xs text-red-500">⚠️ Rupture</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">📖 Comprendre le Smart Score</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-600">Formule</div>
              <p className="text-gray-600">
                Score = (Avancement × 0.4) + (Santé Stock × 0.3) + (Anomalies × 0.3)
              </p>
            </div>
            <div>
              <div className="font-medium text-blue-600">Niveaux</div>
              <ul className="text-gray-600 space-y-1">
                <li>🏆 80-100: Excellent</li>
                <li>👍 60-79: Bon</li>
                <li>📊 40-59: Moyen</li>
                <li>⚠️ 20-39: Faible</li>
                <li>🚨 0-19: Critique</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-blue-600">Pondérations</div>
              <ul className="text-gray-600 space-y-1">
                <li>📈 Avancement: 40%</li>
                <li>📦 Santé Stock: 30%</li>
                <li>🔍 Anomalies: 30%</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}