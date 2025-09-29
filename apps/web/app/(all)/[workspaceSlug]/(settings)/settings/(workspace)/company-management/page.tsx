"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import {
  Search,
  MoreVertical,
  Building2,
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
  Copy,
  Settings,
  Trash2,
  Edit,
  Plus
} from "lucide-react";

import { Button, Input, Avatar, CustomSelect, CustomMenu } from "@plane/ui";
import { PageHead } from "@/components/core";
import { SettingsContentWrapper } from "@/components/settings";
import { useUser } from "@/hooks/store";
import { useUserPermissions } from "@/hooks/store/user";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";

// Company and CompanyUser types
interface ICompany {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  max_users: number;
  primary_color: string;
  logo_url?: string;
  manager_email: string;
  manager_display_name: string;
  current_user_count: number;
  can_add_users: boolean;
  created_at: string;
  updated_at: string;
}

interface ICompanyUser {
  id: string;
  company: string;
  user: string;
  role: 'manager' | 'staff' | 'guest';
  is_active: boolean;
  joined_at: string;
  company_display_name?: string;
  company_role_title?: string;
  user_email: string;
  user_display_name: string;
  user_first_name?: string;
  user_last_name?: string;
  user_avatar?: string;
  company_name: string;
  created_at: string;
  updated_at: string;
}

