"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, CheckCircle, Loader2, Euro, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import orderService from "../../../services/orderService";

interface CashPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId: string;
  orderNumber: string;
  materialName: string;
  supplierName: string;
  siteName: string;
  amount: number;
}

export default function CashPaymentDialog({
  open,
  onClose,
  onSuccess,
  orderId,
  orderNumber,
  materialName,
  supplierName,
  siteName,
  amount,
}: CashPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setConfirmed(true);

    try {
      const result = await orderService.processPayment(orderId, "cash");

      if (!result.success) {
        throw new Error(result.message || "Payment error");
      }

      toast.success("✅ Cash payment recorded!");
      
      // Send WebSocket notification
      try {
        const socketMessage = {
          type: 'payment_confirmation',
          orderId: orderId,
          amount: amount,
          method: 'cash',
          message: `💰 Cash payment of ${amount}€ confirmed for order ${orderNumber}`
        };
        // Emit via socket if available
        if (typeof window !== 'undefined' && (window as any).socket) {
          (window as any).socket.emit('payment-confirmed', socketMessage);
        }
      } catch (socketError) {
        console.log('Socket notification not available');
      }
      
      if (generateInvoice) {
        try {
          const invoice = await orderService.generateInvoice(orderId, siteName);
          if (invoice) {
            setGeneratedInvoice(invoice);
            toast.success(`📄 Invoice ${invoice.numeroFacture} generated!`);
          }
        } catch (invoiceError) {
          console.error("Error generating invoice:", invoiceError);
          toast.warning("Payment successful but invoice generation failed");
        }
      }
      
      // Wait a bit before closing to show success
      setTimeout(() => {
        setLoading(false);
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error("Cash payment error:", error);
      toast.error(error.message || "Error recording payment");
      setLoading(false);
      setConfirmed(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (generatedInvoice?.pdfPath) {
      window.open(generatedInvoice.pdfPath, '_blank');
    } else if (generatedInvoice?.numeroFacture) {
      orderService.downloadInvoice(generatedInvoice.numeroFacture).then((blob) => {
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          window.URL.revokeObjectURL(url);
        }
      });
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen && !generatedInvoice && !loading) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-5 w-5 text-green-600" />
            Cash Payment
          </DialogTitle>
          <DialogDescription>
            Confirm the cash payment for the order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order:</span>
                  <span className="font-medium">{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Material:</span>
                  <span className="font-medium">{materialName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier:</span>
                  <span className="font-medium">{supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Construction Site:</span>
                  <span className="font-medium">{siteName}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Amount to collect:</span>
                    <span className="text-2xl font-bold text-green-600 flex items-center gap-1">
                      <Euro className="h-5 w-5" />
                      {amount.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Checkbox
              id="generate-invoice-cash"
              checked={generateInvoice}
              onCheckedChange={(checked) => setGenerateInvoice(checked === true)}
              disabled={loading}
            />
            <Label htmlFor="generate-invoice-cash" className="text-sm cursor-pointer flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Generate invoice after payment
            </Label>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Confirmation required:</p>
                <p>By confirming, you certify that you have received the cash payment of {amount.toFixed(2)}€ from {supplierName}.</p>
              </div>
            </div>
          </div>

          {generatedInvoice && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Payment confirmed!</p>
                    <p className="text-sm text-green-600">Invoice #{generatedInvoice.numeroFacture}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadInvoice}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}

          {loading && !generatedInvoice && (
            <div className="text-center py-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
              <p className="mt-2 text-gray-500">Processing...</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!generatedInvoice && !loading && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Payment
              </Button>
            </>
          )}
          {generatedInvoice && (
            <Button onClick={onSuccess} className="bg-green-600 hover:bg-green-700">
              Finish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}