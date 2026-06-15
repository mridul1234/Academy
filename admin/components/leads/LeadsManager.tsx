'use client';

import { useMemo, useState } from 'react';
import { Archive, Check, ExternalLink, MessageCircle, Plus, Search, StickyNote, Trash2 } from 'lucide-react';
import type { Lead, LeadNote, LeadSource, LeadStatus } from '@/lib/types';
import { lostReasons, planLabels, sourceLabels, statusLabels, statusOrder, whatsappTemplate } from '@/lib/constants';
import { acquisitionLabel, classifyLeadAcquisition, extractCampaignValue } from '@/lib/acquisition';
import { currency, planAmount, relativeTime } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';

const activeStatusOrder = statusOrder.filter((item) => item !== 'lost');

export function LeadsManager({ initialLeads, initialNotes }: { initialLeads: Lead[]; initialNotes: LeadNote[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<LeadStatus | 'all'>('all');
  const [section, setSection] = useState<'active' | 'lost'>('active');
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return leads
      .filter((lead) => !lead.archived)
      .filter((lead) => section === 'lost' ? lead.status === 'lost' : lead.status !== 'lost')
      .filter((lead) => status === 'all' || lead.status === status)
      .filter((lead) => [lead.parent_name, lead.child_name, lead.phone, lead.email].join(' ').toLowerCase().includes(q));
  }, [leads, query, section, status]);

  const activeCount = leads.filter((lead) => !lead.archived && lead.status !== 'lost').length;
  const lostCount = leads.filter((lead) => !lead.archived && lead.status === 'lost').length;

  function setLeadSection(nextSection: 'active' | 'lost') {
    setSection(nextSection);
    setStatus('all');
    if (nextSection === 'lost') setView('table');
  }

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
      <div className="mb-4 flex flex-wrap gap-2">
        <button className={`btn ${section === 'active' ? 'btn-primary' : ''}`} onClick={() => setLeadSection('active')}>
          Main Leads <span className="badge bg-white/80 text-slate-700">{activeCount}</span>
        </button>
        <button className={`btn ${section === 'lost' ? 'btn-primary' : ''}`} onClick={() => setLeadSection('lost')}>
          Lost Leads <span className="badge bg-white/80 text-slate-700">{lostCount}</span>
        </button>
      </div>

      <div className="card mb-5 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-0 flex-1 basis-full sm:min-w-[260px] sm:basis-auto">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input className="input pl-9" placeholder="Search name, phone, email..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {section === 'active' ? (
          <>
            <select className="select w-full sm:w-auto" value={status} onChange={(e) => setStatus(e.target.value as LeadStatus | 'all')}>
              <option value="all">All active statuses</option>
              {activeStatusOrder.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}
            </select>
            <button className="btn" onClick={() => setView(view === 'table' ? 'kanban' : 'table')}>{view === 'table' ? 'Kanban' : 'Table'}</button>
          </>
        ) : null}
        <button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={16} /> New Lead</button>
      </div>

      {view === 'table' ? (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Parent / Child</th><th>Contact</th><th>Source</th><th>Traffic</th><th>Plan</th><th>Status</th>{section === 'lost' ? <th>Lost Reason</th> : null}<th>Payment</th><th>Lead Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => <LeadRow key={lead.id} lead={lead} showLostReason={section === 'lost'} onOpen={() => setSelected(lead)} onPatch={patchLead} />)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="kanban">
          {activeStatusOrder.map((item) => (
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

function LeadRow({ lead, showLostReason, onOpen, onPatch }: { lead: Lead; showLostReason: boolean; onOpen: () => void; onPatch: (id: string, updates: Partial<Lead>) => void }) {
  const waText = encodeURIComponent(whatsappTemplate.replace('{parent}', lead.parent_name).replace('{child}', lead.child_name));
  const channel = classifyLeadAcquisition(lead);
  const campaign = extractCampaignValue(lead, 'utm_campaign');
  function updateStatus(nextStatus: LeadStatus) {
    onPatch(lead.id, {
      status: nextStatus,
      last_contacted_at: new Date().toISOString(),
      ...(nextStatus === 'lost' ? {} : { lost_reason: null }),
    });
  }

  return (
    <tr>
      <td><button className="text-left" onClick={onOpen}><div className="font-extrabold">{lead.parent_name}</div><div className="text-xs font-semibold text-slate-500">{lead.child_name} · {lead.child_age || '-'} yrs</div></button></td>
      <td data-label="Contact"><a className="font-bold text-brand" href={`https://wa.me/91${lead.phone}?text=${waText}`} target="_blank">{lead.phone}</a><div className="break-all text-xs text-slate-500">{lead.email}</div></td>
      <td data-label="Source">
        <select className="select min-w-0 sm:min-w-[150px]" value={lead.source} onChange={(e) => onPatch(lead.id, { source: e.target.value as LeadSource })}>
          {Object.entries(sourceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </td>
      <td data-label="Traffic">
        <span className={`badge ${channel === 'meta_ads' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {acquisitionLabel(channel)}
        </span>
        {campaign ? <div className="mt-1 max-w-[180px] truncate text-xs font-semibold text-slate-500">{campaign}</div> : null}
      </td>
      <td data-label="Plan">{planLabels[lead.interested_plan || ''] || '-'}</td>
      <td data-label="Status"><select className="select min-w-0 sm:min-w-[150px]" value={lead.status} onChange={(e) => updateStatus(e.target.value as LeadStatus)}>{statusOrder.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></td>
      {showLostReason ? (
        <td data-label="Lost Reason">
          <select className="select min-w-0 sm:min-w-[210px]" value={lead.lost_reason || ''} onChange={(e) => onPatch(lead.id, { lost_reason: e.target.value || null, status: 'lost' })}>
            <option value="">Choose reason</option>
            {lead.lost_reason && !lostReasons.includes(lead.lost_reason) ? <option value={lead.lost_reason}>{lead.lost_reason}</option> : null}
            {lostReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
          </select>
        </td>
      ) : null}
      <td data-label="Payment">{lead.is_paid ? <span className="badge bg-emerald-50 text-emerald-700"><Check size={13} /> Paid {currency(lead.payment_amount)}</span> : <button className="btn" onClick={() => onPatch(lead.id, { is_paid: true, payment_amount: planAmount(lead.interested_plan), payment_date: new Date().toISOString().slice(0, 10) })}>Mark paid</button>}</td>
      <td data-label="Lead Date" className="text-sm font-semibold text-slate-500">{relativeTime(lead.created_at)}</td>
      <td data-label="Actions"><div className="flex flex-wrap gap-1"><button className="btn" onClick={onOpen}><StickyNote size={15} /></button><a className="btn" href={`https://wa.me/91${lead.phone}?text=${waText}`} target="_blank"><MessageCircle size={15} /></a><button className="btn btn-danger" onClick={() => onPatch(lead.id, { archived: true })}><Archive size={15} /></button></div></td>
    </tr>
  );
}

function LeadDrawer({ lead, notes, onClose, onPatch, onNote }: { lead: Lead; notes: LeadNote[]; onClose: () => void; onPatch: (id: string, updates: Partial<Lead>) => void; onNote: (id: string, content: string) => void }) {
  const [note, setNote] = useState('');
  const waText = encodeURIComponent(whatsappTemplate.replace('{parent}', lead.parent_name).replace('{child}', lead.child_name));
  const channel = classifyLeadAcquisition(lead);
  const campaign = extractCampaignValue(lead, 'utm_campaign');
  const creative = extractCampaignValue(lead, 'utm_content');
  const term = extractCampaignValue(lead, 'utm_term');
  function updateStatus(nextStatus: LeadStatus) {
    onPatch(lead.id, {
      status: nextStatus,
      last_contacted_at: new Date().toISOString(),
      ...(nextStatus === 'lost' ? {} : { lost_reason: null }),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" onClick={onClose}>
      <aside className="h-full w-full max-w-xl overflow-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div><h2 className="text-2xl font-black">{lead.parent_name}</h2><p className="font-semibold text-slate-500">{lead.child_name} · {lead.child_age || '-'} yrs</p></div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="mb-5 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm">
          <div><b>Status:</b> <StatusBadge status={lead.status} /></div>
          <div>
            <b>Traffic:</b>{' '}
            <span className={`badge ${channel === 'meta_ads' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {acquisitionLabel(channel)}
            </span>
          </div>
          {campaign || creative || term ? (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-xs font-black uppercase tracking-wide text-slate-400">Ad attribution</div>
              {campaign ? <div className="mt-1"><b>Campaign:</b> {campaign}</div> : null}
              {creative ? <div><b>Creative:</b> {creative}</div> : null}
              {term ? <div><b>Audience:</b> {term}</div> : null}
            </div>
          ) : null}
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
          {statusOrder.map((item) => <button key={item} className="btn" onClick={() => updateStatus(item)}>{statusLabels[item]}</button>)}
          <a className="btn btn-primary" href={`https://wa.me/91${lead.phone}?text=${waText}`} target="_blank"><ExternalLink size={15} /> WhatsApp</a>
        </div>
        <label className="mb-5 block">
          <span className="mb-2 block text-sm font-bold">Lost reason</span>
          <select className="select" value={lead.lost_reason || ''} onChange={(e) => onPatch(lead.id, { lost_reason: e.target.value || null, status: 'lost' })}>
            <option value="">Choose reason</option>
            {lead.lost_reason && !lostReasons.includes(lead.lost_reason) ? <option value={lead.lost_reason}>{lead.lost_reason}</option> : null}
            {lostReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
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
