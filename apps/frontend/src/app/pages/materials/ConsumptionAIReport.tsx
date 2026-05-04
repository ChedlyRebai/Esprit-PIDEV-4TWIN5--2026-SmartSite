"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { toast } from "sonner";
import { 
  Brain, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Shield, AlertCircle, Info, Loader2, FileText, X, RefreshCw,
  BarChart3, Package, Calendar, MapPin, Activity
} from "lucide-react";
import axios from "axios";

interface ConsumptionAlert {
  type: 'NORMAL' | 'WASTE' | 'POSSIBLE_THEFT' | 'OVER_CONSUMPTION' | 'ANOMALY';
  severity: 'INFO' | 'WARNING' | 'DANGER' | 'CRITICAL';
  message: string;
  date: string;
  quantity: number;
  expectedQuantity: number;
  deviation: number;
}

interface ConsumptionAnalysisReport {
  materialId: string;
  materialName: string;
  materialCode: string;
  siteId: string;
  siteName: string;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  totalConsumption: number;
  averageDailyConsumption: number;
  expectedConsumption: number;
  consumptionStatus: 'NORMAL' | 'OVER_CONSUMPTION' | 'UNDER_CONSUMPTION';
  deviationPercentage: number;
  alerts: ConsumptionAlert[];
  recommendations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  possibleIssues: string[];
}

interface ConsumptionAIReportProps {
  materialId: string;
  siteId: string;
  materialName?: string;
  open: boolean;
  onClose: () => void;
}

