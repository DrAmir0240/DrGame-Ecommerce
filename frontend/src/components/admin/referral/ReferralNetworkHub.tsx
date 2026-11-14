'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  GitFork,
  Share2,
  ShieldBan,
  ShieldCheck,
  EyeOff,
  Ban,
  ChevronDown,
  ChevronLeft,
  Loader2,
  UserPlus,
  AlertTriangle,
  Search,
  Crown,
  Activity,
  CheckCircle2,
  X,
  Network,
  LayoutList,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n/I18nProvider';
import { formatDateTime } from '@/i18n';
import { useDepartmentProfile } from '@/components/admin/DepartmentLayout';
import {
  AdminDownlineNode,
  AdminTreeResponse,
  BlacklistEntryItem,
  EnrichedChainAdminItem,
  NetworkRootItem,
  ReferralUserSearchItem,
} from '@/types/referral';
import {
  ANOMALY_FLAG_META,
  ReadOnlyGuardBanner,
  useAdminToast,
} from './AdminToast';
import ReferralUserSearchInput from './ReferralUserSearchInput';
import NodeInspectorDrawer from './NodeInspectorDrawer';
import CommissionWaterfallPanel from './CommissionWaterfallPanel';
import ReferralTreeGraph from './ReferralTreeGraph';
import {
  BlacklistActionModal,
  BlacklistTargetUser,
  UnblockConfirmModal,
} from './BlacklistModals';

type HubTab = 'explorer' | 'directory' | 'blacklist';

interface TreeBranchRowProps {
  node: AdminDownlineNode;
  depth: number;
  expandedMap: Record<number, AdminDownlineNode[] | undefined>;
  loadingNodeId: number | null;
  onToggleExpand: (node: AdminDownlineNode) => void;
  onInspect: (userId: number) => void;
  onFocus: (userId: number) => void;
}

