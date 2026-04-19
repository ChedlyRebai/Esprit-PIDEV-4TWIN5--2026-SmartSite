import { Package, ArrowLeft, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { getMaterialsBySupplier, SupplierMaterial } from "@/app/action/supplier-material.action";
import { getSupplierById, Supplier } from "@/app/action/supplier.action";

export default function SupplierMaterialList() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [materials, setMaterials] = useState<SupplierMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [supRes, matRes] = await Promise.all([
      getSupplierById(id!),
      getMaterialsBySupplier(id!),
    ]);
    if (supRes.status === 200) setSupplier(supRes.data);
    if (matRes.status === 200) setMaterials(matRes.data);
    setLoading(false);
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "limited": return "bg-yellow-100 text-yellow-800";
      case "unavailable": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materials from Supplier</h1>
          {supplier && (
            <p className="text-gray-500">{supplier.name} ({supplier.supplierCode})</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />Materials List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No materials found for this supplier
            </div>
          ) : (
            <div className="space-y-3">
              {materials.map((item) => (
                <div key={item._id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.catalogItemId?.name}</h3>
                        <span className="text-sm text-gray-500">
                          ({item.catalogItemId?.code})
                        </span>
                        {item.isPreferred && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Star className="h-3 w-3 mr-1" />Preferred
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="font-medium">
                          {item.unitPrice} {item.currency}
                        </span>
                        <span className="text-gray-500">
                          {item.deliveryDays ? `${item.deliveryDays} days delivery` : "Delivery: N/A"}
                        </span>
                        <Badge className={getAvailabilityColor(item.availability)}>
                          {item.availability}
                        </Badge>
                        {item.qualityScore !== undefined && (
                          <span className="text-gray-500">
                            Quality: {item.qualityScore}/10
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {item.catalogItemId?.category} • {item.catalogItemId?.unit}
                        {item.supplierRef && ` • Ref: ${item.supplierRef}`}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/catalog/${item.catalogItemId?._id}`)}
                    >
                      View Material
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}