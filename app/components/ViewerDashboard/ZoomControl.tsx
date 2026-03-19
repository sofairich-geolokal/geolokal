"use client";

import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const ZoomControl: React.FC = () => {
  const map = useMap();

  React.useEffect(() => {
    // Add zoom control to bottom right
    const zoomControl = L.control.zoom({
      position: 'bottomright'
    });
    
    zoomControl.addTo(map);

    // Cleanup on unmount
    return () => {
      map.removeControl(zoomControl);
    };
  }, [map]);

  return null;
};

export default ZoomControl;
