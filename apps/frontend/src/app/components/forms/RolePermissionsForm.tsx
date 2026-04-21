import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Permission } from "@/app/types";
import { getAllPermissions } from "@/app/action/permission.action";
import { getRoleById, updateRole } from "@/app/action/role.action";
import useRolePermissionsModal from "@/app/hooks/use-role-permissions-modal";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const RolePermissionsForm = () => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { roleId, onClose, onPermissionsChange, isOpen } =
    useRolePermissionsModal();

  const queryClient = useQueryClient();

  const { data: permissionsRes, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: getAllPermissions,
    enabled: isOpen,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: roleRes, isLoading: roleLoading } = useQuery({
    queryKey: ["role", roleId],
    queryFn: () => getRoleById(roleId!),
    enabled: !!roleId && isOpen,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const availablePermissions: Permission[] = Array.isArray(permissionsRes?.data)
    ? permissionsRes.data
    : Array.isArray(permissionsRes)
      ? permissionsRes
      : [];

  const isLoading = permissionsLoading || roleLoading;

  useEffect(() => {
    if (roleRes?.status === 200) {
      const permissionIds = Array.isArray(roleRes.data.permissions)
        ? roleRes.data.permissions.map((p: any) =>
            typeof p === "string" ? p : p._id,
          )
        : [];

      setSelectedPermissions(permissionIds);
    }
  }, [roleRes]);

  const mutation = useMutation({
    mutationFn: () =>
      updateRole(roleId!, undefined, undefined, selectedPermissions),
    onSuccess: () => {
      toast.success("Permissions updated successfully");

      queryClient.invalidateQueries({ queryKey: ["role", roleId] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });

      onClose();
      onPermissionsChange();
    },
    onError: () => {
      toast.error("Failed to save permissions");
    },
  });

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};

    availablePermissions.forEach((permission) => {
      const category = permission.name || "Other";

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(permission);
    });

    return groups;
  }, [availablePermissions]);

  const handleSelectAllInCategory = (categoryPermissions: Permission[]) => {
    const categoryIds = categoryPermissions.map((p) => p._id);
    const allSelected = categoryIds.every((id) =>
      selectedPermissions.includes(id),
    );

    if (allSelected) {
      setSelectedPermissions((prev) =>
        prev.filter((id) => !categoryIds.includes(id)),
      );
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...categoryIds])]);
    }
  };

  const getSelectedCountInCategory = (categoryPermissions: Permission[]) => {
    return categoryPermissions.filter((p) =>
      selectedPermissions.includes(p._id),
    ).length;
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === availablePermissions.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(availablePermissions.map((p) => p._id));
    }
  };

  const handleSave = () => {
    if (!roleId) return;
    setIsSaving(true);
    mutation.mutate(undefined, {
      onSettled: () => setIsSaving(false),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-sm text-gray-500">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Field>
        <div className="flex justify-between items-center mb-2">
          <FieldLabel>Available Permissions</FieldLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedPermissions.length === availablePermissions.length
              ? "Deselect All"
              : "Select All"}
          </Button>
        </div>

        <FieldDescription>
          Selected: {selectedPermissions.length} of{" "}
          {availablePermissions.length}
        </FieldDescription>

        <div className="mt-4 max-h-96 overflow-y-auto border rounded-md">
          {availablePermissions.length === 0 ? (
            <div className="text-sm text-gray-500 p-4">
              No permissions available
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedPermissions).map(
                ([category, permissions]) => {
                  const selectedCount = getSelectedCountInCategory(permissions);
                  const allSelected = selectedCount === permissions.length;

                  return (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="px-4 hover:bg-gray-50">
                        <div className="flex justify-between w-full pr-4">
                          <span className="font-semibold text-base">
                            {category}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {selectedCount}/{permissions.length}
                          </span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-4">
                        <div className="space-y-1 pt-2">
                          <div className="flex justify-end mb-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleSelectAllInCategory(permissions)
                              }
                            >
                              {allSelected ? "Deselect All" : "Select All"}
                            </Button>
                          </div>

                          {permissions.map((permission) => (
                            <div
                              key={permission._id}
                              className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md"
                            >
                              <Checkbox
                                checked={selectedPermissions.includes(
                                  permission._id,
                                )}
                                onCheckedChange={() =>
                                  handleTogglePermission(permission._id)
                                }
                              />

                              <div className="flex-1">
                                <label className="text-sm font-medium cursor-pointer">
                                  {permission.name}
                                </label>

                                {permission.description && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                },
              )}
            </Accordion>
          )}
        </div>
      </Field>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>

        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default RolePermissionsForm;
