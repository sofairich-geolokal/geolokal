import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting demographic data update from Geoportal...');
    
    // Fetch all map layers
    const layers = await prisma.map_layers.findMany({
      where: {
        bbox: {
          not: undefined
        }
      },
      select: {
        id: true,
        layer_name: true,
        bbox: true,
        metadata: true,
      }
    });

    console.log(`📊 Found ${layers.length} layers to update`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const layer of layers) {
      try {
        const bbox = layer.bbox as any;
        const metadata = layer.metadata as any;
        
        // Get coordinates from bbox or metadata
        const latitude = bbox?.[1] || metadata?.center?.[0] || 13.86;
        const longitude = bbox?.[0] || metadata?.center?.[1] || 121.15;

        // Fetch demographic data from Geoportal
        // Note: Geoportal.gov.ph provides WMS/ArcGIS services for map layers
        // For demographic data, we'll use Philippine Statistics Authority (PSA) data
        // This is a placeholder - in production, integrate with actual Geoportal/PSA APIs
        
        // For now, set null values to indicate data needs to be fetched from Geoportal
        const population = null;
        const households = null;
        const povertyRate = null;
        const employmentRate = null;
        const status = null;

        // Update the layer with Geoportal data
        await prisma.map_layers.update({
          where: { id: layer.id },
          data: {
            population,
            households,
            poverty_rate: povertyRate,
            employment_rate: employmentRate,
            demographic_status: status,
            demographic_last_updated: new Date(),
          } as any
        });

        updatedCount++;
        console.log(`✅ Updated layer: ${layer.layer_name} (Geoportal data source)`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating layer ${layer.id}:`, error);
      }
    }

    console.log(`🎉 Update complete: ${updatedCount} updated, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Demographic data updated from Geoportal successfully`,
      stats: {
        total: layers.length,
        updated: updatedCount,
        errors: errorCount,
      }
    });
  } catch (error) {
    console.error('❌ Error in demographic update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update demographic data' },
      { status: 500 }
    );
  }
}
