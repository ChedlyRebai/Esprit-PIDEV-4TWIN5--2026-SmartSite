import {
  Package,
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
  getAllCatalogItems,
  deleteCatalogItem,
  getCatalogCategories,
  CatalogItem,
} from "@/app/action/catalog.action";

const CATEGORIES = [
  "béton / ciment",
  "acier / ferraillage",
  "granulats",
  "maçonnerie",
  "bois",
  "électricité",
  "plomberie",
  "peinture",
  "sécurité / EPI",
  "équipements",
];

export default function CatalogList() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || { name: "super_admin" as const };
  const canManageCatalog = user && canEdit(userRole.name, "materials");

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadItems();
  }, [pagination.page, filterCategory, filterStatus]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadItems();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await getAllCatalogItems({
        search: searchQuery,
        category: filterCategory,
        status: filterStatus,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (res.status === 200) {
        setItems(res.data);
        setPagination((prev) => ({ ...prev, total: res.total || 0 }));
      }
    } catch (error) {
      console.error("Error loading catalog:", error);
      toast.error("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    const res = await getCatalogCategories();
    if (res.status === 200) setCategories(res.data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (id: string) => {
    const res = await deleteCatalogItem(id);
    if (res.status === 200) {
      toast.success("Item deleted successfully");
      loadItems();
    } else {
      toast.error("Failed to delete item");
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Material Catalog</h1>
          <p className="text-gray-500 mt-1">
            Manage your construction materials catalog
          </p>
        </div>
        {canManageCatalog && (
          <Button
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            onClick={() => navigate("/catalog/add")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Catalog Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search catalog..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterCategory || "all"} onValueChange={(v) => setFilterCategory(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No catalog items found
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {item.name}
                            </h3>
                            <span className="text-sm text-gray-500">
                              ({item.code})
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.category} • {item.unit}
                          </p>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.technicalSpec && (
                            <p className="text-sm text-gray-500 mt-1">
                              Spec: {item.technicalSpec}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge
                            className={
                              item.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {item.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/catalog/${item._id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/catalog/${item._id}/suppliers`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Suppliers
                          </Button>
                          {canManageCatalog && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  navigate(`/catalog/edit/${item._id}`)
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
                                      Delete Material
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete{" "}
                                      {item.name}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDelete(item._id || "")
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
                    of {pagination.total} items
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