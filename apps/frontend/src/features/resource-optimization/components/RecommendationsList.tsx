import React from 'react';
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
  Zap,
  Briefcase,
  Users,
  Calendar,
  Leaf,
  TrendingDown,
  CheckCircle2,
  Clock,
  DollarSign,
  BarChart3,
  TrendingUp,
  UserCheck,
} from 'lucide-react';

interface RecommendationCardProps {
  rec: {
    _id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    estimatedSavings: number;
    estimatedCO2Reduction: number;
    priority: number;
    confidenceScore: number;
    targetMember?: string;
    currentTasks?: string[];
    suggestedDuration?: number;
  };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onImplement: (id: string) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  rec,
  onApprove,
  onReject,
  onImplement,
}) => {
  const typeIcons = {
    energy: <Zap className="h-5 w-5" />,
    equipment: <Briefcase className="h-5 w-5" />,
    workforce: <Users className="h-5 w-5" />,
    scheduling: <Calendar className="h-5 w-5" />,
    environmental: <Leaf className="h-5 w-5" />,
    budget: <DollarSign className="h-5 w-5" />,
    task_distribution: <BarChart3 className="h-5 w-5" />,
    timeline: <TrendingUp className="h-5 w-5" />,
    resource_allocation: <Users className="h-5 w-5" />,
    individual_task_management: <UserCheck className="h-5 w-5" />,
  };

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: '⏳ En attente' },
    approved: { color: 'bg-blue-100 text-blue-800', label: '✅ Approuvée' },
    rejected: { color: 'bg-gray-100 text-gray-800', label: '❌ Rejetée' },
    implemented: { color: 'bg-green-100 text-green-800', label: '🎉 Mise en place' },
  };

  const status = statusConfig[rec.status] || statusConfig.pending;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            {typeIcons[rec.type]}
            <div className="flex-1">
              <CardTitle className="text-lg">{rec.title}</CardTitle>
              <CardDescription className="mt-1">{rec.description}</CardDescription>
            </div>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Member Information for Individual Recommendations */}
        {rec.type === 'individual_task_management' && rec.targetMember && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-2">
              <UserCheck className="h-4 w-4" />
              Recommandation pour: {rec.targetMember}
            </div>
            {rec.currentTasks && rec.currentTasks.length > 0 && (
              <div className="text-sm text-blue-600">
                <strong>Tâches actuelles:</strong>
                <ul className="list-disc list-inside mt-1">
                  {rec.currentTasks.slice(0, 3).map((task: string, index: number) => (
                    <li key={index}>{task}</li>
                  ))}
                  {rec.currentTasks.length > 3 && (
                    <li className="text-blue-500">...et {rec.currentTasks.length - 3} autres</li>
                  )}
                </ul>
              </div>
            )}
            {rec.suggestedDuration && (
              <div className="text-sm text-blue-600 mt-2">
                <strong>Durée suggérée:</strong> {rec.suggestedDuration} jours maximum par tâche
              </div>
            )}
          </div>
        )}

        {/* Confidence Score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <small className="text-gray-600">Confiance</small>
            <small className="font-semibold">{rec.confidenceScore}%</small>
          </div>
          <Progress value={rec.confidenceScore} className="h-2" />
        </div>

        {/* Savings & Impact */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
              <TrendingDown className="h-4 w-4" />
              Économies potentielles
            </div>
            <div className="text-xl font-bold text-emerald-900 mt-1">
              {rec.estimatedSavings ? `${rec.estimatedSavings.toFixed(0)} TND` : 'N/A'}
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
              <Leaf className="h-4 w-4" />
              Réduction CO₂
            </div>
            <div className="text-xl font-bold text-green-900 mt-1">
              {rec.estimatedCO2Reduction ? `${rec.estimatedCO2Reduction.toFixed(0)} kg` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Priority */}
        <div>
          <div className="text-sm font-semibold mb-2">Priorité: {rec.priority}/10</div>
          <Progress value={rec.priority * 10} className="h-2" />
        </div>

        {/* Action Buttons */}
        {rec.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onApprove(rec._id)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approuver
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onReject(rec._id)}
            >
              Rejeter
            </Button>
          </div>
        )}

        {rec.status === 'approved' && (
          <Button
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => onImplement(rec._id)}
          >
            <Clock className="h-4 w-4 mr-1" />
            Mettre en place
          </Button>
        )}

        {rec.status === 'implemented' && (
          <div className="text-center py-2 bg-green-50 rounded text-green-700 text-sm font-semibold">
            ✓ Mise en place effectuée
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface RecommendationsListProps {
  recommendations: RecommendationCardProps['rec'][];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onImplement: (id: string) => void;
  loading?: boolean;
  filter?: string;
}

export const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendations,
  onApprove,
  onReject,
  onImplement,
  loading,
  filter,
}) => {
  const filtered = filter
    ? recommendations.filter((r) => r.type === filter)
    : recommendations;

  if (loading) {
    return <div className="text-center py-4">Chargement des recommandations...</div>;
  }

  if (!filtered || filtered.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune recommandation pour ce filtre
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map((rec) => (
        <RecommendationCard
          key={rec._id}
          rec={rec}
          onApprove={onApprove}
          onReject={onReject}
          onImplement={onImplement}
        />
      ))}
    </div>
  );
};

const typeIcons: Record<string, React.ReactNode> = {
  energy: <Zap className="h-5 w-5" />,
  equipment: <Briefcase className="h-5 w-5" />,
  workforce: <Users className="h-5 w-5" />,
  scheduling: <Calendar className="h-5 w-5" />,
  environmental: <Leaf className="h-5 w-5" />,
};
