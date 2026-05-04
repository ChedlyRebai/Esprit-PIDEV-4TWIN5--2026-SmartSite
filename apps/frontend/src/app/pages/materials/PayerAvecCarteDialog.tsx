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
import { CreditCard, Loader2, Euro, FileText, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import orderService from "../../../services/orderService";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CreditCardPaymentDialogProps {
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

function CardPaymentFormInner({
  amount,
  orderId,
  siteName,
  clientSecret,
  onSuccess,
  onCancel,
  onInvoiceGenerated,
}: {
  amount: number;
  orderId: string;
  siteName: string;
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  onInvoiceGenerated: (invoice: any) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [cardComplete, setCardComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast.error("Payment system unavailable");
      return;
    }

    if (!cardComplete) {
      setErrorMessage("Please enter valid card information");
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Payment error");
        toast.error(error.message || "Payment error");
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        const result = await orderService.confirmCardPayment(orderId, paymentIntent.id);
        
        if (result.success) {
          if (generateInvoice) {
            try {
              const invoice = await orderService.generateInvoice(orderId, siteName);
              if (invoice) {
                onInvoiceGenerated(invoice);
                toast.success(`📄 Invoice ${invoice.numeroFacture} generated!`);
              }
            } catch (invoiceError) {
              console.error("Error generating invoice:", invoiceError);
              toast.warning("Payment successful but invoice generation failed");
            }
          }
          
          toast.success("✅ Payment successful!");
          onSuccess();
        } else {
          toast.error(result.message || "Confirmation error");
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setErrorMessage(error.message || "Payment error");
      toast.error(error.message || "Payment error");
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        fontFamily: "system-ui, -apple-system, sans-serif",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Credit Card Information</Label>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <CardElement
            options={cardElementOptions}
            onChange={(e) => {
              setCardComplete(e.complete);
              setErrorMessage(null);
            }}
          />
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Lock className="h-3 w-3" />
          Secure payment by Stripe - Your information is encrypted
        </p>
        {errorMessage && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3" />
            {errorMessage}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="generate-invoice-card"
          checked={generateInvoice}
          onCheckedChange={(checked) => setGenerateInvoice(checked === true)}
        />
        <Label htmlFor="generate-invoice-card" className="text-sm cursor-pointer flex items-center gap-1">
          <FileText className="h-4 w-4" />
          Generate invoice after payment (PDF)
        </Label>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Amount to pay:</span>
          <span className="text-2xl font-bold text-blue-600 flex items-center gap-1">
            <Euro className="h-5 w-5" />
            {amount.toFixed(2)} €
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || processing || !cardComplete} 
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {processing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CreditCard className="h-4 w-4 mr-2" />
          )}
          Pay {amount.toFixed(2)} €
        </Button>
      </div>
    </form>
  );
}

export default function CreditCardPaymentDialog({
  open,
  onClose,
  onSuccess,
  orderId,
  orderNumber,
  materialName,
  supplierName,
  siteName,
  amount,
}: CreditCardPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  // Initialize payment when dialog opens (once)
  React.useEffect(() => {
    if (open && !clientSecret && !showStripeForm && !generatedInvoice) {
      initPayment();
    }
    // Clean up on close
    return () => {
      if (!open) {
        setShowStripeForm(false);
        setClientSecret(null);
      }
    };
  }, [open, clientSecret, showStripeForm, generatedInvoice]);

  const initPayment = async () => {
    setLoading(true);
    try {
      const result = await orderService.processPayment(orderId, "card");

      if (!result.success) {
        throw new Error(result.message || "Initialization error");
      }

      if (result.payment?.clientSecret) {
        setClientSecret(result.payment.clientSecret);
        setShowStripeForm(true);
      } else {
        throw new Error("Invalid payment response");
      }
    } catch (error: any) {
      console.error("Init payment error:", error);
      toast.error(error.message || "Error initializing payment");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowStripeForm(false);
    setClientSecret(null);
    // Don't call onSuccess here - we call it AFTER generating the invoice
    // But we've already generated the invoice in CardPaymentFormInner
    onSuccess();
  };

  const handleCancel = () => {
    setShowStripeForm(false);
    setClientSecret(null);
    setGeneratedInvoice(null);
    onClose();
  };

  const handleInvoiceGenerated = (invoice: any) => {
    setGeneratedInvoice(invoice);
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

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        // Only call handleCancel if closing the dialog
        // and no invoice has been generated yet
        if (!isOpen && !generatedInvoice) {
          handleCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Credit Card Payment
          </DialogTitle>
          <DialogDescription>
            Please enter your credit card information to complete the payment.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Summary */}
          <Card className="bg-gray-50 border-gray-200 mb-4">
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
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
              </div>
            </CardContent>
          </Card>

          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-gray-500">Initializing payment...</p>
            </div>
          )}

          {showStripeForm && clientSecret && !loading && (
            <Elements stripe={stripePromise}>
              <CardPaymentFormInner
                amount={amount}
                orderId={orderId}
                siteName={siteName}
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
                onInvoiceGenerated={handleInvoiceGenerated}
              />
            </Elements>
          )}

          {generatedInvoice && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Payment successful!</p>
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
        </div>

        <DialogFooter>
          {!generatedInvoice && !loading && !showStripeForm && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          {generatedInvoice && (
            <Button onClick={handlePaymentSuccess} className="bg-green-600 hover:bg-green-700">
              Finish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}