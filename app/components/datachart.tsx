import SourceTypesChart from './SourceTypesChart';

const sourceData = [
  { label: 'Open Street Map (OSM)', percentage: 52.1, color: '#1a1a1a' },
  { label: 'Geo portal Gov-PH', percentage: 22.8, color: '#f9a825' },
  { label: 'Community Monitoring System', percentage: 13.9, color: '#4caf50' },
  { label: 'Tax Parcel Mapping', percentage: 11.2, color: '#ef5350' },
];

export default function DashboardPage() {
  return (
    <div className="py-10 px-4 space-y-10 bg-gray-50 rounded-2xl">
      <SourceTypesChart data={sourceData} />
    </div>
  );
}