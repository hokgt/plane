"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import {
  Search,
  MoreVertical,
  UserX,
  Users,
  AlertTriangle,
  UserPlus,
  Shield,
  UserCheck,
  Eye,
  Mail,
  Calendar,
  Filter,
  Crown,
  Copy
} from "lucide-react";
// import { IWorkspaceMember } from "@plane/types";

// Temporary type definition until the import issue is resolved
interface IWorkspaceMember {
  id: string;
  member: {
    id: string;
    email: string;
    display_name: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  role: number;
  created_at?: string;
  avatar_url?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  joining_date?: string;
  display_name?: string;
  last_login_medium?: string;
  is_active?: boolean;
}
import { Button, Input, Avatar, CustomSelect, CustomMenu } from "@plane/ui";
import { PageHead } from "@/components/core";
import { SettingsContentWrapper } from "@/components/settings";
import { useUser } from "@/hooks/store";
import { useUserPermissions } from "@/hooks/store/user";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { WorkspaceService } from "@/plane-web/services";

const UserManagementPage = observer(() => {
  const { workspaceSlug } = useParams();
  const { data: currentUser } = useUser();
  const { allowPermissions, workspaceUserInfo, fetchUserWorkspaceInfo } = useUserPermissions();

  const [members, setMembers] = useState<IWorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("15"); // Default to Member (staff)
  const [inviteLoading, setInviteLoading] = useState(false);

  // Add member form state
  const [addEmail, setAddEmail] = useState("");
  const [addDisplayName, setAddDisplayName] = useState("");
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addRole, setAddRole] = useState("15"); // Default to Member (staff)
  const [addLoading, setAddLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  
  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here if available
      console.log("Password copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };
  const [selectedMember, setSelectedMember] = useState<IWorkspaceMember | null>(null);
  const [permissions, setPermissions] = useState({
    can_view_projects: false,
    can_create_projects: false,
    can_edit_projects: false,
    can_delete_projects: false,
    can_manage_users: false,
    can_manage_workspace: false,
    can_view_analytics: false,
    can_export_data: false,
  });
  const [permissionsLoading, setPermissionsLoading] = useState(false);

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

  // Add member directly to workspace
  const addMemberDirectly = async () => {
    if (!addEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!addRole) {
      setError("Please select a role");
      return;
    }

    setAddLoading(true);
    setError(null);

    try {
      const addData = {
        email: addEmail.trim().toLowerCase(),
        display_name: addDisplayName.trim() || undefined,
        first_name: addFirstName.trim() || undefined,
        last_name: addLastName.trim() || undefined,
        role: parseInt(addRole)
      };

      const response = await workspaceService.addMemberDirectly(workspaceSlug?.toString() || "", addData);

      // Refresh members list
      await fetchMembers();

      // Reset form and close modal
      setAddEmail("");
      setAddDisplayName("");
      setAddFirstName("");
      setAddLastName("");
      setAddRole("15");
      setShowAddModal(false);

      // Show success message with temporary password
      if (response?.temporary_password) {
        setTemporaryPassword(response.temporary_password);
        setNewMemberEmail(addEmail);
        setShowPasswordModal(true);
      } else {
        console.log("Member added successfully!");
      }

    } catch (error: any) {
      console.error("Error adding member:", error);
      setError(error?.response?.data?.error || "Failed to add member. Please try again.");
    } finally {
      setAddLoading(false);
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
          member.member.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.member.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
    const userRole = currentUser?.user_role || 'guest';
    if (userRole !== 'admin') {
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
    
    // Check for system-level admin
    if (userRole === 'admin') {
      return true;
    }
    
    // Check if workspace user info is loaded
    const currentWorkspaceUserInfo = workspaceUserInfo[workspaceSlug?.toString() || ''];
    
    // DIRECT FIX: Check workspace role directly
    if (currentWorkspaceUserInfo?.role) {
      const workspaceRole = currentWorkspaceUserInfo.role;
      
      // Allow access for ADMIN (20) or MEMBER (15) roles
      if (workspaceRole === EUserPermissions.ADMIN || workspaceRole === EUserPermissions.MEMBER) {
        return true;
      }
    }
    
    // Check workspace-level permissions using the same pattern as members page
    const hasPermission = allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER], 
      EUserPermissionsLevel.WORKSPACE, 
      workspaceSlug?.toString()
    );
    
    return hasPermission;
  };

  // Check if user can remove managers
  const canRemoveManager = (memberRole: string) => {
    const userRole = currentUser?.user_role || 'guest';
    return userRole === 'admin' && memberRole === 'manager';
  };

  // Open permissions modal for a member
  const openPermissionsModal = (member: IWorkspaceMember) => {
    setSelectedMember(member);
    // Set default permissions based on role
    const roleBasedPermissions = getRoleBasedPermissions(member.role);
    setPermissions(roleBasedPermissions);
    setShowPermissionsModal(true);
  };

  // Get role-based default permissions
  const getRoleBasedPermissions = (roleValue: number) => {
    switch (roleValue) {
      case 20: // admin - full permissions
        return {
          can_view_projects: true,
          can_create_projects: true,
          can_edit_projects: true,
          can_delete_projects: true,
          can_manage_users: true,
          can_manage_workspace: true,
          can_view_analytics: true,
          can_export_data: true,
        };
      case 15: // manager - most permissions except workspace management
        return {
          can_view_projects: true,
          can_create_projects: true,
          can_edit_projects: true,
          can_delete_projects: true,
          can_manage_users: true,
          can_manage_workspace: false,
          can_view_analytics: true,
          can_export_data: true,
        };
      case 10: // staff - limited permissions
        return {
          can_view_projects: true,
          can_create_projects: true,
          can_edit_projects: false,
          can_delete_projects: false,
          can_manage_users: false,
          can_manage_workspace: false,
          can_view_analytics: false,
          can_export_data: false,
        };
      case 5: // guest - minimal permissions
        return {
          can_view_projects: true,
          can_create_projects: false,
          can_edit_projects: false,
          can_delete_projects: false,
          can_manage_users: false,
          can_manage_workspace: false,
          can_view_analytics: false,
          can_export_data: false,
        };
      default:
        return {
          can_view_projects: false,
          can_create_projects: false,
          can_edit_projects: false,
          can_delete_projects: false,
          can_manage_users: false,
          can_manage_workspace: false,
          can_view_analytics: false,
          can_export_data: false,
        };
    }
  };

  // Update member permissions
  const updateMemberPermissions = async () => {
    if (!selectedMember) return;

    setPermissionsLoading(true);
    setError(null);

    try {
      await workspaceService.updateWorkspaceMember(
        workspaceSlug?.toString() || "", 
        selectedMember.id, 
        { role: selectedMember.role } // Keep the existing role for now
      );

      // Refresh members list
      await fetchMembers();

      // Close modal
      setShowPermissionsModal(false);
      setSelectedMember(null);

      console.log("Member permissions updated successfully!");

    } catch (error: any) {
      console.error("Error updating permissions:", error);
      setError(error?.response?.data?.error || "Failed to update permissions. Please try again.");
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [searchTerm, roleFilter, workspaceSlug]);

  // Fetch workspace user info if not loaded
  useEffect(() => {
    if (workspaceSlug && !workspaceUserInfo[workspaceSlug.toString()]) {
      fetchUserWorkspaceInfo(workspaceSlug.toString()).catch(console.error);
    }
  }, [workspaceSlug, workspaceUserInfo, fetchUserWorkspaceInfo]);

  // Check if workspace user info is still loading
  const currentWorkspaceUserInfo = workspaceUserInfo[workspaceSlug?.toString() || ''];
  const isWorkspaceInfoLoading = workspaceSlug && !currentWorkspaceUserInfo;

  // Show loading state while workspace user info is being fetched
  if (isWorkspaceInfoLoading) {
    return (
      <SettingsContentWrapper>
        <PageHead title="User Management" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-custom-text-300">Loading workspace permissions...</p>
          </div>
        </div>
      </SettingsContentWrapper>
    );
  }

  // Check access permissions
  if (!canAccessUserManagement()) {
    return (
      <SettingsContentWrapper>
        <PageHead title="User Management" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-custom-text-100 mb-2">Access Denied</h2>
            <p className="text-custom-text-300">You don&apos;t have permission to view user management.</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-custom-text-100">User Management</h1>
            <p className="text-custom-text-400 mt-1">Manage workspace members and their permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <UserCheck className="h-4 w-4" />
              Add Member
            </Button>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-custom-primary hover:bg-custom-primary/90"
              size="sm"
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-custom-background-100 rounded-lg border border-custom-border-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-custom-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-custom-primary" />
              </div>
              <div>
                <p className="text-sm text-custom-text-400">Total Members</p>
                <p className="text-2xl font-semibold text-custom-text-100">{members?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-custom-background-100 rounded-lg border border-custom-border-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-custom-text-400">Managers</p>
                <p className="text-2xl font-semibold text-custom-text-100">{members?.filter(m => m.role >= 15).length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-custom-background-100 rounded-lg border border-custom-border-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <UserCheck className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-custom-text-400">Active</p>
                <p className="text-2xl font-semibold text-custom-text-100">{members?.filter(m => m.is_active).length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-custom-background-100 rounded-lg border border-custom-border-200">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-custom-text-400" />
                  <Input
                    placeholder="Search members by name or email..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
                      <div className={`w-1.5 h-1.5 rounded-sm ${viewMode === 'grid' ? 'bg-custom-primary' : 'bg-custom-text-400'}`} />
                      <div className={`w-1.5 h-1.5 rounded-sm ${viewMode === 'grid' ? 'bg-custom-primary' : 'bg-custom-text-400'}`} />
                      <div className={`w-1.5 h-1.5 rounded-sm ${viewMode === 'grid' ? 'bg-custom-primary' : 'bg-custom-text-400'}`} />
                      <div className={`w-1.5 h-1.5 rounded-sm ${viewMode === 'grid' ? 'bg-custom-primary' : 'bg-custom-text-400'}`} />
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-custom-background-80 shadow-sm' : 'hover:bg-custom-background-80'
                    }`}
                  >
                    <div className="w-4 h-4 space-y-0.5">
                      <div className={`w-full h-1 rounded-sm ${viewMode === 'list' ? 'bg-custom-primary' : 'bg-custom-text-400'}`} />
                      <div className={`w-full h-1 rounded-sm ${viewMode === 'list' ? 'bg-custom-primary' : 'bg-custom-text-400'}`} />
                      <div className={`w-full h-1 rounded-sm ${viewMode === 'list' ? 'bg-custom-primary' : 'bg-custom-text-400'}`} />
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
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
                            <Avatar name={member.member.display_name} src={(member.member as any).avatar} />
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
                          <CustomMenu.MenuItem onClick={() => openPermissionsModal(member)}>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Edit Permissions
                            </div>
                          </CustomMenu.MenuItem>
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
                          <Avatar name={member.member.display_name} src={(member.member as any).avatar} />
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
                        <CustomMenu.MenuItem onClick={() => openPermissionsModal(member)}>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Edit Permissions
                          </div>
                        </CustomMenu.MenuItem>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
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

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-custom-background-100 rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-custom-text-100">
                  Add Member Directly
                </h3>
                <Button
                  variant="link-neutral"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddEmail("");
                    setAddDisplayName("");
                    setAddFirstName("");
                    setAddLastName("");
                    setAddRole("15");
                    setError(null);
                  }}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Direct Addition</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    This will create a user account and add them directly to the workspace. They won&apos;t need to register.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={addEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddEmail(e.target.value)}
                      className="w-full border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={addDisplayName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddDisplayName(e.target.value)}
                      className="w-full border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <Input
                      type="text"
                      placeholder="John"
                      value={addFirstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddFirstName(e.target.value)}
                      className="w-full border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Doe"
                      value={addLastName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddLastName(e.target.value)}
                      className="w-full border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <CustomSelect
                    value={addRole}
                    onChange={(value: string) => setAddRole(value)}
                    label={addRole === "5" ? "Guest" : addRole === "10" ? "Staff" : addRole === "15" ? "Manager" : "Admin"}
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
                      setShowAddModal(false);
                      setAddEmail("");
                      setAddDisplayName("");
                      setAddFirstName("");
                      setAddLastName("");
                      setAddRole("15");
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addMemberDirectly}
                    disabled={addLoading || !addEmail.trim()}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {addLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Add Member
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionsModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-custom-background-100 rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-custom-text-100">
                    Edit Permissions
                  </h3>
                  <p className="text-sm text-custom-text-400 mt-1">
                    Configure permissions for {selectedMember.member.display_name}
                  </p>
                </div>
                <Button
                  variant="link-neutral"
                  size="sm"
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setSelectedMember(null);
                    setError(null);
                  }}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Project Permissions */}
                <div className="bg-custom-background-80 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-custom-text-100 mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Project Permissions
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-custom-text-200">View Projects</label>
                        <p className="text-xs text-custom-text-400">Can view all projects in the workspace</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={permissions.can_view_projects}
                        onChange={(e) => setPermissions(prev => ({ ...prev, can_view_projects: e.target.checked }))}
                        className="h-4 w-4 text-custom-primary focus:ring-custom-primary border-custom-border-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-custom-text-200">Create Projects</label>
                        <p className="text-xs text-custom-text-400">Can create new projects</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={permissions.can_create_projects}
                        onChange={(e) => setPermissions(prev => ({ ...prev, can_create_projects: e.target.checked }))}
                        className="h-4 w-4 text-custom-primary focus:ring-custom-primary border-custom-border-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-custom-text-200">Edit Projects</label>
                        <p className="text-xs text-custom-text-400">Can modify existing projects</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={permissions.can_edit_projects}
                        onChange={(e) => setPermissions(prev => ({ ...prev, can_edit_projects: e.target.checked }))}
                        className="h-4 w-4 text-custom-primary focus:ring-custom-primary border-custom-border-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-custom-text-200">Delete Projects</label>
                        <p className="text-xs text-custom-text-400">Can delete projects</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={permissions.can_delete_projects}
                        onChange={(e) => setPermissions(prev => ({ ...prev, can_delete_projects: e.target.checked }))}
                        className="h-4 w-4 text-custom-primary focus:ring-custom-primary border-custom-border-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* User Management Permissions */}
                <div className="bg-custom-background-80 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-custom-text-100 mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    User Management
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-custom-text-200">Manage Users</label>
                        <p className="text-xs text-custom-text-400">Can invite, edit, and remove users</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={permissions.can_manage_users}
                        onChange={(e) => setPermissions(prev => ({ ...prev, can_manage_users: e.target.checked }))}
                        className="h-4 w-4 text-custom-primary focus:ring-custom-primary border-custom-border-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-custom-text-200">Manage Workspace</label>
                        <p className="text-xs text-custom-text-400">Can modify workspace settings and billing</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={permissions.can_manage_workspace}
                        onChange={(e) => setPermissions(prev => ({ ...prev, can_manage_workspace: e.target.checked }))}
                        className="h-4 w-4 text-custom-primary focus:ring-custom-primary border-custom-border-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Analytics & Data Permissions */}
                <div className="bg-custom-background-80 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-custom-text-100 mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Analytics & Data
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-custom-text-200">View Analytics</label>
                        <p className="text-xs text-custom-text-400">Can access workspace analytics and reports</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={permissions.can_view_analytics}
                        onChange={(e) => setPermissions(prev => ({ ...prev, can_view_analytics: e.target.checked }))}
                        className="h-4 w-4 text-custom-primary focus:ring-custom-primary border-custom-border-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-custom-text-200">Export Data</label>
                        <p className="text-xs text-custom-text-400">Can export workspace data and reports</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={permissions.can_export_data}
                        onChange={(e) => setPermissions(prev => ({ ...prev, can_export_data: e.target.checked }))}
                        className="h-4 w-4 text-custom-primary focus:ring-custom-primary border-custom-border-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-custom-border-200">
                  <Button
                    variant="outline-primary"
                    onClick={() => {
                      setShowPermissionsModal(false);
                      setSelectedMember(null);
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateMemberPermissions}
                    disabled={permissionsLoading}
                    className="flex items-center gap-2 bg-custom-primary hover:bg-custom-primary/90"
                  >
                    {permissionsLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Update Permissions
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Temporary Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-custom-background-100 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-custom-text-100">
                  Member Added Successfully!
                </h3>
                <Button
                  variant="link-neutral"
                  size="sm"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setTemporaryPassword("");
                    setNewMemberEmail("");
                  }}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">New Member Created</span>
                  </div>
                  <p className="text-sm text-green-700">
                    <strong>{newMemberEmail}</strong> has been added to the workspace.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-custom-text-200 mb-2">
                    Temporary Password
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={temporaryPassword}
                      readOnly
                      className="flex-1 font-mono text-sm bg-custom-background-80 border-custom-border-300"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => copyToClipboard(temporaryPassword)}
                      className="px-3"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Important Instructions</p>
                      <ul className="text-xs text-amber-700 mt-1 space-y-1">
                        <li>• Share this password with the new member</li>
                        <li>• They must change it on first login</li>
                        <li>• Keep this password secure until shared</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setTemporaryPassword("");
                      setNewMemberEmail("");
                    }}
                  >
                    Got it!
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
