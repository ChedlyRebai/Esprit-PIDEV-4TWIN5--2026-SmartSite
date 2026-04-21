import { useMemo } from "react";
import { Link } from "react-router";
import { Shield, Users, Lock } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { getAllRoles } from "@/app/action/role.action";
import { deleteRole } from "@/app/action/role.action";
import { getAllPermissions } from "@/app/action/permission.action";
import { RolesDataTable } from "@/app/pages/users/_components/roles-data-table";
import AddRoleModal from "@/app/components/shared/Modals/AddRoleModal";
import RolePermissionsModal from "@/app/components/shared/Modals/RolePermissionsModal";
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

export default function RolesPage() {
  const queryClient = useQueryClient();

  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => getAllRoles(),
  });

  const { data: permissionsResponse, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => getAllPermissions(),
  });

  const roles = useMemo(() => toArray<Role>(rolesResponse), [rolesResponse]);
  const permissions = useMemo(() => toArray<Permission>(permissionsResponse), [permissionsResponse]);

  const totalPermissions = permissions.length;
  const totalAssignedPermissions = roles.reduce((count, role) => {
    const rolePermissions = Array.isArray(role.permissions) ? role.permissions.length : 0;
    return count + rolePermissions;
  }, 0);

  const handleDeleteRole = async (roleId: string) => {
    const response = await deleteRole(roleId);
    if (response?.status === 200) {
      toast.success("Role deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    } else {
      toast.error(response?.data || "Failed to delete role");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          {/* <Badge variant="secondary" className="w-fit gap-2 rounded-full px-3 py-1">
            <Shield className="h-4 w-4" />
            Access Control
          </Badge> */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Create and manage roles, then attach permissions to keep access rules consistent across the platform.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/users/permissions">
              <Lock className="mr-2 h-4 w-4" />
              Open Permissions
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{rolesLoading ? "--" : roles.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Defined role profiles in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{permissionsLoading ? "--" : totalPermissions}</div>
            <p className="mt-1 text-xs text-muted-foreground">Permissions available for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{rolesLoading ? "--" : totalAssignedPermissions}</div>
            <p className="mt-1 text-xs text-muted-foreground">Total permission links across roles</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <RolesDataTable roles={roles} onDelete={handleDeleteRole} />
        </CardContent>
      </Card>

      <AddRoleModal />
      <RolePermissionsModal />
    </div>
  );
}