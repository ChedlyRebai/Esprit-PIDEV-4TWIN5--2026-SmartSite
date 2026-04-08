import { Package, ArrowLeft, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
import { createCatalogItem, CatalogItem } from "@/app/action/catalog.action";

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

const UNITS = [
  "kg",
  "tonne",
  "m³",
  "m²",
  "ml",
  "unité",
  "sac",
  "barre",
  "rouleau",
  "boîte",
  "paire",
  "litre",
];

export default function AddCatalogItem() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || { name: "super_admin" as const };
  const canManageCatalog = user && canEdit(userRole.name, "materials");

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    unit: "",
    technicalSpec: "",
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (!canManageCatalog) {
      toast.error("You don't have permission to add materials");
      navigate("/catalog");
      return;
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.category || !formData.unit) {
      toast.error("Code, name, category, and unit are required");
      return;
    }

    setLoading(true);
    try {
      const res = await createCatalogItem(formData);
      if (res.status === 201 || res.status === 200) {
        toast.success("Material created successfully");
        navigate("/catalog");
      } else {
        toast.error("Failed to create material");
      }
    } catch (error) {
      console.error("Error creating material:", error);
      toast.error("Failed to create material");
    } finally {
      setLoading(false);
    }
  };

  if (!canManageCatalog) {
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
            <h1 className="text-3xl font-bold text-gray-900">Add Material</h1>
            <p className="text-gray-500 mt-1">
              Add a new material to your catalog
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Material Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Material Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="e.g., CEM-001"
                    value={formData.code}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Material Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Ciment Portland 50kg"
                    value={formData.name}
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
                    {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measure *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, unit: value })
                    }
                  >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="technicalSpec">Technical Specification</Label>
                <Input
                  id="technicalSpec"
                  name="technicalSpec"
                  placeholder="e.g., CPJ 42.5 - Classe A"
                  value={formData.technicalSpec}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={3}
                  placeholder="Additional description..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-green-600"
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Material"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}