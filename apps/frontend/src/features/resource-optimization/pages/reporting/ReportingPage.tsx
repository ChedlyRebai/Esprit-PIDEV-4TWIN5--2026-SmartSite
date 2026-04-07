import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboard, usePerformanceReport, useEnvironmentalReport, useFinancialReport } from '../../hooks/useResourceApi';
import { BarChart3, TrendingUp, Leaf, DollarSign } from 'lucide-react';

interface ReportingPageProps {
  siteId: string;
}

export const ReportingPage: React.FC<ReportingPageProps> = ({ siteId }) => {
  const { data: dashboard, isLoading: dashboardLoading } = useDashboard(siteId);
  const { data: performance, isLoading: perfLoading } = usePerformanceReport(siteId);
  const { data: environmental, isLoading: envLoading } = useEnvironmentalReport(siteId);
  const { data: financial, isLoading: finLoading } = useFinancialReport(siteId);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">📈 Rapports</h1>
        <p className="text-gray-600 mt-1">
          Tableaux de bord et rapports analytiques
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="environmental" className="gap-2">
            <Leaf className="h-4 w-4" />
            Environnement
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Financier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle>Tableau de Bord Complet</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : dashboard ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Performance</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Économies</p>
                        <p className="text-xl font-bold">{dashboard.performance?.totalSavings}€</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">CO2 Réduit</p>
                        <p className="text-xl font-bold">{dashboard.performance?.co2Reduction} kg</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Implémentées</p>
                        <p className="text-xl font-bold">{dashboard.performance?.implementedRecommendations}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Recommandations</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">En Attente</p>
                        <p className="text-xl font-bold">{dashboard.recommendations?.pending}</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Approuvées</p>
                        <p className="text-xl font-bold">{dashboard.recommendations?.approved}</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Implémentées</p>
                        <p className="text-xl font-bold">{dashboard.recommendations?.implemented}</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-xl font-bold">{dashboard.recommendations?.total}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Rapport de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {perfLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : performance ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-gray-600">Économies Totales</p>
                    <p className="text-3xl font-bold">{performance.totalSavings}€</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-gray-600">Réduction CO2</p>
                    <p className="text-3xl font-bold">{performance.co2Reduction} kg</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-gray-600">Recommandations Implémentées</p>
                    <p className="text-3xl font-bold">{performance.implementedRecommendations}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environmental">
          <Card>
            <CardHeader>
              <CardTitle>Impact Environnemental</CardTitle>
            </CardHeader>
            <CardContent>
              {envLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : environmental ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-gray-600">Émissions CO2 Actuelles</p>
                      <p className="text-3xl font-bold">{environmental.totalCO2Emissions} kg</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-gray-600">Réduction Réelle</p>
                      <p className="text-3xl font-bold">{environmental.actualCO2Reduction} kg</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-gray-600">Pourcentage</p>
                      <p className="text-3xl font-bold">{environmental.reductionPercentage}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Analyse Financière</CardTitle>
            </CardHeader>
            <CardContent>
              {finLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : financial ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-gray-600">Coûts Actuels</p>
                      <p className="text-3xl font-bold">{financial.currentResourcesCosts}€</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-gray-600">Économies Réalisées</p>
                      <p className="text-3xl font-bold">{financial.realizedSavings}€</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-gray-600">Économies Potentielles</p>
                      <p className="text-3xl font-bold">{financial.potentialSavings}€</p>
                    </div>
                    <div className="text-center p-4 border rounded bg-green-50">
                      <p className="text-sm text-gray-600">ROI</p>
                      <p className="text-3xl font-bold">{financial.roi}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportingPage;
