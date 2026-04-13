# GeoLokal - Geographic Information System Portal

A comprehensive web-based GIS portal built with Next.js, PostgreSQL, and Leaflet for managing and visualizing geographic data.

## Prerequisites

### For Docker Installation (Recommended)
- **Docker** (v20 or higher)
- **Docker Compose** (v2 or higher)
- **Node.js** (v18 or higher) - for the Next.js application
- **npm** or **yarn**

### For Manual Installation
- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher) with PostGIS extension
- **Git**
- **npm** or **yarn**

## Installation Steps

### Option 1: Docker Installation (Recommended)

The Docker setup includes PostgreSQL with PostGIS, GeoServer, and GeoNode - a complete GIS stack.

#### Prerequisites for Docker
- **Docker** (v20 or higher)
- **Docker Compose** (v2 or higher)

#### Docker Installation Steps

1. **Clone the Repository**
```bash
git clone https://github.com/sofairich-geolokal/geolokal.git
cd geolokal
```

2. **Start Docker Services**
```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** with PostGIS on port 5432
- **GeoServer** on port 8080 (admin/geoserver)
- **GeoNode** on port 8000 (admin/geonode)
- **Nginx** reverse proxy on ports 80/443 (optional)

3. **Wait for Services to Initialize**
```bash
# Check container status
docker-compose ps

# View logs for any issues
docker-compose logs -f postgres
```

4. **Configure Application Environment**
```bash
cp env-example.txt .env
```

Edit `.env` file for Docker:
```env
# Database Configuration (Docker)
DATABASE_URL=postgresql://geolokal_user:geolokal_password@localhost:5432/geolokal

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@geolokal.com

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

5. **Install Node Dependencies**
```bash
npm install
```

6. **Setup Application Database**
```bash
npx prisma generate
npx prisma db push
node geoportal-setup.js
```

7. **Start Development Server**
```bash
npm run dev
```

Access the application at [http://localhost:3000](http://localhost:3000)

#### Docker Services Access
- **GeoLokal App**: http://localhost:3000
- **GeoServer**: http://localhost:8080/geoserver (admin/geoserver)
- **GeoNode**: http://localhost:8000 (admin/geonode)
- **PostgreSQL**: localhost:5432 (geolokal_user/geolokal_password)

#### Docker Management Commands
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# View logs
docker-compose logs -f [service_name]

# Access PostgreSQL container
docker-compose exec postgres psql -U geolokal_user -d geolokal

# Restart specific service
docker-compose restart postgres
```

### Option 2: Manual Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/sofairich-geolokal/geolokal.git
cd geolokal
```

#### 2. Install Dependencies

```bash
npm install
```

**Optional: If you encounter installation issues:**
```bash
# Clear previous cache
npm cache clean --force

# Increase timeout and retries
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000

# Use mirror registry if needed
npm install --registry=https://registry.npmjs.org/
```

#### 3. Database Setup

##### 3.1 Create PostgreSQL Database
```sql
CREATE DATABASE geolokal;
CREATE EXTENSION IF NOT EXISTS postgis;
```

##### 3.2 Configure Environment Variables
Copy the example environment file and configure your database connection:

```bash
cp env-example.txt .env
```

Edit `.env` file with your configuration:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/geolokal

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@geolokal.com

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

##### 3.3 Test Database Connection
```bash
node test-connection.js
```

#### 4. Database Migration and Setup

##### 4.1 Generate Prisma Client
```bash
npx prisma generate
```

##### 4.2 Run Database Migrations
```bash
npx prisma db push
```

##### 4.3 Seed Initial Data (optional)
```bash
node geoportal-setup.js
```

#### 5. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

- `app/` - Next.js application pages and API routes
- `components/` - React components
- `lib/` - Utility functions and configurations
- `prisma/` - Database schema and migrations
- `public/` - Static assets
- `data/` - Geographic data files (JSON format)

## Key Features

- **Interactive Mapping**: Leaflet-based map viewer with drawing tools
- **Layer Management**: Upload, style, and manage geographic layers
- **User Authentication**: Role-based access control
- **Data Export**: Export maps and layers in various formats
- **Audit Logging**: Track user activities and changes
- **Measurement Tools**: Distance and area measurements
- **Download Requests**: Formal data request system

## Database Schema

The application uses PostgreSQL with PostGIS for spatial data. Key tables include:
- `users` - User management and authentication
- `map_layers` - Geographic layer storage
- `city_muni_master` - Administrative boundaries
- `audit_logs` - Activity tracking
- `viewer_activity` - User interaction tracking

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:deploy    # Deploy database changes
```

## Troubleshooting

### Docker Issues

#### Container Startup Problems
```bash
# Check container status
docker-compose ps

# View logs for specific service
docker-compose logs postgres
docker-compose logs geoserver
docker-compose logs geonode

# Force rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Port Conflicts
If ports are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # PostgreSQL on 5433
  - "8081:8080"  # GeoServer on 8081
  - "8001:8000"  # GeoNode on 8001
```

#### Database Connection Issues
- Ensure PostgreSQL container is running: `docker-compose ps`
- Check database credentials in `.env` match docker-compose.yml
- Verify PostGIS extension: `docker-compose exec postgres psql -U geolokal_user -d geolokal -c "SELECT PostGIS_Version();"`

#### Volume Issues
```bash
# Reset volumes (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Manual Installation Issues

#### Database Connection Issues
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check if PostGIS extension is installed

#### Build Errors
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`

#### Port Already in Use
- Kill process on port 3000: `npx kill-port 3000`
- Or use different port: `npm run dev -- -p 3001`

## Production Deployment

For production deployment, ensure:
1. Set `NODE_ENV=production`
2. Configure production database
3. Set proper `NEXTAUTH_SECRET`
4. Run `npm run build` before `npm run start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the terms specified in the LICENSE file.
