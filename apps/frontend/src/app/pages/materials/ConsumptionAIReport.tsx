"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { toast } from "sonner";
import { 
  Brain, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Shield, AlertCircle, Info, Loader2, FileText, X, RefreshCw
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
        toast.success('✅ AI report generated successfully!');
      } else {
        const errorMessage = data.message || 'Error generating report';
        
        if (errorMessage.includes('Aucune donnée de consommation') || errorMessage.includes('No consumption data')) {
          toast.error('📊 No consumption data available. Please record stock movements (outgoing) first.', {
            duration: 5000
          });
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Error generating AI report:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Error generating report';
      
      if (errorMessage.includes('Aucune donnée de consommation') || errorMessage.includes('No consumption data')) {
        toast.error('📊 No consumption data found. Record stock movements for this material.', {
          duration: 5000
        });
      } else {
        toast.error(errorMessage);
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
      
      if (data.success) {
        toast.success(`✅ ${data.synced} entries synchronized successfully!`);
        // Regenerate report after sync
        setTimeout(() => generateReport(), 1000);
      } else {
        toast.error('Error during synchronization');
      }
    } catch (error: any) {
      console.error('Error syncing data:', error);
      toast.error(error.response?.data?.message || 'Error during synchronization');
    } finally {
      setSyncing(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OVER_CONSUMPTION': return 'bg-red-100 text-red-700';
      case 'UNDER_CONSUMPTION': return 'bg-blue-100 text-blue-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'DANGER': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'WARNING': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default: return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-50 border-red-300';
      case 'DANGER': return 'bg-orange-50 border-orange-300';
      case 'WARNING': return 'bg-yellow-50 border-yellow-300';
      default: return 'bg-blue-50 border-blue-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              AI Analysis Report - {materialName || 'Material'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Generating AI report...</p>
            <p className="text-sm text-gray-500 mt-2">Analyzing {days} days of data</p>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Report Header */}
            <Card className={`border-2 ${getRiskLevelColor(report.riskLevel)}`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Material</p>
                    <p className="font-bold text-lg">{report.materialName}</p>
                    <p className="text-sm text-gray-500">{report.materialCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Risk Level</p>
                    <Badge className={`text-lg px-4 py-2 ${getRiskLevelColor(report.riskLevel)}`}>
                      {report.riskLevel === 'CRITICAL' ? '🚨 CRITICAL' :
                       report.riskLevel === 'HIGH' ? '⚠️ HIGH' :
                       report.riskLevel === 'MEDIUM' ? '📊 MEDIUM' : '✅ LOW'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Total Consumption</p>
                  <p className="text-2xl font-bold">{report.totalConsumption.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">over {report.period.days} days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Daily Average</p>
                  <p className="text-2xl font-bold">{report.averageDailyConsumption.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">units/day</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Deviation</p>
                  <p className={`text-2xl font-bold ${report.deviationPercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {report.deviationPercentage > 0 ? '+' : ''}{report.deviationPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">vs expected</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(report.consumptionStatus)}>
                    {report.consumptionStatus === 'OVER_CONSUMPTION' ? 'OVERCONSUMPTION' :
                     report.consumptionStatus === 'UNDER_CONSUMPTION' ? 'UNDERCONSUMPTION' : 'NORMAL'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Possible Issues */}
            {report.possibleIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-red-600" />
                    Detected Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.possibleIssues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <p className="text-sm text-red-800">{issue}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alerts */}
            {report.alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Alerts ({report.alerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {report.alerts
                      .filter(alert => alert.severity !== 'INFO')
                      .slice(0, 10)
                      .map((alert, index) => (
                        <div key={index} className={`flex items-start gap-3 p-3 border rounded-lg ${getSeverityColor(alert.severity)}`}>
                          {getSeverityIcon(alert.severity)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.message}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(alert.date).toLocaleDateString('en-US')} - 
                              Quantity: {alert.quantity} (expected: {alert.expectedQuantity.toFixed(1)})
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <p className="text-sm text-green-800">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => generateReport()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium mb-2">No report available</p>
            <p className="text-sm text-gray-500 mb-4">
              To generate an AI analysis report, consumption data must be available.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left max-w-md mx-auto">
              <p className="text-sm font-medium text-blue-800 mb-2">📋 Prerequisites:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Stock movements (outgoing) must be recorded</li>
                <li>• At least 7 days of consumption data</li>
                <li>• Material must be assigned to a site</li>
              </ul>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={handleSyncData}
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync data
                  </>
                )}
              </Button>
              <Button onClick={generateReport} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate report'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}