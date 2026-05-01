import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { Star, ThumbsUp, ThumbsDown, AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';

interface SupplierRatingDialogProps {
  open: boolean;
  onClose: () => void;
  onIgnore?: () => void; // New prop to explicitly ignore
  materialId: string;
  materialName: string;
  supplierId: string;
  supplierName: string;
  siteId: string;
  consumptionPercentage: number;
  userId: string;
  userName: string;
}

export default function SupplierRatingDialog({
  open,
  onClose,
  onIgnore,
  materialId,
  materialName,
  supplierId,
  supplierName,
  siteId,
  consumptionPercentage,
  userId,
  userName,
}: SupplierRatingDialogProps) {
  const [rating, setRating] = useState<'POSITIVE' | 'NEGATIVE' | null>(null);
  const [score, setScore] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [hasComplaint, setHasComplaint] = useState(false);
  const [complaintReason, setComplaintReason] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const complaintReasons = [
    'Insufficient quality',
    'Late delivery',
    'Incorrect quantity',
    'Damaged product',
    'Non-compliance',
    'Poor customer service',
    'Other',
  ];

  const handleSubmit = async () => {
    // Validation
    if (!rating) {
      toast.error('Please provide your feedback (Positive or Negative)');
      return;
    }

    if (score === 0) {
      toast.error('Please provide a rating (1-5 stars)');
      return;
    }

    if (hasComplaint && !complaintReason) {
      toast.error('Please select a complaint reason');
      return;
    }

    if (hasComplaint && !complaintDescription.trim()) {
      toast.error('Please describe your complaint');
      return;
    }

    setLoading(true);

    try {
      const ratingData = {
        materialId,
        supplierId,
        siteId,
        userId,
        userName,
        avis: rating,
        note: score,
        commentaire: comment.trim() || undefined,
        hasReclamation: hasComplaint,
        reclamationMotif: hasComplaint ? complaintReason : undefined,
        reclamationDescription: hasComplaint ? complaintDescription.trim() : undefined,
        consumptionPercentage,
      };

      await axios.post('/api/supplier-ratings', ratingData);

      toast.success(
        hasComplaint
          ? 'Feedback recorded and complaint sent!'
          : 'Thank you for your feedback!'
      );

      // Close dialog on success
      onClose();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.message || 'Error submitting feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setScore(star)}
            className={`transition-all ${
              star <= score ? 'text-yellow-500 scale-110' : 'text-gray-300'
            }`}
          >
            <Star
              className="h-8 w-8"
              fill={star <= score ? 'currentColor' : 'none'}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            🎯 Rate the Supplier (Optional)
          </DialogTitle>
          <DialogDescription>
            You have consumed <strong>{consumptionPercentage}%</strong> of{' '}
            <strong>{materialName}</strong>. Would you like to rate the supplier{' '}
            <strong>{supplierName}</strong>? This rating is completely optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informational note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Information:</strong> This rating is completely optional. 
              It helps us improve our supplier quality. 
              You can ignore this request if you wish.
            </p>
          </div>

          {/* Positive/Negative Rating */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Your overall feedback *
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRating('POSITIVE')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  rating === 'POSITIVE'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <ThumbsUp
                  className={`h-8 w-8 mx-auto mb-2 ${
                    rating === 'POSITIVE' ? 'text-green-600' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`font-semibold ${
                    rating === 'POSITIVE' ? 'text-green-700' : 'text-gray-600'
                  }`}
                >
                  Positive
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRating('NEGATIVE')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  rating === 'NEGATIVE'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <ThumbsDown
                  className={`h-8 w-8 mx-auto mb-2 ${
                    rating === 'NEGATIVE' ? 'text-red-600' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`font-semibold ${
                    rating === 'NEGATIVE' ? 'text-red-700' : 'text-gray-600'
                  }`}
                >
                  Negative
                </span>
              </button>
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Rating (1-5 stars) *
            </Label>
            {renderStars()}
            {score > 0 && (
              <p className="text-center text-sm text-gray-600">
                {score === 1 && 'Very poor'}
                {score === 2 && 'Poor'}
                {score === 3 && 'Average'}
                {score === 4 && 'Good'}
                {score === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this supplier..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Complaint */}
          <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasComplaint"
                checked={hasComplaint}
                onChange={(e) => setHasComplaint(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="hasComplaint" className="cursor-pointer font-semibold">
                <AlertTriangle className="h-4 w-4 inline mr-1 text-orange-600" />
                I want to file a complaint
              </Label>
            </div>

            {hasComplaint && (
              <div className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="complaintReason">Complaint reason *</Label>
                  <select
                    id="complaintReason"
                    className="w-full px-3 py-2 border rounded-md"
                    value={complaintReason}
                    onChange={(e) => setComplaintReason(e.target.value)}
                  >
                    <option value="">Select a reason...</option>
                    {complaintReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complaintDescription">
                    Complaint description *
                  </Label>
                  <Textarea
                    id="complaintDescription"
                    placeholder="Describe the problem in detail..."
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <p className="text-xs text-orange-700">
                  ⚠️ Your complaint will be forwarded to the quality department and
                  the supplier for processing.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => {
              onIgnore?.();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            Ignore (optional)
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !rating || score === 0}
            className={
              rating === 'POSITIVE'
                ? 'bg-green-600 hover:bg-green-700'
                : rating === 'NEGATIVE'
                ? 'bg-red-600 hover:bg-red-700'
                : ''
            }
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>Submit Feedback</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}