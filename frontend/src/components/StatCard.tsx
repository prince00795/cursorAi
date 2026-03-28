import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'red';
  sub?: string;
}

const colorMap = {
  green: { bg: 'bg-green-100', icon: 'text-green-600', val: 'text-green-700' },
  blue: { bg: 'bg-blue-100', icon: 'text-blue-600', val: 'text-blue-700' },
  orange: { bg: 'bg-orange-100', icon: 'text-orange-600', val: 'text-orange-700' },
  purple: { bg: 'bg-purple-100', icon: 'text-purple-600', val: 'text-purple-700' },
  red: { bg: 'bg-red-100', icon: 'text-red-600', val: 'text-red-700' },
};

export default function StatCard({ label, value, icon: Icon, color = 'green', sub }: Props) {
  const c = colorMap[color];
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}
