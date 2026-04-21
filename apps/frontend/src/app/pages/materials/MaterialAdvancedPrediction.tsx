import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Brain, Calendar, Package, AlertTriangle, Loader2 } from 'lucide-react';
import materialService from '../../../services/materialService';
import { toast } from 'sonner';

interface MaterialAdvancedPredictionProps {
  materialId: string;
  materialName: string;
  onClose?: () => void;
}

const weatherOptions = [
  { value: 'sunny', label: 'Ensoleillé' },
  { value: 'rainy', label: 'Pluvieux' },
  { value: 'cloudy', label: 'Nuageux' },
  { value: 'stormy', label: 'Orageux' },
  { value: 'snowy', label: 'Neigeux' },
  { value: 'windy', label: 'Venteux' },
];

const projectTypeOptions = [
  { value: 'residential', label: 'Résidentiel' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'industrial', label: 'Industriel' },
  { value: 'renovation', label: 'Rénovation' },
];

const dayOfWeekOptions = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

export default function MaterialAdvancedPrediction({
  materialId,
  materialName,
  onClose,
}: MaterialAdvancedPredictionProps) {
  const [features, setFeatures] = useState({
    hourOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    siteActivityLevel: 0.7,
    weather: 'sunny',
    projectType: 'commercial',
  });
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const result = await materialService.predictStockAdvanced(materialId, features);
      setPrediction(result);
      toast.success('Prédiction avancée générée!');
    } catch (error: any) {
      console.error('Error predicting:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la prédiction avancée');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 border-red-300';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300';
      default:
        return 'bg-green-100 border-green-300';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      default:
        return 'text-green-700';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-purple-50">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Brain className="h-5 w-5" />
          Prédiction Avancée (IA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Heure (0-23)</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={features.hourOfDay}
              onChange={(e) => setFeatures({ ...features, hourOfDay: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Jour de la semaine</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={features.dayOfWeek}
              onChange={(e) => setFeatures({ ...features, dayOfWeek: parseInt(e.target.value) })}
            >
              {dayOfWeekOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Activité chantier (0-1)</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              max={1}
              value={features.siteActivityLevel}
              onChange={(e) => setFeatures({ ...features, siteActivityLevel: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Météo</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={features.weather}
              onChange={(e) => setFeatures({ ...features, weather: e.target.value })}
            >
              {weatherOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <Label>Type de projet</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={features.projectType}
              onChange={(e) => setFeatures({ ...features, projectType: e.target.value })}
            >
              {projectTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={handlePredict}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Prédiction...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Générer la prédiction avancée
            </>
          )}
        </Button>

        {prediction && (
          <div className={`mt-4 p-4 rounded-lg border-2 space-y-3 ${getStatusColor(prediction.status)}`}>
            <h3 className="font-bold text-lg">📊 Résultat pour {materialName}</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white/80 rounded">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-sm text-gray-600">Date rupture</div>
                <div className="font-bold text-sm">
                  {new Date(prediction.estimatedRuptureDate).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                  })}
                </div>
              </div>
              <div className="p-3 bg-white/80 rounded">
                <Package className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <div className="text-sm text-gray-600">Commander</div>
                <div className="font-bold text-sm">{prediction.recommendedOrderQuantity} unités</div>
              </div>
              <div className={`p-3 bg-white/80 rounded ${getStatusTextColor(prediction.status)}`}>
                <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
                <div className="text-sm text-gray-600">Statut</div>
                <div className="font-bold text-sm uppercase">
                  {prediction.status === 'critical'
                    ? 'CRITIQUE'
                    : prediction.status === 'warning'
                    ? 'ÉLEVÉ'
                    : 'FAIBLE'}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-700 text-center">
              {prediction.message}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}