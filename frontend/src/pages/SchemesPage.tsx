import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmerApi, applicationApi } from '../utils/api';
import SchemeCard from '../components/SchemeCard';
import { Search, Filter, CheckCircle } from 'lucide-react';
import { SchemeMatch } from '../types';

const CATEGORIES = [
  'All', 'Income Support', 'Crop Insurance', 'Credit & Finance', 'Irrigation',
  'Farm Machinery', 'Organic Farming', 'Horticulture', 'Solar Energy',
  'Market Access', 'Pension', 'Special Category', 'Soil Health',
  'Crop Development', 'Agriculture Development',
];

export default function SchemesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showEligibleOnly, setShowEligibleOnly] = useState(true);
  const [trackedSchemes, setTrackedSchemes] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: schemesData, isLoading } = useQuery({
    queryKey: ['mySchemes'],
    queryFn: () => farmerApi.getMySchemes().then(r => r.data),
    retry: false,
  });

  const trackMutation = useMutation({
    mutationFn: (schemeId: string) => applicationApi.addToTracker(schemeId),
    onSuccess: (_, schemeId) => {
      setTrackedSchemes(prev => new Set([...prev, schemeId]));
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    },
  });

  const allSchemes: SchemeMatch[] = [
    ...(schemesData?.eligible_schemes || []),
    ...(schemesData?.other_schemes || []),
  ];

  const filtered = allSchemes.filter(m => {
    if (showEligibleOnly && !m.eligible) return false;
    if (category !== 'All' && m.scheme.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.scheme.name.toLowerCase().includes(q) ||
        m.scheme.description.toLowerCase().includes(q) ||
        m.scheme.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Government Schemes</h1>
        <p className="text-gray-500 mt-1 hindi">सरकारी योजनाएं — आपकी प्रोफ़ाइल के अनुसार फ़िल्टर की गई</p>
      </div>

      {/* Search & Filters */}
      <div className="card mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search schemes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showEligibleOnly}
              onChange={e => setShowEligibleOnly(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded"
            />
            <CheckCircle className="w-4 h-4 text-green-600" />
            Eligible only
          </label>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                category === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <span>{filtered.length} schemes found</span>
        {showEligibleOnly && <span className="badge-green badge">Eligible only</span>}
      </div>

      {/* Schemes grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card animate-pulse h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No schemes match your filters.</p>
          <button onClick={() => { setSearch(''); setCategory('All'); setShowEligibleOnly(false); }} className="btn-secondary mt-4">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((match, idx) => (
            <SchemeCard
              key={match.scheme.id}
              match={match}
              rank={match.eligible ? idx + 1 : undefined}
              onTrack={!trackedSchemes.has(match.scheme.id) ? (id) => trackMutation.mutate(id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
