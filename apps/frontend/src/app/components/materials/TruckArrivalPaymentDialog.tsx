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
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Upload, CreditCard, Banknote, CheckCircle } from "lucide-react";
import axios from "axios";

interface TruckArrivalPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  materialName: string;
  supplierName: string;
  amount: number;
  siteId: string;
}

export default function TruckArrivalPaymentDialog({
  open,
  onClose,
  orderId,
  materialName,
  supplierName,
  amount,
  siteId,
}: TruckArrivalPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const response = await axios.post("/api/payments/create", {
        siteId,
        amount,
        paymentMethod,
        description: `Paiement pour ${materialName} - Commande #${orderId}`,
      });

      if (response.data.success) {
        setPaymentSuccess(true);
        toast.success(
          paymentMethod === "cash"
            ? "Paiement en espèces enregistré avec succès!"
            : "Paiement par carte initié avec succès!"
        );

        // Si paiement par carte, rediriger vers Stripe (simulation)
        if (paymentMethod === "card" && response.data.clientSecret) {
          toast.info("Redirection vers le paiement sécurisé...");
          // Dans un vrai système, intégrer Stripe Elements ici
          setTimeout(() => {
            toast.success("Paiement par carte confirmé!");
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors du paiement"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez PDF, JPG ou PNG.");
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 MB)");
      return;
    }

    setInvoiceFile(file);
    setUploadingInvoice(true);

    try {
      const formData = new FormData();
      formData.append("invoice", file);
      formData.append("orderId", orderId);
      formData.append("materialName", materialName);

      await axios.post("/api/payments/upload-invoice", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Facture téléchargée avec succès!");
    } catch (error: any) {
      console.error("Invoice upload error:", error);
      toast.error("Erreur lors du téléchargement de la facture");
      setInvoiceFile(null);
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleClose = () => {
    if (!processing && !uploadingInvoice) {
      setPaymentSuccess(false);
      setInvoiceFile(null);
      setPaymentMethod("cash");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {paymentSuccess ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Paiement Confirmé
              </>
            ) : (
              <>
                🚚 Camion Arrivé - Paiement Requis
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {paymentSuccess ? (
              "Le paiement a été enregistré avec succès. Vous pouvez maintenant télécharger la facture."
            ) : (
              `Le camion de ${supplierName} est arrivé avec ${materialName}. Veuillez procéder au paiement.`
            )}
          </DialogDescription>
        </DialogHeader>

        {!paymentSuccess ? (
          <div className="space-y-4 py-4">
            {/* Montant */}
            <div className="space-y-2">
              <Label>Montant à payer</Label>
              <div className="text-2xl font-bold text-blue-600">
                {amount.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </div>
            </div>

            {/* Méthode de paiement */}
            <div className="space-y-2">
              <Label>Méthode de paiement</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as "cash" | "card")}
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Espèces</div>
                      <div className="text-xs text-gray-500">Paiement immédiat en liquide</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Carte bancaire</div>
                      <div className="text-xs text-gray-500">Paiement sécurisé en ligne</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Informations supplémentaires */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="font-medium text-blue-900 mb-1">📋 Détails de la commande</div>
              <div className="text-blue-700 space-y-1">
                <div>• Matériau: {materialName}</div>
                <div>• Fournisseur: {supplierName}</div>
                <div>• Commande: #{orderId.substring(0, 8)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Upload facture */}
            <div className="space-y-2">
              <Label>Télécharger la facture (optionnel)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {invoiceFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                    <div className="text-sm font-medium text-green-700">
                      {invoiceFile.name}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvoiceFile(null)}
                      disabled={uploadingInvoice}
                    >
                      Changer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <div className="text-sm text-gray-600">
                      Cliquez pour télécharger la facture
                    </div>
                    <div className="text-xs text-gray-400">
                      PDF, JPG ou PNG (max 5 MB)
                    </div>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleInvoiceUpload}
                      disabled={uploadingInvoice}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              ✅ Le paiement a été enregistré et la livraison peut être finalisée.
            </div>
          </div>
        )}

        <DialogFooter>
          {!paymentSuccess ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={processing}>
                Annuler
              </Button>
              <Button onClick={handlePayment} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Traitement...
                  </>
                ) : (
                  <>
                    {paymentMethod === "cash" ? (
                      <Banknote className="h-4 w-4 mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Confirmer le paiement
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
