import { useState, useEffect } from "react";
import { BarChart3, Star, TrendingUp, Package, Award, DollarSign, Clock, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  getAllCatalogItems,
  CatalogItem,
} from "../../action/catalog.action";
import {
  getComparisonByCatalogItem,
  SupplierMaterial,
} from "../../action/supplier-material.action";

function ScoreBar({ label, score, maxScore = 10 }: { label: string; score: number; maxScore?: number }) {
  const percentage = (score / maxScore) * 100;
  const color = percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500";
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{score.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function SupplierComparisonPage() {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"overallScore" | "price" | "delivery">("overallScore");

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
      const res = await getComparisonByCatalogItem(item._id);
      if (res.status === 200) {
        setSuppliers(res.data);
      }
    } catch (error) {
      console.error("Error loading comparison:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedSuppliers = [...suppliers].sort((a, b) => {
    if (sortBy === "overallScore") return (b.overallScore || 0) - (a.overallScore || 0);
    if (sortBy === "price") return a.unitPrice - b.unitPrice;
    if (sortBy === "delivery") return (a.deliveryDays || 0) - (b.deliveryDays || 0);
    return 0;
  });

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    if (score >= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Supplier Comparison</h1>
        <p className="text-gray-500 mt-1">
          Compare suppliers for a specific material
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {catalogItems.map((item) => (
          <button
            key={item._id}
            onClick={() => handleSelectCatalogItem(item)}
            className={`px-4 py-2 border rounded-lg transition-all ${
              selectedCatalogItem?._id === item._id
                ? "bg-primary text-white border-primary"
                : "hover:border-gray-400"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {selectedCatalogItem && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Comparing: {selectedCatalogItem.name}
            </h2>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "overallScore" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("overallScore")}
              >
                <Star className="w-4 h-4 mr-1" />
                Score
              </Button>
              <Button
                variant={sortBy === "price" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("price")}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Price
              </Button>
              <Button
                variant={sortBy === "delivery" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("delivery")}
              >
                <Clock className="w-4 h-4 mr-1" />
                Delivery
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading comparison data...</div>
          ) : suppliers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No supplier data available for this material yet.
                <br />
                Add supplier offers first.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedSuppliers.map((sm, idx) => {
                const supplierName = typeof sm.supplierId === "object" 
                  ? sm.supplierId.name 
                  : `Supplier ${idx + 1}`;
                const supplierCode = typeof sm.supplierId === "object" 
                  ? sm.supplierId.supplierCode 
                  : "";

                return (
                  <Card 
                    key={sm._id} 
                    className={sm.recommended ? "border-green-500 border-2" : ""}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {supplierName}
                            {sm.recommended && (
                              <Award className="w-5 h-5 text-green-500" />
                            )}
                          </CardTitle>
                          <p className="text-sm text-gray-500">{supplierCode}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getScoreColor(sm.overallScore || 0)}>
                            {(sm.overallScore || 0).toFixed(1)}/10
                          </Badge>
                          {sm.recommended && (
                            <p className="text-xs text-green-600 mt-1">Recommended</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <DollarSign className="w-4 h-4 mx-auto text-gray-400" />
                          <p className="text-xs text-gray-500">Price</p>
                          <p className="font-semibold">
                            {sm.unitPrice} {sm.currency}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <Clock className="w-4 h-4 mx-auto text-gray-400" />
                          <p className="text-xs text-gray-500">Delivery</p>
                          <p className="font-semibold">{sm.deliveryDays} days</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <ScoreBar label="Quality" score={sm.qualityScore || 0} />
                        <ScoreBar label="Delivery" score={sm.deliveryScore || 0} />
                        <ScoreBar label="Communication" score={sm.communicationScore || 0} />
                        <ScoreBar label="Price Score" score={sm.priceScore || 0} />
                        <ScoreBar label="Reliability" score={sm.reliabilityScore || 0} />
                      </div>

                      <div className="mt-4 pt-3 border-t flex justify-between items-center text-sm">
                        <span className="text-gray-500">Availability:</span>
                        <Badge variant={sm.availability === "available" ? "default" : "secondary"}>
                          {sm.availability}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {suppliers.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Comparison Matrix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Supplier</th>
                        <th className="text-center p-2">Price</th>
                        <th className="text-center p-2">Delivery</th>
                        <th className="text-center p-2">Quality</th>
                        <th className="text-center p-2">Delivery Score</th>
                        <th className="text-center p-2">Communication</th>
                        <th className="text-center p-2">Price Score</th>
                        <th className="text-center p-2">Reliability</th>
                        <th className="text-center p-2">Overall</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSuppliers.map((sm) => (
                        <tr 
                          key={sm._id} 
                          className={`border-b ${sm.recommended ? "bg-green-50" : ""}`}
                        >
                          <td className="p-2 font-medium">
                            {typeof sm.supplierId === "object" ? sm.supplierId.name : ""}
                            {sm.recommended && <Award className="w-4 h-4 inline ml-1 text-green-500" />}
                          </td>
                          <td className="p-2 text-center">{sm.unitPrice} {sm.currency}</td>
                          <td className="p-2 text-center">{sm.deliveryDays} days</td>
                          <td className="p-2 text-center">{(sm.qualityScore || 0).toFixed(1)}</td>
                          <td className="p-2 text-center">{(sm.deliveryScore || 0).toFixed(1)}</td>
                          <td className="p-2 text-center">{(sm.communicationScore || 0).toFixed(1)}</td>
                          <td className="p-2 text-center">{(sm.priceScore || 0).toFixed(1)}</td>
                          <td className="p-2 text-center">{(sm.reliabilityScore || 0).toFixed(1)}</td>
                          <td className="p-2 text-center">
                            <Badge className={getScoreColor(sm.overallScore || 0)}>
                              {(sm.overallScore || 0).toFixed(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedCatalogItem && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Select a material above to compare suppliers
          </CardContent>
        </Card>
      )}
    </div>
  );
}
