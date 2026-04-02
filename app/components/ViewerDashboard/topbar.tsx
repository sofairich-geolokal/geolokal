"use client";
import React, { useState, useEffect } from 'react';

const TopBar = () => {
  const [currentUser, setCurrentUser] = useState('Viewer');
  const [userLocation, setUserLocation] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user data and location from database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data from localStorage (set during login)
        const storedUser = localStorage.getItem('loggedInUser');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setCurrentUser(userData.username || userData.name || 'Viewer');
        }

        // First check if location is in localStorage (set during login)
        const storedLocation = localStorage.getItem('userLocation');
        if (storedLocation) {
          setUserLocation(storedLocation);
          setIsLoading(false);
          return;
        }

        // If not in localStorage, try to fetch from database
        const response = await fetch('/api/user/location');
        if (response.ok) {
          const data = await response.json();
          setUserLocation(data.location);
          // Update localStorage with database value
          localStorage.setItem('userLocation', data.location);
        } else {
          setUserLocation('Ibaan, Batangas');
        }
      } catch (error) {
        console.error('Error fetching user location:', error);
        // Fallback to default
        const storedLocation = localStorage.getItem('userLocation');
        setUserLocation(storedLocation || 'Ibaan, Batangas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Save location to database when viewer logs in with location selection
  const saveLocationToDatabase = async (location: string) => {
    try {
      const response = await fetch('/api/user/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Location saved to database:', data);
        // Also update localStorage as backup
        localStorage.setItem('userLocation', location);
      }
    } catch (error) {
      console.error('Error saving location to database:', error);
      // Fallback to localStorage
      localStorage.setItem('userLocation', location);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-300 px-8 flex items-center justify-between">
      <div className="text-sm font-semibold text-gray-500">
        Dashboard / User / Viewer
      </div>
      <div className="text-right">
        <div style={{ display: 'inline-block' }}>
          <p className="text-sm text-slate-800" 
          style={{ display: 'inline', marginRight: '8px' }}>
            <b>User: </b>{currentUser}
          </p>
          <p 
            className="text-sm text-slate-800"
            style={{ display: 'inline' }}
          >
            <b> Location: </b>{isLoading ? 'Loading...' : userLocation}
          </p>
        </div>
      </div>
    </header>
  );
};

export default TopBar;

