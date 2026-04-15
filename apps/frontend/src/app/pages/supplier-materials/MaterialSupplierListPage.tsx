import { Users, Package, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { getAllCatalogItems, CatalogItem } from "@/app/action/catalog.action";
import { getSuppliersByCatalogItem, SupplierMaterial } from "@/app/action/supplier-material.action";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";
import { useTranslation } from "@/app/hooks/useTranslation";

export default function MaterialSupplierListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || { name: "super_admin" as const };
  const canManage = user && canEdit(userRole.name, "materials");
  const { t } = useTranslation();

  const [materials, setMaterials] = useState<CatalogItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [suppliers, setSuppliers] = useState<SupplierMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    const res = await getAllCatalogItems({ limit: 100 });
    if (res.status === 200) setMaterials(res.data);
  };

  const loadSuppliers = async (materialId: string) => {
    setLoading(true);
    const res = await getSuppliersByCatalogItem(materialId);
    if (res.status === 200) setSuppliers(res.data);
    setLoading(false);
  };

  const handleMaterialChange = (id: string) => {
    setSelectedMaterial(id);
    if (id) loadSuppliers(id);
    else setSuppliers([]);
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "limited": return "bg-yellow-100 text-yellow-800";
      case "unavailable": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredSuppliers = search
    ? suppliers.filter(s => s.supplierId?.name?.toLowerCase().includes(search.toLowerCase()))
    : suppliers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t(
              "supplierMaterials.materialSupplierListTitle",
              "Material Supplier List",
            )}
          </h1>
          <p className="text-gray-500 mt-1">
            {t(
              "supplierMaterials.materialSupplierListSubtitle",
              "View all suppliers for a given material",
            )}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("supplierMaterials.selectMaterial", "Select Material")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={selectedMaterial} onValueChange={handleMaterialChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue
                  placeholder={t(
                    "supplierMaterials.selectMaterialPlaceholder",
                    "Select a material...",
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {materials.map(m => (
                  <SelectItem key={m._id} value={m._id!}>
                    {m.name} ({m.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMaterial && (
              <Button variant="outline" onClick={() => navigate(`/catalog/${selectedMaterial}`)}>
                {t(
                  "supplierMaterials.viewMaterialDetails",
                  "View Material Details",
                )}
              </Button>
            )}
          </div>

          {selectedMaterial && (
            <>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t(
                        "supplierMaterials.searchSuppliersPlaceholder",
                        "Search suppliers...",
                      )}
                      className="pl-10"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  {t("supplierMaterials.loading", "Loading...")}
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t(
                    "supplierMaterials.noSuppliersFound",
                    "No suppliers found for this material",
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSuppliers.map((item) => (
                    <div key={item._id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{item.supplierId?.name}</h3>
                            <span className="text-sm text-gray-500">
                              ({item.supplierId?.supplierCode})
                            </span>
                            {item.isPreferred && (
                              <Badge className="bg-blue-100 text-blue-800">
                                {t("supplierMaterials.preferred", "Preferred")}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="font-medium">
                              {item.unitPrice} {item.currency}
                            </span>
                            <span className="text-gray-500">
                              {item.deliveryDays
                                ? `${item.deliveryDays} ${t(
                                    "supplierMaterials.days",
                                    "days",
                                  )}`
                                : "-"}
                            </span>
                            <Badge className={getAvailabilityColor(item.availability)}>
                              {item.availability}
                            </Badge>
                            {item.qualityScore !== undefined && (
                              <span className="text-gray-500">
                                {t("supplierMaterials.quality", "Quality")}:{" "}
                                {item.qualityScore}/10
                              </span>
                            )}
                          </div>
                          {item.supplierRef && (
                            <p className="text-sm text-gray-400 mt-1">
                              {t("supplierMaterials.ref", "Ref")}:{" "}
                              {item.supplierRef}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/supplier-materials/${item._id}`)}
                          >
                            {t("supplierMaterials.viewDetails", "View Details")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/suppliers/${item.supplierId?._id}`)}
                          >
                            {t(
                              "supplierMaterials.supplierProfile",
                              "Supplier Profile",
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}