const CompanyManagementPage = observer(() => {
  const { workspaceSlug } = useParams();
  const { data: currentUser } = useUser();
  const { allowPermissions, workspaceUserInfo, fetchUserWorkspaceInfo } = useUserPermissions();

  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [companyUsers, setCompanyUsers] = useState<ICompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Company management modals
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showCompanyUsersModal, setShowCompanyUsersModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<ICompany | null>(null);
  
  // Company creation form
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [maxUsers, setMaxUsers] = useState(50);
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [createLoading, setCreateLoading] = useState(false);
  
  // Add user to company form
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addDisplayName, setAddDisplayName] = useState("");
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addRole, setAddRole] = useState("staff");
  const [addRoleTitle, setAddRoleTitle] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  
  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Check permissions on component mount
  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentUser) return;
      
      // Check if user can manage companies (owner or manager)
      const canManageCompanies = currentUser.is_owner || currentUser.user_role === 'manager';
      
      if (!canManageCompanies) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      
      await fetchCompanies();
      setLoading(false);
    };

    checkPermissions();
  }, [currentUser]);

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      } else {
        setError('Failed to fetch companies');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Failed to fetch companies');
    }
  };

  // Fetch company users
  const fetchCompanyUsers = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/users/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompanyUsers(data);
      } else {
        setError('Failed to fetch company users');
      }
    } catch (error) {
      console.error('Error fetching company users:', error);
      setError('Failed to fetch company users');
    }
  };

  // Create company
  const createCompany = async () => {
    if (!companyName.trim()) {
      setError("Please enter a company name");
      return;
    }

    setCreateLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/companies/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName.trim(),
          description: companyDescription.trim() || undefined,
          max_users: maxUsers,
          primary_color: primaryColor,
        }),
      });

      if (response.ok) {
        const newCompany = await response.json();
        setCompanies([...companies, newCompany]);
        
        // Reset form and close modal
        setCompanyName("");
        setCompanyDescription("");
        setMaxUsers(50);
        setPrimaryColor("#3B82F6");
        setShowCreateCompanyModal(false);
        
        console.log("Company created successfully!");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create company");
      }
    } catch (error) {
      console.error('Error creating company:', error);
      setError("Failed to create company. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Add user to company
  const addUserToCompany = async () => {
    if (!addEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!selectedCompany) {
      setError("No company selected");
      return;
    }

    setAddLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/companies/${selectedCompany.id}/users/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: addEmail.trim().toLowerCase(),
          display_name: addDisplayName.trim() || undefined,
          first_name: addFirstName.trim() || undefined,
          last_name: addLastName.trim() || undefined,
          role: addRole,
          company_role_title: addRoleTitle.trim() || undefined,
        }),
      });

      if (response.ok) {
        const newUser = await response.json();
        setCompanyUsers([...companyUsers, newUser]);
        
        // Refresh companies to update user count
        await fetchCompanies();
        
        // Reset form
        setAddEmail("");
        setAddDisplayName("");
        setAddFirstName("");
        setAddLastName("");
        setAddRole("staff");
        setAddRoleTitle("");
        setShowAddUserModal(false);
        
        // Show success message with temporary password if provided
        if (newUser.temporary_password) {
          setTemporaryPassword(newUser.temporary_password);
          setNewMemberEmail(addEmail);
          setShowPasswordModal(true);
        }
        
        console.log("User added to company successfully!");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add user to company");
      }
    } catch (error) {
      console.error('Error adding user to company:', error);
      setError("Failed to add user to company. Please try again.");
    } finally {
      setAddLoading(false);
    }
  };

  // Delete company
  const deleteCompany = async (companyId: string) => {
    if (!confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/${companyId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setCompanies(companies.filter(company => company.id !== companyId));
        console.log("Company deleted successfully!");
      } else {
        setError("Failed to delete company");
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      setError("Failed to delete company");
    }
  };

  // Remove user from company
  const removeUserFromCompany = async (companyId: string, userId: string) => {
    if (!confirm("Are you sure you want to remove this user from the company?")) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/${companyId}/users/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setCompanyUsers(companyUsers.filter(user => user.id !== userId));
        await fetchCompanies(); // Refresh to update user count
        console.log("User removed from company successfully!");
      } else {
        setError("Failed to remove user from company");
      }
    } catch (error) {
      console.error('Error removing user from company:', error);
      setError("Failed to remove user from company");
    }
  };

  // Filter companies based on search
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.manager_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (accessDenied) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to manage companies. Only owners and managers can access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHead title="Company Management" />
      <SettingsContentWrapper>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Company Management</h3>
              <p className="text-sm text-gray-500">
                Manage companies, users, and permissions in your organization
              </p>
            </div>
            <Button
              onClick={() => setShowCreateCompanyModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Company
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Companies List */}
          <div className="grid gap-4">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div 
                      className="flex h-12 w-12 items-center justify-center rounded-lg text-white font-semibold"
                      style={{ backgroundColor: company.primary_color }}
                    >
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-medium text-gray-900">{company.name}</h4>
                        {!company.is_active && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      {company.description && (
                        <p className="mt-1 text-sm text-gray-600">{company.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Crown className="h-4 w-4" />
                          {company.manager_display_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {company.current_user_count}/{company.max_users} users
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Created {new Date(company.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCompany(company);
                        setShowCompanyUsersModal(true);
                        fetchCompanyUsers(company.id);
                      }}
                    >
                      <Users className="h-4 w-4" />
                      Manage Users
                    </Button>
                    <CustomMenu
                      menuItems={[
                        {
                          id: "edit",
                          label: "Edit Company",
                          icon: Edit,
                          onClick: () => {
                            // TODO: Implement edit functionality
                            console.log("Edit company:", company.id);
                          }
                        },
                        {
                          id: "delete",
                          label: "Delete Company",
                          icon: Trash2,
                          onClick: () => deleteCompany(company.id),
                          className: "text-red-600 hover:text-red-700"
                        }
                      ]}
                    >
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </CustomMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No companies found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm ? "Try adjusting your search criteria." : "Get started by creating your first company."}
              </p>
            </div>
          )}
        </div>
      </SettingsContentWrapper>

      {/* Create Company Modal */}
      {showCreateCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-medium text-gray-900">Create Company</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <Input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Enter company description"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Maximum Users</label>
                <Input
                  type="number"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(parseInt(e.target.value) || 50)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="mt-1 h-10 w-full"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateCompanyModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={createCompany}
                loading={createLoading}
              >
                Create Company
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Company Users Modal */}
      {showCompanyUsersModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Users in {selectedCompany.name}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddUserModal(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Add User
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompanyUsersModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="space-y-3">
                {companyUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={user.user_display_name}
                        src={user.user_avatar}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {user.company_display_name || user.user_display_name}
                          </span>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                            user.role === 'manager' 
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'staff'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{user.user_email}</p>
                        {user.company_role_title && (
                          <p className="text-sm text-gray-500">{user.company_role_title}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!user.is_active && (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">
                          Inactive
                        </span>
                      )}
                      <CustomMenu
                        menuItems={[
                          {
                            id: "edit",
                            label: "Edit Role",
                            icon: Edit,
                            onClick: () => {
                              // TODO: Implement edit functionality
                              console.log("Edit user role:", user.id);
                            }
                          },
                          {
                            id: "remove",
                            label: "Remove from Company",
                            icon: UserX,
                            onClick: () => removeUserFromCompany(selectedCompany.id, user.id),
                            className: "text-red-600 hover:text-red-700"
                          }
                        ]}
                      >
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </CustomMenu>
                    </div>
                  </div>
                ))}
              </div>
              
              {companyUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No users in this company</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Start by adding users to this company.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-medium text-gray-900">Add User to {selectedCompany.name}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <Input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <Input
                  type="text"
                  value={addDisplayName}
                  onChange={(e) => setAddDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <Input
                    type="text"
                    value={addFirstName}
                    onChange={(e) => setAddFirstName(e.target.value)}
                    placeholder="First name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <Input
                    type="text"
                    value={addLastName}
                    onChange={(e) => setAddLastName(e.target.value)}
                    placeholder="Last name"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role in Company</label>
                <CustomSelect
                  value={addRole}
                  onChange={setAddRole}
                  options={[
                    { value: 'staff', label: 'Staff' },
                    { value: 'guest', label: 'Guest' },
                  ]}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <Input
                  type="text"
                  value={addRoleTitle}
                  onChange={(e) => setAddRoleTitle(e.target.value)}
                  placeholder="Enter job title"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddUserModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={addUserToCompany}
                loading={addLoading}
              >
                Add User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-medium text-gray-900">User Created Successfully</h3>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                A new user has been created with the email <strong>{newMemberEmail}</strong>.
              </p>
              <div className="mt-4 rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Temporary Password</h3>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-yellow-100 px-2 py-1 text-sm font-mono">
                          {temporaryPassword}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(temporaryPassword);
                            // You could add a toast notification here
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-yellow-700">
                        Please share this password with the user. They should change it after their first login.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowPasswordModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default CompanyManagementPage;