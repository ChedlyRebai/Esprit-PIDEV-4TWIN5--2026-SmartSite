"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Truck,
  Mail,
  Phone,
  MapPin,
  Award,
  Calendar,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { toast } from "react-hot-toast";

import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  reactivateSupplier,
  type Supplier,
} from "@/app/action/supplier.action";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^[0-9]{6}$/, "Code must be 6 digits"),
  email: z.string().email("Invalid email format").max(100),
  phone: z.string().min(1, "Phone is required").max(20),
  address: z.string().min(1, "Address is required").max(200),
});

type FormValues = z.infer<typeof formSchema>;

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    form.reset({
      name: "",
      code: "",
      email: "",
      phone: "",
      address: "",
    });
    setOpenModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      code: supplier.code,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
    });
    setOpenModal(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      if (editingSupplier) {
        await updateSupplier(editingSupplier._id, values);
        toast.success("Supplier updated successfully");
      } else {
        await createSupplier(values);
        toast.success("Supplier created successfully");
      }
      setOpenModal(false);
      await loadSuppliers();
    } catch (error: any) {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Operation failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    try {
      await deleteSupplier(supplier._id);
      toast.success("Supplier deactivated");
      setDeleteConfirm(null);
      await loadSuppliers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to deactivate supplier");
    }
  };

  const handleReactivate = async (supplier: Supplier) => {
    try {
      await reactivateSupplier(supplier._id);
      toast.success("Supplier reactivated");
      await loadSuppliers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reactivate supplier");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 mt-1">
            Manage your suppliers and vendor information
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  Quality
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Avg Days
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading suppliers...
                </TableCell>
              </TableRow>
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No suppliers found. Add your first supplier!
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier._id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {supplier.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {supplier.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {supplier.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-xs">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        supplier.quality_score >= 8
                          ? "default"
                          : supplier.quality_score >= 6
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {supplier.quality_score.toFixed(1)}/10
                    </Badge>
                  </TableCell>
                  <TableCell>{supplier.avg_delivery_days} days</TableCell>
                  <TableCell>
                    <Badge
                      variant={supplier.is_active ? "default" : "secondary"}
                    >
                      {supplier.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {supplier.is_active ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteConfirm(supplier)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReactivate(supplier)}
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Supplier name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code (6 digits) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456"
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="supplier@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="+216 12 345 678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Full address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingSupplier
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate Supplier</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to deactivate{" "}
              <strong>{deleteConfirm?.name}</strong>? This action can be undone later.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
