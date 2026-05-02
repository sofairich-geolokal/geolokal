'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedLgu, setSelectedLgu] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Determine target dashboard based on selected role
    let targetDashboard: 'lgu' | 'viewer' | 'superadmin' | undefined;
    if (selectedRole === 'viewer') {
      targetDashboard = 'viewer';
    } else if (selectedRole === 'superadmin') {
      targetDashboard = 'superadmin';
    } else if (selectedRole === 'admin') {
      targetDashboard = 'lgu';
    }

    const result = await login(username, password, selectedRole === 'viewer' ? selectedLgu : undefined, targetDashboard);

    if (result.success && result.user) {
      // Redirect based on role
      const role = result.user.role?.toLowerCase();
      if (role === 'viewer') {
        // Store selected LGU in sessionStorage for viewer dashboard
        if (selectedLgu) {
          sessionStorage.setItem('selectedCityId', selectedLgu);
        }
        // Store user data in localStorage for TopBar display
        localStorage.setItem('loggedInUser', JSON.stringify(result.user));
        // Store location in localStorage for TopBar display
        if (selectedLgu) {
          const locationMap: { [key: string]: string } = {
            '1': 'Ibaan, Batangas',
            '2': 'Teresa, Rizal',
            '3': 'Binangonan, Rizal'
          };
          const locationName = locationMap[selectedLgu] || 'Ibaan, Batangas';
          localStorage.setItem('userLocation', locationName);
        }
        router.push('/viewerDashboard/dashboard');
      } else if (role === 'superadmin') {
        router.push('/superadmin/dashboard');
      } else {
        router.push('/lgu-dashboard/dashboard');
      }
    } else {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <img src="/images/viewerbg.jpg" alt="Login Background" className="w-full h-full object-cover" />
      </div>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/images/logolg.png" 
            alt="GeoLokal Logo" 
            className="w-30 h-30 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">GeoLokal Web GIS</h1>
          <p className="text-sm text-gray-600">Centralized Geospatial Platform</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4" suppressHydrationWarning>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="Enter your username"
              required
              suppressHydrationWarning
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              required
              suppressHydrationWarning
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white"
              required
              suppressHydrationWarning
            >
              <option value="">Select your role</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          {selectedRole === 'viewer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select LGU
              </label>
              <select
                value={selectedLgu}
                onChange={(e) => setSelectedLgu(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white"
                required
                suppressHydrationWarning
              >
                <option value="">Select an LGU</option>
                <option value="1">Ibaan, Batangas</option>
                <option value="2">Teresa, Rizal</option>
                <option value="3">Binangonan, Rizal</option>
              </select>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#318855] hover:bg-[#a35f03] text-white font-bold py-4 rounded-2xl shadow-lg mt-4 disabled:opacity-50 transition-all active:scale-95"
            suppressHydrationWarning
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
