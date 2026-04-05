import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  DollarSign,
  BarChart3,
  UserCheck,
} from 'lucide-react';

const RESOURCE_OPT_API =
  (import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL &&
    String(import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL).replace(/\/$/, '')) ||
  '/api';

interface SiteRecommendationCardProps {
  site: any;
  siteId: string;
  onSelect: () => void;
}

interface Recommendation {
  _id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  estimatedSavings: number;
  priority: number;
  confidenceScore: number;
  targetMember?: string;
  currentTasks?: string[];
  suggestedDuration?: number;
}

export const SiteRecommendationCard: React.FC<SiteRecommendationCardProps> = ({
  site,
  siteId,
  onSelect,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch recommendations for this site
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        const qs = new URLSearchParams({ siteId });
        const response = await fetch(
          `${RESOURCE_OPT_API}/recommendations?${qs.toString()}`,
        );
        if (response.ok) {
          const data = await response.json();
          setRecommendations(Array.isArray(data) ? data : []);
        } else {
          setError('Erreur lors du chargement des recommandations');
        }
      } catch (err) {
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [siteId]);

  // Generate recommendations if none exist
  const generateRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${RESOURCE_OPT_API}/recommendations/generate/${siteId}`,
        { method: 'POST' },
      );
      if (response.ok) {
        const qs = new URLSearchParams({ siteId });
        const recommendationsResponse = await fetch(
          `${RESOURCE_OPT_API}/recommendations?${qs.toString()}`,
        );
        if (recommendationsResponse.ok) {
          const data = await recommendationsResponse.json();
          setRecommendations(Array.isArray(data) ? data : []);
        }
      } else {
        setError('Erreur lors de la génération des recommandations');
      }
    } catch (err) {
      setError('Erreur lors de la génération des recommandations');
    } finally {
      setLoading(false);
    }
  };

  // Calculate site statistics
  const siteStats = {
    totalRecommendations: recommendations.length,
    urgentRecommendations: recommendations.filter(r => r.priority >= 8).length,
    implementedRecommendations: recommendations.filter(r => r.status === 'implemented').length,
    potentialSavings: recommendations.reduce((sum, r) => sum + (r.estimatedSavings || 0), 0),
    individualRecommendations: recommendations.filter(r => r.type === 'individual_task_management').length,
  };

  const typeIcons = {
    energy: <Zap className="h-4 w-4" />,
    equipment: <Building2 className="h-4 w-4" />,
    workforce: <Users className="h-4 w-4" />,
    scheduling: <Calendar className="h-4 w-4" />,
    environmental: <AlertTriangle className="h-4 w-4" />,
    budget: <DollarSign className="h-4 w-4" />,
    task_distribution: <BarChart3 className="h-4 w-4" />,
    timeline: <TrendingUp className="h-4 w-4" />,
    resource_allocation: <Users className="h-4 w-4" />,
    individual_task_management: <UserCheck className="h-4 w-4" />,
  };

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: '⏳ En attente' },
    approved: { color: 'bg-blue-100 text-blue-800', label: '✅ Approuvée' },
    rejected: { color: 'bg-gray-100 text-gray-800', label: '❌ Rejetée' },
    implemented: { color: 'bg-green-100 text-green-800', label: '🎉 Mise en place' },
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">{site.nom}</CardTitle>
              <Badge className={
                site.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                site.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }>
                {site.status}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              📍 {site.localisation} • 💰 {site.budget || 0} TND
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Masquer' : 'Détails'}
            </Button>
            <Button
              size="sm"
              onClick={onSelect}
            >
              Voir tout
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Site Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{siteStats.totalRecommendations}</div>
            <div className="text-xs text-gray-600">Recommandations</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{siteStats.urgentRecommendations}</div>
            <div className="text-xs text-gray-600">Urgentes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{siteStats.implementedRecommendations}</div>
            <div className="text-xs text-gray-600">Implémentées</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">{siteStats.individualRecommendations}</div>
            <div className="text-xs text-gray-600">Individuelles</div>
          </div>
        </div>

        {/* Progress Bar */}
        {siteStats.totalRecommendations > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <small className="text-gray-600">Progression</small>
              <small className="font-semibold">
                {Math.round((siteStats.implementedRecommendations / siteStats.totalRecommendations) * 100)}%
              </small>
            </div>
            <Progress 
              value={(siteStats.implementedRecommendations / siteStats.totalRecommendations) * 100} 
              className="h-2" 
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {recommendations.length === 0 && !loading && (
            <Button
              onClick={generateRecommendations}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Génération...' : '🚀 Générer les recommandations IA'}
            </Button>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Detailed Recommendations */}
        {showDetails && recommendations.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-semibold text-sm">Recommandations récentes</h4>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec) => (
                <div key={rec._id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    {typeIcons[rec.type] || <AlertTriangle className="h-4 w-4" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{rec.title}</span>
                        <Badge className={statusConfig[rec.status]?.color || statusConfig.pending.color}>
                          {statusConfig[rec.status]?.label || statusConfig.pending.label}
                        </Badge>
                      </div>
                      {rec.targetMember && (
                        <div className="text-xs text-blue-600 mt-1">
                          👤 {rec.targetMember}
                        </div>
                      )}
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{rec.description}</p>
                      {rec.estimatedSavings && (
                        <div className="text-xs text-green-600 mt-1">
                          💰 Économies: {rec.estimatedSavings} TND
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {recommendations.length > 3 && (
                <div className="text-center text-sm text-gray-500">
                  ...et {recommendations.length - 3} autres recommandations
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
