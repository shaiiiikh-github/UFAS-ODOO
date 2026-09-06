import type { AuthResponse, LoginCredentials, User, UserRole } from '@/types/auth';
import { api, setToken, clearToken, getToken } from '@/lib/api';

const USER_KEY = 'ufas-auth-user';

// Backend UserRole values are "Admin" | "Accountant" | "Contact".
// The frontend type is 'ADMIN' | 'ACCOUNTANT' | 'CUSTOMER' | 'VENDOR'.
// There is no clean CUSTOMER/VENDOR split on the backend: a portal login is
// just role "Contact". We surface it as 'CONTACT' and cast. If your routing
// depends on CUSTOMER vs VENDOR, add 'CONTACT' to UserRole and branch on the
// linked contact's type instead of the login role.
function mapRole(backendRole: string): UserRole {
  const normalized = backendRole.toUpperCase();
  if (normalized === 'ADMIN') return 'ADMIN';
  if (normalized === 'ACCOUNTANT') return 'ACCOUNTANT';
  // Backend "Contact" portal logins have no customer/vendor split exposed via the
  // API (a contact user cannot read its own contact record). Default to CUSTOMER
  // so portal routing/guards work; the portal still shows the contact's real
  // documents (bills/POs included) regardless of this label.
  return 'CUSTOMER';
}

interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  contact_id: string | null;
}

interface BackendTokenResponse {
  access_token: string;
  token_type: string;
  user: BackendUser;
}

function mapUser(u: BackendUser): User {
  return { id: u.id, name: u.name, email: u.email, role: mapRole(u.role) };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await api.post<BackendTokenResponse>(
      '/api/auth/login',
      { email: credentials.email, password: credentials.password },
      { auth: false },
    );
    setToken(data.access_token);
    const user = mapUser(data.user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { user, token: data.access_token };
  },

  async logout(): Promise<void> {
    clearToken();
    localStorage.removeItem(USER_KEY);
  },

  // Kept for AuthContext, which reads the cached user synchronously on mount.
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw || !getToken()) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  // Verifies the stored token against the backend and refreshes the cached user.
  async validateToken(): Promise<User | null> {
    if (!getToken()) return null;
    try {
      const u = await api.get<BackendUser>('/api/auth/me');
      const user = mapUser(u);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      clearToken();
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
};
