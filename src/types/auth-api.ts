export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
};

export type RegisterRequest = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
};

export type LoginRequest = {
  email: string;
  password: string;
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
};

export type UserResponse = {
  id: number;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  profileImage: string | null;
  active: boolean;
  addresses: UserAddress[];
  role: UserRole[];
  createdAt: string;
  updatedAt: string;
};

export type UserAddress = {
  id: number;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
};

export type UserRole = {
  roleId: number;
  roleName: string;
  active: boolean;
  description: string;
  permissions: {
    id: number;
    name: string;
    resource: string;
    action: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  }[];
};

export type UpdateProfileRequest = {
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
};

export type UpdatePasswordRequest = {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type GetUsersParams = {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc" | string;
  search?: string;
  role?: string;
  active?: boolean;
};

export type UserPageResponse = {
  content: UserResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
};
