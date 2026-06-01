'use client';

import { useMemo, useState } from 'react';
import { Archive, Check, ExternalLink, MessageCircle, Plus, Search, StickyNote, Trash2 } from 'lucide-react';
import type { Lead, LeadNote, LeadSource, LeadStatus } from '@/lib/types';
import { lostReasons, planLabels, sourceLabels, statusLabels, statusOrder, whatsappTemplate } from '@/lib/constants';
import { currency, planAmount, relativeTime } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';

export function LeadsManager({ initialLeads, initialNotes }: { initialLeads: Lead[]; initialNotes: LeadNote[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<LeadStatus | 'all'>('all');
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return leads
      .filter((lead) => !lead.archived)
      .filter((lead) => status === 'all' || lead.status === status)
      .filter((lead) => [lead.parent_name, lead.child_name, lead.phone, lead.email].join(' ').toLowerCase().includes(q));
  }, [leads, query, status]);

  async function patchLead(id: string, updates: Partial<Lead>) {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    setLeads((items) => items.map((lead) => (lead.id === id ? data.lead : lead)));
    if (selected?.id === id) setSelected(data.lead);
  }

  async function addNote(leadId: string, content: string) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    setNotes((items) => [data.note, ...items]);
  }

  async function createLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form);
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, interested_plan: payload.interested_plan || 'buddy_beginner' }),
    });
    const data = await res.json();
    setLeads((items) => [data.lead, ...items]);
    setShowNew(false);
  }

  return (
    <>
      <div className="card mb-5 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-0 flex-1 basis-full sm:min-w-[260px] sm:basis-auto">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input className="input pl-9" placeholder="Search name, phone, email..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="select w-full sm:w-auto" value={status} onChange={(e) => setStatus(e.target.value as LeadStatus | 'all')}>
          <option value="all">All statuses</option>
          {statusOrder.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}
        </select>
        <button className="btn" onClick={() => setView(view === 'table' ? 'kanban' : 'table')}>{view === 'table' ? 'Kanban' : 'Table'}</button>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={16} /> New Lead</button>
      </div>

      {view === 'table' ? (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Parent / Child</th><th>Contact</th><th>Source</th><th>Plan</th><th>Status</th><th>Payment</th><th>Lead Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => <LeadRow key={lead.id} lead={lead} onOpen={() => setSelected(lead)} onPatch={patchLead} />)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="kanban">
          {statusOrder.map((item) => (
            <div className="kanban-col" key={item}>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-black">{statusLabels[item]}</div>
                <span className="badge bg-white text-slate-600">{filtered.filter((lead) => lead.status === item).length}</span>
              </div>
              <div className="space-y-3">
                {filtered.filter((lead) => lead.status === item).map((lead) => (
                  <button className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm" key={lead.id} onClick={() => setSelected(lead)}>
                    <div className="font-extrabold">{lead.parent_name}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{lead.child_name} · {planLabels[lead.interested_plan || ''] || 'Plan TBD'}</div>
                    <div className="mt-3 text-xs font-bold text-slate-400">{relativeTime(lead.created_at)}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected ? <LeadDrawer lead={selected} notes={notes.filter((note) => note.lead_id === selected.id)} onClose={() => setSelected(null)} onPatch={patchLead} onNote={addNote} /> : null}

      {showNew ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onClick={() => setShowNew(false)}>
          <form className="card max-h-[92vh] w-full max-w-2xl overflow-auto p-4 sm:p-5" onSubmit={createLead} onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-xl font-black">Add Lead</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" name="parentName" placeholder="Parent name" required />
              <input className="input" name="childName" placeholder="Child name" required />
              <input className="input" name="phone" placeholder="Phone" required />
              <input className="input" name="email" placeholder="Email" />
              <input className="input" name="childAge" placeholder="Child age" type="number" />
              <select className="select" name="source">{Object.entries(sourceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
              <select className="select md:col-span-2" name="interested_plan">{Object.entries(planLabels).map(([key, label]) => <option key={key} value={key}>{label} · {currency(planAmount(key))}</option>)}</select>
              <textarea className="textarea md:col-span-2" name="message" placeholder="Notes or message" />
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2"><button className="btn" type="button" onClick={() => setShowNew(false)}>Cancel</button><button className="btn btn-primary">Save Lead</button></div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function LeadRow({ lead, onOpen, onPatch }: { lead: Lead; onOpen: () => void; onPatch: (id: string, updates: Partial<Lead>) => void }) {
  const waText = encodeURIComponent(whatsappTemplate.replace('{parent}', lead.parent_name).replace('{child}', lead.child_name));
  return (
    <tr>
      <td><button className="text-left" onClick={onOpen}><div className="font-extrabold">{lead.parent_name}</div><div className="text-xs font-semibold text-slate-500">{lead.child_name} · {lead.child_age || '-'} yrs</div></button></td>
      <td data-label="Contact"><a className="font-bold text-brand" href={`https://wa.me/91${lead.phone}?text=${waText}`} target="_blank">{lead.phone}</a><div className="break-all text-xs text-slate-500">{lead.email}</div></td>
      <td data-label="Source">
        <select className="select min-w-0 sm:min-w-[150px]" value={lead.source} onChange={(e) => onPatch(lead.id, { source: e.target.value as LeadSource })}>
          {Object.entries(sourceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </td>
      <td data-label="Plan">{planLabels[lead.interested_plan || ''] || '-'}</td>
      <td data-label="Status"><select className="select min-w-0 sm:min-w-[150px]" value={lead.status} onChange={(e) => onPatch(lead.id, { status: e.target.value as LeadStatus, last_contacted_at: new Date().toISOString() })}>{statusOrder.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></td>
      <td data-label="Payment">{lead.is_paid ? <span className="badge bg-emerald-50 text-emerald-700"><Check size={13} /> Paid {currency(lead.payment_amount)}</span> : <button className="btn" onClick={() => onPatch(lead.id, { is_paid: true, payment_amount: planAmount(lead.interested_plan), payment_date: new Date().toISOString().slice(0, 10) })}>Mark paid</button>}</td>
      <td data-label="Lead Date" className="text-sm font-semibold text-slate-500">{relativeTime(lead.created_at)}</td>
      <td data-label="Actions"><div className="flex flex-wrap gap-1"><button className="btn" onClick={onOpen}><StickyNote size={15} /></button><a className="btn" href={`https://wa.me/91${lead.phone}?text=${waText}`} target="_blank"><MessageCircle size={15} /></a><button className="btn btn-danger" onClick={() => onPatch(lead.id, { archived: true })}><Archive size={15} /></button></div></td>
    </tr>
  );
}

function LeadDrawer({ lead, notes, onClose, onPatch, onNote }: { lead: Lead; notes: LeadNote[]; onClose: () => void; onPatch: (id: string, updates: Partial<Lead>) => void; onNote: (id: string, content: string) => void }) {
  const [note, setNote] = useState('');
  const waText = encodeURIComponent(whatsappTemplate.replace('{parent}', lead.parent_name).replace('{child}', lead.child_name));
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" onClick={onClose}>
      <aside className="h-full w-full max-w-xl overflow-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div><h2 className="text-2xl font-black">{lead.parent_name}</h2><p className="font-semibold text-slate-500">{lead.child_name} · {lead.child_age || '-'} yrs</p></div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="mb-5 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm">
          <div><b>Status:</b> <StatusBadge status={lead.status} /></div>
          <label>
            <span className="mb-1 block font-bold">Confirmed source</span>
            <select className="select" value={lead.source} onChange={(e) => onPatch(lead.id, { source: e.target.value as LeadSource })}>
              {Object.entries(sourceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          <div><b>Plan:</b> {planLabels[lead.interested_plan || ''] || '-'}</div>
          <div><b>Payment:</b> {lead.is_paid ? currency(lead.payment_amount) : 'Unpaid'}</div>
          <div><b>Message:</b> {lead.message || '-'}</div>
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {statusOrder.map((item) => <button key={item} className="btn" onClick={() => onPatch(lead.id, { status: item })}>{statusLabels[item]}</button>)}
          <a className="btn btn-primary" href={`https://wa.me/91${lead.phone}?text=${waText}`} target="_blank"><ExternalLink size={15} /> WhatsApp</a>
        </div>
        <label className="mb-5 block">
          <span className="mb-2 block text-sm font-bold">Lost reason</span>
          <select className="select" value={lead.lost_reason || ''} onChange={(e) => onPatch(lead.id, { lost_reason: e.target.value, status: 'lost' })}>
            <option value="">Not lost</option>
            {lostReasons.map((reason) => <option key={reason}>{reason}</option>)}
          </select>
        </label>
        <form className="mb-5" onSubmit={(e) => { e.preventDefault(); if (note.trim()) { onNote(lead.id, note.trim()); setNote(''); } }}>
          <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add timestamped note..." />
          <button className="btn btn-primary mt-2"><Plus size={15} /> Add Note</button>
        </form>
        <div className="space-y-3">
          {notes.map((item) => <div className="rounded-lg border border-slate-200 p-3" key={item.id}><div className="font-semibold">{item.content}</div><div className="mt-1 text-xs font-bold text-slate-400">{relativeTime(item.created_at)}</div></div>)}
        </div>
      </aside>
    </div>
  );
}
