import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmerApi } from '../utils/api';
import { STATES, CASTES, CROPS } from '../types';
import { Save, User, MapPin, Wheat, Wallet, CheckCircle } from 'lucide-react';

const IRRIGATION_TYPES = ['Rain-fed', 'Canal', 'Borewell/Tubewell', 'Drip', 'Sprinkler', 'Pond/Tank'];
const LAND_TYPES = ['Owned', 'Leased', 'Shared'];
const SMARTPHONE_LEVELS = [
  { value: 'none', label: 'No Smartphone / Keypad Phone', labelHi: 'कीपैड फोन' },
  { value: 'low', label: 'Basic Smartphone (calls/WhatsApp only)', labelHi: 'बेसिक स्मार्टफोन' },
  { value: 'medium', label: 'Moderate (apps, browsing)', labelHi: 'मध्यम' },
  { value: 'high', label: 'Proficient (comfortable online)', labelHi: 'कुशल' },
];

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['farmerProfile'],
    queryFn: () => farmerApi.getProfile().then(r => r.data),
    retry: false,
  });

  const [form, setForm] = useState({
    name: '', phone: '', aadhar: '',
    state: '', district: '', village: '', pincode: '',
    land_area_acres: '', land_type: 'owned',
    caste: '', annual_income: '',
    irrigation_type: 'Rain-fed',
    bank_account: true,
    smartphone_proficiency: 'medium',
    preferred_language: 'hindi',
    previously_allotted_schemes: [],
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        aadhar: profile.aadhar || '',
        state: profile.state || '',
        district: profile.district || '',
        village: profile.village || '',
        pincode: profile.pincode || '',
        land_area_acres: profile.land_area_acres?.toString() || '',
        land_type: profile.land_type || 'owned',
        caste: profile.caste || '',
        annual_income: profile.annual_income?.toString() || '',
        irrigation_type: profile.irrigation_type || 'Rain-fed',
        bank_account: !!profile.bank_account,
        smartphone_proficiency: profile.smartphone_proficiency || 'medium',
        preferred_language: profile.preferred_language || 'hindi',
        previously_allotted_schemes: [],
      });
      try {
        setSelectedCrops(JSON.parse(profile.crops || '[]'));
      } catch {
        setSelectedCrops([]);
      }
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => farmerApi.saveProfile(data),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['farmerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['mySchemes'] });
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      crops: selectedCrops,
      land_area_acres: parseFloat(form.land_area_acres),
      annual_income: parseFloat(form.annual_income),
    });
  };

  const toggleCrop = (crop: string) => {
    setSelectedCrops(prev =>
      prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const f = form;
  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Farmer Profile</h1>
        <p className="text-gray-500 mt-1 hindi">किसान प्रोफ़ाइल — यह जानकारी आपकी पात्र योजनाओं को फ़िल्टर करती है</p>
      </div>

      {saved && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Profile saved! Your eligible schemes have been updated.
        </div>
      )}

      {mutation.isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          Failed to save profile. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold text-gray-800">Personal Information</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" value={f.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Mobile Number *</label>
              <input className="input" type="tel" value={f.phone} onChange={e => set('phone', e.target.value)} required />
            </div>
            <div>
              <label className="label">Aadhar Number (optional)</label>
              <input className="input" value={f.aadhar} onChange={e => set('aadhar', e.target.value)} placeholder="12-digit Aadhar" />
            </div>
            <div>
              <label className="label">Caste Category *</label>
              <select className="input" value={f.caste} onChange={e => set('caste', e.target.value)} required>
                <option value="">Select category</option>
                {CASTES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Preferred Language</label>
              <select className="input" value={f.preferred_language} onChange={e => set('preferred_language', e.target.value)}>
                <option value="hindi">Hindi / हिंदी</option>
                <option value="english">English</option>
                <option value="marathi">Marathi / मराठी</option>
                <option value="telugu">Telugu / తెలుగు</option>
                <option value="tamil">Tamil / தமிழ்</option>
                <option value="kannada">Kannada / ಕನ್ನಡ</option>
                <option value="gujarati">Gujarati / ગુજરાતી</option>
                <option value="punjabi">Punjabi / ਪੰਜਾਬੀ</option>
              </select>
            </div>
            <div>
              <label className="label">Smartphone Usage</label>
              <select className="input" value={f.smartphone_proficiency} onChange={e => set('smartphone_proficiency', e.target.value)}>
                {SMARTPHONE_LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold text-gray-800">Location</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">State *</label>
              <select className="input" value={f.state} onChange={e => set('state', e.target.value)} required>
                <option value="">Select state</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">District *</label>
              <input className="input" value={f.district} onChange={e => set('district', e.target.value)} placeholder="Your district" required />
            </div>
            <div>
              <label className="label">Village / Town</label>
              <input className="input" value={f.village} onChange={e => set('village', e.target.value)} placeholder="Village name" />
            </div>
            <div>
              <label className="label">PIN Code</label>
              <input className="input" value={f.pincode} onChange={e => set('pincode', e.target.value)} placeholder="6-digit PIN" />
            </div>
          </div>
        </div>

        {/* Land & Financial */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold text-gray-800">Land & Financial Details</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Land Area (Acres) *</label>
              <input className="input" type="number" step="0.01" min="0" value={f.land_area_acres} onChange={e => set('land_area_acres', e.target.value)} placeholder="e.g. 2.5" required />
            </div>
            <div>
              <label className="label">Land Type</label>
              <select className="input" value={f.land_type} onChange={e => set('land_type', e.target.value)}>
                {LAND_TYPES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Annual Family Income (₹) *</label>
              <input className="input" type="number" min="0" value={f.annual_income} onChange={e => set('annual_income', e.target.value)} placeholder="e.g. 120000" required />
            </div>
            <div>
              <label className="label">Irrigation Type</label>
              <select className="input" value={f.irrigation_type} onChange={e => set('irrigation_type', e.target.value)}>
                {IRRIGATION_TYPES.map(t => <option key={t} value={t.toLowerCase().replace(/\//g, '_')}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={f.bank_account}
                  onChange={e => set('bank_account', e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">I have a Bank Account</span>
                  <p className="text-xs text-gray-500">Required for Direct Benefit Transfer (DBT) schemes</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Crops */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Wheat className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold text-gray-800">Crops You Grow</h2>
            <span className="text-xs text-gray-400">({selectedCrops.length} selected)</span>
          </div>
          <p className="text-sm text-gray-500 mb-3">Select all crops you grow throughout the year:</p>
          <div className="flex flex-wrap gap-2">
            {CROPS.map(crop => (
              <button
                key={crop}
                type="button"
                onClick={() => toggleCrop(crop)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedCrops.includes(crop)
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
                }`}
              >
                {crop}
              </button>
            ))}
          </div>
          {selectedCrops.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">Please select at least one crop for accurate scheme matching.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          <Save className="w-5 h-5" />
          {mutation.isPending ? 'Saving...' : 'Save Profile & Find Schemes'}
        </button>
      </form>
    </div>
  );
}
