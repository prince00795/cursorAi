import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmerApi } from '../../utils/api';
import { FarmerProfile, STATES, CASTES, CROPS } from '../../types';
import { Users, Upload, Search, ChevronDown, ChevronUp, Phone, MapPin } from 'lucide-react';

function ImportModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');

  const importMutation = useMutation({
    mutationFn: (farmers: Record<string, unknown>[]) => farmerApi.importSurvey(farmers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFarmers'] });
      onClose();
    },
  });

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonText);
      const farmers = Array.isArray(data) ? data : [data];
      importMutation.mutate(farmers);
    } catch {
      setError('Invalid JSON format');
    }
  };

  const sampleData = JSON.stringify([{
    name: 'Ramesh Kumar',
    phone: '9876543210',
    aadhar: '123456789012',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    village: 'Sitapur',
    land_area_acres: 2.5,
    land_type: 'owned',
    caste: 'OBC',
    annual_income: 85000,
    crops: ['Wheat', 'Rice/Paddy'],
    irrigation_type: 'canal',
    bank_account: true,
    smartphone_proficiency: 'none',
    preferred_language: 'hindi',
    previously_allotted_schemes: [],
  }], null, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Import Farmers from Survey</h2>
          <p className="text-sm text-gray-500 mb-4">
            Paste farmer data as JSON array. Each farmer object should include: name, phone, state, district, land_area_acres, caste, annual_income, crops, smartphone_proficiency.
          </p>

          {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <div className="mb-3">
            <button
              type="button"
              onClick={() => setJsonText(sampleData)}
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              Load sample data
            </button>
          </div>

          <textarea
            className="input font-mono text-xs"
            rows={10}
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            placeholder="Paste JSON array of farmers here..."
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleImport}
              disabled={importMutation.isPending || !jsonText}
              className="btn-primary"
            >
              <Upload className="w-4 h-4" />
              {importMutation.isPending ? 'Importing...' : 'Import Farmers'}
            </button>
            <button onClick={onClose} className="btn-secondary">Cancel</button>
          </div>

          {importMutation.isSuccess && (
            <p className="text-green-600 text-sm mt-2">
              Imported successfully! {(importMutation.data?.data?.farmer_ids?.length || 0)} farmers added.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FarmerRow({ farmer }: { farmer: FarmerProfile }) {
  const [expanded, setExpanded] = useState(false);
  const crops: string[] = (() => { try { return JSON.parse(farmer.crops || '[]'); } catch { return []; } })();

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-4">
          <div className="font-medium text-gray-800">{farmer.name}</div>
          <div className="text-xs text-gray-400">{farmer.aadhar ? 'Aadhar linked' : 'No aadhar'}</div>
        </td>
        <td className="py-3 px-4 text-gray-600">{farmer.phone}</td>
        <td className="py-3 px-4 text-gray-600 text-sm">{farmer.district}, {farmer.state}</td>
        <td className="py-3 px-4 text-gray-700 font-medium">{farmer.land_area_acres} ac</td>
        <td className="py-3 px-4">
          <span className="badge badge-gray">{farmer.caste}</span>
        </td>
        <td className="py-3 px-4 text-gray-600 text-sm">₹{Number(farmer.annual_income).toLocaleString('en-IN')}</td>
        <td className="py-3 px-4">
          <span className={`badge ${farmer.smartphone_proficiency === 'none' || farmer.smartphone_proficiency === 'low' ? 'badge-red' : 'badge-green'}`}>
            {farmer.smartphone_proficiency}
          </span>
        </td>
        <td className="py-3 px-4 text-gray-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-4 py-3">
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">Crops:</p>
                <div className="flex flex-wrap gap-1">
                  {crops.map(c => <span key={c} className="badge badge-green">{c}</span>)}
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Details:</p>
                <p className="text-gray-600">Land: {farmer.land_type} | Irrigation: {farmer.irrigation_type}</p>
                <p className="text-gray-600">Bank: {farmer.bank_account ? 'Yes' : 'No'}</p>
                <p className="text-gray-600">Language: {farmer.preferred_language}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Location:</p>
                <p className="text-gray-600">{farmer.village ? `${farmer.village}, ` : ''}{farmer.district}, {farmer.state}</p>
                {farmer.pincode && <p className="text-gray-500">PIN: {farmer.pincode}</p>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminFarmers() {
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCaste, setFilterCaste] = useState('');

  const { data: farmers, isLoading } = useQuery<FarmerProfile[]>({
    queryKey: ['adminFarmers'],
    queryFn: () => farmerApi.getAll().then(r => r.data),
  });

  const filtered = (farmers || []).filter(f => {
    if (search) {
      const q = search.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.phone.includes(q) || f.district.toLowerCase().includes(q);
    }
    if (filterState && f.state !== filterState) return false;
    if (filterCaste && f.caste !== filterCaste) return false;
    return true;
  });

  const keypadFarmers = filtered.filter(f => f.smartphone_proficiency === 'none' || f.smartphone_proficiency === 'low');

  return (
    <div className="max-w-7xl mx-auto">
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}

      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Farmers</h1>
          <p className="text-gray-500">{filtered.length} farmers registered</p>
        </div>
        <button onClick={() => setShowImport(true)} className="btn-primary">
          <Upload className="w-4 h-4" />
          Import from Survey
        </button>
      </div>

      {/* Info bar */}
      {keypadFarmers.length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
          <Phone className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-800">
              {keypadFarmers.length} farmers use keypad/basic phones
            </p>
            <p className="text-xs text-orange-600">These farmers need AI call assistance. Go to Call Assistant to schedule calls.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name, phone, district..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={filterState} onChange={e => setFilterState(e.target.value)}>
          <option value="">All States</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input sm:w-36" value={filterCaste} onChange={e => setFilterCaste(e.target.value)}>
          <option value="">All Castes</option>
          {CASTES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No farmers found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {['Name', 'Phone', 'Location', 'Land', 'Caste', 'Income', 'Phone Type', ''].map(h => (
                  <th key={h} className="py-3 px-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(f => <FarmerRow key={f.id} farmer={f} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
