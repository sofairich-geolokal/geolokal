import AccessByProject from './AccessByProject';

const chartData = [
  { label: 'DRRM', value: 18000, color: '#f9a825' },
  { label: 'Land Use', value: 30500, color: '#4caf50' },
  { label: 'Revenue', value: 22000, color: '#000000' },
  { label: 'Socio-Eco', value: 32000, color: '#fb8c00' },
  { label: 'Smart City', value: 14000, color: '#ef5350' },
];

export default function Projectschart() {
  return (
    <div className="p-2 mb-8 space-y-10 bg-gray-50 rounded-2xl">
      <AccessByProject />
    </div>
  );
}