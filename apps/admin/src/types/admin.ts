export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  loginHistory: LoginHistoryEntry[];
  avatar?: string;
  phone?: string;
  department?: string;
  isEmailVerified: boolean;
}

export interface UserFormData {
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  department?: string;
  password?: string;
}

export interface CreateUserData extends Omit<UserFormData, 'status'> {
  password: string;
}

export interface UpdateUserData extends Partial<UserFormData> {
  _id: string;
}

export type UserRole = 'admin' | 'manager' | 'staff' | 'client';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface LoginHistoryEntry {
  timestamp: Date;
  ip: string;
  userAgent: string;
  location?: string;
  success: boolean;
}

export interface UserTableColumn {
  key: keyof User | 'actions';
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface UserTableProps {
  users: User[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: UserFilters;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onFiltersChange: (filters: UserFilters) => void;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  onUserEdit: (user: User) => void;
  onUserDelete: (userId: string) => void;
  onUserToggleStatus: (userId: string, status: UserStatus) => void;
  loading?: boolean;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive';
  requireConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<UserRole, number>;
  usersByDepartment: Record<string, number>;
  recentLogins: number;
}

export interface ExportOptions {
  format: 'csv' | 'excel';
  fields: (keyof User)[];
  filters?: UserFilters;
  includeHistory?: boolean;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationData;
}

export interface UserListResponse extends ApiResponse {
  data: {
    users: User[];
    stats: UserStats;
  };
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}