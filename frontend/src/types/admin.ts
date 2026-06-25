export type AdminRole = 'SUPER_ADMIN' | 'DISTRICT_ADMIN' | 'SUB_DISTRICT_ADMIN';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  districtId?: string;
  districtName?: string | null;
  subDistrictId?: string;
  subDistrictName?: string | null;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminAuthResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminUser;
}

export interface AdminApiError {
  code: string;
  message: string;
  retryAfter?: number;
}
