'use client';

import React, { useState } from 'react';
import { X, MessageSquarePlus, Send, Loader2, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: () => void;
}

export default function NewTicketModal({
  isOpen,
  onClose,
  onTicketCreated,
}: NewTicketModalProps) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState<'technical' | 'financial' | 'downloads' | 'general'>('technical');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError(t('ticketUI.errorRequired'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiRequest('/tickets/me', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          department,
          priority,
          initial_message: message.trim(),
        }),
      });

      setSubject('');
      setMessage('');
      setDepartment('technical');
      setPriority('medium');
      onTicketCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || t('ticketUI.errorSubmit'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-vazir text-start">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0b0e17] border border-white/10 p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <MessageSquarePlus className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-white">{t('ticketUI.title')}</h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          {t('ticketUI.subtitle')}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-bold">{t('ticketUI.subjectLabel')}</label>
            <input
              type="text"
              required
              placeholder={t('ticketUI.subjectPlaceholder')}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-bold">{t('ticketUI.departmentLabel')}</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="technical">{t('ticketUI.department.technical')}</option>
                <option value="downloads">{t('ticketUI.department.downloads')}</option>
                <option value="financial">{t('ticketUI.department.financial')}</option>
                <option value="general">{t('ticketUI.department.general')}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-bold">{t('ticketUI.priorityLabel')}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="low">{t('ticketUI.priority.low')}</option>
                <option value="medium">{t('ticketUI.priority.medium')}</option>
                <option value="high">{t('ticketUI.priority.high')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-bold">{t('ticketUI.messageLabel')}</label>
            <textarea
              required
              rows={5}
              placeholder={t('ticketUI.messagePlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
            >
              {t('ticketUI.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{t('ticketUI.submit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
