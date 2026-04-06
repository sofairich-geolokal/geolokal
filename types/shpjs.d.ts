declare module 'shpjs' {
  export default function shp(buffer: ArrayBuffer | Buffer): Promise<GeoJSON.GeoJSON>;
  export function parse(buffer: ArrayBuffer | Buffer): Promise<GeoJSON.GeoJSON>;
  export function combine(files: { [key: string]: ArrayBuffer | Buffer }): Promise<GeoJSON.GeoJSON>;
}
