# GeoServer and GeoNode Setup Guide

## Prerequisites
- Docker and Docker Compose installed
- Git installed

## Quick Start

### 1. Start Services with Docker Compose
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 2. Access Services
- **GeoServer**: http://localhost:8080/geoserver
  - Username: `admin`
  - Password: `geoserver`
  
- **GeoNode**: http://localhost:8000
  - Username: `admin`
  - Password: `geonode`
  
- **PostgreSQL**: localhost:5432
  - Database: `geolokal`
  - Username: `geolokal_user`
  - Password: `geolokal_password`

### 3. Configure GeoServer
1. Login to GeoServer web interface
2. Create a new workspace called `LGU`
3. Create layers for:
   - `construction_sites`
   - `built_areas`
   - `evacuation_centers`
   - `hazard_areas`
   - `admin_boundaries`

### 4. Configure GeoNode
1. Login to GeoNode admin interface
2. Connect to GeoServer layers
3. Set up user permissions and groups
4. Configure map styling and templates

### 5. Update Application Configuration
Copy `env-configuration.txt` to `.env` and update values:
```bash
cp env-configuration.txt .env
```

### 6. Start the Application
```bash
npm install
npm run dev
```

## Map Customization Features

### Available Map Components
1. **MapRenderer** - Main map rendering component
2. **MapContent** - Core map functionality with layers
3. **AdvancedGeoMap** - Full-featured map with drawing tools
4. **GeoMap** - Simple map with GeoServer integration
5. **MapInterface** - LGU dashboard map interface

### Customizable Features
- **Base Maps**: OpenStreetMap, Satellite, Philippine Basemap
- **Layers**: Buildings, Heat Map, Boundary, Road Networks, Waterways
- **Drawing Tools**: Point, Line, Polygon, Circle, Rectangle
- **Measurements**: Distance and area calculations
- **Projections**: Multiple coordinate system support
- **Styling**: Custom colors, icons, and popups
- **Layer Management**: Visibility, opacity, zoom levels

### Layer Configuration
All layers can be configured through:
- Layer Manager component (`/components/LayerManager.tsx`)
- Database settings (PostgreSQL)
- GeoServer style definitions
- GeoNode metadata

### API Endpoints
- `/api/layers` - Layer management
- `/api/categories` - Layer categories
- `/api/lgus` - LGU data
- `/api/activity` - Activity tracking
- `/api/measurements` - Measurement data
- `/api/drawings` - Drawing data

## Troubleshooting

### Common Issues
1. **Port conflicts**: Ensure ports 5432, 8080, 8000 are available
2. **Database connection**: Check PostgreSQL credentials
3. **GeoServer layers**: Verify workspace and layer names
4. **CORS issues**: Nginx configuration handles CORS headers

### Reset Services
```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: Deletes all data)
docker-compose down -v

# Restart
docker-compose up -d
```

### Logs
```bash
# View specific service logs
docker-compose logs geoserver
docker-compose logs geonode
docker-compose logs postgres
```
