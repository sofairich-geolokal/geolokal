'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you'd validate credentials here.
    // For now, we redirect to your specified link upon clicking Sign In.
    console.log("Logging in with:", { username, password });
    router.push('/lgu-dashboard/dashboard');
  };

  return (
    <div 
      className="relative min-h-screen w-full flex items-center justify-center p-6 sm:p-12"
      suppressHydrationWarning
    >
      {/* Background Image Layer */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/Login-bg.jpg" // Ensure this is in your /public folder
          alt="Login Background"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* LGU Logo - Positioned at top left like the design */}
      <div className="absolute top-10 left-10 hidden lg:block">
        <div className="bg-white rounded-full p-2 shadow-lg border border-gray-100">
          <Image 
            src="/logo.png" 
            alt="Ibaan LGU Logo" 
            width={100} 
            height={100}
          />
        </div>
      </div>

      {/* Centered Login Card */}
      <div className="bg-white p-8 sm:p-12 rounded-[40px] shadow-2xl w-full max-w-md border border-gray-50">
        <p className="text-gray-500 mb-2 font-medium">Welcome to IBAAN LGU</p>
        <h1 className="text-5xl font-bold mb-10 text-black tracking-tight">Login</h1>

        <form className="space-y-6" onSubmit={handleLogin}>
          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Enter your username or email address
            </label>
            <input
              required
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or email address"
              className="w-full px-4 py-4 rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300 text-black"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Enter your Password
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300 text-black"
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

          {/* Forgot Password */}
          <div className="text-right">
            <a href="#" className="text-sm font-bold text-[#5C3D2E] hover:opacity-80 transition-opacity">
              Forgot Password
            </a>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full bg-[#BF7004] hover:bg-[#A35F03] text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] mt-4"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}