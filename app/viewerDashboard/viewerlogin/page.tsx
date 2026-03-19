'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Get selected city from sessionStorage
      const selectedCityId = sessionStorage.getItem('selectedCityId');
      
      if (!selectedCityId) {
        setError('Please select a city first.');
        router.push('/viewerDashboard/location-selection');
        return;
      }

      const result = await login(username, password, selectedCityId);
      
      if (result.success) {
        // Clear sessionStorage after successful login
        sessionStorage.removeItem('selectedCityId');
        router.push('/viewerDashboard/dashboard');
        router.refresh();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('A system error occurred. Check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 sm:p-12">
      <div className="absolute inset-0 -z-10">
        <Image src="/images/viewerbg.jpg" alt="Login Background" fill priority className="object-cover" />
      </div>

      <div className="absolute top-6 left-6 w-24 h-24">
        <Image src="/images/logolg.png" alt="Logo" fill className="object-contain" priority />
      </div>

      <div className="bg-white p-8 sm:p-12 rounded-[40px] shadow-2xl w-full max-w-md border border-gray-50">
        <p className="text-gray-500 mb-2 font-medium">Welcome to IBAAN LGU</p>
        <h1 className="text-5xl font-bold mb-10 text-black tracking-tight">Login</h1>
        <form className="space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Username</label>
            <input
              required
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-4 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-100 text-black placeholder:text-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Password</label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 text-black placeholder:text-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#318855] hover:bg-[#a35f03] text-white font-bold py-4 rounded-2xl shadow-lg mt-4 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isLoading ? <><Loader2 className="animate-spin" /> Authenticating...</> : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}