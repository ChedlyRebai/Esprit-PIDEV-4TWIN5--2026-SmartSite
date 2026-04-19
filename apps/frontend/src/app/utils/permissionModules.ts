import type { Permission } from "../types";

export interface PermissionModuleGroup {
  key: string;
  label: string;
  items: Permission[];
}

const normalizeModuleKey = (moduleValue?: string, hrefValue?: string) => {
  if (moduleValue && moduleValue.trim().length > 0) {
    return moduleValue.trim().toLowerCase().replace(/\s+/g, "_");
  }

  const cleanedHref = (hrefValue || "").trim().replace(/^\/+/, "");
  if (!cleanedHref) {
    return "general";
  }

  const firstSegment = cleanedHref.split("/")[0] || "general";
  return firstSegment.toLowerCase().replace(/-/g, "_");
};

const moduleLabel = (moduleValue?: string, hrefValue?: string) => {
  if (moduleValue && moduleValue.trim().length > 0) {
    return moduleValue.trim();
  }

  const cleanedHref = (hrefValue || "").trim().replace(/^\/+/, "");
  if (!cleanedHref) {
    return "General";
  }

  const firstSegment = cleanedHref.split("/")[0] || "general";
  return firstSegment
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export const groupPermissionsByModule = (
  permissions: Permission[],
): PermissionModuleGroup[] => {
  const groupsMap = new Map<string, { label: string; items: Permission[] }>();

  for (const permission of permissions || []) {
    const key = normalizeModuleKey(permission.module, permission.href);
    const label = moduleLabel(permission.module, permission.href);

    if (!groupsMap.has(key)) {
      groupsMap.set(key, { label, items: [] });
    }

    groupsMap.get(key)!.items.push(permission);
  }

  return Array.from(groupsMap.entries())
    .map(([key, value]) => ({
      key,
      label: value.label,
      items: [...value.items].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};
