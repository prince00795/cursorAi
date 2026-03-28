import { SchemeMatch, Scheme } from '../types';
import { CheckCircle, XCircle, ChevronRight, ExternalLink, FileText, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  match?: SchemeMatch;
  scheme?: Scheme;
  onTrack?: (schemeId: string) => void;
  rank?: number;
}

export default function SchemeCard({ match, scheme: schemeProp, onTrack, rank }: Props) {
  const navigate = useNavigate();
  const scheme = match?.scheme ?? schemeProp!;
  const eligible = match?.eligible ?? true;

  const docs: string[] = (() => {
    try { return JSON.parse(scheme.required_documents); } catch { return []; }
  })();

  const categoryColors: Record<string, string> = {
    'Income Support': 'bg-green-100 text-green-800',
    'Crop Insurance': 'bg-blue-100 text-blue-800',
    'Credit & Finance': 'bg-purple-100 text-purple-800',
    'Irrigation': 'bg-cyan-100 text-cyan-800',
    'Farm Machinery': 'bg-orange-100 text-orange-800',
    'Organic Farming': 'bg-lime-100 text-lime-800',
    'Horticulture': 'bg-pink-100 text-pink-800',
    'Solar Energy': 'bg-yellow-100 text-yellow-800',
    'Market Access': 'bg-indigo-100 text-indigo-800',
    'Pension': 'bg-gray-100 text-gray-800',
    'Special Category': 'bg-red-100 text-red-800',
    'Soil Health': 'bg-earth-100 text-earth-800',
    'Crop Development': 'bg-teal-100 text-teal-800',
    'Agriculture Development': 'bg-violet-100 text-violet-800',
  };

  return (
    <div className={`card hover:shadow-md transition-shadow ${!eligible ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {rank && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                {rank}
              </span>
            )}
            {eligible ? (
              <span className="badge badge-green flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Eligible
              </span>
            ) : (
              <span className="badge badge-red flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Not Eligible
              </span>
            )}
            <span className={`badge ${categoryColors[scheme.category] || 'badge-gray'}`}>
              {scheme.category}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 text-base leading-tight">{scheme.name}</h3>
          <p className="text-xs text-gray-500 hindi mt-0.5">{scheme.name_hindi}</p>
          <p className="text-xs text-gray-500 mt-1">{scheme.ministry}</p>
        </div>
      </div>

      {/* Benefits */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{scheme.benefits}</p>

      {/* Deadline */}
      {scheme.deadline && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{scheme.deadline}</span>
        </div>
      )}

      {/* Required docs preview */}
      {docs.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span className="font-medium">Documents needed:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {docs.slice(0, 3).map(doc => (
              <span key={doc} className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{doc}</span>
            ))}
            {docs.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">+{docs.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* Match reasons */}
      {match && match.match_reasons.length > 0 && eligible && (
        <div className="mb-3 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 space-y-0.5">
          {match.match_reasons.slice(0, 2).map(r => (
            <div key={r} className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 flex-shrink-0" />
              {r}
            </div>
          ))}
        </div>
      )}

      {/* Missing criteria */}
      {match && !eligible && match.missing_criteria.length > 0 && (
        <div className="mb-3 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 space-y-0.5">
          {match.missing_criteria.slice(0, 2).map(r => (
            <div key={r} className="flex items-center gap-1">
              <XCircle className="w-3 h-3 flex-shrink-0" />
              {r}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => navigate(`/schemes/${scheme.id}`)}
          className="flex-1 btn-primary text-sm py-2 justify-center"
        >
          View Details
          <ChevronRight className="w-4 h-4" />
        </button>
        {eligible && onTrack && (
          <button
            onClick={() => onTrack(scheme.id)}
            className="btn-secondary text-sm py-2"
            title="Track this application"
          >
            Track
          </button>
        )}
        {scheme.application_url && eligible && (
          <a
            href={scheme.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm py-2"
            title="Apply online"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
