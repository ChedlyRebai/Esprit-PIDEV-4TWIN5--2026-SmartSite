import { Package, ArrowLeft, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";
import { getCatalogItemById, CatalogItem } from "@/app/action/catalog.action";

export default function CatalogDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || { name: "super_admin" as const };
  const canManageCatalog = user && canEdit(userRole.name, "materials");

  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (id) {
        const res = await getCatalogItemById(id);
        if (res.status === 200) {
          setItem(res.data);
        } else {
          navigate("/catalog");
        }
      }
    } catch (error) {
      console.error("Error loading material:", error);
      navigate("/catalog");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!item) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/catalog")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Material Details</h1>
            <p className="text-gray-500 mt-1">
              View material information
            </p>
          </div>
        </div>
        {canManageCatalog && (
          <Button onClick={() => navigate(`/catalog/edit/${id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Code</p>
                <p className="text-lg font-semibold">{item.code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg font-semibold">{item.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="text-lg">{item.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Unit</p>
                <p className="text-lg">{item.unit}</p>
              </div>
            </div>

            {item.technicalSpec && (
              <div>
                <p className="text-sm font-medium text-gray-500">Technical Specification</p>
                <p className="text-lg">{item.technicalSpec}</p>
              </div>
            )}

            {item.description && (
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-gray-700">{item.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={
                  item.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {item.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-sm">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-sm">
                  {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}