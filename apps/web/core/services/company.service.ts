import { APIService } from "./api.service";

export interface ICompany {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  max_users: number;
  primary_color: string;
  logo?: string;
  logo_asset?: string;
  logo_url?: string;
  manager: string;
  manager_email: string;
  manager_display_name: string;
  current_user_count: number;
  can_add_users: boolean;
  created_at: string;
  updated_at: string;
}

export interface ICompanyUser {
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

export interface ICompanyCreateData {
  name: string;
  description?: string;
  max_users?: number;
  primary_color?: string;
  logo?: string;
  logo_asset?: string;
}

export interface ICompanyUserCreateData {
  email: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  role: 'manager' | 'staff' | 'guest';
  company_role_title?: string;
}

export interface ICompanyUpdateData {
  name?: string;
  description?: string;
  is_active?: boolean;
  max_users?: number;
  primary_color?: string;
  logo?: string;
  logo_asset?: string;
}

export interface ICompanyUserUpdateData {
  role?: 'manager' | 'staff' | 'guest';
  is_active?: boolean;
  company_display_name?: string;
  company_role_title?: string;
}

export class CompanyService extends APIService {
  constructor() {
    super("/api");
  }

  // Company Management
  async getCompanies(): Promise<ICompany[]> {
    return this.get("/companies/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCompany(companyId: string): Promise<ICompany> {
    return this.get(`/companies/${companyId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createCompany(data: ICompanyCreateData): Promise<ICompany> {
    return this.post("/companies/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCompany(companyId: string, data: ICompanyUpdateData): Promise<ICompany> {
    return this.patch(`/companies/${companyId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCompany(companyId: string): Promise<void> {
    return this.delete(`/companies/${companyId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // Company User Management
  async getCompanyUsers(companyId: string, params?: {
    search?: string;
    role?: string;
    is_active?: string;
  }): Promise<ICompanyUser[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active);

    const url = `/companies/${companyId}/users/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return this.get(url)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addUserToCompany(companyId: string, data: ICompanyUserCreateData): Promise<ICompanyUser & { temporary_password?: string }> {
    return this.post(`/companies/${companyId}/users/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCompanyUser(companyId: string, userId: string, data: ICompanyUserUpdateData): Promise<ICompanyUser> {
    return this.patch(`/companies/${companyId}/users/${userId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeUserFromCompany(companyId: string, userId: string): Promise<void> {
    return this.delete(`/companies/${companyId}/users/${userId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // User Management (Admin)
  async getAllUsers(params?: {
    search?: string;
    role?: string;
    is_active?: string;
    company_id?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active);
    if (params?.company_id) queryParams.append('company_id', params.company_id);

    const url = `/users/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return this.get(url)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateUserRole(userId: string, role: string): Promise<any> {
    return this.patch(`/users/${userId}/`, { user_role: role })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async toggleUserStatus(userId: string): Promise<any> {
    return this.put(`/users/${userId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUserDetails(userId: string): Promise<any> {
    return this.get(`/users/${userId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