function TreeBranchRow({
  node,
  depth,
  expandedMap,
  loadingNodeId,
  onToggleExpand,
  onInspect,
  onFocus,
}: TreeBranchRowProps) {
  const { price, n, percent } = useTranslation();
  const children = expandedMap[node.user_id];
  const isExpanded = children !== undefined;
  const isLoading = loadingNodeId === node.user_id;
  const effectiveSharePct = Math.round((21 / Math.pow(2, depth)) * 1000) / 1000;

  return (
    <div className="space-y-1.5">
      <div
        className={`rounded-xl border p-3 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${
          node.is_referral_blocked
            ? 'bg-rose-500/5 border-rose-500/30'
            : node.is_referral_hidden
            ? 'bg-amber-500/5 border-amber-500/30 border-dashed'
            : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
        }`}
        style={{ marginRight: `${Math.min(depth - 1, 5) * 18}px` }}
      >
        {/* Node Main Identity & Expand Control */}
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          {node.direct_children_count > 0 ? (
            <button
              type="button"
              onClick={() => onToggleExpand(node)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shrink-0 mt-0.5 sm:mt-0"
              title={isExpanded ? 'بستن شاخه' : 'باز کردن زیرمجموعه‌های این گره'}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
              ) : isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-600 text-[10px] font-mono flex items-center justify-center shrink-0">
              L{n(depth)}
            </span>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onInspect(node.user_id)}
                className="font-bold text-xs text-white hover:text-rose-300 transition-colors truncate"
              >
                {node.full_name || node.username}
              </button>
              <span className="text-[11px] font-mono text-rose-300" dir="ltr">
                @{node.username}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                عمق {n(depth)} ({percent(effectiveSharePct)})
              </span>
              {node.is_referral_hidden && (
                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <EyeOff className="w-2.5 h-2.5" />
                  مخفی
                </span>
              )}
              {node.is_referral_blocked && (
                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  <ShieldBan className="w-2.5 h-2.5" />
                  روح‌شده
                </span>
              )}
              {node.is_subscription_banned && (
                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">
                  <Ban className="w-2.5 h-2.5" />
                  تحریم
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400 mt-1">
              <span>
                {node.has_active_subscription ? (
                  <span className="text-emerald-400">● اشتراک فعال</span>
                ) : (
                  <span className="text-slate-500">○ بدون اشتراک</span>
                )}
              </span>
              <span>
                زیرشاخه: <strong className="text-slate-200">{n(node.direct_children_count)}</strong> مستقیم /{' '}
                <strong className="text-slate-200">{n(node.total_subtree_count)}</strong> کل
              </span>
              {node.contributed_commission_toman > 0 && (
                <span className="text-emerald-300 tabular-nums">
                  پورسانت تولیدی: {price(node.contributed_commission_toman)}
                </span>
              )}
              {node.anomaly_flags
                .filter((f) => f === 'many_inactive_downlines' || f === 'zero_commission_cluster')
                .map((f) => {
                  const meta = ANOMALY_FLAG_META[f];
                  return (
                    <span
                      key={f}
                      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${meta.badgeClass}`}
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {meta.label}
                    </span>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={() => onInspect(node.user_id)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700"
          >
            بازرسی و کنترل
          </button>
          <button
            type="button"
            onClick={() => onFocus(node.user_id)}
            className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-semibold"
          >
            محور درخت
          </button>
        </div>
      </div>

      {/* Recursive Lazy Children */}
      {isExpanded && children && (
        <div className="space-y-1.5 border-r border-slate-800/80 pr-2 sm:pr-3">
          {children.map((child) => (
            <TreeBranchRow
              key={child.user_id}
              node={child}
              depth={depth + 1}
              expandedMap={expandedMap}
              loadingNodeId={loadingNodeId}
              onToggleExpand={onToggleExpand}
              onInspect={onInspect}
              onFocus={onFocus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReferralNetworkHub({
  defaultTab = 'explorer',
}: {
  defaultTab?: HubTab;
}) {
  const searchParams = useSearchParams();
  const { price, n, percent, locale } = useTranslation();
  const { isReadOnly } = useDepartmentProfile();
  const { showToast } = useAdminToast();

  const initialTabParam = searchParams.get('tab') as HubTab | null;
  const initialUserIdParam = searchParams.get('user_id');

  const [activeTab, setActiveTab] = useState<HubTab>(
    initialTabParam && ['explorer', 'directory', 'blacklist'].includes(initialTabParam)
      ? initialTabParam
      : defaultTab
  );

  // Sync URL query params if navigating between overview/other pages while mounted
  useEffect(() => {
    const qTab = searchParams.get('tab') as HubTab | null;
    const qUid = searchParams.get('user_id');
    if (qTab && ['explorer', 'directory', 'blacklist'].includes(qTab)) {
      setActiveTab(qTab);
    }
    if (qUid) {
      const parsed = parseInt(qUid, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setActiveTab('explorer');
        setFocusedUserId(parsed);
      }
    }
  }, [searchParams]);

  // --- Explorer State ---
  const [focusedUserId, setFocusedUserId] = useState<number | null>(
    initialUserIdParam ? parseInt(initialUserIdParam, 10) || null : null
  );
  const [allowAutoPickRoot, setAllowAutoPickRoot] = useState(!initialUserIdParam);
  const [treeData, setTreeData] = useState<AdminTreeResponse | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [roots, setRoots] = useState<NetworkRootItem[]>([]);
  const [rootsLoading, setRootsLoading] = useState(false);
  const [rootsPage, setRootsPage] = useState(1);
  const [rootsTotal, setRootsTotal] = useState(0);

  const [expandedMap, setExpandedMap] = useState<Record<number, AdminDownlineNode[] | undefined>>({});
  const [loadingNodeId, setLoadingNodeId] = useState<number | null>(null);
  const [expandingAll, setExpandingAll] = useState(false);
  const [fitVersion, setFitVersion] = useState(0);
  const [treeViewMode, setTreeViewMode] = useState<'graph' | 'list'>('graph');
  const treeLoadSeqRef = useRef(0);

  // Inspector & External Order Trace
  const [inspectUserId, setInspectUserId] = useState<number | null>(null);
  const [externalTraceOrderId, setExternalTraceOrderId] = useState<number | null>(null);

  // --- Directory Tab State ---
  const [chains, setChains] = useState<EnrichedChainAdminItem[]>([]);
  const [chainsTotal, setChainsTotal] = useState(0);
  const [chainsPage, setChainsPage] = useState(1);
  const [chainsSearch, setChainsSearch] = useState('');
  const [chainsStatusFilter, setChainsStatusFilter] = useState('all');
  const [chainsLoading, setChainsLoading] = useState(false);

  // --- Blacklist Tab State ---
  const [blacklist, setBlacklist] = useState<BlacklistEntryItem[]>([]);
  const [blTotal, setBlTotal] = useState(0);
  const [blPage, setBlPage] = useState(1);
  const [blSearch, setBlSearch] = useState('');
  const [blActiveOnly, setBlActiveOnly] = useState(true);
  const [blLoading, setBlLoading] = useState(false);
  const [addBlPickerOpen, setAddBlPickerOpen] = useState(false);

  // Shared Blacklist / Unblock Modals
  const [blacklistTarget, setBlacklistTarget] = useState<BlacklistTargetUser | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<BlacklistTargetUser | null>(null);

  const loadRoots = useCallback(async (page = 1) => {
    setRootsLoading(true);
    try {
      const res = await apiRequest<{
        items: NetworkRootItem[];
        total: number;
      }>(`/admin-referral/tree/roots?page=${page}&limit=12`);
      setRoots(res.items || []);
      setRootsTotal(res.total || 0);
    } catch (err: any) {
      showToast('خطا در بارگذاری ریشه‌های شبکه', 'error', err?.message);
    } finally {
      setRootsLoading(false);
    }
  }, [showToast]);

  const expandSubtreeWaves = useCallback(
    async (
      seedNodes: AdminDownlineNode[],
      existingMap: Record<number, AdminDownlineNode[] | undefined>,
      seqId: number,
      maxDepthWaves = 3,
      maxRequests = 24
    ) => {
      const merged: Record<number, AdminDownlineNode[] | undefined> = { ...existingMap };
      let frontier = seedNodes.filter(
        (node) => node.direct_children_count > 0 && merged[node.user_id] === undefined
      );
      let requestsUsed = 0;

      for (let wave = 0; wave < maxDepthWaves && frontier.length > 0 && requestsUsed < maxRequests; wave++) {
        const batch = frontier.slice(0, maxRequests - requestsUsed);
        requestsUsed += batch.length;

        const results = await Promise.all(
          batch.map(async (node) => {
            try {
              const res = await apiRequest<{ items: AdminDownlineNode[] }>(
                `/admin-referral/tree/${node.user_id}/children?page=1&limit=50`
              );
              return { parentId: node.user_id, items: res.items || [] };
            } catch {
              return { parentId: node.user_id, items: null };
            }
          })
        );

        if (treeLoadSeqRef.current !== seqId) return null;

        const nextFrontier: AdminDownlineNode[] = [];
        for (const r of results) {
          if (r.items !== null) {
            merged[r.parentId] = r.items;
            for (const child of r.items) {
              if (child.direct_children_count > 0 && merged[child.user_id] === undefined) {
                nextFrontier.push(child);
              }
            }
          }
        }
        frontier = nextFrontier;
      }

      return merged;
    },
    []
  );

  const loadTree = useCallback(async (uid: number) => {
    const seqId = ++treeLoadSeqRef.current;
    setTreeLoading(true);
    setExpandedMap({});
    try {
      const res = await apiRequest<AdminTreeResponse>(`/admin-referral/tree/${uid}`);
      if (treeLoadSeqRef.current !== seqId) return;
      setTreeData(res);

      // Automatically reveal deep levels on open for trees up to 45 descendants
      if (
        res.user.total_subtree_count > res.direct_downlines.length &&
        res.user.total_subtree_count <= 45
      ) {
        const autoExpanded = await expandSubtreeWaves(res.direct_downlines, {}, seqId, 3, 24);
        if (autoExpanded && treeLoadSeqRef.current === seqId) {
          setExpandedMap(autoExpanded);
          setFitVersion((v) => v + 1);
        }
      }
    } catch (err: any) {
      if (treeLoadSeqRef.current === seqId) {
        showToast('خطا در بارگذاری درخت رفرال کاربر', 'error', err?.message);
      }
    } finally {
      if (treeLoadSeqRef.current === seqId) {
        setTreeLoading(false);
      }
    }
  }, [expandSubtreeWaves, showToast]);

  const handleExpandAllBranches = useCallback(async () => {
    if (!treeData) return;
    const seqId = treeLoadSeqRef.current;
    setExpandingAll(true);
    try {
      // Collect every currently visible node (direct + already expanded levels)
      const queue: AdminDownlineNode[] = [...treeData.direct_downlines];
      const visited = new Set<number>();
      const allKnown: AdminDownlineNode[] = [];
      while (queue.length > 0) {
        const cur = queue.shift()!;
        if (visited.has(cur.user_id)) continue;
        visited.add(cur.user_id);
        allKnown.push(cur);
        const kids = expandedMap[cur.user_id];
        if (kids) queue.push(...kids);
      }

      const nextMap = await expandSubtreeWaves(allKnown, expandedMap, seqId, 4, 24);
      if (nextMap && treeLoadSeqRef.current === seqId) {
        setExpandedMap(nextMap);
        setFitVersion((v) => v + 1);
      }
    } finally {
      setExpandingAll(false);
    }
  }, [treeData, expandedMap, expandSubtreeWaves]);

  const loadDirectory = useCallback(async () => {
    setChainsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(chainsPage),
        limit: '25',
        status_filter: chainsStatusFilter,
      });
      if (chainsSearch.trim()) params.set('search', chainsSearch.trim());
      const res = await apiRequest<{ items: EnrichedChainAdminItem[]; total: number }>(
        `/admin-referral/chains?${params.toString()}`
      );
      setChains(res.items || []);
      setChainsTotal(res.total || 0);
    } catch (err: any) {
      showToast('خطا در بارگذاری زنجیره‌ها', 'error', err?.message);
    } finally {
      setChainsLoading(false);
    }
  }, [chainsPage, chainsSearch, chainsStatusFilter, showToast]);

  const loadBlacklist = useCallback(async () => {
    setBlLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(blPage),
        limit: '25',
        active_only: String(blActiveOnly),
      });
      if (blSearch.trim()) params.set('search', blSearch.trim());
      const res = await apiRequest<{ items: BlacklistEntryItem[]; total: number }>(
        `/admin-referral/blacklist?${params.toString()}`
      );
      setBlacklist(res.items || []);
      setBlTotal(res.total || 0);
    } catch (err: any) {
      showToast('خطا در بارگذاری لیست سیاه', 'error', err?.message);
    } finally {
      setBlLoading(false);
    }
  }, [blPage, blActiveOnly, blSearch, showToast]);

  useEffect(() => {
    if (activeTab === 'explorer') {
      if (focusedUserId) {
        loadTree(focusedUserId);
        if (roots.length === 0) {
          loadRoots(1);
        }
      } else {
        loadRoots(rootsPage);
      }
    }
  }, [activeTab, focusedUserId, rootsPage, roots.length, loadTree, loadRoots]);

  useEffect(() => {
    if (activeTab === 'explorer' && allowAutoPickRoot && !focusedUserId && roots.length > 0) {
      setFocusedUserId(roots[0].user_id);
      setAllowAutoPickRoot(false);
    }
  }, [activeTab, allowAutoPickRoot, focusedUserId, roots]);

  useEffect(() => {
    if (activeTab === 'directory') {
      const timer = setTimeout(loadDirectory, 200);
      return () => clearTimeout(timer);
    }
  }, [activeTab, loadDirectory]);

  useEffect(() => {
    if (activeTab === 'blacklist') {
      const timer = setTimeout(loadBlacklist, 200);
      return () => clearTimeout(timer);
    }
  }, [activeTab, loadBlacklist]);

  const handleToggleExpandNode = async (node: AdminDownlineNode) => {
    if (expandedMap[node.user_id] !== undefined) {
      setExpandedMap((prev) => {
        const next = { ...prev };
        delete next[node.user_id];
        return next;
      });
      return;
    }
    setLoadingNodeId(node.user_id);
    try {
      const res = await apiRequest<{ items: AdminDownlineNode[] }>(
        `/admin-referral/tree/${node.user_id}/children?page=1&limit=50`
      );
      setExpandedMap((prev) => ({
        ...prev,
        [node.user_id]: res.items || [],
      }));
    } catch (err: any) {
      showToast('خطا در باز کردن زیرشاخه‌های گره', 'error', err?.message);
    } finally {
      setLoadingNodeId(null);
    }
  };

  const handleFocusUser = (uid: number) => {
    setActiveTab('explorer');
    setFocusedUserId(uid);
  };

  const refreshActiveView = () => {
    if (activeTab === 'explorer') {
      if (focusedUserId) loadTree(focusedUserId);
      else loadRoots(rootsPage);
    } else if (activeTab === 'directory') {
      loadDirectory();
    } else {
      loadBlacklist();
    }
  };

  // Uplines reversed so root is on right and target is on left in RTL
  const uplinesRootToTarget = treeData ? [...treeData.uplines].reverse() : [];

  return (
    <div className="space-y-6" dir="rtl">
      <ReadOnlyGuardBanner visible={isReadOnly} />

      {/* Unified Header + Omnibox */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <GitFork className="w-6 h-6 text-rose-400" />
              مرکز رهگیری زنجیره رفرال، شجره‌نامه و لیست سیاه
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              جستجوی لحظه‌ای شبکه، پایش چندلایه زیرمجموعه‌ها، ردیابی آبشار پورسانت ۲۱٪ و مدیریت اعضای مخفی یا روح‌شده
            </p>
          </div>

          <div className="w-full lg:w-[420px]">
            <ReferralUserSearchInput
              placeholder="جستجوی کاربر (نام، یوزرنیم، موبایل، کدرهگیری/معرفی، کدملی)..."
              onSelect={(u) => handleFocusUser(u.id)}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('explorer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'explorer'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <GitFork className="w-4 h-4" />
            کاوشگر درختی و آبشار مالی
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4" />
            فهرست ریشه‌محور زنجیره‌ها و ضدتقلب
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blacklist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'blacklist'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldBan className="w-4 h-4" />
            لیست سیاه و روح‌شدگان
            {blTotal > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px]">
                {n(blTotal)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: EXPLORER & WATERFALL ===================== */}
      {activeTab === 'explorer' && (
        <div className="space-y-6">
          {!focusedUserId ? (
            /* Top Network Roots Directory */
            <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 bg-[#0f1520]/80 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    ریشه‌های برتر شبکه رفرال (Top Network Roots)
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    روی هر سرشاخه کلیک کنید تا شجره‌نامه چندسطحی و مسیر آبشار پورسانت آن باز شود
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  کل ریشه‌ها: <strong className="text-white">{n(rootsTotal)}</strong>
                </span>
              </div>

              {rootsLoading ? (
                <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
                  در حال تحلیل ساختار ریشه‌های شبکه...
                </div>
              ) : roots.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  هنوز هیچ پیوند رفرالی در سیستم ثبت نشده است.
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {roots.map((r) => (
                    <div
                      key={r.user_id}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-white truncate">
                            {r.full_name || r.username}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono" dir="ltr">
                            <span className="text-rose-300">@{r.username}</span>
                            <span>#{r.user_id}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFocusUser(r.user_id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shrink-0"
                        >
                          مشاهده گراف درخت
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                          <div className="text-slate-500 text-[10px]">مستقیم</div>
                          <div className="font-bold text-white mt-0.5">{n(r.direct_downlines_count)}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                          <div className="text-slate-500 text-[10px]">کل زیرشاخه</div>
                          <div className="font-bold text-rose-300 mt-0.5">{n(r.total_subtree_count)}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                          <div className="text-slate-500 text-[10px]">پورسانت کل</div>
                          <div className="font-bold text-emerald-300 mt-0.5 tabular-nums truncate">
                            {price(r.total_earned_toman)}
                          </div>
                        </div>
                      </div>

                      {r.anomaly_flags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {r.anomaly_flags.map((flag) => {
                            const meta = ANOMALY_FLAG_META[flag];
                            return (
                              <span
                                key={flag}
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {rootsTotal > 12 && (
                <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <button
                    type="button"
                    disabled={rootsPage <= 1}
                    onClick={() => setRootsPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
                  >
                    صفحه قبل
                  </button>
                  <span>صفحه {n(rootsPage)}</span>
                  <button
                    type="button"
                    disabled={rootsPage * 12 >= rootsTotal}
                    onClick={() => setRootsPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
                  >
                    صفحه بعد
                  </button>
                </div>
              )}
            </div>
          ) : treeLoading && !treeData ? (
            <div className="p-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-[#0c1017]">
              <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
              در حال بارگذاری ساختار شجره‌نامه...
            </div>
          ) : treeData ? (
            <div className="space-y-6">
              {/* Quick Root Switcher Bar */}
              {roots.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800/80 bg-[#0c1017] px-3.5 py-2.5">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 ml-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    ریشه‌های برتر:
                  </span>
                  {roots.slice(0, 6).map((r) => (
                    <button
                      key={r.user_id}
                      type="button"
                      onClick={() => handleFocusUser(r.user_id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        treeData.user.id === r.user_id
                          ? 'bg-rose-600/20 border-rose-500/50 text-rose-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {r.full_name || r.username}{' '}
                      <span className="text-[10px] text-slate-400">({n(r.total_subtree_count)})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Focused Node Summary Banner */}
              <div className="rounded-2xl border border-rose-500/30 bg-[#0c1017] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
                      گره محور فعلی
                    </span>
                    <h2 className="text-lg font-extrabold text-white">
                      {treeData.user.full_name || treeData.user.username}
                    </h2>
                    <span className="text-xs font-mono text-rose-300" dir="ltr">
                      @{treeData.user.username} (#{treeData.user.id})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>
                      درآمد کل:{' '}
                      <strong className="text-emerald-300 tabular-nums">
                        {price(treeData.wallet.total_earned_toman)}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      معوقه:{' '}
                      <strong className="text-amber-300 tabular-nums">
                        {price(treeData.wallet.pending_balance_toman)}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      قابل برداشت:{' '}
                      <strong className="text-sky-300 tabular-nums">
                        {price(treeData.wallet.withdrawable_balance_toman)}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      زیرمجموعه: <strong className="text-white">{n(treeData.user.direct_children_count)}</strong> مستقیم /{' '}
                      <strong className="text-white">{n(treeData.user.total_subtree_count)}</strong> کل
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectUserId(treeData.user.id)}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    بازرس پرونده و کنترل وضعیت
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAllowAutoPickRoot(false);
                      setFocusedUserId(null);
                      setTreeData(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                  >
                    مشاهده لیست ریشه‌ها
                  </button>
                </div>
              </div>

              {/* Tree View Switcher Header (Interactive Tree Graph vs Expandable List) */}
              <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Network className="w-4 h-4 text-rose-400" />
                      گراف و شجره‌نامه چندسطحی ({n(treeData.direct_downlines_total)} زیرمجموعه مستقیم)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      روی دکمه «+» پایین هر گره بزنید تا لایه‌های عمیق‌تر در گراف باز شوند، یا روی «بازرسی» کلیک کنید
                    </p>
                  </div>

                  <div className="inline-flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setTreeViewMode('graph')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        treeViewMode === 'graph'
                          ? 'bg-rose-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Network className="w-3.5 h-3.5" />
                      نمای گرافی درختی
                    </button>
                    <button
                      type="button"
                      onClick={() => setTreeViewMode('list')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        treeViewMode === 'list'
                          ? 'bg-rose-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                      نمای لیستی
                    </button>
                  </div>
                </div>

                {treeViewMode === 'graph' ? (
                  <ReferralTreeGraph
                    treeData={treeData}
                    expandedMap={expandedMap}
                    loadingNodeId={loadingNodeId}
                    fitVersion={fitVersion}
                    expandingAll={expandingAll}
                    onToggleExpand={handleToggleExpandNode}
                    onInspect={(uid) => setInspectUserId(uid)}
                    onFocus={(uid) => handleFocusUser(uid)}
                    onCollapseAll={() => setExpandedMap({})}
                    onExpandAll={handleExpandAllBranches}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Horizontal Upline Breadcrumb Trail (Root -> Direct Parent -> Focused User) */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-sky-400" />
                          مسیر بالادست (Upline Trail) — نمایش وضعیت عادی، مخفی Pass-Through و روح‌شده
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" /> عادی
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400" /> مخفی (پرش لایه)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-400" /> روح‌شده (واریز به خزانه)
                          </span>
                        </div>
                      </div>

                      {uplinesRootToTarget.length === 0 ? (
                        <div className="text-xs text-slate-500 py-1">
                          این کاربر سرشاخه اصلی (Root) است و معرف بالادستی ندارد.
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          {uplinesRootToTarget.map((up) => (
                            <React.Fragment key={up.user_id}>
                              <button
                                type="button"
                                onClick={() => setInspectUserId(up.user_id)}
                                className={`p-2.5 rounded-xl border text-right transition-all ${
                                  up.is_referral_blocked
                                    ? 'bg-rose-500/10 border-rose-500/40 hover:border-rose-400'
                                    : up.is_referral_hidden
                                    ? 'bg-amber-500/10 border-amber-500/40 border-dashed hover:border-amber-300'
                                    : 'bg-slate-900 border-slate-700 hover:border-emerald-500/50'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <span>فاصله {n(up.level)}</span>
                                  <span>·</span>
                                  {up.is_referral_hidden ? (
                                    <span className="text-amber-300 font-bold">Pass-Through (۰٪)</span>
                                  ) : up.is_referral_blocked ? (
                                    <span className="text-rose-300 font-bold">
                                      روح → خزانه ({percent(up.nominal_share_percent)})
                                    </span>
                                  ) : (
                                    <span className="text-emerald-300 font-bold">
                                      لایه موثر {n(up.effective_layer)} ({percent(up.nominal_share_percent)})
                                    </span>
                                  )}
                                </div>
                                <div className="font-bold text-xs text-white mt-0.5">
                                  {up.full_name || up.username}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400" dir="ltr">
                                  @{up.username}
                                </div>
                              </button>
                              <ChevronLeft className="w-4 h-4 text-slate-600 shrink-0" />
                            </React.Fragment>
                          ))}
                          <div className="p-2.5 rounded-xl border border-rose-500/60 bg-rose-500/10 text-right">
                            <div className="text-[10px] text-rose-300 font-bold">نقطه کانونی (Target)</div>
                            <div className="font-bold text-xs text-white mt-0.5">
                              {treeData.user.full_name || treeData.user.username}
                            </div>
                            <div className="text-[10px] font-mono text-rose-200" dir="ltr">
                              @{treeData.user.username}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Multi-Depth Expandable RTL Tree List */}
                    {treeData.direct_downlines.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        این کاربر هنوز هیچ زیرمجموعه مستقیمی معرفی نکرده است.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {treeData.direct_downlines.map((node) => (
                          <TreeBranchRow
                            key={node.user_id}
                            node={node}
                            depth={1}
                            expandedMap={expandedMap}
                            loadingNodeId={loadingNodeId}
                            onToggleExpand={handleToggleExpandNode}
                            onInspect={(uid) => setInspectUserId(uid)}
                            onFocus={(uid) => handleFocusUser(uid)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Commission Waterfall Tracer & Dry-Run Simulator */}
          <CommissionWaterfallPanel
            focusedUserId={focusedUserId}
            focusedUsername={treeData?.user.username}
            externalOrderId={externalTraceOrderId}
            onInspectUser={(uid) => setInspectUserId(uid)}
          />
        </div>
      )}

      {/* ===================== TAB 2: ROOT-ANCHORED DIRECTORY & ANOMALIES ===================== */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={chainsSearch}
                onChange={(e) => {
                  setChainsSearch(e.target.value);
                  setChainsPage(1);
                }}
                placeholder="جستجو در زیرمجموعه، معرف مستقیم، ریشه کل یا موبایل..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'all', label: 'همه پیوندها' },
                { key: 'blocked', label: 'اعضای روح‌شده' },
                { key: 'hidden', label: 'مخفی (Pass-Through)' },
                { key: 'banned', label: 'تحریم اشتراک' },
                { key: 'anomaly', label: 'دارای پرچم هشدار' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setChainsStatusFilter(opt.key);
                    setChainsPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors ${
                    chainsStatusFilter === opt.key
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Table */}
          <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">زیرمجموعه</th>
                    <th className="py-3.5 px-4 font-semibold">معرف مستقیم</th>
                    <th className="py-3.5 px-4 font-semibold">ریشه درخت / عمق</th>
                    <th className="py-3.5 px-4 font-semibold">پرچم‌های وضعیت و ضدتقلب</th>
                    <th className="py-3.5 px-4 font-semibold">تاریخ اتصال</th>
                    <th className="py-3.5 px-4 font-semibold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {chainsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin inline-block ml-2 text-rose-400" />
                        در حال بارگذاری جدول زنجیره‌ها...
                      </td>
                    </tr>
                  ) : chains.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        پیوندی مطابق این فیلتر یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    chains.map((ch) => (
                      <tr key={ch.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setInspectUserId(ch.user_id)}
                            className="text-right hover:text-rose-300"
                          >
                            <div className="font-bold text-white">
                              {ch.user_full_name || ch.user_username}
                            </div>
                            <div className="text-[11px] font-mono text-rose-300" dir="ltr">
                              @{ch.user_username} (#{ch.user_id})
                            </div>
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setInspectUserId(ch.referrer_id)}
                            className="text-right hover:text-sky-300"
                          >
                            <div className="font-medium text-slate-200">
                              {ch.referrer_full_name || ch.referrer_username}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400" dir="ltr">
                              @{ch.referrer_username}
                            </div>
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          {ch.root_user_id ? (
                            <button
                              type="button"
                              onClick={() => handleFocusUser(ch.root_user_id!)}
                              className="text-right hover:text-amber-300"
                            >
                              <div className="font-mono text-amber-300 text-[11px]" dir="ltr">
                                @{ch.root_username}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                عمق از ریشه: <strong>{n(ch.depth_from_root || 1)}</strong>
                              </div>
                            </button>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[260px]">
                            {!ch.anomaly_flags?.length ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                عادی و سالم
                              </span>
                            ) : (
                              ch.anomaly_flags.map((f) => {
                                const meta = ANOMALY_FLAG_META[f];
                                return (
                                  <span
                                    key={f}
                                    className={`text-[10px] px-2 py-0.5 rounded-full border ${meta.badgeClass}`}
                                  >
                                    {meta.label}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-[11px] text-slate-400">
                          {formatDateTime(ch.created_at, locale)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleFocusUser(ch.user_id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700"
                            >
                              درخت
                            </button>
                            {ch.user_is_referral_blocked ? (
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() =>
                                  setUnblockTarget({
                                    userId: ch.user_id,
                                    username: ch.user_username || `user_${ch.user_id}`,
                                    fullName: ch.user_full_name,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold disabled:opacity-40"
                              >
                                رفع مسدودیت
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() =>
                                  setBlacklistTarget({
                                    userId: ch.user_id,
                                    username: ch.user_username || `user_${ch.user_id}`,
                                    fullName: ch.user_full_name,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold disabled:opacity-40"
                              >
                                مسدودسازی
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {chainsTotal > 25 && (
              <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  disabled={chainsPage <= 1}
                  onClick={() => setChainsPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
                >
                  صفحه قبل
                </button>
                <span>
                  صفحه {n(chainsPage)} از {n(Math.ceil(chainsTotal / 25))} (مجموع {n(chainsTotal)} پیوند)
                </span>
                <button
                  type="button"
                  disabled={chainsPage * 25 >= chainsTotal}
                  onClick={() => setChainsPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
                >
                  صفحه بعد
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: BLACKLIST ===================== */}
      {activeTab === 'blacklist' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={blSearch}
                  onChange={(e) => {
                    setBlSearch(e.target.value);
                    setBlPage(1);
                  }}
                  placeholder="جستجو در نام، یوزرنیم، موبایل، کدملی یا دلیل..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blActiveOnly}
                  onChange={(e) => {
                    setBlActiveOnly(e.target.checked);
                    setBlPage(1);
                  }}
                  className="w-4 h-4 accent-rose-500 rounded"
                />
                فقط مسدودیت‌های فعال
              </label>
            </div>

            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => setAddBlPickerOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              افزودن کاربر به لیست سیاه
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">کاربر</th>
                    <th className="py-3.5 px-4 font-semibold">موبایل / کدملی مسدود</th>
                    <th className="py-3.5 px-4 font-semibold">نوع محدودیت</th>
                    <th className="py-3.5 px-4 font-semibold">دلیل و ادمین ثبت‌کننده</th>
                    <th className="py-3.5 px-4 font-semibold">تاریخ ثبت</th>
                    <th className="py-3.5 px-4 font-semibold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {blLoading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin inline-block ml-2 text-rose-400" />
                        در حال بارگذاری لیست سیاه...
                      </td>
                    </tr>
                  ) : blacklist.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        موردی در لیست سیاه یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    blacklist.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setInspectUserId(b.user_id)}
                            className="text-right hover:text-rose-300"
                          >
                            <div className="font-bold text-white">{b.full_name || b.username}</div>
                            <div className="text-[11px] font-mono text-rose-300" dir="ltr">
                              @{b.username} (#{b.user_id})
                            </div>
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-300" dir="ltr">
                          <div>{b.phone || '—'}</div>
                          {b.blocked_national_code && (
                            <div className="text-rose-300">NC: {b.blocked_national_code}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {b.block_referral && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px]">
                                روح پورسانت → خزانه
                              </span>
                            )}
                            {b.block_subscription && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-200 text-[10px]">
                                تحریم اشتراک
                              </span>
                            )}
                            {!b.is_active && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px]">
                                رفع‌شده
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-300 max-w-xs">
                          <div>{b.reason || 'بدون توضیح'}</div>
                          {b.admin_username && (
                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono" dir="ltr">
                              by @{b.admin_username}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-400">
                          {formatDateTime(b.blocked_at, locale)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleFocusUser(b.user_id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                            >
                              شجره‌نامه
                            </button>
                            {b.is_active && (
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() =>
                                  setUnblockTarget({
                                    userId: b.user_id,
                                    username: b.username,
                                    fullName: b.full_name,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-40"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                رفع مسدودیت
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {blTotal > 25 && (
              <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  disabled={blPage <= 1}
                  onClick={() => setBlPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
                >
                  صفحه قبل
                </button>
                <span>
                  صفحه {n(blPage)} از {n(Math.ceil(blTotal / 25))} (مجموع {n(blTotal)})
                </span>
                <button
                  type="button"
                  disabled={blPage * 25 >= blTotal}
                  onClick={() => setBlPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
                >
                  صفحه بعد
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Picker Modal for direct Blacklist insertion */}
      {addBlPickerOpen && (
        <div
          className="fixed inset-0 z-[108] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-rose-400" />
                انتخاب کاربر برای افزودن به لیست سیاه
              </h3>
              <button
                type="button"
                onClick={() => setAddBlPickerOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ReferralUserSearchInput
              autoFocus
              placeholder="نام، یوزرنیم، موبایل یا کدملی کاربر را وارد کنید..."
              onSelect={(u: ReferralUserSearchItem) => {
                setAddBlPickerOpen(false);
                setBlacklistTarget({
                  userId: u.id,
                  username: u.username,
                  fullName: u.full_name,
                });
              }}
            />
            <p className="text-[11px] text-slate-400">
              پس از انتخاب کاربر از لیست بالا، گزینه‌های دوگانه «روح‌شدن پورسانت» و «ممنوعیت اشتراک» نمایش داده می‌شود.
            </p>
          </div>
        </div>
      )}

      {/* Inspector Drawer & Action Modals */}
      <NodeInspectorDrawer
        userId={inspectUserId}
        isReadOnly={isReadOnly}
        onClose={() => setInspectUserId(null)}
        onFocusInTree={(uid) => handleFocusUser(uid)}
        onTraceOrder={(oid) => {
          setActiveTab('explorer');
          setExternalTraceOrderId(oid);
        }}
        onMutated={refreshActiveView}
      />
      <BlacklistActionModal
        target={blacklistTarget}
        onClose={() => setBlacklistTarget(null)}
        onSuccess={refreshActiveView}
      />
      <UnblockConfirmModal
        target={unblockTarget}
        onClose={() => setUnblockTarget(null)}
        onSuccess={refreshActiveView}
      />
    </div>
  );
}
