"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader as LoaderIcon, Search, Shield, User, UserCheck } from "lucide-react";
// types
import { Button, Loader, setPromiseToast, Input } from "@plane/ui";
import { cn } from "@plane/utils";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_role: 'admin' | 'staff' | 'user';
  is_active: boolean;
  created_at: string;
}

const UserManagementPage = observer(() => {
  // states
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/users/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.results || data);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // update user role
  const updateUserRole = async (userId: string, newRole: 'admin' | 'staff' | 'user') => {
    try {
      setUpdatingUser(userId);
      const response = await fetch(`/api/v1/users/${userId}/role/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ user_role: newRole }),
      });

      if (response.ok) {
        setPromiseToast(Promise.resolve(), {
          loading: "Updating user role...",
          success: {
            title: "Success",
            message: () => "User role updated successfully",
          },
          error: {
            title: "Error",
            message: () => "Failed to update user role",
          },
        });
        // Refresh users list
        await fetchUsers();
      } else {
        throw new Error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      setPromiseToast(Promise.reject(error), {
        loading: "Updating user role...",
        success: {
          title: "Success",
          message: () => "User role updated successfully",
        },
        error: {
          title: "Error",
          message: () => "Failed to update user role",
        },
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  // toggle user status
  const toggleUserStatus = async (userId: string, _isActive: boolean) => {
    try {
      setUpdatingUser(userId);
      const response = await fetch(`/api/v1/users/${userId}/status/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        setPromiseToast(Promise.resolve(), {
          loading: "Updating user status...",
          success: {
            title: "Success",
            message: () => "User status updated successfully",
          },
          error: {
            title: "Error",
            message: () => "Failed to update user status",
          },
        });
        // Refresh users list
        await fetchUsers();
      } else {
        throw new Error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setPromiseToast(Promise.reject(error), {
        loading: "Updating user status...",
        success: {
          title: "Success",
          message: () => "User status updated successfully",
        },
        error: {
          title: "Error",
          message: () => "Failed to update user status",
        },
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  // fetch data on component mount
  useSWR("ADMIN_USERS", fetchUsers);

  // filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'staff':
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-custom-border-100 mx-4 py-4 space-y-1 flex-shrink-0">
        <div className="flex flex-col gap-1">
          <div className="text-xl font-medium text-custom-text-100">User Management</div>
          <div className="text-sm font-normal text-custom-text-300">
            Manage user roles and permissions across the instance.
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-custom-text-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-custom-text-300">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <Loader className="space-y-4 py-8">
              <Loader.Item height="60px" width="100%" />
              <Loader.Item height="60px" width="100%" />
              <Loader.Item height="60px" width="100%" />
            </Loader>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    user.is_active
                      ? "bg-custom-background-100 border-custom-border-200"
                      : "bg-custom-background-80 border-custom-border-100 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.user_role)}
                      <div>
                        <div className="font-medium text-custom-text-100">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-custom-text-300">{user.email}</div>
                        <div className="text-xs text-custom-text-400">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role Badge */}
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full border",
                      getRoleBadgeColor(user.user_role)
                    )}>
                      {user.user_role.toUpperCase()}
                    </span>

                    {/* Status Badge */}
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full border",
                      user.is_active
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    )}>
                      {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>

                    {/* Role Change Dropdown */}
                    <div className="flex items-center gap-2">
                      <select
                        value={user.user_role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'staff' | 'user')}
                        disabled={updatingUser === user.id}
                        className="px-2 py-1 text-sm border border-custom-border-200 rounded bg-custom-background-100 text-custom-text-100"
                      >
                        <option value="user">User</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>

                      {/* Toggle Status Button */}
                      <Button
                        variant={user.is_active ? "danger" : "primary"}
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        disabled={updatingUser === user.id}
                      >
                        {updatingUser === user.id ? (
                          <LoaderIcon className="w-3 h-3 animate-spin" />
                        ) : (
                          user.is_active ? "Deactivate" : "Activate"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-8">
                  <div className="text-custom-text-400">No users found</div>
                  {searchTerm && (
                    <div className="text-sm text-custom-text-300 mt-2">
                      Try adjusting your search terms
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default UserManagementPage;
