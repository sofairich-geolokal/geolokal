'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const cities = [
  { 
    name: 'Ibaan, Batangas', 
    image: '/images/Ibaan, Batangas.png',
    id: 'ibaan-batangas'
  },
  { 
    name: 'Teresa, Rizal', 
    image: '/images/Teresa, Rizal.png',
    id: 'teresa-rizal'
  },
  { 
    name: 'Binangonan, Rizal', 
    image: '/images/Binangonan, Rizal.png',
    id: 'binangonan-rizal'
  }
];

export default function CitySelection() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const router = useRouter();

  const handleCitySelect = (cityId: string) => {
    setSelectedCity(cityId);
  };

  const handleContinue = () => {
    if (selectedCity) {
      router.push(`/viewerDashboard/viewerlogin?location=${selectedCity}`);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 sm:p-12">
      {/* Background with diagonal split */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#318855] via-[#318855] to-white"></div>
      </div>

      {/* Logo */}
      <div className="absolute top-6 left-6 w-24 h-24">
        <Image src="/images/logo.png" alt="GEOLOKAL" fill className="object-contain" priority />
      </div>

      {/* City Selection Content */}
      <div className="bg-white/90 backdrop-blur-sm p-8 sm:p-12 rounded-[40px] shadow-2xl w-full max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-black text-center tracking-tight">Choose one City</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cities.map((city) => (
            <div
              key={city.id}
              onClick={() => handleCitySelect(city.id)}
              className={`relative cursor-pointer rounded-2xl overflow-hidden border-4 transition-all duration-300 hover:scale-105 ${
                selectedCity === city.id 
                  ? 'border-[#318855] shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="aspect-square relative">
                <Image 
                  src={city.image} 
                  alt={city.name} 
                  fill 
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white font-semibold text-sm">{city.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedCity}
          className="w-full bg-[#318855] hover:bg-[#266944] text-white font-bold py-4 rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          Continue to Login
        </button>
      </div>
    </div>
  );
}
