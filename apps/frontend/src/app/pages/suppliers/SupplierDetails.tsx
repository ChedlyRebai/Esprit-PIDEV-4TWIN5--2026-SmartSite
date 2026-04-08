import {
  Warehouse,
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  User,
  Clock,
  CreditCard,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";
import { toast } from "sonner";
import { getSupplierById, Supplier } from "@/app/action/supplier.action";

export default function SupplierDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || { name: "super_admin" as const };
  const canManageSuppliers = user && canEdit(userRole.name, "suppliers");

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupplier();
  }, [id]);

  const loadSupplier = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getSupplierById(id);
      if (res.status === 200) {
        setSupplier(res.data);
      } else {
        toast.error("Supplier not found");
        navigate("/suppliers");
      }
    } catch (error) {
      console.error("Error loading supplier:", error);
      toast.error("Failed to load supplier");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!supplier) {
    return <div className="p-8">Supplier not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/suppliers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supplier Details</h1>
            <p className="text-gray-500 mt-1">
              View supplier information and details
            </p>
          </div>
        </div>
        {canManageSuppliers && (
          <Button
            className="bg-gradient-to-r from-blue-600 to-green-600"
            onClick={() => navigate(`/suppliers/edit/${id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                General Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Supplier Name</p>
                  <p className="font-semibold text-gray-900">{supplier.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Supplier Code</p>
                  <p className="font-semibold text-gray-900">{supplier.supplierCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-semibold text-gray-900">{supplier.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Specialty</p>
                  <p className="font-semibold text-gray-900">{supplier.specialty || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average Delivery Days</p>
                  <p className="font-semibold text-gray-900">{supplier.averageDeliveryDays ? `${supplier.averageDeliveryDays} days` : "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-semibold text-gray-900">{supplier.address || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="font-semibold text-gray-900">{supplier.city || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Country</p>
                  <p className="font-semibold text-gray-900">{supplier.country || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {supplier.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Contact Name</p>
                <p className="font-semibold text-gray-900">
                  {supplier.contactName || "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${supplier.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {supplier.email || "N/A"}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <a
                  href={`tel:${supplier.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {supplier.phone || "N/A"}
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Commercial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Delivery Time</p>
                  <p className="font-semibold text-gray-900">
                    {supplier.deliveryDays ? `${supplier.deliveryDays} days` : "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Terms</p>
                <p className="font-semibold text-gray-900">
                  {supplier.paymentTerms || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <span className="text-gray-500">Created:</span>{" "}
                <span className="font-medium">{formatDate(supplier.createdAt)}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Updated:</span>{" "}
                <span className="font-medium">{formatDate(supplier.updatedAt)}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}