export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'CUSTOMER' | 'VENDOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token?: string;
}