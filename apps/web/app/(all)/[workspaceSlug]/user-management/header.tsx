"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Users, Shield } from "lucide-react";
import { Breadcrumbs } from "@plane/ui";

export const UserManagementHeader = observer(() => {
  const { workspaceSlug } = useParams();

  return (
    <div className="relative flex w-full flex-shrink-0 flex-col z-10">
      <div className="flex w-full flex-col gap-2 px-5 py-4 border-b border-custom-border-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-custom-primary-100/10">
              <Shield className="w-4 h-4 text-custom-primary-100" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-custom-text-100">
                User Management
              </h3>
              <p className="text-sm text-custom-text-300">
                Manage user roles and permissions
              </p>
            </div>
          </div>
        </div>

        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            label={workspaceSlug?.toString() || "Workspace"}
            icon={<Users className="h-4 w-4" />}
          />
          <Breadcrumbs.BreadcrumbItem
            type="text"
            label="User Management"
            icon={<Shield className="h-4 w-4" />}
          />
        </Breadcrumbs>
      </div>
    </div>
  );
});
