import type { LoginCredentials, AuthResponse, User, UserRole } from '@/types/auth';

// Mock user data
const mockUsers: Record<UserRole, User> = {
  ADMIN: {
    id: '1',
    name: 'Admin User',
    email: 'admin@urbanfurniture.com',
    role: 'ADMIN',
  },
  ACCOUNTANT: {
    id: '2',
    name: 'Accountant User',
    email: 'accountant@urbanfurniture.com',
    role: 'ACCOUNTANT',
  },
  CUSTOMER: {
    id: '3',
    name: 'Customer User',
    email: 'customer@urbanfurniture.com',
    role: 'CUSTOMER',
  },
  VENDOR: {
    id: '4',
    name: 'Vendor User',
    email: 'vendor@urbanfurniture.com',
    role: 'VENDOR',
  },
};

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    // For demo, we accept any non-empty email/password and use the selected role
    // In production, validate against backend
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required.');
    }

    // Find user by role (or return mock based on role)
    const user = mockUsers[credentials.role];
    if (!user) {
      throw new Error('Invalid role selected.');
    }

    // Simulate token
    const token = `mock-jwt-${user.id}-${Date.now()}`;

    return { user, token };
  },

  logout: async (): Promise<void> => {
    // Simulate logout
    await new Promise(resolve => setTimeout(resolve, 300));
    // Clear token from localStorage if needed
  },

  validateToken: async (token: string): Promise<User | null> => {
    // Mock validation
    await new Promise(resolve => setTimeout(resolve, 200));
    if (token && token.startsWith('mock-jwt-')) {
      // Extract user from token (mock)
      const userId = token.split('-')[2];
      const user = Object.values(mockUsers).find(u => u.id === userId);
      return user || null;
    }
    return null;
  },
};