"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Button, Input, Avatar, CustomSelect, CustomMenu } from "@plane/ui";
import { 
  Search, 
  MoreVertical, 
  UserX, 
  Users, 
  AlertTriangle, 
  Lock, 
  UserPlus, 
  Shield, 
  UserCheck, 
  Eye,
  Mail,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Crown,
  Star
} from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core";
import { SettingsContentWrapper } from "@/components/settings";
import { WorkspaceService } from "@/plane-web/services";
import { IWorkspaceMember } from "@plane/types";
import { useUser } from "@/hooks/store";

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
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Initialize workspace service
  const workspaceService = new WorkspaceService();

  // Helper functions
  const getRoleValue = (roleString: string): number => {
    switch (roleString) {
      case 'admin': return 20;
      case 'manager': return 15;
      case 'staff': return 10;
      case 'guest': return 5;
      default: return 5;
    }
  };

  const getRoleString = (roleValue: number): string => {
    switch (roleValue) {
      case 20: return 'admin';
      case 15: return 'manager';
      case 10: return 'staff';
      case 5: return 'guest';
      default: return 'guest';
    }
  };

  const getRoleIconComponent = (roleValue: number) => {
    switch (roleValue) {
      case 20: // admin
        return <Crown className="h-4 w-4 text-amber-500" />;
      case 15: // member
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case 10: // viewer
        return <Eye className="h-4 w-4 text-green-500" />;
      case 5: // guest
        return <Users className="h-4 w-4 text-gray-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeClasses = (roleValue: number): string => {
    switch (roleValue) {
      case 20: // admin
        return 'bg-custom-background-80 text-amber-600 border border-amber-200 shadow-sm';
      case 15: // member
        return 'bg-custom-background-80 text-custom-primary border border-custom-border-200 shadow-sm';
      case 10: // viewer
        return 'bg-custom-background-80 text-green-500 border border-green-200 shadow-sm';
      case 5: // guest
        return 'bg-custom-background-80 text-custom-text-400 border border-custom-border-200 shadow-sm';
      default:
        return 'bg-custom-background-80 text-custom-text-400 border border-custom-border-200 shadow-sm';
    }
  };

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
      
      // Show success message
      console.log("Member invited successfully!");
      
    } catch (error: any) {
      console.error("Error inviting member:", error);
      setError(error?.response?.data?.error || "Failed to invite member. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };


  // Refresh members with loading state
  const refreshMembers = async () => {
    setRefreshing(true);
    try {
      await fetchMembers();
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch workspace members
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      setAccessDenied(false);

      console.log('Fetching members for workspace:', workspaceSlug);

      const data = await workspaceService.fetchWorkspaceMembers(workspaceSlug?.toString() || "");
      let filteredMembers = data || [];

      // Apply search filter
      if (searchTerm) {
        filteredMembers = filteredMembers.filter(member => 
          member.member.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.member.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply role filter
      if (roleFilter) {
        const roleValue = getRoleValue(roleFilter);
        filteredMembers = filteredMembers.filter(member => member.role === roleValue);
      }

      setMembers(filteredMembers);
    } catch (error: any) {
      console.error('Error fetching members:', error);
      if (error?.status === 403) {
        setAccessDenied(true);
      } else {
        setError(error?.detail || error?.message || 'Failed to fetch members');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update member role
  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const roleValue = getRoleValue(newRole);
      await workspaceService.updateWorkspaceMember(workspaceSlug?.toString() || "", memberId, { role: roleValue });
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
      await workspaceService.deleteWorkspaceMember(workspaceSlug?.toString() || "", memberId);
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
      <SettingsContentWrapper>
        <PageHead title="User Management" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-custom-text-100 mb-2">Access Denied</h2>
            <p className="text-custom-text-300">You don't have permission to view user management.</p>
          </div>
        </div>
      </SettingsContentWrapper>
    );
  }

  return (
    <SettingsContentWrapper>
      <PageHead title="User Management" />
      <div className="space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-custom-background-100 rounded-2xl border border-custom-border-200">
          <div className="absolute inset-0 bg-gradient-to-r from-custom-primary/5 to-purple-600/5"></div>
          <div className="relative px-8 py-8">
        <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
          <div>
                    <h1 className="text-3xl font-bold text-custom-text-100">User Management</h1>
                    <p className="text-custom-text-300">Manage workspace members and their permissions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-custom-background-80 backdrop-blur-sm rounded-full border border-custom-border-200">
                    <Users className="h-4 w-4 text-custom-primary" />
                    <span className="text-sm font-medium text-custom-text-300">{members?.length || 0} Members</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-custom-background-80 backdrop-blur-sm rounded-full border border-custom-border-200">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-custom-text-300">{members?.filter(m => m.role >= 15).length || 0} Managers</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={refreshMembers}
                  disabled={refreshing}
                  variant="outline-primary"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-custom-background-80"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 bg-custom-primary hover:bg-custom-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-custom-background-100 rounded-xl border border-custom-border-200 shadow-sm">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-custom-text-400" />
            <Input
                    placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-custom-background-80 border-custom-border-200 focus:border-custom-primary focus:ring-custom-primary"
            />
          </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-custom-text-400" />
          <CustomSelect
            value={roleFilter}
            onChange={(value: string) => setRoleFilter(value)}
                    label="All Roles"
                    className="min-w-[140px]"
          >
            <CustomSelect.Option value="">All Roles</CustomSelect.Option>
                    <CustomSelect.Option value="admin">👑 Admin</CustomSelect.Option>
                    <CustomSelect.Option value="manager">👨‍💼 Manager</CustomSelect.Option>
                    <CustomSelect.Option value="staff">👤 Staff</CustomSelect.Option>
                    <CustomSelect.Option value="guest">👥 Guest</CustomSelect.Option>
          </CustomSelect>
        </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-custom-background-80 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-custom-background-80 shadow-sm' : 'hover:bg-custom-background-80'
                    }`}
                  >
                    <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                      <div className={`w-1.5 h-1.5 rounded-sm ${viewMode === 'grid' ? 'bg-custom-primary' : 'bg-custom-text-400'}`}></div>
                      <div className={`w-1.5 h-1.5 rounded-sm ${viewMode === 'grid' ? 'bg-custom-primary' : 'bg-custom-text-400'}`}></div>
                      <div className={`w-1.5 h-1.5 rounded-sm ${viewMode === 'grid' ? 'bg-custom-primary' : 'bg-custom-text-400'}`}></div>
                      <div className={`w-1.5 h-1.5 rounded-sm ${viewMode === 'grid' ? 'bg-custom-primary' : 'bg-custom-text-400'}`}></div>
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-custom-background-80 shadow-sm' : 'hover:bg-custom-background-80'
                    }`}
                  >
                    <div className="w-4 h-4 space-y-0.5">
                      <div className={`w-full h-1 rounded-sm ${viewMode === 'list' ? 'bg-custom-primary' : 'bg-custom-text-400'}`}></div>
                      <div className={`w-full h-1 rounded-sm ${viewMode === 'list' ? 'bg-custom-primary' : 'bg-custom-text-400'}`}></div>
                      <div className={`w-full h-1 rounded-sm ${viewMode === 'list' ? 'bg-custom-primary' : 'bg-custom-text-400'}`}></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
              </div>
            </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
              </div>
            </div>
        )}

        {/* Members Section */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
              <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading members...</p>
              </div>
            </div>
          ) : (
          <div className="space-y-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members && members.length > 0 ? members.map((member) => (
                  <div key={member.id} className="group bg-custom-background-100 rounded-xl border border-custom-border-200 hover:border-custom-primary hover:shadow-lg transition-all duration-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar name={member.member.display_name} src={member.member.avatar} />
                            <div className="absolute -bottom-1 -right-1 p-1 bg-custom-background-100 rounded-full border-2 border-custom-background-100">
                              {getRoleIconComponent(member.role)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-custom-text-100 truncate">
                              {member.member.display_name}
                            </h3>
                            <p className="text-sm text-custom-text-400 truncate">{member.member.email}</p>
                          </div>
                        </div>
                        <CustomMenu
                          customButton={
                            <Button variant="link-neutral" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                          placement="bottom-end"
                        >
                          {canRemoveManager(getRoleString(member.role)) && (
                            <CustomMenu.MenuItem onClick={() => removeManager(member.id)}>
                              <div className="flex items-center gap-2 text-red-600">
                                <UserX className="h-4 w-4" />
                                Remove Manager
                              </div>
                            </CustomMenu.MenuItem>
                          )}
                          <CustomMenu.MenuItem onClick={() => removeMember(member.id)}>
                            <div className="flex items-center gap-2">
                              <UserX className="h-4 w-4" />
                              Remove from workspace
                            </div>
                          </CustomMenu.MenuItem>
                        </CustomMenu>
                      </div>
                      
              <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Role</span>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeClasses(member.role)}`}>
                            {getRoleString(member.role)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Joined</span>
                          <span className="text-sm text-gray-500">
                            {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <CustomSelect
                          value={getRoleString(member.role)}
                          onChange={(value: string) => updateMemberRole(member.id, value)}
                          label={`Change role`}
                          className="w-full"
                        >
                          <CustomSelect.Option value="guest">👥 Guest</CustomSelect.Option>
                          <CustomSelect.Option value="staff">👤 Staff</CustomSelect.Option>
                          <CustomSelect.Option value="manager">👨‍💼 Manager</CustomSelect.Option>
                          <CustomSelect.Option value="admin">👑 Admin</CustomSelect.Option>
                        </CustomSelect>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
                    <p className="text-custom-text-400">No members match your current filters.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-custom-background-100 rounded-xl border border-custom-border-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-custom-background-80 border-b border-custom-border-200">
                  <h3 className="text-lg font-semibold text-custom-text-100">Workspace Members</h3>
                  <p className="text-sm text-custom-text-400">{members?.length || 0} total members</p>
                </div>
                <div className="divide-y divide-custom-border-200">
                  {members && members.length > 0 ? members.map((member) => (
                    <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-custom-background-80 transition-colors group">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar name={member.member.display_name} src={member.member.avatar} />
                          <div className="absolute -bottom-1 -right-1 p-1 bg-custom-background-100 rounded-full border-2 border-custom-background-100">
                            {getRoleIconComponent(member.role)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-base font-semibold text-gray-900 truncate">
                            {member.member.display_name}
                          </h4>
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadgeClasses(member.role)}`}>
                              {getRoleString(member.role)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <p className="text-sm text-gray-500 truncate">{member.member.email}</p>
                        </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-500">
                          Joined {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                            </div>
                          </div>
                      </div>
                    </div>

                      <div className="flex items-center space-x-3">
                      <CustomSelect
                        value={getRoleString(member.role)}
                        onChange={(value: string) => updateMemberRole(member.id, value)}
                          label={getRoleString(member.role)}
                          className="min-w-[120px]"
                        >
                          <CustomSelect.Option value="guest">👥 Guest</CustomSelect.Option>
                          <CustomSelect.Option value="staff">👤 Staff</CustomSelect.Option>
                          <CustomSelect.Option value="manager">👨‍💼 Manager</CustomSelect.Option>
                          <CustomSelect.Option value="admin">👑 Admin</CustomSelect.Option>
                      </CustomSelect>

                      <CustomMenu
                        customButton={
                            <Button variant="link-neutral" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        }
                        placement="bottom-end"
                      >
                        {canRemoveManager(getRoleString(member.role)) && (
                            <CustomMenu.MenuItem onClick={() => removeManager(member.id)}>
                            <div className="flex items-center gap-2 text-red-600">
                              <UserX className="h-4 w-4" />
                              Remove Manager
                            </div>
                          </CustomMenu.MenuItem>
                        )}
                          <CustomMenu.MenuItem onClick={() => removeMember(member.id)}>
                          <div className="flex items-center gap-2">
                            <UserX className="h-4 w-4" />
                            Remove from workspace
                          </div>
                        </CustomMenu.MenuItem>
                      </CustomMenu>
                    </div>
                  </div>
                  )) : (
                    <div className="px-6 py-12 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
                      <p className="text-custom-text-400">No members match your current filters.</p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Invite Member Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-custom-background-100 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-custom-text-100">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <CustomSelect
                    value={inviteRole}
                    onChange={(value: string) => setInviteRole(value)}
                    label={inviteRole === "5" ? "Guest" : inviteRole === "10" ? "Staff" : inviteRole === "15" ? "Manager" : "Admin"}
                    className="w-full"
                  >
                    <CustomSelect.Option value="5">👥 Guest - Limited access</CustomSelect.Option>
                    <CustomSelect.Option value="10">👤 Staff - Can view team members and assigned work</CustomSelect.Option>
                    <CustomSelect.Option value="15">👨‍💼 Manager - Can manage team members</CustomSelect.Option>
                    <CustomSelect.Option value="20">👑 Admin - Full administrative access</CustomSelect.Option>
                  </CustomSelect>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    variant="outline-primary"
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
                    className="flex items-center gap-2 bg-custom-primary hover:bg-custom-primary/90"
                  >
                    {inviteLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
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
    </SettingsContentWrapper>
  );
});

export default UserManagementPage;
