import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../utils/api';
import StatCard from '../../components/StatCard';
import { Users, BookOpen, FileText, CheckCircle, PhoneCall, TrendingUp } from 'lucide-react';
import { AdminStats } from '../../types';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getStats().then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Kisan Sahayak — Overview</p>
      </div>

      {/* Summary stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Farmers" value={stats?.summary.totalFarmers || 0} icon={Users} color="green" />
        <StatCard label="Active Schemes" value={stats?.summary.totalSchemes || 0} icon={BookOpen} color="blue" />
        <StatCard label="Applications" value={stats?.summary.totalApplications || 0} icon={FileText} color="purple" />
        <StatCard label="Applied/Approved" value={stats?.summary.appliedCount || 0} icon={CheckCircle} color="green" sub="Submitted applications" />
        <StatCard label="Pending Calls" value={stats?.summary.pendingCalls || 0} icon={PhoneCall} color="orange" />
        <StatCard label="Completed Calls" value={stats?.summary.completedCalls || 0} icon={TrendingUp} color="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Schemes */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Top Schemes by Applications</h2>
          <div className="space-y-3">
            {stats?.topSchemes?.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{s.name}</p>
                </div>
                <span className="badge badge-blue">{s.applications}</span>
              </div>
            ))}
            {(!stats?.topSchemes || stats.topSchemes.length === 0) && (
              <p className="text-gray-400 text-sm">No applications yet</p>
            )}
          </div>
        </div>

        {/* Applications by Status */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Applications by Status</h2>
          <div className="space-y-2">
            {stats?.byStatus?.map(s => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{s.status.replace('_', ' ')}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 bg-brand-400 rounded-full"
                    style={{ width: `${Math.max(4, (s.count / (stats.summary.totalApplications || 1)) * 120)}px` }}
                  />
                  <span className="text-sm font-medium text-gray-700 w-6 text-right">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schemes by Category */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Schemes by Category</h2>
        <div className="flex flex-wrap gap-2">
          {stats?.schemesByCategory?.map(c => (
            <div key={c.category} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-bold text-brand-700">{c.count}</p>
              <p className="text-xs text-gray-500">{c.category}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Farmers */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Recently Registered Farmers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-2 text-gray-500 font-medium">Name</th>
                <th className="pb-2 text-gray-500 font-medium">Phone</th>
                <th className="pb-2 text-gray-500 font-medium">Location</th>
                <th className="pb-2 text-gray-500 font-medium">Phone Type</th>
                <th className="pb-2 text-gray-500 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats?.recentFarmers?.map(f => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="py-2 font-medium text-gray-800">{f.name}</td>
                  <td className="py-2 text-gray-600">{f.phone}</td>
                  <td className="py-2 text-gray-600">{f.district}, {f.state}</td>
                  <td className="py-2">
                    <span className={`badge ${f.smartphone_proficiency === 'none' || f.smartphone_proficiency === 'low' ? 'badge-red' : 'badge-green'}`}>
                      {f.smartphone_proficiency}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 text-xs">{new Date(f.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
