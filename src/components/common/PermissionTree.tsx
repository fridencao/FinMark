import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Shield } from 'lucide-react';
import type { Permission } from '@/services/user';

interface PermissionNode {
  category: string;
  permissions: Permission[];
}

interface PermissionTreeProps {
  permissions: Permission[];
  selectedPermissionIds: string[];
  onSelectionChange: (permissionIds: string[]) => void;
  disabled?: boolean;
}

export function PermissionTree({
  permissions,
  selectedPermissionIds,
  onSelectionChange,
  disabled = false,
}: PermissionTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(permissions.map((p) => p.category))
  );

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handlePermissionCheck = (permissionId: string, checked: boolean) => {
    if (disabled) return;

    const newSelection = checked
      ? [...selectedPermissionIds, permissionId]
      : selectedPermissionIds.filter((id) => id !== permissionId);
    onSelectionChange(newSelection);
  };

  const handleCategoryCheck = (category: string, checked: boolean) => {
    if (disabled) return;

    const categoryPermissions = groupedPermissions[category];
    const categoryPermissionIds = categoryPermissions.map((p) => p.id);

    let newSelection = [...selectedPermissionIds];
    if (checked) {
      // Add all permissions in this category
      categoryPermissionIds.forEach((id) => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
    } else {
      // Remove all permissions in this category
      newSelection = newSelection.filter((id) => !categoryPermissionIds.includes(id));
    }
    onSelectionChange(newSelection);
  };

  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = groupedPermissions[category];
    return categoryPermissions.every((p) => selectedPermissionIds.includes(p.id));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = groupedPermissions[category];
    const selectedCount = categoryPermissions.filter((p) =>
      selectedPermissionIds.includes(p.id)
    ).length;
    return selectedCount > 0 && selectedCount < categoryPermissions.length;
  };

  return (
    <div className="space-y-2">
      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
        const isExpanded = expandedCategories.has(category);
        const isFullySelected = isCategoryFullySelected(category);
        const isPartiallySelected = isCategoryPartiallySelected(category);

        return (
          <div key={category} className="border border-slate-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <div
              className="flex items-center gap-2 px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => toggleCategory(category)}
            >
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-700"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              <input
                type="checkbox"
                checked={isFullySelected}
                ref={(ref) => {
                  if (ref) {
                    ref.indeterminate = isPartiallySelected;
                  }
                }}
                onChange={(e) => handleCategoryCheck(category, e.target.checked)}
                disabled={disabled}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                onClick={(e) => e.stopPropagation()}
              />

              <Shield className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-sm text-slate-700">{category}</span>
              <span className="text-xs text-slate-500 ml-auto">
                {categoryPermissions.filter((p) => selectedPermissionIds.includes(p.id)).length}/{categoryPermissions.length}
              </span>
            </div>

            {/* Permissions List */}
            {isExpanded && (
              <div className="divide-y divide-slate-100 bg-white">
                {categoryPermissions.map((permission) => {
                  const isChecked = selectedPermissionIds.includes(permission.id);

                  return (
                    <div
                      key={permission.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handlePermissionCheck(permission.id, e.target.checked)}
                        disabled={disabled}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded mt-0.5 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-slate-700">{permission.name}</span>
                          <code className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {permission.code}
                          </code>
                        </div>
                        {permission.description && (
                          <p className="text-xs text-slate-500 mt-1">{permission.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PermissionTree;
