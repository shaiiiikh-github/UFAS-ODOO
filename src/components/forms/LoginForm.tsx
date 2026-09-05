import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { PasswordInput } from './PasswordInput';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      await login(data);
      // Navigation will be handled in the Login page after success
    } catch (error) {
      setFormError('Unable to sign in. Please check your email and password.');
    }
  };

  const isSubmittingOrLoading = isSubmitting || isLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      <PasswordInput
        id="password"
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

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
        disabled={isSubmittingOrLoading}
        className="w-full py-2.5 text-base font-medium bg-[#1a2a3a] hover:bg-[#2a3f56] text-white rounded-md transition-colors duration-150 flex items-center justify-center gap-2"
      >
        {isSubmittingOrLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  );
};