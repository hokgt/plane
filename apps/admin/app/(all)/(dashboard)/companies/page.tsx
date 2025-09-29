"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { Building2, Users, UserPlus, Plus, Search, Filter, MoreHorizontal } from "lucide-react";
import { Button, Input, CustomSelect, CustomMenu } from "@plane/ui";

// Types
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
  // states
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [companyUsers, setCompanyUsers] = useState<ICompanyUser[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Create company form state
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [maxUsers, setMaxUsers] = useState(50);
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [createLoading, setCreateLoading] = useState(false);

  // Add user form state
  const [userEmail, setUserEmail] = useState("");
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userRole, setUserRole] = useState("staff");
  const [companyRoleTitle, setCompanyRoleTitle] = useState("");
  const [addUserLoading, setAddUserLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyUsers(selectedCompany);
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/companies/");
      
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      
      const data = await response.json();
      setCompanies(data);
      
      // Auto-select first company if available
      if (data.length > 0 && !selectedCompany) {
        setSelectedCompany(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyUsers = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/users/`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch company users");
      }
      
      const data = await response.json();
      setCompanyUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleCreateCompany = async () => {
    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }

    try {
      setCreateLoading(true);
      const response = await fetch("/api/companies/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: companyName,
          description: companyDescription,
          max_users: maxUsers,
          primary_color: primaryColor,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create company");
      }

      const newCompany = await response.json();
      setCompanies([...companies, newCompany]);
      setShowCreateCompanyModal(false);
      
      // Reset form
      setCompanyName("");
      setCompanyDescription("");
      setMaxUsers(50);
      setPrimaryColor("#3B82F6");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedCompany || !userEmail.trim()) {
      setError("Company and user email are required");
      return;
    }

    try {
      setAddUserLoading(true);
      const response = await fetch(`/api/companies/${selectedCompany}/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          display_name: userDisplayName,
          first_name: userFirstName,
          last_name: userLastName,
          role: userRole,
          company_role_title: companyRoleTitle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add user");
      }

      const newUser = await response.json();
      setCompanyUsers([...companyUsers, newUser]);
      setShowAddUserModal(false);
      
      // Reset form
      setUserEmail("");
      setUserDisplayName("");
      setUserFirstName("");
      setUserLastName("");
      setUserRole("staff");
      setCompanyRoleTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAddUserLoading(false);
    }
  };

  const filteredUsers = companyUsers.filter((user) => {
    const matchesSearch = 
      user.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.company_display_name && user.company_display_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  if (loading) {
    return (
      <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-custom-text-300">Loading companies...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-custom-border-100 mx-4 py-4 space-y-1 flex-shrink-0">
        <div className="flex flex-col gap-1">
          <div className="text-xl font-medium text-custom-text-100">Company Management</div>
          <div className="text-sm font-normal text-custom-text-300">
            Manage companies and their users across the instance.
          </div>
        </div>
        <Button
          onClick={() => setShowCreateCompanyModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Company
        </Button>
      </div>

      <div className="flex-grow overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-4">
        <div className="space-y-6">
          {/* Company Selection */}
          <div className="bg-custom-background-90 border border-custom-border-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-custom-text-100">Select Company</h3>
              <div className="text-sm text-custom-text-400">
                {companies.length} companies
              </div>
            </div>
            
            <CustomSelect
              value={selectedCompany}
              onChange={(value) => setSelectedCompany(value)}
              options={companies.map(company => ({
                value: company.id,
                label: company.name,
              }))}
              placeholder="Select a company"
              className="w-full"
            />
          </div>

          {selectedCompanyData && (
            <div className="bg-custom-background-90 border border-custom-border-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: selectedCompanyData.primary_color }}
                  >
                    {selectedCompanyData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-custom-text-100">
                      {selectedCompanyData.name}
                    </h3>
                    <p className="text-sm text-custom-text-400">
                      {selectedCompanyData.description}
                    </p>
                    <p className="text-sm text-custom-text-500 mt-1">
                      {selectedCompanyData.current_user_count} / {selectedCompanyData.max_users} users
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-custom-text-100">Manager</p>
                    <p className="text-sm text-custom-text-400">{selectedCompanyData.manager_display_name}</p>
                  </div>
                  <Button
                    onClick={() => setShowAddUserModal(true)}
                    disabled={!selectedCompanyData.can_add_users}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* User Management */}
          {selectedCompany && (
            <div className="bg-custom-background-90 border border-custom-border-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-custom-text-100">Company Users</h3>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-custom-text-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <CustomSelect
                    value={roleFilter}
                    onChange={(value) => setRoleFilter(value)}
                    options={[
                      { value: "", label: "All Roles" },
                      { value: "manager", label: "Manager" },
                      { value: "staff", label: "Staff" },
                      { value: "guest", label: "Guest" },
                    ]}
                    placeholder="Filter by role"
                    className="w-40"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-custom-border-200">
                  <thead className="bg-custom-background-80">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-custom-text-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-custom-text-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-custom-text-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-custom-text-400 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-custom-text-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-custom-background-90 divide-y divide-custom-border-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-custom-background-80">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-custom-background-80 flex items-center justify-center text-custom-text-300 text-sm font-medium">
                              {user.user_display_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-custom-text-100">
                                {user.company_display_name || user.user_display_name}
                              </div>
                              <div className="text-sm text-custom-text-400">
                                {user.user_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-custom-text-400">
                          {new Date(user.joined_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <CustomMenu
                            options={[
                              {
                                label: "Edit Role",
                                onClick: () => {
                                  // TODO: Implement edit role functionality
                                },
                              },
                              {
                                label: user.is_active ? "Deactivate" : "Activate",
                                onClick: () => {
                                  // TODO: Implement activate/deactivate functionality
                                },
                              },
                              {
                                label: "Remove from Company",
                                onClick: () => {
                                  // TODO: Implement remove user functionality
                                },
                              },
                            ]}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
              <Button
                onClick={() => setError(null)}
                variant="ghost"
                size="sm"
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Company Modal */}
      {showCreateCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-custom-background-100 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-custom-text-100 mb-4">Create Company</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-custom-text-300 mb-1">
                  Company Name *
                </label>
                <Input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-custom-text-300 mb-1">
                  Description
                </label>
                <textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Enter company description"
                  className="w-full px-3 py-2 border border-custom-border-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-custom-background-90 text-custom-text-100"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-custom-text-300 mb-1">
                    Max Users
                  </label>
                  <Input
                    type="number"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-custom-text-300 mb-1">
                    Primary Color
                  </label>
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full h-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => setShowCreateCompanyModal(false)}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCompany}
                loading={createLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Company
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-custom-background-100 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-custom-text-100 mb-4">Add User to Company</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-custom-text-300 mb-1">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-custom-text-300 mb-1">
                  Display Name
                </label>
                <Input
                  type="text"
                  value={userDisplayName}
                  onChange={(e) => setUserDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-custom-text-300 mb-1">
                    First Name
                  </label>
                  <Input
                    type="text"
                    value={userFirstName}
                    onChange={(e) => setUserFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-custom-text-300 mb-1">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    value={userLastName}
                    onChange={(e) => setUserLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-custom-text-300 mb-1">
                  Role in Company
                </label>
                <CustomSelect
                  value={userRole}
                  onChange={(value) => setUserRole(value)}
                  options={[
                    { value: "staff", label: "Staff" },
                    { value: "guest", label: "Guest" },
                  ]}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-custom-text-300 mb-1">
                  Job Title
                </label>
                <Input
                  type="text"
                  value={companyRoleTitle}
                  onChange={(e) => setCompanyRoleTitle(e.target.value)}
                  placeholder="Enter job title"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => setShowAddUserModal(false)}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                loading={addUserLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                Add User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CompanyManagementPage;

