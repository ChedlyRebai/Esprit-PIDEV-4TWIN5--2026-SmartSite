import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { TrendingUp, Calendar, Package, RefreshCw } from 'lucide-react';
import materialService, { Material } from '../../../services/materialService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

interface MaterialForecastProps {
  materials: Material[];
}

export default function MaterialForecast({ materials }: MaterialForecastProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedMaterial) {
      loadForecast(selectedMaterial);
    }
  }, [selectedMaterial]);

  const loadForecast = async (materialId: string) => {
    setLoading(true);
    try {
      const data = await materialService.getForecast(materialId);
      setForecast(data);
    } catch (error) {
      console.error('Error loading forecast:', error);
      toast.error('Error loading forecast');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!selectedMaterial) return;
    
    try {
      const result = await materialService.reorderMaterial(selectedMaterial);
      if (result.success) {
        toast.success(`Order created! Expected delivery: ${new Date(result.expectedDelivery).toLocaleDateString()}`);
        loadForecast(selectedMaterial);
      }
    } catch (error) {
      toast.error('Order failed');
    }
  };

  const chartData = forecast?.trends?.map((trend: any) => ({
    date: new Date(trend.date).toLocaleDateString(),
    consumption: trend.consumption,
  })) || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Consumption Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
            >
              <option value="">Select a material...</option>
              {materials.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.code})
                </option>
              ))}
            </select>
          </div>

          {loading && <div className="text-center py-8">Loading forecast...</div>}

          {forecast && !loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{forecast.currentStock}</div>
                    <p className="text-sm text-gray-500">Current Stock</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{forecast.dailyConsumption?.toFixed(2) || 0}</div>
                    <p className="text-sm text-gray-500">Daily Consumption</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{forecast.daysRemaining?.toFixed(1) || 0}</div>
                    <p className="text-sm text-gray-500">Days Remaining</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{forecast.suggestedOrderQuantity || 0}</div>
                    <p className="text-sm text-gray-500">Recommended Quantity</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Recommended Order Date:</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {forecast.reorderDate ? new Date(forecast.reorderDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {chartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Last 7 Days Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="consumption" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleReorder}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => loadForecast(selectedMaterial)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}