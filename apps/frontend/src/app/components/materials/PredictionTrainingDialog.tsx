"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";
import { Upload, Loader2, CheckCircle, Brain, TrendingUp, AlertCircle } from "lucide-react";
import axios from "axios";

interface PredictionTrainingDialogProps {
  open: boolean;
  onClose: () => void;
  materialId: string;
  materialName: string;
  onTrainingComplete: (prediction: any) => void;
}

export default function PredictionTrainingDialog({
  open,
  onClose,
  materialId,
  materialName,
  onTrainingComplete,
}: PredictionTrainingDialogProps) {
  const [step, setStep] = useState<"upload" | "training" | "prediction" | "complete">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [trainingResult, setTrainingResult] = useState<any>(null);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Vérifier le type de fichier
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Format non supporté. Utilisez un fichier CSV.");
      return;
    }

    // Vérifier la taille (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10 MB)");
      return;
    }

    setFile(selectedFile);
    toast.success(`Fichier sélectionné: ${selectedFile.name}`);
  };

  const handleUploadAndTrain = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier CSV");
      return;
    }

    setUploading(true);
    setStep("training");

    try {
      // 1. Upload du dataset
      const formData = new FormData();
      formData.append("dataset", file);
      formData.append("materialId", materialId);

      const uploadResponse = await axios.post(
        "/api/materials/ml/upload-dataset",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message || "Erreur lors de l'upload");
      }

      toast.success("Dataset uploadé avec succès!");

      // 2. Entraînement du modèle
      setTraining(true);
      const trainingResponse = await axios.post("/api/materials/ml/train", {
        materialId,
        datasetPath: uploadResponse.data.datasetPath,
      });

      if (!trainingResponse.data.success) {
        throw new Error(trainingResponse.data.message || "Erreur lors de l'entraînement");
      }

      setTrainingResult(trainingResponse.data);
      toast.success(
        `Modèle entraîné! Précision: ${Math.round(trainingResponse.data.accuracy * 100)}%`
      );

      // 3. Génération de la prédiction
      setStep("prediction");
      setPredicting(true);

      const predictionResponse = await axios.post("/api/materials/ml/predict", {
        materialId,
        modelPath: trainingResponse.data.modelPath,
      });

      if (!predictionResponse.data.success) {
        throw new Error(predictionResponse.data.message || "Erreur lors de la prédiction");
      }

      setPredictionResult(predictionResponse.data.prediction);
      setStep("complete");
      toast.success("Prédiction générée avec succès!");

      // Notifier le parent
      onTrainingComplete(predictionResponse.data.prediction);
    } catch (error: any) {
      console.error("Training error:", error);
      toast.error(
        error.response?.data?.message || error.message || "Erreur lors du processus"
      );
      setStep("upload");
    } finally {
      setUploading(false);
      setTraining(false);
      setPredicting(false);
    }
  };

  const handleClose = () => {
    if (!uploading && !training && !predicting) {
      setStep("upload");
      setFile(null);
      setTrainingResult(null);
      setPredictionResult(null);
      onClose();
    }
  };

  const formatHours = (hours: number) => {
    if (hours < 24) return `${Math.floor(hours)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Prédiction IA - {materialName}
          </DialogTitle>
          <DialogDescription>
            Uploadez un dataset CSV pour entraîner le modèle et générer des prédictions précises
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Étape 1: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {file ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                    <div className="text-sm font-medium text-green-700">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      Changer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div className="text-sm text-gray-600">
                      Cliquez pour sélectionner un fichier CSV
                    </div>
                    <div className="text-xs text-gray-400">
                      Format: date, quantité, consommation (max 10 MB)
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <div className="font-medium text-blue-900 mb-2">
                  📋 Format du CSV attendu:
                </div>
                <div className="text-blue-700 space-y-1 font-mono text-xs">
                  <div>date,quantity,consumption</div>
                  <div>2026-04-01,1000,50</div>
                  <div>2026-04-02,950,45</div>
                  <div>2026-04-03,905,48</div>
                  <div>...</div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Training */}
          {step === "training" && (
            <div className="space-y-4 text-center py-8">
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-purple-600" />
              <div className="space-y-2">
                <div className="text-lg font-medium">
                  {uploading && "Upload du dataset en cours..."}
                  {training && "Entraînement du modèle IA..."}
                </div>
                <div className="text-sm text-gray-500">
                  Cela peut prendre quelques secondes
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Prediction */}
          {step === "prediction" && (
            <div className="space-y-4 text-center py-8">
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-blue-600" />
              <div className="space-y-2">
                <div className="text-lg font-medium">
                  Génération de la prédiction...
                </div>
                <div className="text-sm text-gray-500">
                  Analyse des données et calcul des tendances
                </div>
              </div>
            </div>
          )}

          {/* Étape 4: Complete */}
          {step === "complete" && predictionResult && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-medium text-green-900">
                  Prédiction générée avec succès!
                </div>
              </div>

              {/* Résultats de l'entraînement */}
              {trainingResult && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Résultats de l'entraînement
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-purple-700">Précision:</span>
                      <span className="ml-2 font-medium">
                        {Math.round(trainingResult.accuracy * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700">Erreur (MSE):</span>
                      <span className="ml-2 font-medium">
                        {trainingResult.mse?.toFixed(2) || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700">Époques:</span>
                      <span className="ml-2 font-medium">
                        {trainingResult.epochs || 50}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700">Données:</span>
                      <span className="ml-2 font-medium">
                        {trainingResult.dataPoints || "N/A"} points
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Résultats de la prédiction */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Prédictions
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded p-3">
                      <div className="text-xs text-gray-500">Stock Actuel</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {predictionResult.currentStock}
                      </div>
                    </div>
                    <div className="bg-white rounded p-3">
                      <div className="text-xs text-gray-500">Stock Prédit (24h)</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.floor(predictionResult.predictedStock)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Consommation:</span>
                      <span className="ml-2 font-medium">
                        {predictionResult.consumptionRate?.toFixed(2)}/h
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Confiance:</span>
                      <span className="ml-2 font-medium">
                        {Math.round(predictionResult.confidence * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rupture dans:</span>
                      <span className={`ml-2 font-medium ${
                        predictionResult.hoursToOutOfStock < 24 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatHours(predictionResult.hoursToOutOfStock)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Statut:</span>
                      <span className={`ml-2 font-medium ${
                        predictionResult.status === 'critical' ? 'text-red-600' :
                        predictionResult.status === 'warning' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {predictionResult.status === 'critical' ? '🚨 Critique' :
                         predictionResult.status === 'warning' ? '⚠️ Attention' :
                         '✅ Sécurisé'}
                      </span>
                    </div>
                  </div>

                  {predictionResult.recommendedOrderQuantity > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                      <div className="font-medium text-yellow-900">
                        📦 Commande recommandée:
                      </div>
                      <div className="text-yellow-700 text-lg font-bold mt-1">
                        {Math.ceil(predictionResult.recommendedOrderQuantity)} unités
                      </div>
                    </div>
                  )}

                  {predictionResult.message && (
                    <div className="text-sm text-gray-600 italic">
                      {predictionResult.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleUploadAndTrain}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Entraîner & Prédire
                  </>
                )}
              </Button>
            </>
          )}
          {step === "complete" && (
            <Button onClick={handleClose} className="w-full">
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
