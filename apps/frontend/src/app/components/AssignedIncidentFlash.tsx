import { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle, Trash2, Eye, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { incidentEvents } from './IncidentBadge';

// API pour les incidents
const incidentsApi = axios.create({
  baseURL: "http://localhost:3003",
  timeout: 10000,
});

// Récupérer le token
const getAuthToken = (): string | null => {
  const directToken = localStorage.getItem("access_token");
  if (directToken) return directToken;
  const persisted = localStorage.getItem("smartsite-auth");
  if (!persisted) return null;
  try {
    const parsed = JSON.parse(persisted);
    return parsed?.state?.user?.access_token || null;
  } catch {
    return null;
  }
};

// Configuration des headers
incidentsApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Incident {
  _id?: string;
  id?: string;
  incidentName?: string;
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  priority?: string;
  severity?: string;
  site?: any;
  project?: any;
  assignedUserCin?: string;
  assignedToCin?: string;
  createdAt?: string;
}

interface AssignedIncidentFlashProps {
  userCin: string;
}

export function AssignedIncidentFlash({ userCin }: AssignedIncidentFlashProps) {
  const [assignedIncidents, setAssignedIncidents] = useState<Incident[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Récupérer les incidents assignés au user
  useEffect(() => {
    const fetchAssignedIncidents = async () => {
      if (!userCin) {
        console.log('❌ AssignedIncidentFlash: No userCin provided');
        return;
      }

      console.log('🔍 AssignedIncidentFlash: Fetching incidents for userCin:', userCin);

      try {
        // Vérifier si on a déjà affiché aujourd'hui
        const lastShown = localStorage.getItem(`incident-flash-${userCin}`);
        const today = new Date().toDateString();

        console.log('📅 AssignedIncidentFlash: lastShown =', lastShown, '| today =', today);

        // Récupérer tous les incidents
        const response = await incidentsApi.get("/incidents");
        const allIncidents = response.data || [];

        console.log('📊 AssignedIncidentFlash: Total incidents:', allIncidents.length);
        console.log('👤 AssignedIncidentFlash: Looking for assignedUserCin =', userCin);

        // Filtrer ceux assignés à ce user et non résolus
        const assigned = allIncidents.filter((inc: Incident) =>
          (inc.assignedToCin === userCin || inc.assignedUserCin === userCin) &&
          inc.status !== 'resolved'
        );

        console.log('✅ AssignedIncidentFlash: Found assigned incidents:', assigned.length);
        console.log('📋 AssignedIncidentFlash: Assigned incidents:', assigned);

        if (assigned.length > 0) {
          setAssignedIncidents(assigned);

          // Afficher seulement si pas déjà vu aujourd'hui
          if (lastShown !== today) {
            console.log('🚨 AssignedIncidentFlash: Showing notification!');
            setIsVisible(true);
            localStorage.setItem(`incident-flash-${userCin}`, today);
          } else {
            console.log('⏭️ AssignedIncidentFlash: Already shown today, skipping');
            // DEBUG: Always show for testing
            // setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("❌ AssignedIncidentFlash: Error fetching incidents:", error);
      }
    };

    // Attendre 1 seconde après le chargement de la page
    const timer = setTimeout(fetchAssignedIncidents, 1000);
    return () => clearTimeout(timer);
  }, [userCin]);

  // Force show for debugging (Ctrl+Shift+I)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        console.log('🧪 AssignedIncidentFlash: Force show triggered!');
        if (assignedIncidents.length > 0) {
          setIsVisible(true);
        } else {
          console.log('⚠️ No incidents to show');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assignedIncidents]);

  // Périodiquement vérifier les nouveaux incidents (toutes les 30 secondes)
  useEffect(() => {
    if (!userCin) return;

    const interval = setInterval(async () => {
      try {
        const response = await incidentsApi.get("/incidents");
        const allIncidents = response.data || [];
        const assigned = allIncidents.filter((inc: Incident) =>
          (inc.assignedToCin === userCin || inc.assignedUserCin === userCin) &&
          inc.status !== 'resolved'
        );

        // Si nouveaux incidents non encore dans la liste
        const currentIds = assignedIncidents.map(i => i._id || i.id);
        const newIncidents = assigned.filter((inc: Incident) =>
          !currentIds.includes(inc._id || inc.id)
        );

        if (newIncidents.length > 0) {
          setAssignedIncidents(prev => [...newIncidents, ...prev]);
          setIsVisible(true);
          setCurrentIndex(0);
          toast.info(`${newIncidents.length} nouvel incident${newIncidents.length > 1 ? 's' : ''} vous a été assigné !`);
        }
      } catch (error) {
        console.error("Erreur polling incidents:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [userCin, assignedIncidents]);

  const currentIncident = assignedIncidents[currentIndex];

  const handleResolve = async (incidentId: string) => {
    try {
      setLoading(true);
      await incidentsApi.put(`/incidents/${incidentId}`, {
        status: 'resolved',
        resolvedAt: new Date().toISOString()
      });

      // Notifier les autres pages
      incidentEvents.emit('updated', { incidentId, status: 'resolved' });

      // Retirer de la liste
      setAssignedIncidents(prev => prev.filter(inc =>
        (inc._id !== incidentId && inc.id !== incidentId)
      ));

      toast.success("Incident marqué comme traité !");

      // Passer au suivant ou fermer
      if (currentIndex < assignedIncidents.length - 1) {
        setCurrentIndex(prev => prev);
      } else if (assignedIncidents.length <= 1) {
        setIsVisible(false);
      }
    } catch (error) {
      toast.error("Erreur lors du traitement");
    } finally {
      setLoading(false);
      setShowDetails(false);
    }
  };

  const handleDelete = async (incidentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet incident ?")) return;

    try {
      setLoading(true);
      await incidentsApi.delete(`/incidents/${incidentId}`);

      // Notifier les autres pages
      incidentEvents.emit('deleted', { incidentId });

      // Retirer de la liste
      setAssignedIncidents(prev => prev.filter(inc =>
        (inc._id !== incidentId && inc.id !== incidentId)
      ));

      toast.success("Incident supprimé !");

      // Passer au suivant ou fermer
      if (assignedIncidents.length <= 1) {
        setIsVisible(false);
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
      setShowDetails(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < assignedIncidents.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(assignedIncidents.length - 1);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleShowDetails = () => {
    setSelectedIncident(currentIncident);
    setShowDetails(true);
  };

  if (!isVisible || !currentIncident) return null;

  return (
    <>
      {/* Flash Notification - Rouge et clignotante */}
      <div className="fixed top-4 right-4 z-50 animate-pulse">
        <div className="bg-red-600 text-white rounded-lg shadow-2xl p-4 min-w-[350px] max-w-[450px] border-4 border-red-400">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 animate-bounce" />
              <span className="font-bold text-lg">⚠️ INCIDENT ASSIGNED</span>
              {assignedIncidents.length > 1 && (
                <Badge variant="secondary" className="bg-red-700 text-white">
                  {currentIndex + 1} / {assignedIncidents.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem(`incident-flash-${userCin}`);
                  console.log('🔄 Reset daily flag, will show on next reload');
                  toast.success('Flag reset! Reload page to see notification');
                }}
                className="text-xs text-red-200 hover:text-white"
                title="Reset daily flag"
              >
                Reset
              </button>
              <button
                onClick={handleDismiss}
                className="text-white hover:text-red-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">
                  {currentIncident.incidentName || "Incident sans nom"}
                </p>
                <p className="text-sm text-red-100 line-clamp-2">
                  {currentIncident.description || "Pas de description"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="border-white text-white">
                {currentIncident.type || "Type inconnu"}
              </Badge>
              <Badge variant="outline" className="border-white text-white">
                {currentIncident.priority || "Priorité normale"}
              </Badge>
            </div>

            {(currentIncident.site || currentIncident.project) && (
              <div className="text-xs text-red-100">
                {currentIncident.site?.nom && `📍 ${currentIncident.site.nom}`}
                {currentIncident.site?.nom && currentIncident.project?.name && " | "}
                {currentIncident.project?.name && `📁 ${currentIncident.project.name}`}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 bg-white text-red-600 hover:bg-red-50"
              onClick={handleShowDetails}
              disabled={loading}
            >
              <Eye className="h-4 w-4 mr-1" />
              Lire
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              onClick={() => handleResolve(currentIncident._id || currentIncident.id || '')}
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Traité
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 bg-red-800 hover:bg-red-900"
              onClick={() => handleDelete(currentIncident._id || currentIncident.id || '')}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Suppr
            </Button>
          </div>

          {/* Navigation si plusieurs incidents */}
          {assignedIncidents.length > 1 && (
            <div className="flex justify-between mt-3 pt-2 border-t border-red-400">
              <button
                onClick={handlePrev}
                className="text-xs text-red-200 hover:text-white"
              >
                ← Précédent
              </button>
              <span className="text-xs text-red-200">
                {assignedIncidents.length} incidents à traiter
              </span>
              <button
                onClick={handleNext}
                className="text-xs text-red-200 hover:text-white"
              >
                Suivant →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dialog détails */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Détails de l'incident
            </DialogTitle>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Nom</h4>
                <p>{selectedIncident.incidentName || "Non spécifié"}</p>
              </div>

              <div>
                <h4 className="font-semibold">Description</h4>
                <p className="text-sm text-gray-600">{selectedIncident.description || "Aucune description"}</p>
              </div>

              <div className="flex gap-4">
                <div>
                  <h4 className="font-semibold">Type</h4>
                  <Badge>{selectedIncident.type || "Inconnu"}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold">Priorité</h4>
                  <Badge variant={selectedIncident.priority === 'high' ? 'destructive' : 'default'}>
                    {selectedIncident.priority || "Normale"}
                  </Badge>
                </div>
              </div>

              {(selectedIncident.site || selectedIncident.project) && (
                <div>
                  <h4 className="font-semibold">Localisation</h4>
                  <p className="text-sm">
                    {selectedIncident.site?.nom && `Site: ${selectedIncident.site.nom}`}
                    {selectedIncident.site?.nom && selectedIncident.project?.name && " | "}
                    {selectedIncident.project?.name && `Projet: ${selectedIncident.project.name}`}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={() => handleResolve(selectedIncident._id || selectedIncident.id || '')}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer comme traité
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedIncident._id || selectedIncident.id || '')}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
