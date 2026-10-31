'use client';

import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Filter,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/useAuthStore';
import NewTicketModal from '@/components/tickets/NewTicketModal';
import TicketConversationModal from '@/components/tickets/TicketConversationModal';
import { useTranslation } from '@/i18n';

interface TicketListItem {
  id: number;
  tracking_code: string;
  subject: string;
  department: string;
  priority: string;
  status: 'open' | 'in_progress' | 'answered' | 'closed';
  created_at: string;
  updated_at: string;
}

interface TicketStats {
  total: number;
  open: number;
  answered: number;
  closed: number;
}

const TICKET_STATUS_KEY: Record<string, string> = {
  open: 'dashboardTickets.status.open',
  in_progress: 'dashboardTickets.status.inProgress',
  answered: 'dashboardTickets.status.answered',
  closed: 'dashboardTickets.status.closed',
};

const TICKET_DEPARTMENT_KEY: Record<string, string> = {
  technical: 'dashboardTickets.department.technical',
  downloads: 'dashboardTickets.department.downloads',
  financial: 'dashboardTickets.department.financial',
  general: 'dashboardTickets.department.general',
};

export default function MyTicketsPage() {
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { t, n, d } = useTranslation();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);

  const fetchTicketsAndStats = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [ticketsData, statsData] = await Promise.all([
        apiRequest<TicketListItem[]>('/tickets/me'),
        apiRequest<TicketStats>('/tickets/me/stats').catch(() => null),
      ]);
      setTickets(ticketsData || []);
      if (statsData) {
        setTicketStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTicketsAndStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const filteredTickets = tickets.filter((tk) => {
    const term = search.toLowerCase();
    const matchesSearch =
      tk.subject.toLowerCase().includes(term) ||
      tk.tracking_code.toLowerCase().includes(term);

    if (statusFilter !== 'all' && tk.status !== statusFilter) return false;
    if (departmentFilter !== 'all' && tk.department !== departmentFilter) return false;
    return matchesSearch;
  });

  const getStatusLabel = (status: string) => {
    const key = TICKET_STATUS_KEY[status];
    return key ? t(key) : status;
  };

  const getStatusBadge = (status: TicketListItem['status']) => {
    switch (status) {
      case 'answered':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{getStatusLabel(status)}</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">{getStatusLabel(status)}</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">{getStatusLabel(status)}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">{getStatusLabel(status)}</span>;
    }
  };

  const getDepartmentLabel = (dept: string) => {
    const key = TICKET_DEPARTMENT_KEY[dept];
    return key ? t(key) : dept;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">{t('dashboardTickets.priority.high')}</span>;
      case 'low':
        return <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">{t('dashboardTickets.priority.low')}</span>;
      default:
        return <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">{t('dashboardTickets.priority.medium')}</span>;
    }
  };

  // Stats calculation: prefer backend stats endpoint
  const totalCount = ticketStats?.total ?? tickets.length;
  const openCount = ticketStats?.open ?? tickets.filter((tk) => tk.status === 'open' || tk.status === 'in_progress').length;
  const answeredCount = ticketStats?.answered ?? tickets.filter((tk) => tk.status === 'answered').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-vazir text-start">
      {!isAuthenticated && (
        <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>{t('dashboardTickets.loginPrompt')}</span>
          </div>
          <button
            onClick={() => setAuthModalOpen(true, 'otp')}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shrink-0"
          >
            {t('dashboardTickets.loginButton')}
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
            <Headphones className="w-4 h-4" />
            <span>{t('dashboardTickets.eyebrow')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t('dashboardTickets.title')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('dashboardTickets.subtitle')}
          </p>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              setAuthModalOpen(true, 'otp');
            } else {
              setIsNewModalOpen(true);
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('dashboardTickets.newTicket')}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('dashboardTickets.stats.total')}</span>
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-roboto pt-2">
            {n(totalCount)} <span className="text-xs font-vazir text-slate-400">{t('dashboardTickets.unitTickets')}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('dashboardTickets.stats.inProgress')}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-roboto pt-2">
            {n(openCount)} <span className="text-xs font-vazir text-slate-400">{t('dashboardTickets.unitTickets')}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('dashboardTickets.stats.answered')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-roboto pt-2">
            {n(answeredCount)} <span className="text-xs font-vazir text-slate-400">{t('dashboardTickets.unitTickets')}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d121f] border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dashboardTickets.searchPlaceholder')}
            className="w-full bg-[#141b2d] border border-white/10 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="all">تمام دپارتمان‌ها</option>
            <option value="technical">{t('dashboardTickets.department.technical')}</option>
            <option value="downloads">{t('dashboardTickets.department.downloads')}</option>
            <option value="financial">{t('dashboardTickets.department.financial')}</option>
            <option value="general">{t('dashboardTickets.department.general')}</option>
          </select>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">{t('dashboardTickets.filter.all')}</option>
              <option value="open">{t('dashboardTickets.filter.open')}</option>
              <option value="in_progress">{t('dashboardTickets.filter.inProgress')}</option>
              <option value="answered">{t('dashboardTickets.filter.answered')}</option>
              <option value="closed">{t('dashboardTickets.filter.closed')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-5 sm:p-6 shadow-2xl">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-400">{t('dashboardTickets.loading')}</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-14 space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto opacity-40" />
            <h4 className="text-sm font-bold text-white">{t('dashboardTickets.emptyTitle')}</h4>
            <p className="text-xs text-slate-400">
              {tickets.length === 0
                ? t('dashboardTickets.emptyNoTickets')
                : t('dashboardTickets.emptyFiltered')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setActiveTicketId(ticket.id)}
                className="p-4 rounded-2xl bg-[#141b2d] border border-white/5 hover:border-cyan-500/40 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20" dir="ltr">
                      {ticket.tracking_code}
                    </span>
                    <span className="text-xs text-slate-400 px-2 py-0.5 rounded-md bg-white/5">
                      {getDepartmentLabel(ticket.department)}
                    </span>
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {ticket.subject}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-roboto">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{d(ticket.updated_at || ticket.created_at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button className="px-3 py-1.5 rounded-xl bg-white/5 group-hover:bg-cyan-500/20 text-slate-300 group-hover:text-cyan-300 text-xs font-bold transition-all flex items-center gap-1">
                    <span>{t('dashboardTickets.viewConversation')}</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <NewTicketModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onTicketCreated={fetchTicketsAndStats}
      />

      <TicketConversationModal
        ticketId={activeTicketId}
        isOpen={Boolean(activeTicketId)}
        onClose={() => setActiveTicketId(null)}
        onRefreshList={fetchTicketsAndStats}
      />
    </div>
  );
}
