"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Search, Users, Shield, UserCheck, UserX, Edit3, MoreVertical, AlertTriangle, Lock, UserPlus } from "lucide-react";
import { Button, Input, Avatar, CustomMenu, CustomSelect } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { WorkspaceService } from "@/plane-web/services";
import { IWorkspaceMember } from "@plane/types";
import { useUser } from "@/hooks/store";

// Types
interface WorkspaceMember {
  id: string;
  member: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    display_name: string;
    avatar: string;
  };
  role: number; // 20 = Admin, 15 = Member, 10 = Viewer, 5 = Guest
  created_at: string;
}

const UserManagementPage = observer(() => {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { data: currentUser } = useUser();

  const [members, setMembers] = useState<IWorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("15"); // Default to Member (staff)
  const [inviteLoading, setInviteLoading] = useState(false);

  // Initialize workspace service
  const workspaceService = new WorkspaceService();

  // Invite member to workspace
  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!inviteRole) {
      setError("Please select a role");
      return;
    }

    setInviteLoading(true);
    setError(null);

    try {
      const inviteData = {
        emails: [
          {
            email: inviteEmail.trim().toLowerCase(),
            role: parseInt(inviteRole)
          }
        ]
      };

      await workspaceService.inviteWorkspace(workspaceSlug?.toString() || "", inviteData);
      
      // Refresh members list
      await fetchMembers();
      
      // Reset form and close modal
      setInviteEmail("");
      setInviteRole("15");
      setShowInviteModal(false);
      
      // Show success message (you can add a toast notification here)
      console.log("Member invited successfully!");
      
    } catch (error: any) {
      console.error("Error inviting member:", error);
      setError(error?.response?.data?.error || "Failed to invite member. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };


  // Fetch workspace members
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      setAccessDenied(false);

      console.log('Fetching members for workspace:', workspaceSlug);

      const data = await workspaceService.fetchWorkspaceMembers(workspaceSlug.toString());
      let filteredMembers = data;

      // Apply search filter
      if (searchTerm) {
        filteredMembers = filteredMembers.filter((member: IWorkspaceMember) =>
          member.member.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.member.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply role filter
      if (roleFilter) {
        const roleValue = getRoleValue(roleFilter);
        filteredMembers = filteredMembers.filter((member: IWorkspaceMember) =>
          member.role === roleValue
        );
      }

      setMembers(filteredMembers);
      console.log('Successfully fetched members:', filteredMembers.length);
    } catch (error: any) {
      console.error('Error fetching members:', error);

      if (error?.status === 403) {
        setAccessDenied(true);
      } else {
        setError(error?.detail || error?.message || 'Failed to fetch workspace members');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for role management
  const getRoleValue = (roleString: string): number => {
    switch (roleString) {
      case 'admin': return 20;
      case 'member': return 15;
      case 'viewer': return 10;
      case 'guest': return 5;
      default: return 15;
    }
  };

  const getRoleString = (roleValue: number): string => {
    switch (roleValue) {
      case 20: return 'admin';
      case 15: return 'member';
      case 10: return 'viewer';
      case 5: return 'guest';
      default: return 'member';
    }
  };

  // Update member role
  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const roleValue = getRoleValue(newRole);
      await workspaceService.updateWorkspaceMember(workspaceSlug.toString(), memberId, { role: roleValue });
      fetchMembers(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating member role:', error);
      if (error?.status === 403) {
        setAccessDenied(true);
      } else {
        setError(error?.detail || error?.message || 'Failed to update member role');
      }
    }
  };

  // Remove member from workspace
  const removeMember = async (memberId: string) => {
    try {
      await workspaceService.deleteWorkspaceMember(workspaceSlug.toString(), memberId);
      fetchMembers(); // Refresh the list
    } catch (error: any) {
      console.error('Error removing member:', error);
      if (error?.status === 403) {
        setAccessDenied(true);
      } else {
        setError(error?.detail || error?.message || 'Failed to remove member');
      }
    }
  };

  // Remove manager function (only admins can do this)
  const removeManager = async (memberId: string) => {
    if (currentUserRole !== 'admin') {
      alert('Only admins can remove managers');
      return;
    }

    if (confirm('Are you sure you want to remove this manager?')) {
      try {
        const response = await fetch(`/api/v1/workspaces/${workspaceSlug}/members/${memberId}/remove-manager/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Refresh the members list
          fetchMembers();
          alert('Manager removed successfully');
        } else {
          alert('Failed to remove manager');
        }
      } catch (error) {
        console.error('Error removing manager:', error);
        alert('Error removing manager');
      }
    }
  };

  // Check if user can access this page
  const canAccessUserManagement = () => {
    const userRole = currentUser?.user_role || 'guest';
    console.log('UserManagementPage - Current user role:', userRole);
    return userRole === 'admin' || userRole === 'manager';
  };

  // Check if user can remove managers
  const canRemoveManager = (memberRole: string) => {
    const userRole = currentUser?.user_role || 'guest';
    return userRole === 'admin' && memberRole === 'manager';
  };

  useEffect(() => {
    fetchMembers();
  }, [searchTerm, roleFilter, workspaceSlug]);

  // Check access permissions
  if (!canAccessUserManagement()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-custom-text-100 mb-2">Access Denied</h2>
          <p className="text-custom-text-300">You don't have permission to view user management.</p>
        </div>
      </div>
    );
  }

  const getRoleBadgeClasses = (roleValue: number): string => {
    switch (roleValue) {
      case 20: // admin
        return 'bg-red-100 text-red-800 border border-red-200';
      case 15: // member
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 10: // viewer
        return 'bg-green-100 text-green-800 border border-green-200';
      case 5: // guest
        return 'bg-custom-background-80 text-custom-text-300 border border-custom-border-200';
      default:
        return 'bg-custom-background-80 text-custom-text-300 border border-custom-border-200';
    }
  };

  const getRoleIcon = (roleValue: number) => {
    switch (roleValue) {
      case 20: // admin
        return <Shield className="h-3 w-3" />;
      case 15: // member
        return <UserCheck className="h-3 w-3" />;
      case 10: // viewer
        return <Users className="h-3 w-3" />;
      case 5: // guest
        return <Users className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  return (
    <div className="h-full w-full">
      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <div className="relative flex w-full flex-shrink-0 flex-col z-10">
          <div className="flex w-full items-center gap-2 px-5 py-4 border-b border-custom-border-200">
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-custom-text-100">
                    User Management
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-custom-background-80 text-custom-text-300 border border-custom-border-200 rounded">
                    {members.length} members
                  </span>
                </div>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
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
            <CustomSelect.Option value="member">Member</CustomSelect.Option>
            <CustomSelect.Option value="viewer">Viewer</CustomSelect.Option>
            <CustomSelect.Option value="guest">Guest</CustomSelect.Option>
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
                <Button onClick={fetchMembers} variant="primary" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          ) : members.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Users className="h-12 w-12 text-custom-text-400 mx-auto mb-4" />
                <div className="text-custom-text-400">No members found</div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4">
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-custom-border-200 rounded-lg hover:bg-custom-background-80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={member.member.display_name}
                        src={member.member.avatar_url}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-custom-text-100">
                            {member.member.display_name}
                          </h4>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getRoleBadgeClasses(member.role)}`}>
                            {getRoleIcon(member.role)}
                            {getRoleString(member.role).charAt(0).toUpperCase() + getRoleString(member.role).slice(1)}
                          </div>
                        </div>
                        <p className="text-sm text-custom-text-400">{member.member.email}</p>
                        <p className="text-xs text-custom-text-500">
                          Joined {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CustomSelect
                        value={getRoleString(member.role)}
                        onChange={(value: string) => updateMemberRole(member.id, value)}
                        label={getRoleString(member.role).charAt(0).toUpperCase() + getRoleString(member.role).slice(1)}
                        className="w-24"
                      >
                        <CustomSelect.Option value="guest">Guest</CustomSelect.Option>
                        <CustomSelect.Option value="viewer">Viewer</CustomSelect.Option>
                        <CustomSelect.Option value="member">Member</CustomSelect.Option>
                        <CustomSelect.Option value="admin">Admin</CustomSelect.Option>
                      </CustomSelect>

                      <CustomMenu
                        customButton={
                          <Button variant="link-neutral" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        }
                        placement="bottom-end"
                      >
                        {canRemoveManager(getRoleString(member.role)) && (
                          <CustomMenu.MenuItem
                            onClick={() => removeManager(member.id)}
                          >
                            <div className="flex items-center gap-2 text-red-600">
                              <UserX className="h-4 w-4" />
                              Remove Manager
                            </div>
                          </CustomMenu.MenuItem>
                        )}
                        <CustomMenu.MenuItem
                          onClick={() => removeMember(member.id)}
                        >
                          <div className="flex items-center gap-2">
                            <UserX className="h-4 w-4" />
                            Remove from workspace
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

        {/* Invite Member Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-custom-background-100 rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-custom-text-100">
                  Invite New Member
                </h3>
                <Button
                  variant="link-neutral"
                  size="sm"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail("");
                    setInviteRole("15");
                    setError(null);
                  }}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-custom-text-200 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-custom-text-200 mb-2">
                    Role
                  </label>
                  <CustomSelect
                    value={inviteRole}
                    onChange={(value: string) => setInviteRole(value)}
                    label={inviteRole === "5" ? "Guest" : inviteRole === "10" ? "Viewer" : inviteRole === "15" ? "Staff" : "Admin"}
                    className="w-full"
                  >
                    <CustomSelect.Option value="5">Guest - Limited access</CustomSelect.Option>
                    <CustomSelect.Option value="10">Viewer - Can view assigned items</CustomSelect.Option>
                    <CustomSelect.Option value="15">Staff - Can view team members and assigned work</CustomSelect.Option>
                    <CustomSelect.Option value="20">Admin - Can manage team members</CustomSelect.Option>
                  </CustomSelect>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-4">
                  <Button
                    variant="link-neutral"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteEmail("");
                      setInviteRole("15");
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={inviteMember}
                    disabled={inviteLoading || !inviteEmail.trim()}
                    className="flex items-center gap-2"
                  >
                    {inviteLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Inviting...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Send Invite
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default UserManagementPage;
