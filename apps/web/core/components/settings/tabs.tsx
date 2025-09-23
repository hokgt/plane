import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@plane/utils";
import { useProject, useUser } from "@/hooks/store";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

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
  const [refreshing, setRefreshing] = useState(false);
  
  // Force refresh user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        console.log('SettingsTabs - Starting fresh user data fetch...');
        
        // Force fetch fresh user data
        const user = await fetchCurrentUser();
        console.log('SettingsTabs - Fresh user data:', user);
        
        if (user?.user_role) {
          setUserRole(user.user_role);
          console.log('SettingsTabs - User role from fresh fetch:', user.user_role);
        } else {
          console.log('SettingsTabs - No user_role in fresh fetch, user:', user);
        }
      } catch (error) {
        console.error('SettingsTabs - Error loading user data:', error);
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
      console.log('SettingsTabs - User role updated from currentUser:', currentUser.user_role);
      setIsLoading(false);
    } else if (currentUser && !currentUser.user_role) {
      console.log('SettingsTabs - currentUser exists but no user_role field:', currentUser);
    }
  }, [currentUser?.user_role]);
  
  // Debug logging
  useEffect(() => {
    console.log('SettingsTabs - Current user:', currentUser);
    console.log('SettingsTabs - User role:', userRole);
    console.log('SettingsTabs - Is loading:', isLoading);
  }, [currentUser, userRole, isLoading]);

  // Manual refresh function
  const handleRefreshUserData = async () => {
    setRefreshing(true);
    try {
      console.log('SettingsTabs - Manual refresh triggered');
      const user = await fetchCurrentUser();
      console.log('SettingsTabs - Manual refresh user data:', user);
      if (user?.user_role) {
        setUserRole(user.user_role);
        console.log('SettingsTabs - Manual refresh user role:', user.user_role);
      }
    } catch (error) {
      console.error('SettingsTabs - Manual refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

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
      
      {/* Debug refresh button - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={handleRefreshUserData}
          disabled={refreshing || isLoading}
          className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh User'}
        </button>
      )}
      
      {/* Debug info - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
          Role: {userRole} | Loading: {isLoading ? 'Yes' : 'No'}
        </div>
      )}
    </div>
  );
});

export default SettingsTabs;
