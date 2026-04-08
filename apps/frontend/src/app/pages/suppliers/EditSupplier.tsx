import { Warehouse, ArrowLeft, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";
import { toast } from "sonner";
import { updateSupplier, getSupplierById, getSupplierCategories, Supplier } from "@/app/action/supplier.action";

export default function EditSupplier() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || { name: "super_admin" as const };
  const canManageSuppliers = user && canEdit(userRole.name, "suppliers");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    supplierCode: "",
    category: "",
    specialty: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "",
    paymentTerms: "",
    averageDeliveryDays: "",
    notes: "",
  });

  useEffect(() => {
    if (!canManageSuppliers) {
      toast.error("You don't have permission to edit suppliers");
      navigate("/suppliers");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setFetching(true);
    try {
      const [catRes, supplierRes] = await Promise.all([
        getSupplierCategories(),
        id ? getSupplierById(id) : Promise.resolve({ status: 404, data: {} as Supplier }),
      ]);

      if (catRes.status === 200) setCategories(catRes.data);
      
      if (supplierRes.status === 200) {
        const s = supplierRes.data;
        setFormData({
          name: s.name || "",
          supplierCode: s.supplierCode || "",
          category: s.category || "",
          specialty: s.specialty || "",
          contactName: s.contactName || "",
          phone: s.phone || "",
          email: s.email || "",
          address: s.address || "",
          city: s.city || "",
          country: s.country || "",
          paymentTerms: s.paymentTerms || "",
          averageDeliveryDays: s.averageDeliveryDays?.toString() || "",
          notes: s.notes || "",
        });
      } else {
        toast.error("Supplier not found");
        navigate("/suppliers");
      }
    } catch (error) {
      console.error("Error loading supplier:", error);
      toast.error("Failed to load supplier");
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.supplierCode || !formData.category) {
      toast.error("Name, code, and category are required");
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        averageDeliveryDays: formData.averageDeliveryDays ? parseInt(formData.averageDeliveryDays) : undefined,
      };

      const res = await updateSupplier(id!, data);
      if (res.status === 200) {
        toast.success("Supplier updated successfully");
        navigate("/suppliers");
      } else {
        toast.error(res.data || "Failed to update supplier");
      }
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast.error("Failed to update supplier");
    } finally {
      setLoading(false);
    }
  };

  if (!canManageSuppliers) {
    return null;
  }

  if (fetching) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/suppliers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Supplier</h1>
            <p className="text-gray-500 mt-1">
              Update supplier information
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Supplier Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., ABC Construction Suppliers"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierCode">Supplier Code *</Label>
                  <Input
                    id="supplierCode"
                    name="supplierCode"
                    placeholder="e.g., SUP-001"
                    value={formData.supplierCode}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value="Construction Materials">
                        Construction Materials
                      </SelectItem>
                      <SelectItem value="Electrical Equipment">
                        Electrical Equipment
                      </SelectItem>
                      <SelectItem value="Equipment Rental">
                        Equipment Rental
                      </SelectItem>
                      <SelectItem value="Plumbing">Plumbing</SelectItem>
                      <SelectItem value="HVAC">HVAC</SelectItem>
                      <SelectItem value="Safety Equipment">
                        Safety Equipment
                      </SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input
                    id="specialty"
                    name="specialty"
                    placeholder="e.g., Cement, Steel, Lumber"
                    value={formData.specialty}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Street address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="e.g., Tunis"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="e.g., Tunisia"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    name="paymentTerms"
                    placeholder="e.g., Net 30"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    placeholder="Primary contact person"
                    value={formData.contactName}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+216 12 345 678"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contact@supplier.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="averageDeliveryDays">Average Delivery Days</Label>
                  <Input
                    id="averageDeliveryDays"
                    name="averageDeliveryDays"
                    type="number"
                    placeholder="e.g., 7"
                    value={formData.averageDeliveryDays}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    rows={3}
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-green-600"
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}