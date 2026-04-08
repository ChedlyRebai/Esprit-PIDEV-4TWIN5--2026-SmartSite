import { Package, Users, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { getAllSuppliers, Supplier } from "@/app/action/supplier.action";
import { getMaterialsBySupplier, SupplierMaterial } from "@/app/action/supplier-material.action";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";

export default function SupplierMaterialListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || { name: "super_admin" as const };
  const canManage = user && canEdit(userRole.name, "materials");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [materials, setMaterials] = useState<SupplierMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const res = await getAllSuppliers({ limit: 100 });
    if (res.status === 200) setSuppliers(res.data);
  };

  const loadMaterials = async (supplierId: string) => {
    setLoading(true);
    const res = await getMaterialsBySupplier(supplierId);
    if (res.status === 200) setMaterials(res.data);
    setLoading(false);
  };

  const handleSupplierChange = (id: string) => {
    setSelectedSupplier(id);
    if (id) loadMaterials(id);
    else setMaterials([]);
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "limited": return "bg-yellow-100 text-yellow-800";
      case "unavailable": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredMaterials = search
    ? materials.filter(m => m.catalogItemId?.name?.toLowerCase().includes(search.toLowerCase()))
    : materials;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Material List</h1>
          <p className="text-gray-500 mt-1">View all materials provided by a given supplier</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />Select Supplier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={selectedSupplier} onValueChange={handleSupplierChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s._id} value={s._id!}>
                    {s.name} ({s.supplierCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSupplier && (
              <Button variant="outline" onClick={() => navigate(`/suppliers/${selectedSupplier}`)}>
                View Supplier Profile
              </Button>
            )}
          </div>

          {selectedSupplier && (
            <>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search materials..."
                      className="pl-10"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No materials found for this supplier
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Material</th>
                        <th className="text-left py-3 px-4 font-medium">Category</th>
                        <th className="text-left py-3 px-4 font-medium">Price</th>
                        <th className="text-left py-3 px-4 font-medium">Delivery</th>
                        <th className="text-left py-3 px-4 font-medium">Availability</th>
                        <th className="text-left py-3 px-4 font-medium">Preferred</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMaterials.map((item) => (
                        <tr key={item._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-medium">{item.catalogItemId?.name}</span>
                              <span className="text-gray-500 text-sm ml-2">({item.catalogItemId?.code})</span>
                              {item.supplierRef && (
                                <span className="text-gray-400 text-sm ml-2">- Ref: {item.supplierRef}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{item.catalogItemId?.category}</td>
                          <td className="py-3 px-4 font-medium">{item.unitPrice} {item.currency}</td>
                          <td className="py-3 px-4 text-gray-600">{item.deliveryDays ? `${item.deliveryDays} days` : "-"}</td>
                          <td className="py-3 px-4">
                            <Badge className={getAvailabilityColor(item.availability)}>
                              {item.availability}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {item.isPreferred ? (
                              <Badge className="bg-blue-100 text-blue-800">Yes</Badge>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/supplier-materials/${item._id}`)}
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}