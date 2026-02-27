import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAuthModal } from '@/context/AuthModalContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertCircle, X } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const { openRegister } = useAuthModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <Card className="relative w-full max-w-md z-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          aria-label="Close login"
        >
          <X className="w-4 h-4" />
        </button>
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">🚗 AUTOMALL</h1>
          <CardTitle className="mt-1 text-lg">Sign In</CardTitle>
          <CardDescription>Access your AUTOMALL account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-2 my-1 px-2 text-[11px] font-medium text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <p className="text-center text-[11px] text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="font-medium text-blue-600 hover:underline"
                onClick={() => {
                  onClose();
                  openRegister();
                }}
              >
                Click here to register
              </button>
            </p>

            <div className="mt-3 text-[11px] text-gray-500 space-y-1">
              <p className="font-medium">Demo Accounts:</p>
              <p>👤 Buyer: maria@example.com / password123</p>
              <p>🏪 Seller: juan@example.com / password123</p>
              <p>👨‍💼 Staff: staff@automall.com / staff123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
