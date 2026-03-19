"use client";
import React, { useState, useEffect } from 'react';
const TopBar = () => {
  const [currentUser, setCurrentUser] = useState('Viewer');
  const [userLocation, setUserLocation] = useState('Ibaan, Batangas');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  // Fetch current user data from localStorage or authentication context
  useEffect(() => {
    const fetchUserData = () => {
      // Try to get user data from localStorage (set during login)
      const storedUser = localStorage.getItem('loggedInUser');
      const storedLocation = localStorage.getItem('userLocation');
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData.username || userData.name || 'Viewer');
      }
      
      if (storedLocation) {
        setUserLocation(storedLocation);
      } else {
        // Default available locations
        const availableLocations = ['Ibaan, Batangas', 'Batangas City', 'Lipa City', 'Tanauan City', 'San Pablo City', 'Batangas Province'];
        setUserLocation(availableLocations[0]);
        localStorage.setItem('userLocation', availableLocations[0]);
      }
    };

    fetchUserData();
  }, []);

  const handleLocationChange = (newLocation: string) => {
    setUserLocation(newLocation);
    setIsEditingLocation(false);
    // Save location to localStorage for persistence
    localStorage.setItem('userLocation', newLocation);
    // In a real app, this would update user profile in database
  };

  return (
    <header className="h-16 bg-white border-b border-gray-300 px-8 flex items-center justify-between">
      <div className="text-sm font-medium text-gray-500">
        Dashboard / User / <span className="text-green-600">{currentUser}</span>
      </div>
      <div className="text-right">
        {isEditingLocation ? (
          <div className="flex items-center justify-end space-x-2">
            <select
              value={userLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Ibaan, Batangas">Ibaan, Batangas</option>
              <option value="Batangas City">Batangas City</option>
              <option value="Lipa City">Lipa City</option>
              <option value="Tanauan City">Tanauan City</option>
              <option value="San Pablo City">San Pablo City</option>
              <option value="Batangas Province">Batangas Province</option>
            </select>
            <button
              onClick={() => setIsEditingLocation(false)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              ✓
            </button>
          </div>
        ) : (
          <div style={{ display: 'inline-block' }}>
            <p className="text-sm text-slate-800" 
            style={{ display: 'inline', marginRight: '8px' }}>
              <b>User: </b>{currentUser}
            </p>
            <p 
              className="text-sm text-slate-800 cursor-pointer hover:text-gray-700"
              onClick={() => setIsEditingLocation(true)}
              style={{ display: 'inline' }}
            >
              <b> Location: </b>{userLocation}
            </p>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;

