"use client";

import shp from 'shpjs';

export interface BoundaryLocation {
  id?: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  location_type: string;
  boundary_type: string;
}

export interface BoundaryArea {
  id?: number;
  name: string;
  area_type: string;
  boundary_type: string;
  center_latitude: number;
  center_longitude: number;
  radius_km?: number;
  polygon_coordinates?: any;
  rectangle_bounds?: any;
  color: string;
  fill_opacity: number;
  stroke_weight: number;
}

export interface BoundaryData {
  area: BoundaryArea | null;
  locations: BoundaryLocation[];
}

// Read shapefile data from Files folder
export async function readShapefileData(shapefileName: string): Promise<any> {
  try {
    const response = await fetch(`/api/shapefiles/${shapefileName}`);
    if (!response.ok) {
      throw new Error(`Failed to load shapefile: ${shapefileName}`);
    }
    
    const geojson = await response.json();
    return geojson;
  } catch (error) {
    console.error(`Error reading shapefile ${shapefileName}:`, error);
    return null;
  }
}

// Extract boundary locations from shapefile
export function extractBoundaryLocations(shapefileData: any): BoundaryLocation[] {
  if (!shapefileData || !shapefileData.features) {
    return [];
  }

  const locations: BoundaryLocation[] = [];
  
  shapefileData.features.forEach((feature: any, index: number) => {
    const properties = feature.properties || {};
    const geometry = feature.geometry;
    
    if (geometry && geometry.coordinates) {
      let coords: [number, number] = [0, 0];
      
      // Extract coordinates based on geometry type
      if (geometry.type === 'Point') {
        coords = geometry.coordinates as [number, number];
      } else if (geometry.type === 'Polygon') {
        // Get centroid of polygon
        const polygonCoords = geometry.coordinates[0];
        coords = calculateCentroid(polygonCoords);
      } else if (geometry.type === 'MultiPolygon') {
        // Get centroid of first polygon
        const polygonCoords = geometry.coordinates[0][0];
        coords = calculateCentroid(polygonCoords);
      }
      
      // Create location object
      const location: BoundaryLocation = {
        name: properties.NAME || properties.name || `Location ${index + 1}`,
        description: properties.DESCRIPTION || properties.description || 'Boundary location point',
        latitude: coords[1], // GeoJSON is [lon, lat], we want [lat, lon]
        longitude: coords[0],
        location_type: properties.TYPE || properties.type || 'boundary_point',
        boundary_type: properties.BOUNDARY_TYPE || properties.boundary_type || 'municipal'
      };
      
      locations.push(location);
    }
  });
  
  return locations;
}

// Calculate centroid of polygon coordinates
function calculateCentroid(coordinates: [number, number][]): [number, number] {
  let sumX = 0;
  let sumY = 0;
  let numPoints = coordinates.length;
  
  for (let i = 0; i < numPoints; i++) {
    sumX += coordinates[i][0];
    sumY += coordinates[i][1];
  }
  
  return [sumX / numPoints, sumY / numPoints];
}

// Extract boundary area from shapefile
export function extractBoundaryArea(shapefileData: any): BoundaryArea | null {
  if (!shapefileData || !shapefileData.features || shapefileData.features.length === 0) {
    return null;
  }
  
  const firstFeature = shapefileData.features[0];
  const properties = firstFeature.properties || {};
  const geometry = firstFeature.geometry;
  
  if (!geometry || !geometry.coordinates) {
    return null;
  }
  
  let centerLatitude = 13.7588; // Default Ibaan center
  let centerLongitude = 121.1250;
  let radiusKm: number | undefined;
  let polygonCoordinates: any;
  
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates[0];
    const centroid = calculateCentroid(coords);
    centerLatitude = centroid[1];
    centerLongitude = centroid[0];
    polygonCoordinates = coords;
    
    // Calculate approximate radius from polygon bounds
    const bounds = getPolygonBounds(coords);
    const maxDistance = Math.max(
      calculateDistance(bounds.north, bounds.west, bounds.south, bounds.east)
    );
    radiusKm = maxDistance / 2;
  } else if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates[0][0];
    const centroid = calculateCentroid(coords);
    centerLatitude = centroid[1];
    centerLongitude = centroid[0];
    polygonCoordinates = coords;
    
    const bounds = getPolygonBounds(coords);
    const maxDistance = Math.max(
      calculateDistance(bounds.north, bounds.west, bounds.south, bounds.east)
    );
    radiusKm = maxDistance / 2;
  }
  
  return {
    name: properties.NAME || properties.name || 'Administrative Boundary',
    area_type: properties.AREA_TYPE || properties.area_type || 'municipal',
    boundary_type: 'polygon',
    center_latitude: centerLatitude,
    center_longitude: centerLongitude,
    radius_km: radiusKm,
    polygon_coordinates: polygonCoordinates,
    color: '#dc2626',
    fill_opacity: 0.15,
    stroke_weight: 4
  };
}

// Get polygon bounds
function getPolygonBounds(coordinates: [number, number][]) {
  let minLat = Infinity, maxLat = -Infinity;
  let minLon = Infinity, maxLon = -Infinity;
  
  coordinates.forEach(([lon, lat]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
  });
  
  return {
    north: maxLat,
    south: minLat,
    east: maxLon,
    west: minLon
  };
}

// Calculate distance between two points in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Load complete boundary data from database and shapefiles
export async function loadBoundaryData(areaType: string = 'municipal'): Promise<BoundaryData> {
  try {
    // First try to get data from database
    const response = await fetch(`/api/admin-boundary?areaType=${areaType}&includeLocations=true`);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.warn('Failed to load from database, falling back to shapefile:', error);
  }
  
  // Fallback to shapefile data
  try {
    const shapefileData = await readShapefileData('Ibaan_boundary');
    if (shapefileData) {
      const area = extractBoundaryArea(shapefileData);
      const locations = extractBoundaryLocations(shapefileData);
      
      return {
        area,
        locations
      };
    }
  } catch (error) {
    console.error('Failed to load shapefile data:', error);
  }
  
  // Return default data if everything fails
  return {
    area: {
      name: 'Ibaan Municipality Boundary',
      area_type: 'municipal',
      boundary_type: 'circle',
      center_latitude: 13.7588,
      center_longitude: 121.1250,
      radius_km: 4.5,
      color: '#dc2626',
      fill_opacity: 0.15,
      stroke_weight: 4
    },
    locations: [
      {
        name: 'Barangay San Isidro',
        description: 'Northern boundary of Ibaan municipality',
        latitude: 13.7756,
        longitude: 121.1250,
        location_type: 'barangay_center',
        boundary_type: 'barangay'
      },
      {
        name: 'Barangay Sabang',
        description: 'Southern boundary of Ibaan municipality',
        latitude: 13.7421,
        longitude: 121.1250,
        location_type: 'barangay_center',
        boundary_type: 'barangay'
      },
      {
        name: 'Barangay Tala',
        description: 'Eastern boundary of Ibaan municipality',
        latitude: 13.7588,
        longitude: 121.1412,
        location_type: 'barangay_center',
        boundary_type: 'barangay'
      },
      {
        name: 'Barangay Paligawan',
        description: 'Western boundary of Ibaan municipality',
        latitude: 13.7588,
        longitude: 121.1089,
        location_type: 'barangay_center',
        boundary_type: 'barangay'
      },
      {
        name: 'Ibaan Town Proper',
        description: 'Municipal center of Ibaan',
        latitude: 13.7588,
        longitude: 121.1250,
        location_type: 'municipal_center',
        boundary_type: 'municipal'
      }
    ]
  };
}
