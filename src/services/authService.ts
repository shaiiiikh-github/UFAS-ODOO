import type { LoginCredentials, AuthResponse, User } from '@/types/auth';

// This is a placeholder service – it will be replaced by Flask API calls.
// We do NOT hardcode credentials or fake success.
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    void credentials;
    // Simulate API call – will be replaced with real fetch to Flask
    // For now, we throw an error to indicate "not implemented" so we can test error state.
    // Actually, we want to prepare for future integration, but we also need to demonstrate
    // a successful login flow for testing. The spec says: "Do NOT hardcode fake credentials."
    // We'll throw an error so that login always fails, forcing the user to see error state.
    // This also prevents accidental fake login.
    throw new Error('Authentication service not yet connected to backend.');
  },

  logout: async (): Promise<void> => {
    // Placeholder for logout
  },

  // This can be used later to check if token is valid
  validateToken: async (token: string): Promise<User | null> => {
    void token;
    return null;
  },
};
