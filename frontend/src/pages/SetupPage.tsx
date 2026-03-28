import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../utils/api';
import { Sprout, ShieldCheck } from 'lucide-react';

export default function SetupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', password: '', setup_key: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminApi.setup(form);
      alert('Admin setup complete! Please login.');
      navigate('/login');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Admin Setup</h1>
          <p className="text-gray-500">One-time setup for the first admin account</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-700">This page will be disabled after the first admin is created.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Admin Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className="input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Setup Key</label>
              <input className="input" type="password" value={form.setup_key} onChange={e => setForm(f => ({ ...f, setup_key: e.target.value }))} placeholder="Default: kisan_setup_2024" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Creating...' : 'Create Admin Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
