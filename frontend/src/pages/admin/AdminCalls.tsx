import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../../utils/api';
import { CallLog } from '../../types';
import {
  PhoneCall, Phone, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  FileText, MessageSquare,
} from 'lucide-react';

interface FarmerForCall {
  id: string;
  name: string;
  phone: string;
  preferred_language: string;
  smartphone_proficiency: string;
}

interface CallScript {
  greeting: string;
  scheme_summaries: Array<{
    name: string;
    benefits: string;
    deadline: string;
    documents: string[];
    where_to_apply: string;
    approximate_charges: string;
  }>;
  followup_questions: string[];
  closing: string;
}

function ScriptModal({ farmerId, onClose }: { farmerId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['callScript', farmerId],
    queryFn: () => callApi.getScript(farmerId).then(r => r.data),
  });

  const queryClient = useQueryClient();
  const initiateMutation = useMutation({
    mutationFn: ({ schemes }: { schemes: string[] }) =>
      callApi.initiateCall(farmerId, schemes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingCalls'] });
      onClose();
    },
  });

  const script: CallScript | undefined = data?.script;
  const eligibleSchemes: Array<{ id: string; name: string }> = data?.eligible_schemes || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Call Script — {data?.farmer?.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : script ? (
            <div className="space-y-4 text-sm">
              {/* Farmer info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p><strong>Phone:</strong> {data?.farmer?.phone}</p>
                <p><strong>Language:</strong> {data?.farmer?.preferred_language}</p>
                <p><strong>Eligible Schemes:</strong> {eligibleSchemes.length}</p>
              </div>

              {/* Script */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-500" />
                  Call Script
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-medium text-green-800 mb-1">Greeting:</p>
                    <p className="text-green-700 hindi leading-relaxed">{script.greeting}</p>
                  </div>

                  {script.scheme_summaries.map((s, i) => (
                    <div key={i} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-semibold text-blue-800 mb-2">{i + 1}. {s.name}</p>
                      <p className="text-blue-700 mb-1"><strong>Benefits:</strong> {s.benefits}</p>
                      <p className="text-blue-600 text-xs mb-1"><strong>Deadline:</strong> {s.deadline}</p>
                      <p className="text-blue-600 text-xs mb-1"><strong>Where to apply:</strong> {s.where_to_apply}</p>
                      <p className="text-blue-600 text-xs"><strong>Charges:</strong> {s.approximate_charges}</p>
                      {s.documents.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-blue-700">Documents needed:</p>
                          <ul className="text-xs text-blue-600 list-disc list-inside">
                            {s.documents.map(d => <li key={d}>{d}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="font-medium text-amber-800 mb-2">Follow-up Questions:</p>
                    {script.followup_questions.map((q, i) => (
                      <p key={i} className="text-amber-700 text-xs">• {q}</p>
                    ))}
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-700 mb-1">Closing:</p>
                    <p className="text-gray-600 hindi leading-relaxed">{script.closing}</p>
                  </div>
                </div>
              </div>

              {/* Initiate button */}
              <button
                onClick={() => initiateMutation.mutate({ schemes: eligibleSchemes.map(s => s.id) })}
                disabled={initiateMutation.isPending}
                className="btn-primary w-full justify-center"
              >
                <Phone className="w-4 h-4" />
                {initiateMutation.isPending ? 'Logging call...' : 'Log Call as Initiated'}
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

function OutcomeModal({ callId, onClose }: { callId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    outcome: 'answered',
    notes: '',
    application_number: '',
    schedule_followup: false,
    followup_days: 7,
  });

  const mutation = useMutation({
    mutationFn: () => callApi.recordOutcome({ call_id: callId, ...form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingCalls'] });
      queryClient.invalidateQueries({ queryKey: ['callHistory'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Record Call Outcome</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Outcome</label>
              <select className="input" value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}>
                <option value="answered">Answered — Schemes explained</option>
                <option value="no_answer">No Answer</option>
                <option value="busy">Busy</option>
                <option value="not_interested">Not Interested</option>
                <option value="applied">Applied / Will Apply</option>
                <option value="needs_help">Needs Assistance</option>
              </select>
            </div>

            <div>
              <label className="label">Application Number (if farmer has applied)</label>
              <input className="input" value={form.application_number} onChange={e => setForm(f => ({ ...f, application_number: e.target.value }))} placeholder="e.g. PM-KISAN-12345678" />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Call notes, farmer feedback..." />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.schedule_followup} onChange={e => setForm(f => ({ ...f, schedule_followup: e.target.checked }))} className="w-4 h-4 text-brand-600 rounded" />
              <span className="text-sm font-medium">Schedule follow-up call</span>
            </label>

            {form.schedule_followup && (
              <div>
                <label className="label">Follow-up in (days)</label>
                <input type="number" className="input" min={1} max={30} value={form.followup_days} onChange={e => setForm(f => ({ ...f, followup_days: parseInt(e.target.value) }))} />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
                {mutation.isPending ? 'Saving...' : 'Save Outcome'}
              </button>
              <button onClick={onClose} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCalls() {
  const [scriptFarmerId, setScriptFarmerId] = useState<string | null>(null);
  const [outcomeCallId, setOutcomeCallId] = useState<string | null>(null);

  const { data: outboundQueue } = useQuery<FarmerForCall[]>({
    queryKey: ['outboundQueue'],
    queryFn: () => callApi.getOutboundQueue().then(r => r.data),
  });

  const { data: pendingCalls } = useQuery<CallLog[]>({
    queryKey: ['pendingCalls'],
    queryFn: () => callApi.getPending().then(r => r.data),
  });

  const { data: callHistory } = useQuery<CallLog[]>({
    queryKey: ['callHistory'],
    queryFn: () => callApi.getHistory().then(r => r.data),
  });

  return (
    <div className="max-w-6xl mx-auto">
      {scriptFarmerId && <ScriptModal farmerId={scriptFarmerId} onClose={() => setScriptFarmerId(null)} />}
      {outcomeCallId && <OutcomeModal callId={outcomeCallId} onClose={() => setOutcomeCallId(null)} />}

      <div className="mb-8">
        <h1 className="text-2xl font-bold">AI Call Assistant</h1>
        <p className="text-gray-500 hindi">AI कॉल सहायक — कीपैड फोन किसानों के लिए</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Outbound Queue */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <PhoneCall className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold text-gray-800">Farmers to Call</h2>
            <span className="badge badge-orange ml-auto">{outboundQueue?.length || 0} pending</span>
          </div>
          <div className="space-y-2">
            {outboundQueue?.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{f.name}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="w-3 h-3" />
                    {f.phone}
                    <span className="badge badge-red ml-1">{f.smartphone_proficiency} phone</span>
                  </div>
                </div>
                <button
                  onClick={() => setScriptFarmerId(f.id)}
                  className="btn-primary text-xs py-1.5"
                >
                  <FileText className="w-3 h-3" />
                  Script
                </button>
              </div>
            ))}
            {(!outboundQueue || outboundQueue.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">No farmers in queue</p>
            )}
          </div>
        </div>

        {/* Pending Calls */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-800">Active / Scheduled Calls</h2>
          </div>
          <div className="space-y-2">
            {pendingCalls?.map(call => (
              <div key={call.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{call.farmer_name}</p>
                  <p className="text-xs text-gray-500">{call.farmer_phone} · {call.call_type}</p>
                  {call.scheduled_at && (
                    <p className="text-xs text-amber-600">Scheduled: {new Date(call.scheduled_at).toLocaleDateString()}</p>
                  )}
                </div>
                <button
                  onClick={() => setOutcomeCallId(call.id)}
                  className="btn-secondary text-xs py-1.5"
                >
                  Record Outcome
                </button>
              </div>
            ))}
            {(!pendingCalls || pendingCalls.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">No pending calls</p>
            )}
          </div>
        </div>
      </div>

      {/* Call History */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold text-gray-800">Call History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {['Farmer', 'Phone', 'Type', 'Status', 'Outcome', 'Date'].map(h => (
                  <th key={h} className="pb-2 px-2 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {callHistory?.map(call => (
                <tr key={call.id} className="hover:bg-gray-50">
                  <td className="py-2 px-2 font-medium text-gray-800">{call.farmer_name}</td>
                  <td className="py-2 px-2 text-gray-600">{call.farmer_phone}</td>
                  <td className="py-2 px-2">
                    <span className="badge badge-blue capitalize">{call.call_type}</span>
                  </td>
                  <td className="py-2 px-2">
                    <span className={`badge ${call.status === 'completed' ? 'badge-green' : call.status === 'failed' ? 'badge-red' : 'badge-yellow'}`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-gray-600 text-xs max-w-32 truncate">{call.outcome || '—'}</td>
                  <td className="py-2 px-2 text-gray-400 text-xs">
                    {call.called_at ? new Date(call.called_at).toLocaleDateString() : call.created_at ? new Date(call.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!callHistory || callHistory.length === 0) && (
            <p className="text-gray-400 text-sm text-center py-6">No call history yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
