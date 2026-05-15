# Shapefile Auto-Loader Script

## Overview

The auto-loader script automatically watches a folder for new shapefile uploads, converts them to GeoJSON, saves them to the data folder, and updates the database.

## Features

- **Automatic Processing**: Watches the uploads folder and processes new shapefiles automatically
- **Multiple Formats**: Supports both zip files and individual shapefile components (.shp, .shx, .dbf, .prj, .cpg)
- **GeoJSON Conversion**: Uses shpjs library to convert shapefiles to GeoJSON
- **Database Integration**: Automatically creates database records for each processed layer
- **File Management**: Moves processed files to a processed folder with timestamps
- **Error Handling**: Logs errors and continues processing other files

## Usage

### Start the Auto-Loader

```bash
npm run auto-load:shapefiles
```

Or directly with Node:

```bash
node scripts/auto-load-shapefiles.js
```

### Folder Structure

The script expects the following folder structure:

```
geolokal/
├── uploads/              # Watch folder - place shapefiles here
│   └── processed/       # Processed files are moved here
├── public/
│   └── data/            # GeoJSON files are saved here
└── scripts/
    └── auto-load-shapefiles.js
```

### How to Use

1. **Place shapefiles in the uploads folder**:
   - Drop a `.zip` file containing shapefile components
   - Or drop individual shapefile files (.shp, .shx, .dbf)

2. **The script automatically**:
   - Detects new files
   - Converts to GeoJSON
   - Saves to `public/data/`
   - Creates database record
   - Moves processed files to `uploads/processed/`

3. **View on map**:
   - Layers appear automatically in the Viewer Dashboard
   - Navigate to `/viewerDashboard` to see uploaded layers

## Configuration

Edit the configuration variables in `scripts/auto-load-shapefiles.js`:

```javascript
const WATCH_FOLDER = path.join(__dirname, '..', 'uploads');
const PROCESSED_FOLDER = path.join(WATCH_FOLDER, 'processed');
const DATA_FOLDER = path.join(__dirname, '..', 'public', 'data');
const DEFAULT_COLOR = '#318855';
const CHECK_INTERVAL = 5000; // Check every 5 seconds
```

## Required Files

For successful processing, ensure your shapefiles include:
- `.shp` - Shape geometry (required)
- `.shx` - Shape index (required)
- `.dbf` - Attribute data (required)
- `.prj` - Projection information (optional)
- `.cpg` - Code page (optional)

## Database Schema

The script creates records in the `map_layers` table with:
- `layer_name`: Derived from filename
- `layer_type`: Set to 'vector'
- `metadata.geojson_file`: Path to GeoJSON file
- `style_config`: Default styling with configurable color
- `is_visible`: Set to true by default

## Running as a Service

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start the auto-loader
pm2 start scripts/auto-load-shapefiles.js --name shapefile-loader

# View logs
pm2 logs shapefile-loader

# Stop the service
pm2 stop shapefile-loader

# Restart the service
pm2 restart shapefile-loader
```

### Using systemd (Linux)

Create a service file at `/etc/systemd/system/shapefile-loader.service`:

```ini
[Unit]
Description=Shapefile Auto-Loader
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/geolokal
ExecStart=/usr/bin/node scripts/auto-load-shapefiles.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl enable shapefile-loader
sudo systemctl start shapefile-loader
sudo systemctl status shapefile-loader
```

## Troubleshooting

### Script not detecting files
- Ensure files are placed in the correct `uploads` folder
- Check file permissions
- Verify the script is running

### Conversion errors
- Ensure all required shapefile components are present (.shp, .shx, .dbf)
- Check that shapefiles are not corrupted
- Verify projection information if available

### Database errors
- Ensure DATABASE_URL is set in .env file
- Check database connection
- Verify Prisma client is generated (`npx prisma generate`)

## Logs

The script outputs logs to console including:
- Processing start/end messages
- Conversion status
- Database record creation
- File movement operations
- Error messages

## Stopping the Script

Press `Ctrl+C` to stop the script gracefully. The script will:
- Complete current processing
- Close database connection
- Exit cleanly

## Security Considerations

- Ensure the uploads folder has proper permissions
- Consider implementing file size limits
- Validate file types before processing
- Monitor for malicious uploads in production

## Performance

- Default check interval: 5 seconds
- Adjust `CHECK_INTERVAL` based on your needs
- Large shapefiles may take longer to process
- Consider implementing a queue for high-volume scenarios
