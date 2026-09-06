import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/types/auth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'CUSTOMER', 'VENDOR']),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, isLoading, user, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'ADMIN',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'ADMIN' || user.role === 'ACCOUNTANT' ? '/dashboard' : '/portal';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      await login({
        email: data.email,
        password: data.password,
        role: data.role as UserRole,
      });
      // Redirect will happen in useEffect after authentication
    } catch (error) {
      setFormError('Unable to sign in. Please check your email and password.');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f7f8fa]">
      {/* Left brand section */}
      <div className="hidden lg:flex lg:w-1/2 bg-white flex-col justify-center px-12 py-12 relative">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#1a2a3a] rounded-md flex items-center justify-center text-white font-bold text-sm">
                UF
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1a2a3a] tracking-tight">Urban Furniture</div>
                <div className="text-xs uppercase tracking-widest text-[#6b7280]">Accounting System</div>
              </div>
            </div>
            <p className="text-sm text-[#6b7280] mt-4 leading-relaxed">
              Manage sales, purchases, payments and financial reporting in one place.
            </p>
          </div>
          <div className="mt-12 flex gap-4 opacity-30">
            <div className="w-16 h-16 border-2 border-[#1a2a3a] rounded-sm"></div>
            <div className="w-16 h-16 bg-[#1a2a3a] rounded-sm"></div>
            <div className="w-16 h-16 border-2 border-[#1a2a3a] rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right login form section */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-[#1a2a3a] rounded-md flex items-center justify-center text-white font-bold text-xs">
                UF
              </div>
              <span className="text-lg font-bold text-[#1a2a3a]">Urban Furniture</span>
            </div>
            <p className="text-xs text-[#6b7280]">Accounting System</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border border-[#e5e7eb]">
            <h1 className="text-2xl font-semibold text-[#1a2332]">Welcome back</h1>
            <p className="text-sm text-[#6b7280] mt-1">Sign in to continue to your account.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              {/* Role Selector */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-[#1a2332]">
                  Sign in as
                </label>
                <select
                  id="role"
                  {...register('role')}
                  className="w-full px-3 py-2.5 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="VENDOR">Vendor</option>
                </select>
                {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1a2332]">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={`w-full px-3 py-2.5 bg-white border rounded-md text-sm transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-[#1a2a3a] ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'border-[#e5e7eb] hover:border-[#c1c7cd]'
                  }`}
                  {...register('email')}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1a2332]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`w-full px-3 py-2.5 bg-white border rounded-md text-sm transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-[#1a2a3a] ${
                      errors.password ? 'border-red-500 focus:ring-red-500' : 'border-[#e5e7eb] hover:border-[#c1c7cd]'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6b7280] hover:text-[#1a2332] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#1a2a3a] focus:ring-[#1a2a3a] border-[#e5e7eb] rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-[#6b7280]">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-[#1a2a3a] hover:underline focus:outline-none focus:ring-2 focus:ring-[#1a2a3a] focus:ring-offset-2 rounded"
                >
                  Forgot password?
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {formError}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-2.5 text-base font-medium bg-[#1a2a3a] hover:bg-[#2a3f56] text-white rounded-md transition-colors duration-150 flex items-center justify-center gap-2"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-[#6b7280]">
            &copy; {new Date().getFullYear()} Urban Furniture. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};