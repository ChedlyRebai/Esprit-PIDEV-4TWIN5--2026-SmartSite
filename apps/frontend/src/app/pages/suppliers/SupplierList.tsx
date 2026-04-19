import {
  Warehouse,
  Edit,
  Eye,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";
import { toast } from "sonner";
import {
  getAllSuppliers,
  deleteSupplier,
  getSupplierCategories,
  getSupplierCities,
  Supplier,
} from "@/app/action/supplier.action";

export default function SupplierList() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || { name: "super_admin" as const };
  const canManageSuppliers = user && canEdit(userRole.name, "suppliers");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    loadSuppliers();
    loadFilters();
  }, [pagination.page, filterCategory, filterCity]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadSuppliers();
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await getAllSuppliers({
        search: searchQuery,
        category: filterCategory,
        city: filterCity,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (res.status === 200) {
        setSuppliers(res.data);
        setPagination((prev) => ({ ...prev, total: res.total || 0 }));
      }
    } catch (error) {
      console.error("Error loading suppliers:", error);
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    const [catRes, cityRes] = await Promise.all([
      getSupplierCategories(),
      getSupplierCities(),
    ]);
    if (catRes.status === 200) setCategories(catRes.data);
    if (cityRes.status === 200) setCities(cityRes.data);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteSupplier(id);
    if (res.status === 200) {
      toast.success("Supplier deleted successfully");
      loadSuppliers();
    } else {
      toast.error("Failed to delete supplier");
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 mt-1">
            Manage supplier relationships and orders
          </p>
        </div>
        {canManageSuppliers && (
          <Button
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            onClick={() => navigate("/suppliers/add")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Supplier List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search suppliers..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No suppliers found
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {suppliers.map((supplier) => (
                    <div
                      key={supplier._id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {supplier.name}
                            </h3>
                            <span className="text-sm text-gray-500">
                              ({supplier.supplierCode})
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            <p>
                              {supplier.address}
                              {supplier.city && `, ${supplier.city}`}
                              {supplier.country && `, ${supplier.country}`}
                            </p>
                            <p className="mt-1">
                              {supplier.contactName && `${supplier.contactName} • `}
                              {supplier.email} • {supplier.phone}
                            </p>
                            {supplier.averageDeliveryDays && (
                              <p className="text-sm text-gray-500">
                                Avg. Delivery: {supplier.averageDeliveryDays} days
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/suppliers/${supplier._id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/suppliers/${supplier._id}/materials`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Materials
                          </Button>
                          {canManageSuppliers && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  navigate(`/suppliers/edit/${supplier._id}`)
                                }
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Supplier
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete{" "}
                                      {supplier.name}? This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDelete(supplier._id || "")
                                      }
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                    of {pagination.total} suppliers
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={pagination.page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}