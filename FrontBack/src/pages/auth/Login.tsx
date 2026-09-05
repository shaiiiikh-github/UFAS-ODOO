import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/forms/LoginForm';

export const Login: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authenticated, redirect based on role
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'ADMIN' || user.role === 'ACCOUNTANT' ? '/dashboard' : '/portal';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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

          {/* Subtle abstract visual element – geometric shapes, not an illustration */}
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

            <div className="mt-6">
              <LoginForm />
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-[#6b7280]">
            &copy; {new Date().getFullYear()} Urban Furniture. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};