import type { AuthResponse, LoginCredentials, User } from '@/types/auth';

const SESSION_KEY = 'ufas-auth-user';
const mockUsers: Array<User & { password: string }> = [
  { id: 'admin-1', name: 'System Administrator', email: 'admin@urbanfurniture.test', password: 'password123', role: 'ADMIN' },
  { id: 'accountant-1', name: 'Accounts Team', email: 'accountant@urbanfurniture.test', password: 'password123', role: 'ACCOUNTANT' },
  { id: 'customer-rahul', name: 'Rahul Kumar', email: 'rahul@customer.test', password: 'password123', role: 'CUSTOMER' },
  { id: 'vendor-priya', name: 'Priya Sharma', email: 'priya@vendor.test', password: 'password123', role: 'VENDOR' },
];

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const user = mockUsers.find(candidate => candidate.email === credentials.email.toLowerCase() && candidate.password === credentials.password);
    if (!user) throw new Error('Invalid email or password.');
    const authenticatedUser: User = { id: user.id, name: user.name, email: user.email, role: user.role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser));
    return { user: authenticatedUser, token: `mock-token-${authenticatedUser.id}` };
  },
  async logout(): Promise<void> { sessionStorage.removeItem(SESSION_KEY); },
  async validateToken(token: string): Promise<User | null> { return token.startsWith('mock-token-') ? authService.getCurrentUser() : null; },
  getCurrentUser(): User | null {
    const rawUser = sessionStorage.getItem(SESSION_KEY);
    if (!rawUser) return null;
    try { return JSON.parse(rawUser) as User; } catch { sessionStorage.removeItem(SESSION_KEY); return null; }
  },
};
