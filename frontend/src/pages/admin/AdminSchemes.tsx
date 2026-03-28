import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schemeApi } from '../../utils/api';
import { Scheme } from '../../types';
import { Plus, Edit2, ToggleLeft, ToggleRight, Search, BookOpen } from 'lucide-react';

function SchemeFormModal({ scheme, onClose }: { scheme?: Scheme; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEdit = !!scheme;

  const [form, setForm] = useState({
    name: scheme?.name || '',
    name_hindi: scheme?.name_hindi || '',
    ministry: scheme?.ministry || '',
    category: scheme?.category || 'Income Support',
    description: scheme?.description || '',
    description_hindi: scheme?.description_hindi || '',
    benefits: scheme?.benefits || '',
    benefits_hindi: scheme?.benefits_hindi || '',
    eligibility_criteria: scheme?.eligibility_criteria || '',
    required_documents: (() => { try { return (JSON.parse(scheme?.required_documents || '[]') as string[]).join('\n'); } catch { return ''; } })(),
    application_url: scheme?.application_url || '',
    helpline: scheme?.helpline || '',
    deadline: scheme?.deadline || '',
    min_land_acres: scheme?.min_land_acres?.toString() || '0',
    max_land_acres: scheme?.max_land_acres?.toString() || '',
    min_income: scheme?.min_income?.toString() || '0',
    max_income: scheme?.max_income?.toString() || '',
    requires_bank_account: scheme?.requires_bank_account ? true : false,
    priority_score: scheme?.priority_score?.toString() || '50',
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? schemeApi.update(scheme!.id, data) : schemeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSchemes'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const docs = form.required_documents.split('\n').map(d => d.trim()).filter(Boolean);
    mutation.mutate({
      ...form,
      required_documents: docs,
      min_land_acres: parseFloat(form.min_land_acres) || 0,
      max_land_acres: form.max_land_acres ? parseFloat(form.max_land_acres) : null,
      min_income: parseFloat(form.min_income) || 0,
      max_income: form.max_income ? parseFloat(form.max_income) : null,
      priority_score: parseInt(form.priority_score) || 50,
    });
  };

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const CATEGORIES = ['Income Support', 'Crop Insurance', 'Credit & Finance', 'Irrigation', 'Farm Machinery', 'Organic Farming', 'Horticulture', 'Solar Energy', 'Market Access', 'Pension', 'Special Category', 'Soil Health', 'Crop Development', 'Agriculture Development'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{isEdit ? 'Edit Scheme' : 'Add New Scheme'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Name (English) *</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Name (Hindi)</label>
                <input className="input hindi" value={form.name_hindi} onChange={e => set('name_hindi', e.target.value)} />
              </div>
              <div>
                <label className="label">Ministry *</label>
                <input className="input" value={form.ministry} onChange={e => set('ministry', e.target.value)} required />
              </div>
              <div>
                <label className="label">Category *</label>
                <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} required />
            </div>

            <div>
              <label className="label">Benefits *</label>
              <textarea className="input resize-none" rows={2} value={form.benefits} onChange={e => set('benefits', e.target.value)} required />
            </div>

            <div>
              <label className="label">Benefits (Hindi)</label>
              <textarea className="input resize-none hindi" rows={2} value={form.benefits_hindi} onChange={e => set('benefits_hindi', e.target.value)} />
            </div>

            <div>
              <label className="label">Eligibility Criteria *</label>
              <textarea className="input resize-none" rows={2} value={form.eligibility_criteria} onChange={e => set('eligibility_criteria', e.target.value)} required />
            </div>

            <div>
              <label className="label">Required Documents (one per line) *</label>
              <textarea className="input resize-none font-mono text-xs" rows={4} value={form.required_documents} onChange={e => set('required_documents', e.target.value)} placeholder="Aadhar Card&#10;Land Records&#10;Bank Account" required />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Application URL</label>
                <input className="input" type="url" value={form.application_url} onChange={e => set('application_url', e.target.value)} />
              </div>
              <div>
                <label className="label">Helpline</label>
                <input className="input" value={form.helpline} onChange={e => set('helpline', e.target.value)} />
              </div>
              <div>
                <label className="label">Deadline</label>
                <input className="input" value={form.deadline} onChange={e => set('deadline', e.target.value)} placeholder="e.g. December 31" />
              </div>
              <div>
                <label className="label">Priority Score (0-100)</label>
                <input className="input" type="number" min={0} max={100} value={form.priority_score} onChange={e => set('priority_score', e.target.value)} />
              </div>
              <div>
                <label className="label">Min. Land (Acres)</label>
                <input className="input" type="number" step="0.01" value={form.min_land_acres} onChange={e => set('min_land_acres', e.target.value)} />
              </div>
              <div>
                <label className="label">Max. Land (blank = no limit)</label>
                <input className="input" type="number" step="0.01" value={form.max_land_acres} onChange={e => set('max_land_acres', e.target.value)} />
              </div>
              <div>
                <label className="label">Max. Income ₹ (blank = no limit)</label>
                <input className="input" type="number" value={form.max_income} onChange={e => set('max_income', e.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="bank" checked={form.requires_bank_account} onChange={e => set('requires_bank_account', e.target.checked)} className="w-4 h-4 text-brand-600 rounded" />
                <label htmlFor="bank" className="text-sm text-gray-700">Requires Bank Account</label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={mutation.isPending} className="btn-primary">
                {mutation.isPending ? 'Saving...' : isEdit ? 'Update Scheme' : 'Create Scheme'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            </div>

            {mutation.isError && <p className="text-red-600 text-sm">Failed to save scheme.</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminSchemes() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editScheme, setEditScheme] = useState<Scheme | undefined>();
  const [showForm, setShowForm] = useState(false);

  const { data: schemes, isLoading } = useQuery<Scheme[]>({
    queryKey: ['adminSchemes'],
    queryFn: () => schemeApi.getAll().then(r => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (scheme: Scheme) =>
      schemeApi.update(scheme.id, { is_active: scheme.is_active ? 0 : 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminSchemes'] }),
  });

  const filtered = (schemes || []).filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      {(showForm || editScheme) && (
        <SchemeFormModal
          scheme={editScheme}
          onClose={() => { setShowForm(false); setEditScheme(undefined); }}
        />
      )}

      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Schemes Management</h1>
          <p className="text-gray-500">{filtered.length} schemes</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add New Scheme
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search schemes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className={`card flex items-start gap-4 ${!s.is_active ? 'opacity-60' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-1">
                  <span className="badge badge-blue">{s.category}</span>
                  <span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="badge badge-gray">Priority: {s.priority_score}</span>
                </div>
                <h3 className="font-semibold text-gray-800">{s.name}</h3>
                <p className="text-xs text-gray-400 hindi">{s.name_hindi}</p>
                <p className="text-xs text-gray-500 mt-1">{s.ministry}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-1">{s.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { setEditScheme(s); }}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-brand-600"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleMutation.mutate(s)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                  title={s.is_active ? 'Deactivate' : 'Activate'}
                >
                  {s.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
