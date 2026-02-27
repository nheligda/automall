/**
 * AUTOMALL - Register Page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone_number: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!formData.phone_number.match(/^09\d{9}$/)) {
      setError('Phone number must be in format: 09XXXXXXXXX');
      return;
    }

    setLoading(true);

    try {
      await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
        // All self-registered users are standard customers; they can both buy and sell
        role: 'Customer',
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        {!success ? (
          <>
            <CardHeader className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">🚗 CAVITE AUTOMALL</h1>
              <CardTitle className="mt-2">Create Account</CardTitle>
              <CardDescription>
                Join Cavite Automall to buy and sell vehicles
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">
                      First Name
                    </label>
                    <Input
                      name="first_name"
                      placeholder="Juan"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">
                      Last Name
                    </label>
                    <Input
                      name="last_name"
                      placeholder="Dela Cruz"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Phone (09XXXXXXXXX)
                  </label>
                  <Input
                    name="phone_number"
                    placeholder="09171234567"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Password
                  </label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    name="confirm_password"
                    placeholder="••••••••"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>

                <p className="text-center text-xs text-gray-600">
                  Already have an account?{' '}
                  <a href="/login" className="text-blue-600 hover:underline">
                    Sign in
                  </a>
                </p>
              </form>
            </CardContent>
          </>
        ) : (
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <CardTitle>Account Created!</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
