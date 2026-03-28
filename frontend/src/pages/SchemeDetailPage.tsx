import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schemeApi, applicationApi } from '../utils/api';
import {
  ArrowLeft, ExternalLink, FileText, Phone, Clock, CheckCircle,
  Building2, MapPin, BookmarkPlus,
} from 'lucide-react';

export default function SchemeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: scheme, isLoading } = useQuery({
    queryKey: ['scheme', id],
    queryFn: () => schemeApi.getById(id!).then(r => r.data),
  });

  const trackMutation = useMutation({
    mutationFn: () => applicationApi.addToTracker(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!scheme) {
    return <div className="text-center py-12 text-gray-500">Scheme not found.</div>;
  }

  const docs: string[] = (() => {
    try { return JSON.parse(scheme.required_documents); } catch { return []; }
  })();

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-600 hover:text-brand-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Schemes
      </button>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="badge badge-green">{scheme.category}</span>
          <span className="badge badge-gray">{scheme.ministry}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{scheme.name}</h1>
        <p className="text-lg text-brand-600 hindi">{scheme.name_hindi}</p>

        <p className="text-gray-600 mt-4 leading-relaxed">{scheme.description}</p>
        {scheme.description_hindi && (
          <p className="text-gray-500 mt-2 text-sm leading-relaxed hindi">{scheme.description_hindi}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {scheme.application_url && (
            <a
              href={scheme.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <ExternalLink className="w-4 h-4" />
              Apply Online
            </a>
          )}
          <button
            onClick={() => trackMutation.mutate()}
            disabled={trackMutation.isPending || trackMutation.isSuccess}
            className="btn-secondary"
          >
            <BookmarkPlus className="w-4 h-4" />
            {trackMutation.isSuccess ? 'Added to Tracker ✓' : 'Track Application'}
          </button>
        </div>
        {trackMutation.isError && (
          <p className="text-xs text-red-500 mt-2">Already tracking or error occurred.</p>
        )}
      </div>

      {/* Benefits */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Benefits / लाभ
        </h2>
        <p className="text-gray-700 leading-relaxed">{scheme.benefits}</p>
        {scheme.benefits_hindi && (
          <p className="text-gray-500 mt-2 text-sm leading-relaxed hindi">{scheme.benefits_hindi}</p>
        )}
      </div>

      {/* Eligibility */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-500" />
          Eligibility Criteria / पात्रता मानदंड
        </h2>
        <p className="text-gray-700 leading-relaxed">{scheme.eligibility_criteria}</p>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          {scheme.min_land_acres > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500">Min. Land</p>
              <p className="font-semibold">{scheme.min_land_acres} Acres</p>
            </div>
          )}
          {scheme.max_land_acres && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500">Max. Land</p>
              <p className="font-semibold">{scheme.max_land_acres} Acres</p>
            </div>
          )}
          {scheme.max_income && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500">Max. Income</p>
              <p className="font-semibold">₹{Number(scheme.max_income).toLocaleString('en-IN')}/year</p>
            </div>
          )}
          {scheme.requires_bank_account ? (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500">Bank Account</p>
              <p className="font-semibold text-green-600">Required</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Documents Required */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          Documents Required / आवश्यक दस्तावेज़
        </h2>
        <div className="space-y-2">
          {docs.map((doc, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg text-sm">
              <span className="w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-gray-700">{doc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Where to Apply */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-500" />
          Where to Apply / कहाँ आवेदन करें
        </h2>
        <div className="space-y-3 text-sm">
          {scheme.application_url && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800">Apply Online</p>
                <a href={scheme.application_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all">
                  {scheme.application_url}
                </a>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <Building2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">CSC Center (Common Service Centre)</p>
              <p className="text-gray-600">Visit your nearest CSC center with documents. Charges: ₹30–₹100 typically.</p>
              <p className="text-gray-500 hindi text-xs mt-1">नजदीकी CSC केंद्र पर दस्तावेजों के साथ जाएं। शुल्क: ₹30-₹100</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Building2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-700">District Agriculture Office</p>
              <p className="text-gray-600">Visit your district agriculture office or Gram Panchayat for assistance.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deadline & Helpline */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {scheme.deadline && (
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-gray-800">Deadline</h3>
            </div>
            <p className="text-amber-700 font-medium">{scheme.deadline}</p>
          </div>
        )}
        {scheme.helpline && (
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-5 h-5 text-brand-500" />
              <h3 className="font-semibold text-gray-800">Helpline</h3>
            </div>
            <p className="text-brand-700 font-medium text-lg">{scheme.helpline}</p>
            <p className="text-xs text-gray-500">Call for queries / शिकायत के लिए</p>
          </div>
        )}
      </div>
    </div>
  );
}
