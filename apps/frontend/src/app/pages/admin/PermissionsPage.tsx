import { useMemo } from "react";
import { Link } from "react-router";
import { Lock, Shield, SlidersHorizontal, Users } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { getAllPermissions } from "@/app/action/permission.action";
import { deletePermission } from "@/app/action/permission.action";
import { getAllRoles } from "@/app/action/role.action";
import { PermissionsDataTable } from "@/app/pages/users/_components/permissions-data-table";
import AddPermissionModal from "@/app/components/shared/Modals/AddPermissionModal";
import type { Permission, Role } from "@/app/types";

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data;
  }

  return [];
}

export default function PermissionsPage() {
  const queryClient = useQueryClient();

  const { data: permissionsResponse, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => getAllPermissions(),
  });

  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => getAllRoles(),
  });

  const permissions = useMemo(() => toArray<Permission>(permissionsResponse), [permissionsResponse]);
  const roles = useMemo(() => toArray<Role>(rolesResponse), [rolesResponse]);

  const moduleCount = useMemo(() => {
    return new Set(permissions.map((permission) => permission.module || "General")).size;
  }, [permissions]);

  const roleUsage = useMemo(() => {
    return roles.reduce((count, role) => {
      const rolePermissions = Array.isArray(role.permissions) ? role.permissions.length : 0;
      return count + rolePermissions;
    }, 0);
  }, [roles]);

  const handleDeletePermission = async (permissionId: string) => {
    const response = await deletePermission(permissionId);
    if (response?.status === 200) {
      toast.success("Permission deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    } else {
      toast.error(response?.data || "Failed to delete permission");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          {/* <Badge variant="secondary" className="w-fit gap-2 rounded-full px-3 py-1">
            <Lock className="h-4 w-4" />
            Access Rules
          </Badge> */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Define route and feature permissions, then assign them to roles to keep the admin surface controlled.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/users/roles">
              <Shield className="mr-2 h-4 w-4" />
              Open Roles
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{permissionsLoading ? "--" : permissions.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Rules currently defined in the catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules</CardTitle>
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{permissionsLoading ? "--" : moduleCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Distinct modules grouped by permission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{rolesLoading ? "--" : roleUsage}</div>
            <p className="mt-1 text-xs text-muted-foreground">Permission links referenced by roles</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionsDataTable
            permissions={permissions}
            onDelete={handleDeletePermission}
          />
        </CardContent>
      </Card>

      <AddPermissionModal />
    </div>
  );
}