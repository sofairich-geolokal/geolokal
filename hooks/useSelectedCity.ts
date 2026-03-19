'use client';

import { useState, useEffect } from 'react';

interface City {
  id: number;
  name: string;
  province: string;
}

export const useSelectedCity = () => {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSelectedCity = async () => {
      try {
        // Get the current user's city from the database
        const response = await fetch('/api/user/city');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.city) {
            setSelectedCity(data.city);
          }
        }
      } catch (error) {
        console.error('Error fetching selected city:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSelectedCity();
  }, []);

  return { selectedCity, loading };
};
