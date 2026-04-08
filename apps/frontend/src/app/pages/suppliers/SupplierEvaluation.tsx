import { useState, useEffect } from "react";
import { Star, Package, Save, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  getAllCatalogItems,
  CatalogItem,
} from "../../action/catalog.action";
import {
  getSuppliersByCatalogItem,
  updateSupplierMaterial,
  SupplierMaterial,
} from "../../action/supplier-material.action";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";

function RatingSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <span className="font-bold text-primary">{value}/10</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

export default function SupplierEvaluationPage() {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || { name: "super_admin" as const };
  const canManage = user && canEdit(userRole.name, "suppliers");

  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [supplierMaterials, setSupplierMaterials] = useState<SupplierMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SupplierMaterial | null>(null);
  const [scores, setScores] = useState({
    qualityScore: 5,
    deliveryScore: 5,
    communicationScore: 5,
    priceScore: 5,
    reliabilityScore: 5,
  });

  useEffect(() => {
    loadCatalogItems();
  }, []);

  const loadCatalogItems = async () => {
    setLoading(true);
    try {
      const res = await getAllCatalogItems({ limit: 100 });
      if (res.status === 200) {
        setCatalogItems(res.data);
      }
    } catch (error) {
      console.error("Error loading catalog:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCatalogItem = async (item: CatalogItem) => {
    setSelectedCatalogItem(item);
    setLoading(true);
    try {
      const res = await getSuppliersByCatalogItem(item._id);
      if (res.status === 200) {
        setSupplierMaterials(res.data);
      }
    } catch (error) {
      console.error("Error loading suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEvalDialog = (item: SupplierMaterial) => {
    setSelectedItem(item);
    setScores({
      qualityScore: item.qualityScore || 5,
      deliveryScore: item.deliveryScore || 5,
      communicationScore: item.communicationScore || 5,
      priceScore: item.priceScore || 5,
      reliabilityScore: item.reliabilityScore || 5,
    });
    setDialogOpen(true);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedItem?._id) return;

    const res = await updateSupplierMaterial(selectedItem._id, {
      qualityScore: scores.qualityScore,
      deliveryScore: scores.deliveryScore,
      communicationScore: scores.communicationScore,
      priceScore: scores.priceScore,
      reliabilityScore: scores.reliabilityScore,
    });

    if (res.status === 200) {
      toast.success("Evaluation saved!");
      setDialogOpen(false);
      if (selectedCatalogItem) {
        handleSelectCatalogItem(selectedCatalogItem);
      }
    } else {
      toast.error("Failed to save evaluation");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    if (score >= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Supplier Evaluation</h1>
        <p className="text-gray-500 mt-1">
          Evaluate supplier offers for specific materials
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Material
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {catalogItems.map((item) => (
              <button
                key={item._id}
                onClick={() => handleSelectCatalogItem(item)}
                className={`p-3 border rounded-lg text-left transition-all ${
                  selectedCatalogItem?._id === item._id
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "hover:border-gray-400"
                }`}
              >
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.code} - {item.category}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCatalogItem && (
        <Card>
          <CardHeader>
            <CardTitle>
              Supplier Offers for: {selectedCatalogItem.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : supplierMaterials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No supplier offers for this material yet.
              </div>
            ) : (
              <div className="space-y-4">
                {supplierMaterials.map((sm) => (
                  <div
                    key={sm._id}
                    className={`p-4 border rounded-lg ${
                      sm.recommended ? "border-green-500 bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {typeof sm.supplierId === "object"
                              ? sm.supplierId.name
                              : "Supplier"}
                          </h3>
                          {sm.recommended && (
                            <Badge className="bg-green-500">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Ref: {sm.supplierRef || "N/A"} |{" "}
                          {sm.unitPrice} {sm.currency}
                        </p>
                        <p className="text-sm text-gray-500">
                          Delivery: {sm.deliveryDays} days | Availability:{" "}
                          {sm.availability}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Overall Score</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getScoreColor(sm.overallScore || 0)}
                          >
                            {sm.overallScore?.toFixed(1) || "N/A"}/10
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {sm.overallScore !== undefined && (
                      <div className="mt-3 pt-3 border-t grid grid-cols-5 gap-2 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500">Quality</p>
                          <span className="font-medium">
                            {sm.qualityScore?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Delivery</p>
                          <span className="font-medium">
                            {sm.deliveryScore?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Communication</p>
                          <span className="font-medium">
                            {sm.communicationScore?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Price</p>
                          <span className="font-medium">
                            {sm.priceScore?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Reliability</p>
                          <span className="font-medium">
                            {sm.reliabilityScore?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                      </div>
                    )}

                    {canManage && (
                      <div className="mt-3 flex justify-end">
                        <Dialog
                          open={dialogOpen && selectedItem?._id === sm._id}
                          onOpenChange={setDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => handleOpenEvalDialog(sm)}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Evaluate
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>
                                Evaluate{" "}
                                {typeof sm.supplierId === "object"
                                  ? sm.supplierId.name
                                  : "Supplier"}{" "}
                                for {selectedCatalogItem.name}
                              </DialogTitle>
                              <DialogDescription>
                                Rate this supplier offer on different criteria
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <RatingSlider
                                label="Quality Score"
                                value={scores.qualityScore}
                                onChange={(v) =>
                                  setScores({ ...scores, qualityScore: v })
                                }
                              />
                              <RatingSlider
                                label="Delivery Score"
                                value={scores.deliveryScore}
                                onChange={(v) =>
                                  setScores({ ...scores, deliveryScore: v })
                                }
                              />
                              <RatingSlider
                                label="Communication Score"
                                value={scores.communicationScore}
                                onChange={(v) =>
                                  setScores({ ...scores, communicationScore: v })
                                }
                              />
                              <RatingSlider
                                label="Price Score"
                                value={scores.priceScore}
                                onChange={(v) =>
                                  setScores({ ...scores, priceScore: v })
                                }
                              />
                              <RatingSlider
                                label="Reliability Score"
                                value={scores.reliabilityScore}
                                onChange={(v) =>
                                  setScores({ ...scores, reliabilityScore: v })
                                }
                              />
                              <div className="pt-4 border-t">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">
                                    Calculated Overall Score:
                                  </span>
                                  <Badge
                                    className={getScoreColor(
                                      ((scores.qualityScore * 0.25 +
                                        scores.deliveryScore * 0.2 +
                                        scores.communicationScore * 0.15 +
                                        scores.priceScore * 0.25 +
                                        scores.reliabilityScore *
                                          0.15) /
                                        1) *
                                        10
                                    )}
                                  >
                                    {(
                                      (scores.qualityScore * 0.25 +
                                        scores.deliveryScore * 0.2 +
                                        scores.communicationScore * 0.15 +
                                        scores.priceScore * 0.25 +
                                        scores.reliabilityScore * 0.15) /
                                      1
                                    ).toFixed(1)}
                                    /10
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Weights: Quality 25%, Price 25%, Delivery 20%,
                                  Reliability 15%, Communication 15%
                                </p>
                              </div>
                              <Button
                                className="w-full"
                                onClick={handleSubmitEvaluation}
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save Evaluation
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
