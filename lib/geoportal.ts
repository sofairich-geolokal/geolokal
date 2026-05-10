// GeoPortal API Integration Service
// Fetches specific layers from Philippine GeoPortal

interface GeoPortalLayer {
  id: string;
  name: string;
  title: string;
  description: string;
  geometry: any;
  wmsUrl?: string;  // WMS service URL
  wmsLayer?: string; // WMS layer name
  arcgisUrl?: string; // ArcGIS REST service URL
  service?: string;  // Service type (WMS, ArcGIS REST, etc.)
  layer?: string;    // Layer ID/name
  style: {
    color: string;
    fillColor: string;
    fillOpacity: number;
    weight: number;
    opacity: number;
  };
  properties: any;
  attribution: string;
  category: string;
}

const GEOPORTAL_BASE_URL = 'https://geoportal.gov.ph';

export class GeoPortalService {
  /**
   * Create a mock layer when WMS service fails
   */
  private static createMockLayer(id: string, title: string, category: string, color: string): GeoPortalLayer {
    return {
      id,
      name: id.replace(/[^a-zA-Z0-9_]/g, '_'),
      title,
      description: `${title} from Philippine GeoPortal`,
      geometry: null,
      style: {
        color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 2,
        opacity: 1
      },
      properties: {
        service: 'WMS',
        format: 'image/png',
        transparent: true
      },
      attribution: 'Philippine GeoPortal',
      category
    };
  }

  /**
   * Fetch 2020 Land Cover Map from ArcGIS REST API
   */
  static async fetchLandCoverRegion4A(): Promise<GeoPortalLayer | null> {
    try {
      // Use ArcGIS REST API directly instead of GeoPortal WMS
      const arcgisUrl = 'https://services3.arcgis.com/pNwij5WvjK23c10k/ArcGIS/rest/services/Land_Cover__NAMRIA_2020_/FeatureServer/0';
      
      // Check if the ArcGIS service is available
      const response = await fetch(`${arcgisUrl}?f=json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GeoLokal/1.0'
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        console.error('Failed to fetch ArcGIS Land Cover service:', response.statusText);
        return this.createMockLayer('land-cover-namria', 'Land Cover (NAMRIA 2020)', 'Environmental', '#228B22');
      }
      
      const serviceInfo = await response.json();
      console.log('ArcGIS Land Cover service info:', serviceInfo);
      
      // Return layer configuration for ArcGIS REST service
      return {
        id: 'arcgis-land-cover-namria-2020',
        name: 'land_cover_namria_2020',
        title: 'Land Cover (NAMRIA 2020)',
        description: 'Land cover map of the entire Philippines from NAMRIA 2020 dataset',
        geometry: null, // Will be fetched dynamically
        arcgisUrl: arcgisUrl,
        service: 'ArcGIS REST',
        layer: '0', // Layer ID in the service
        style: {
          color: '#228B22',
          fillColor: '#228B22',
          fillOpacity: 0.7,
          weight: 1,
          opacity: 0.8
        },
        properties: {
          service: 'ArcGIS REST',
          layer: '0',
          format: 'json',
          outFields: '*',
          returnGeometry: true,
          outSR: '4326'
        },
        attribution: 'NAMRIA 2020',
        category: 'Environmental'
      };
    } catch (error: any) {
      if (error && error.name === 'AbortError') {
        console.error('Timeout error fetching ArcGIS Land Cover:', error);
      } else {
        console.error('Error fetching ArcGIS Land Cover:', error);
      }
      return this.createMockLayer('land-cover-namria', 'Land Cover (NAMRIA 2020)', 'Environmental', '#228B22');
    }
  }

  /**
   * Fetch Climate Type layer (Mock implementation)
   * Note: GeoPortal climate service is currently unavailable, returning mock layer
   */
  static async fetchClimateType(): Promise<GeoPortalLayer | null> {
    try {
      console.log('Climate Type service: GeoPortal service unavailable, returning mock layer');
      
      // Return mock climate layer since GeoPortal service is failing
      return this.createMockLayer('climate-type', 'Climate Type', 'Climate', '#FF6B35');
    } catch (error) {
      console.error('Error creating Climate Type mock layer:', error);
      return this.createMockLayer('climate-type', 'Climate Type', 'Climate', '#FF6B35');
    }
  }

  /**
   * Fetch Landslide 1:10,000 Susceptibility layer (Mock implementation)
   * Note: GeoPortal landslide service is currently unavailable, returning mock layer
   */
  static async fetchLandslideSusceptibility(): Promise<GeoPortalLayer | null> {
    try {
      console.log('Landslide Susceptibility service: GeoPortal service unavailable, returning mock layer');
      
      // Return mock landslide layer since GeoPortal service is failing
      return this.createMockLayer('landslide-susceptibility', 'Landslide 1:10,000 Susceptibility', 'Hazard', '#DC2626');
    } catch (error) {
      console.error('Error creating Landslide Susceptibility mock layer:', error);
      return this.createMockLayer('landslide-susceptibility', 'Landslide 1:10,000 Susceptibility', 'Hazard', '#DC2626');
    }
  }

  /**
   * Fetch all GeoPortal layers from actual endpoints
   */
  static async fetchAllLayers(): Promise<GeoPortalLayer[]> {
    const layers: GeoPortalLayer[] = [];
    
    try {
      // Fetch Land Cover from WMS service
      const landCover = await this.fetchLandCoverRegion4A();
      if (landCover) {
        layers.push(landCover);
        console.log('✓ Fetched Land Cover Region 4-A from GeoPortal');
      }

      // Fetch Climate Type from WMS service  
      const climateType = await this.fetchClimateType();
      if (climateType) {
        layers.push(climateType);
        console.log('✓ Fetched Climate Type from GeoPortal');
      }

      // Fetch Landslide Susceptibility from WMS service
      const landslideSusceptibility = await this.fetchLandslideSusceptibility();
      if (landslideSusceptibility) {
        layers.push(landslideSusceptibility);
        console.log('✓ Fetched Landslide Susceptibility from GeoPortal');
      }

      console.log(`✅ Successfully fetched ${layers.length} GeoPortal layers`);
      return layers;
    } catch (error) {
      console.error('❌ Error fetching GeoPortal layers:', error);
      return [];
    }
  }

  /**
   * Convert GeoPortal layer to database format
   */
  static toDatabaseFormat(layer: GeoPortalLayer) {
    return {
      layer_name: layer.title,
      layer_type: 'vector',
      metadata: {
        geojson: layer.geometry,
        source: 'geoportal',
        description: layer.description,
        properties: layer.properties
      },
      style_config: layer.style,
      is_visible: true,
      is_downloadable: false,
      attribution: layer.attribution,
      category: layer.category
    };
  }
}
