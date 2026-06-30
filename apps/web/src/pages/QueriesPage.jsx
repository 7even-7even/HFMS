import { useState } from 'react';
import { useSelector } from 'react-redux';
import { MessageCircleQuestion, Send } from 'lucide-react';
import Badge from '../components/Badge';
import DataState from '../components/DataState';
import { useAnswerPatientQueryMutation, useCreatePatientQueryMutation, usePatientQueriesQuery } from '../services/api';
import { ROLES, apiError, dateOnly, humanize } from '../utils/format';

export default function QueriesPage() {
  const user = useSelector((state) => state.auth.user);
  const { data, isLoading, error } = usePatientQueriesQuery({ limit: 100 });
  const [createQuery, createState] = useCreatePatientQueryMutation();
  const [answerQuery, answerState] = useAnswerPatientQueryMutation();
  const [form, setForm] = useState({ targetRole: 'DOCTOR', subject: '', message: '' });
  const [answers, setAnswers] = useState({});
  const isPatient = user?.role === ROLES.PATIENT;
  const canAnswer = [ROLES.DOCTOR, ROLES.DIETICIAN, ROLES.ADMIN].includes(user?.role);

  async function submit(e) {
    e.preventDefault();
    await createQuery(form).unwrap();
    setForm({ targetRole: 'DOCTOR', subject: '', message: '' });
  }

  async function answer(id) {
    await answerQuery({ id, response: answers[id], status: 'ANSWERED' }).unwrap();
    setAnswers({ ...answers, [id]: '' });
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-black text-brand-700"><MessageCircleQuestion size={16} /> Care team queries</p>
        <h2 className="mt-4 text-3xl font-black text-slate-950">Queries</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Patients can ask diet or medical food-related questions. Doctors and dieticians can respond from the same workspace.</p>
      </div>

      {isPatient && (
        <form onSubmit={submit} className="card space-y-4 p-5">
          <h3 className="text-lg font-black text-slate-950">Ask a new query</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label><span className="label">Ask to</span><select className="input" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}><option value="DOCTOR">Doctor</option><option value="DIETICIAN">Dietician</option></select></label>
            <label><span className="label">Subject</span><input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></label>
          </div>
          <label><span className="label">Message</span><textarea className="input min-h-28" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></label>
          {createState.error && <p className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{apiError(createState.error)}</p>}
          <button className="btn-primary"><Send size={16} /> Send query</button>
        </form>
      )}

      <DataState isLoading={isLoading} error={error}>
        <div className="space-y-4">
          {(data?.data?.items || []).map((query) => (
            <div key={query.id} className="card p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div><p className="text-xs font-black uppercase tracking-wide text-brand-700">To {humanize(query.targetRole)} · {dateOnly(query.createdAt)}</p><h3 className="mt-1 text-xl font-black text-slate-950">{query.subject}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{query.message}</p></div>
                <Badge value={query.status} />
              </div>
              {query.patient && !isPatient && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600"><b>Patient:</b> {query.patient.name} · {query.patient.ward} {query.patient.roomNumber}/{query.patient.bedNumber}</p>}
              {query.response && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900"><p className="font-black">Response</p><p className="mt-1 leading-6">{query.response}</p></div>}
              {canAnswer && query.status === 'OPEN' && (
                <div className="mt-4 space-y-3">
                  <textarea className="input min-h-24" placeholder="Write response..." value={answers[query.id] || ''} onChange={(e) => setAnswers({ ...answers, [query.id]: e.target.value })} />
                  <button className="btn-primary" disabled={!answers[query.id] || answerState.isLoading} onClick={() => answer(query.id)}>Send answer</button>
                </div>
              )}
            </div>
          ))}
          {!data?.data?.items?.length && <div className="card p-8 text-center text-sm text-slate-500">No queries found.</div>}
        </div>
      </DataState>
    </div>
  );
}
