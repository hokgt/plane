"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Settings, Shield, UserCheck } from "lucide-react";

interface RoleBasedNavProps {
  workspaceSlug: string;
}

const RoleBasedNav = ({ workspaceSlug }: RoleBasedNavProps) => {
  const [userRole, setUserRole] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    // Fetch current user role
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/v1/users/me/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.user_role || 'guest');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, []);

  const getNavItems = () => {
    const baseItems = [
      {
        name: "Dashboard",
        href: `/${workspaceSlug}`,
        icon: Shield,
      },
    ];

    // Add role-specific items
    if (userRole === 'admin' || userRole === 'manager') {
      baseItems.push({
        name: "User Management",
        href: `/${workspaceSlug}/user-management`,
        icon: Users,
      });
    }

    if (userRole === 'staff' || userRole === 'manager') {
      baseItems.push({
        name: "Team Management",
        href: `/${workspaceSlug}/team-management`,
        icon: UserCheck,
      });
    }

    if (userRole === 'admin') {
      baseItems.push({
        name: "Admin Settings",
        href: `/${workspaceSlug}/admin-settings`,
        icon: Settings,
      });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? "bg-custom-primary-100 text-custom-primary-700"
                : "text-custom-text-300 hover:bg-custom-background-80 hover:text-custom-text-100"
            }`}
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
};

export default RoleBasedNav;