export default function ConsumptionAIReport({
  materialId,
  siteId,
  materialName,
  open,
  onClose,
}: ConsumptionAIReportProps) {
  const [report, setReport] = useState<ConsumptionAnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [days, setDays] = useState(30);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/consumption-history/ai-report/${materialId}/${siteId}`,
        { params: { days } }
      );

      if (data.success && data.report) {
        setReport(data.report);
        toast.success('✅ AI report generated!');
      } else {
        const msg = data.message || 'Error generating report';
        if (msg.includes('Aucune donnée') || msg.includes('No consumption')) {
          toast.error('📊 No consumption data. Record stock movements first.', { duration: 5000 });
        } else {
          toast.error(msg);
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Error';
      if (msg.includes('Aucune donnée') || msg.includes('No consumption')) {
        toast.error('📊 No consumption data found. Record stock movements for this material.', { duration: 5000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open && !report) {
      generateReport();
    }
  }, [open]);

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const { data } = await axios.post('/api/consumption-history/sync');
      if (data.success !== false) {
        toast.success(`✅ ${data.synced || 0} entries synchronized!`);
        setTimeout(() => generateReport(), 800);
      } else {
        toast.error('Sync failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sync error');
    } finally {
      setSyncing(false);
    }
  };

  const getRiskConfig = (level: string) => {
    switch (level) {
      case 'CRITICAL': return { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-700', badge: 'bg-red-100 text-red-800', icon: '🚨', label: 'CRITICAL RISK' };
      case 'HIGH': return { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800', icon: '⚠️', label: 'HIGH RISK' };
      case 'MEDIUM': return { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800', icon: '📊', label: 'MEDIUM RISK' };
      default: return { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', badge: 'bg-green-100 text-green-800', icon: '✅', label: 'LOW RISK' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'OVER_CONSUMPTION': return { bg: 'bg-red-100', text: 'text-red-700', icon: <TrendingUp className="h-4 w-4" />, label: 'OVER-CONSUMPTION' };
      case 'UNDER_CONSUMPTION': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: <TrendingDown className="h-4 w-4" />, label: 'UNDER-CONSUMPTION' };
      default: return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="h-4 w-4" />, label: 'NORMAL' };
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return { bg: 'bg-red-50 border-red-300', icon: <AlertTriangle className="h-4 w-4 text-red-600" />, text: 'text-red-800' };
      case 'DANGER': return { bg: 'bg-orange-50 border-orange-300', icon: <AlertCircle className="h-4 w-4 text-orange-600" />, text: 'text-orange-800' };
      case 'WARNING': return { bg: 'bg-yellow-50 border-yellow-300', icon: <AlertCircle className="h-4 w-4 text-yellow-600" />, text: 'text-yellow-800' };
      default: return { bg: 'bg-blue-50 border-blue-300', icon: <Info className="h-4 w-4 text-blue-600" />, text: 'text-blue-800' };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-6 w-6 text-purple-600" />
              AI Consumption Analysis — {materialName || 'Material'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Period selector */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-gray-600">Analysis period:</span>
            {[7, 14, 30, 60, 90].map(d => (
              <Button
                key={d}
                variant={days === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDays(d)}
                className="h-7 px-3 text-xs"
              >
                {d}d
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={generateReport} disabled={loading} className="ml-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <Brain className="h-16 w-16 text-purple-200" />
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 absolute top-4 left-4" />
            </div>
            <p className="text-gray-600 font-medium mt-4">Generating AI report...</p>
            <p className="text-sm text-gray-400 mt-1">Analyzing {days} days of consumption data</p>
          </div>
        ) : report ? (
          <div className="space-y-5">
            {/* ===== SIMPLIFIED STATUS BANNER ===== */}
            {(() => {
              // Déterminer l'état: NORMAL ou RISQUE
              const isRisk = report.riskLevel === 'HIGH' || report.riskLevel === 'CRITICAL' || 
                             report.consumptionStatus === 'OVER_CONSUMPTION' ||
                             Math.abs(report.deviationPercentage) > 30;
              
              if (isRisk) {
                // RISQUE DE VOL OU GASPILLAGE
                return (
                  <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-red-500 uppercase tracking-wide font-semibold mb-1">État de Consommation</p>
                        <p className="text-2xl font-bold text-red-700 mb-2">🚨 RISQUE DE VOL OU GASPILLAGE</p>
                        <p className="text-sm text-red-600">
                          Consommation anormalement élevée détectée. Déviation: <strong>{report.deviationPercentage > 0 ? '+' : ''}{report.deviationPercentage.toFixed(1)}%</strong>
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-red-600">
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {report.materialName}
                          </span>
                          {report.siteName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {report.siteName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {report.period.days} jours
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // ÉTAT NORMAL
                return (
                  <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-green-500 uppercase tracking-wide font-semibold mb-1">État de Consommation</p>
                        <p className="text-2xl font-bold text-green-700 mb-2">✅ ÉTAT NORMAL DE CONSOMMATION</p>
                        <p className="text-sm text-green-600">
                          La consommation est dans les limites normales. Déviation: <strong>{report.deviationPercentage > 0 ? '+' : ''}{report.deviationPercentage.toFixed(1)}%</strong>
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-green-600">
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {report.materialName}
                          </span>
                          {report.siteName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {report.siteName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {report.period.days} jours
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })()}

            {/* ===== KEY METRICS ===== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <p className="text-xs text-gray-500 uppercase">Total Consommé</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{report.totalConsumption.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">sur {report.period.days} jours</p>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    <p className="text-xs text-gray-500 uppercase">Moyenne Journalière</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{report.averageDailyConsumption.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">unités/jour</p>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500 uppercase">Attendu</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-600">{report.expectedConsumption.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">baseline</p>
                </CardContent>
              </Card>
              <Card className={`border-2 ${Math.abs(report.deviationPercentage) > 30 ? 'border-red-300' : 'border-green-300'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className={`h-4 w-4 ${Math.abs(report.deviationPercentage) > 30 ? 'text-red-500' : 'text-green-500'}`} />
                    <p className="text-xs text-gray-500 uppercase">Déviation</p>
                  </div>
                  <p className={`text-3xl font-bold ${report.deviationPercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {report.deviationPercentage > 0 ? '+' : ''}{report.deviationPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-400">vs attendu</p>
                </CardContent>
              </Card>
            </div>

            {/* ===== POSSIBLE ISSUES (only if risk) ===== */}
            {report.possibleIssues.length > 0 && (
              <Card className="border-2 border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-red-700">
                    <Shield className="h-5 w-5" />
                    Problèmes Détectés ({report.possibleIssues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.possibleIssues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-800">{issue}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ===== ALERTS (only critical/danger) ===== */}
            {report.alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'DANGER').length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Alertes Critiques ({report.alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'DANGER').length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {report.alerts
                      .filter(a => a.severity === 'CRITICAL' || a.severity === 'DANGER')
                      .slice(0, 10)
                      .map((alert, i) => {
                        const cfg = getSeverityConfig(alert.severity);
                        return (
                          <div key={i} className={`flex items-start gap-3 p-3 border rounded-lg ${cfg.bg}`}>
                            <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${cfg.text}`}>{alert.message}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                                <span>{new Date(alert.date).toLocaleDateString('fr-FR')}</span>
                                <span>Réel: <strong>{alert.quantity}</strong></span>
                                <span>Attendu: <strong>{alert.expectedQuantity.toFixed(1)}</strong></span>
                                {alert.deviation > 0 && (
                                  <span className="text-red-600 font-bold">+{alert.deviation.toFixed(1)}%</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ===== PERIOD INFO ===== */}
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500 flex items-center gap-4 flex-wrap">
              <span>📅 Période: {new Date(report.period.startDate).toLocaleDateString('fr-FR')} → {new Date(report.period.endDate).toLocaleDateString('fr-FR')}</span>
              <span>📊 {report.period.days} jours analysés</span>
              <span>🤖 Analyse IA</span>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t">
              <Button variant="outline" size="sm" onClick={handleSyncData} disabled={syncing}>
                {syncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Synchroniser
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={generateReport} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Régénérer
                </Button>
                <Button onClick={onClose}>Fermer</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-10 w-10 text-purple-300" />
            </div>
            <p className="text-gray-700 font-semibold text-lg mb-2">No report available</p>
            <p className="text-sm text-gray-500 mb-5">
              AI analysis requires consumption data to be available.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-left max-w-sm mx-auto">
              <p className="text-sm font-semibold text-blue-800 mb-2">📋 Prerequisites:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Stock movements (OUT) must be recorded</li>
                <li>• At least 7 days of consumption data</li>
                <li>• Material must be assigned to a site</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleSyncData} disabled={syncing}>
                {syncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Sync data
              </Button>
              <Button onClick={generateReport} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Brain className="h-4 w-4 mr-1" />}
                Generate report
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
