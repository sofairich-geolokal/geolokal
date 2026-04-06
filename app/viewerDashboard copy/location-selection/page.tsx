'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface City {
  id: number;
  name: string;
  province: string;
  image: string;
}

export default function LocationSelection() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<number | null>(null);

  // Hardcoded cities with exact image paths
  const cities: City[] = [
    { id: 1, name: 'Ibaan', province: 'Batangas', image: '/images/Ibaan, Batangas.png' },
    { id: 2, name: 'Teresa', province: 'Rizal', image: '/images/Teresa, Rizal.png' },
    { id: 3, name: 'Binangonan', province: 'Rizal', image: '/images/Binangonan, Rizal.png' },
  ];

  const handleCitySelect = (cityId: number) => {
    setSelectedCity(cityId);
  };

  const handleContinue = () => {
    if (selectedCity) {
      sessionStorage.setItem('selectedCityId', selectedCity.toString());
      router.push('/viewerDashboard/viewerlogin');
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Section - Green Background */}
      <div className="w-1/2 bg-[#318855] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <Image 
              src="/logo.png" 
              alt="GEOLOKAL Logo" 
              width={200} 
              height={80} 
              className="mx-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-white">Choose one City</h1>
        </div>
      </div>

      {/* Right Section - White Background with City Cards */}
      <div className="w-1/2 bg-white flex items-center justify-center p-12">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-3 gap-8">
            {cities.map((city) => (
              <div
                key={city.id}
                onClick={() => handleCitySelect(city.id)}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedCity === city.id 
                    ? 'transform scale-105 shadow-2xl' 
                    : 'hover:transform hover:scale-102 hover:shadow-lg'
                }`}
              >
                <div className={`rounded-2xl overflow-hidden border-4 ${
                  selectedCity === city.id 
                    ? 'border-[#318855]' 
                    : 'border-transparent'
                }`}>
                  <div className="relative h-48 w-full">
                    <Image
                      src={city.image}
                      alt={`${city.name} aerial view`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="bg-white p-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {city.name}, {city.province}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedCity && (
            <div className="mt-12 text-center">
              <button
                onClick={handleContinue}
                className="bg-[#318855] hover:bg-[#266844] text-white font-bold py-4 px-12 rounded-2xl shadow-lg transition-all duration-200 active:scale-95"
              >
                Continue to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
