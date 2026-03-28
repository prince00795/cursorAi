import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi } from '../utils/api';
import { Application, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '../types';
import { FileText, ExternalLink, Phone, ChevronDown, ChevronUp, Save } from 'lucide-react';

const NEXT_STATUSES: Record<string, string[]> = {
  interested: ['documents_ready'],
  documents_ready: ['applied'],
  applied: ['approved', 'rejected'],
  approved: ['disbursed'],
  rejected: [],
  disbursed: [],
};

function ApplicationCard({ app }: { app: Application }) {
  const [expanded, setExpanded] = useState(false);
  const [appNumber, setAppNumber] = useState(app.application_number || '');
  const [status, setStatus] = useState(app.status);
  const [notes, setNotes] = useState(app.notes || '');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => applicationApi.updateApplication(app.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ status, application_number: appNumber || undefined, notes });
  };

  const statusColor = APPLICATION_STATUS_COLORS[app.status] || 'badge-gray';

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={statusColor}>{APPLICATION_STATUS_LABELS[app.status]}</span>
            <span className="badge badge-gray text-xs">{app.category}</span>
          </div>
          <h3 className="font-semibold text-gray-900">{app.scheme_name}</h3>
          {app.name_hindi && <p className="text-xs text-gray-400 hindi">{app.name_hindi}</p>}
          <p className="text-xs text-gray-500 mt-1">{app.ministry}</p>
          {app.application_number && (
            <p className="text-xs text-brand-600 font-medium mt-1">
              App No: {app.application_number}
            </p>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        {app.application_url && (
          <a href={app.application_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1.5">
            <ExternalLink className="w-3 h-3" />
            Apply Online
          </a>
        )}
        {app.helpline && (
          <a href={`tel:${app.helpline}`} className="btn-secondary text-xs py-1.5">
            <Phone className="w-3 h-3" />
            {app.helpline}
          </a>
        )}
      </div>

      {/* Expanded update form */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div>
            <label className="label text-xs">Update Status</label>
            <select
              className="input text-sm"
              value={status}
              onChange={e => setStatus(e.target.value as Application['status'])}
            >
              <option value={app.status}>{APPLICATION_STATUS_LABELS[app.status]} (current)</option>
              {NEXT_STATUSES[app.status]?.map(s => (
                <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {(status === 'applied' || app.application_number) && (
            <div>
              <label className="label text-xs">Application Number (if applied)</label>
              <input
                className="input text-sm"
                value={appNumber}
                onChange={e => setAppNumber(e.target.value)}
                placeholder="Enter application/reference number"
              />
            </div>
          )}

          <div>
            <label className="label text-xs">Notes / Feedback</label>
            <textarea
              className="input text-sm resize-none"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes about this application..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="btn-primary text-sm py-2"
          >
            <Save className="w-3.5 h-3.5" />
            {updateMutation.isPending ? 'Saving...' : 'Save Update'}
          </button>

          {updateMutation.isSuccess && (
            <p className="text-xs text-green-600">Updated successfully!</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  const { data: applications, isLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => applicationApi.getMyApplications().then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500 mt-1 hindi">मेरे आवेदन — ट्रैक करें</p>
      </div>

      {!applications || applications.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Applications Yet</h3>
          <p className="text-gray-500 text-sm mb-4">
            Go to Schemes page and click "Track" on schemes you're interested in.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-500">
            {applications.length} scheme{applications.length !== 1 ? 's' : ''} in tracker
          </div>
          {applications.map((app: Application) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
