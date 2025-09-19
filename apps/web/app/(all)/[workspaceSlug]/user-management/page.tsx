"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Search, Users, Shield, UserCheck, UserX, Edit3, MoreVertical, AlertTriangle, Lock } from "lucide-react";
import { Button, Input, Avatar, Badge, CustomMenu, CustomSelect } from "@plane/ui";
import { useTranslation } from "@plane/i18n";

// Types
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  user_role: 'admin' | 'staff' | 'user';
  is_active: boolean;
  created_at: string;
}

const UserManagementPage = observer(() => {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setAccessDenied(false);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('is_active', statusFilter);
      
      const response = await fetch(`/api/v1/users/?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Failed to fetch users (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error: Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/v1/users/${userId}/role/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ user_role: newRole }),
      });
      
      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }
      
      if (response.ok) {
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Failed to update user role (${response.status})`);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      setError('Network error: Unable to update user role');
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/users/${userId}/status/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }
      
      if (response.ok) {
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Failed to update user status (${response.status})`);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Network error: Unable to update user status');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'staff':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'staff':
        return <UserCheck className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-full w-full">
      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <div className="relative flex w-full flex-shrink-0 flex-col z-10">
          <div className="flex w-full items-center gap-2 px-5 py-4 border-b border-custom-border-200">
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-custom-text-100">
                  User Management
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {users.length} users
                </Badge>
              </div>
              <p className="text-sm text-custom-text-300">
                Manage user roles and permissions across the system
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex w-full items-center gap-4 px-5 py-4 border-b border-custom-border-200">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-custom-text-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <CustomSelect
            value={roleFilter}
            onChange={(value: string) => setRoleFilter(value)}
            label={roleFilter || "Role"}
            className="w-32"
          >
            <CustomSelect.Option value="">All Roles</CustomSelect.Option>
            <CustomSelect.Option value="admin">Admin</CustomSelect.Option>
            <CustomSelect.Option value="staff">Staff</CustomSelect.Option>
            <CustomSelect.Option value="user">User</CustomSelect.Option>
          </CustomSelect>

          <CustomSelect
            value={statusFilter}
            onChange={(value: string) => setStatusFilter(value)}
            label={statusFilter || "Status"}
            className="w-32"
          >
            <CustomSelect.Option value="">All Status</CustomSelect.Option>
            <CustomSelect.Option value="true">Active</CustomSelect.Option>
            <CustomSelect.Option value="false">Inactive</CustomSelect.Option>
          </CustomSelect>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-custom-text-400">Loading users...</div>
            </div>
          ) : accessDenied ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Lock className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-custom-text-100 mb-2">Access Denied</h3>
                <p className="text-custom-text-400 mb-4">
                  You need admin permissions to access user management.
                </p>
                <p className="text-sm text-custom-text-500">
                  Contact your administrator to request access.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-custom-text-100 mb-2">Error Loading Users</h3>
                <p className="text-custom-text-400 mb-4">{error}</p>
                <Button onClick={fetchUsers} variant="primary" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Users className="h-12 w-12 text-custom-text-400 mx-auto mb-4" />
                <div className="text-custom-text-400">No users found</div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4">
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-custom-border-200 rounded-lg hover:bg-custom-background-80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={user.display_name}
                        src={user.avatar_url}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-custom-text-100">
                            {user.display_name}
                          </h4>
                          <Badge className={getRoleBadgeColor(user.user_role)}>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(user.user_role)}
                              {user.user_role.charAt(0).toUpperCase() + user.user_role.slice(1)}
                            </div>
                          </Badge>
                          {!user.is_active && (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              <UserX className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-custom-text-400">{user.email}</p>
                        <p className="text-xs text-custom-text-500">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CustomSelect
                        value={user.user_role}
                        onChange={(value: string) => updateUserRole(user.id, value)}
                        label={user.user_role.charAt(0).toUpperCase() + user.user_role.slice(1)}
                        className="w-24"
                      >
                        <CustomSelect.Option value="user">User</CustomSelect.Option>
                        <CustomSelect.Option value="staff">Staff</CustomSelect.Option>
                        <CustomSelect.Option value="admin">Admin</CustomSelect.Option>
                      </CustomSelect>

                      <CustomMenu
                        customButton={
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        }
                        placement="bottom-end"
                      >
                        <CustomMenu.MenuItem
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          <div className="flex items-center gap-2">
                            {user.is_active ? (
                              <>
                                <UserX className="h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4" />
                                Activate
                              </>
                            )}
                          </div>
                        </CustomMenu.MenuItem>
                      </CustomMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default UserManagementPage;
