import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@plane/utils";
import { useProject, useUser } from "@/hooks/store";
import { useState, useEffect } from "react";

const TABS = {
  account: {
    key: "account",
    label: "Account",
    href: `/settings/account/`,
  },
  workspace: {
    key: "workspace",
    label: "Workspace",
    href: `/settings/`,
  },
  projects: {
    key: "projects",
    label: "Projects",
    href: `/settings/projects/`,
  },
  userManagement: {
    key: "userManagement",
    label: "User Management",
    href: `/settings/user-management/`,
  },
};

const SettingsTabs = observer(() => {
  // router
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  // store hooks
  const { joinedProjectIds } = useProject();
  const { data: currentUser, fetchCurrentUser } = useUser();
  
  // State for direct API call
  const [userRole, setUserRole] = useState<string>('guest');
  const [isLoading, setIsLoading] = useState(true);
  
  // Force refresh user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        // Force fetch fresh user data
        const user = await fetchCurrentUser();
        
        if (user?.user_role) {
          setUserRole(user.user_role);
        }
      } catch (error) {
        setUserRole('guest');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [fetchCurrentUser]);

  // Separate effect to handle currentUser changes
  useEffect(() => {
    if (currentUser?.user_role) {
      setUserRole(currentUser.user_role);
      setIsLoading(false);
    }
  }, [currentUser?.user_role]);
  


  // Get available tabs based on user role
  const getAvailableTabs = () => {
    const baseTabs = [TABS.account, TABS.workspace, TABS.projects];
    
    // Only show User Management tab for owners and managers
    if (userRole === 'owner' || userRole === 'manager') {
      baseTabs.push(TABS.userManagement);
    }
    
    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  const currentTab = pathname.includes(TABS.projects.href)
    ? TABS.projects
    : pathname.includes(TABS.account.href)
      ? TABS.account
      : pathname.includes(TABS.userManagement.href)
        ? TABS.userManagement
        : TABS.workspace;

  return (
    <div className="flex items-center gap-2">
      <div className="flex w-fit min-w-fit items-center justify-between gap-1.5 rounded-md text-sm p-0.5 bg-custom-background-80">
        {availableTabs.map((tab) => {
          const isActive = currentTab?.key === tab.key;
          const href = tab.key === TABS.projects.key ? `${tab.href}${joinedProjectIds[0] || ""}` : tab.href;
          return (
            <Link
              key={tab.key}
              href={`/${workspaceSlug}${href}`}
              className={cn(
                "flex items-center justify-center p-1 min-w-fit w-full font-medium outline-none focus:outline-none cursor-pointer transition-all rounded text-custom-text-200 ",
                {
                  "bg-custom-background-100 text-custom-text-100 shadow-sm": isActive,
                  "hover:text-custom-text-100 hover:bg-custom-background-80/60": !isActive,
                }
              )}
            >
              <div className="text-xs font-semibold p-1">{tab.label}</div>
            </Link>
          );
        })}
      </div>
      
    </div>
  );
});

export default SettingsTabs;
