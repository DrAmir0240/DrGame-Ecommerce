'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Plus,
  Minus,
  Loader2,
  EyeOff,
  ShieldBan,
  Ban,
  AlertTriangle,
  Crown,
  Crosshair,
  ScanSearch,
  GitFork,
  ArrowUpDown,
  Move,
  Layers,
} from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';
import { AdminDownlineNode, AdminTreeResponse, AdminUplineNode } from '@/types/referral';
import { ANOMALY_FLAG_META } from './AdminToast';

interface ReferralTreeGraphProps {
  treeData: AdminTreeResponse;
  expandedMap: Record<number, AdminDownlineNode[] | undefined>;
  loadingNodeId: number | null;
  fitVersion?: number;
  expandingAll?: boolean;
  onToggleExpand: (node: AdminDownlineNode) => void;
  onInspect: (userId: number) => void;
  onFocus: (userId: number) => void;
  onCollapseAll: () => void;
  onExpandAll?: () => void;
}

interface PlacedNode {
  kind: 'upline' | 'focus' | 'downline';
  id: number;
  x: number; // top-left X in canvas coords
  y: number; // top-left Y in canvas coords
  w: number;
  h: number;
  cx: number; // center X
  upline?: AdminUplineNode;
  uplineStepIndex?: number;
  downline?: AdminDownlineNode;
  physicalDepth?: number;
  effectiveLayerToFocus?: number;
}

interface PlacedEdge {
  key: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  variant: 'normal' | 'hidden' | 'blocked';
  label?: string;
}

const PAD_X = 64;
const PAD_Y = 44;
const UPLINE_W = 244;
const UPLINE_H = 82;
const UPLINE_STEP_Y = 136;

const FOCUS_W = 276;
const FOCUS_H = 128;
const DOWNLINE_W = 236;
const DOWNLINE_H = 126;
const H_GAP = 28;
const LEVEL_STEP_Y = 204;

interface SubtreeMeasure {
  node: AdminDownlineNode;
  physicalDepth: number;
  effectiveLayerToFocus: number;
  subtreeWidth: number;
  children: SubtreeMeasure[];
}

export default function ReferralTreeGraph({
  treeData,
  expandedMap,
  loadingNodeId,
  fitVersion = 0,
  expandingAll = false,
  onToggleExpand,
  onInspect,
  onFocus,
  onCollapseAll,
  onExpandAll,
}: ReferralTreeGraphProps) {
  const { price, n, percent } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showUplines, setShowUplines] = useState(true);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number } | null>(null);
  const lastFittedKeyRef = useRef<string>('');

  const uplinesRootToTarget = useMemo(
    () => [...treeData.uplines].reverse(),
    [treeData.uplines]
  );

  // Build hierarchical geometry for uplines -> focus -> multi-depth downlines
  const layout = useMemo(() => {
    const measureNode = (
      node: AdminDownlineNode,
      physicalDepth: number,
      nonHiddenBetween: number
    ): SubtreeMeasure => {
      const effectiveLayerToFocus = nonHiddenBetween + 1;
      const nextNonHiddenBetween = node.is_referral_hidden
        ? nonHiddenBetween
        : nonHiddenBetween + 1;

      const loadedChildren = expandedMap[node.user_id] || [];
      const measuredChildren = loadedChildren.map((child) =>
        measureNode(child, physicalDepth + 1, nextNonHiddenBetween)
      );

      let childrenTotalW = 0;
      if (measuredChildren.length > 0) {
        childrenTotalW =
          measuredChildren.reduce((sum, c) => sum + c.subtreeWidth, 0) +
          (measuredChildren.length - 1) * H_GAP;
      }

      return {
        node,
        physicalDepth,
        effectiveLayerToFocus,
        subtreeWidth: Math.max(DOWNLINE_W, childrenTotalW),
        children: measuredChildren,
      };
    };

    const rootMeasures = treeData.direct_downlines.map((child) => measureNode(child, 1, 0));
    const downlinesTotalW =
      rootMeasures.length > 0
        ? rootMeasures.reduce((sum, c) => sum + c.subtreeWidth, 0) +
          (rootMeasures.length - 1) * H_GAP
        : FOCUS_W;

    const totalTreeW = Math.max(downlinesTotalW, FOCUS_W, UPLINE_W);
    const canvasW = Math.max(totalTreeW + PAD_X * 2, 760);
    const focusCenterX = canvasW / 2;

    const nodes: PlacedNode[] = [];
    const edges: PlacedEdge[] = [];

    const visibleUplines = showUplines ? uplinesRootToTarget : [];
    const focusY = PAD_Y + visibleUplines.length * UPLINE_STEP_Y;

    // 1) Place Upline Spine above Focused Node
    visibleUplines.forEach((up, idx) => {
      const y = PAD_Y + idx * UPLINE_STEP_Y;
      const x = focusCenterX - UPLINE_W / 2;
      nodes.push({
        kind: 'upline',
        id: up.user_id,
        x,
        y,
        w: UPLINE_W,
        h: UPLINE_H,
        cx: focusCenterX,
        upline: up,
        uplineStepIndex: idx,
      });

      const nextY = idx + 1 < visibleUplines.length ? PAD_Y + (idx + 1) * UPLINE_STEP_Y : focusY;
      const variant: PlacedEdge['variant'] = up.is_referral_blocked
        ? 'blocked'
        : up.is_referral_hidden
        ? 'hidden'
        : 'normal';

      const edgeLabel = up.is_referral_hidden
        ? 'Pass-Through (۰٪)'
        : up.is_referral_blocked
        ? `روح → خزانه (${percent(up.nominal_share_percent)})`
        : `لایه ${n(up.effective_layer ?? up.level)} · ${percent(up.nominal_share_percent)}`;

      edges.push({
        key: `up-${up.user_id}-${idx}`,
        fromX: focusCenterX,
        fromY: y + UPLINE_H,
        toX: focusCenterX,
        toY: nextY,
        variant,
        label: edgeLabel,
      });
    });

    // 2) Place Focused Anchor Node
    nodes.push({
      kind: 'focus',
      id: treeData.user.id,
      x: focusCenterX - FOCUS_W / 2,
      y: focusY,
      w: FOCUS_W,
      h: FOCUS_H,
      cx: focusCenterX,
    });

    let maxBottomY = focusY + FOCUS_H;

    // 3) Place Downline Tree RTL (index 0 at rightmost slot of the group)
    const placeSubtrees = (
      measures: SubtreeMeasure[],
      parentCenterX: number,
      parentBottomY: number,
      parentY: number,
      parentKey: string
    ) => {
      if (measures.length === 0) return;

      const totalGroupW =
        measures.reduce((sum, m) => sum + m.subtreeWidth, 0) + (measures.length - 1) * H_GAP;

      // Start on the right edge and step leftwards for natural RTL order
      let cursorRight = parentCenterX + totalGroupW / 2;

      measures.forEach((m) => {
        const slotLeft = cursorRight - m.subtreeWidth;
        const childCenterX = slotLeft + m.subtreeWidth / 2;
        const childY = parentY + LEVEL_STEP_Y;
        const childX = childCenterX - DOWNLINE_W / 2;

        nodes.push({
          kind: 'downline',
          id: m.node.user_id,
          x: childX,
          y: childY,
          w: DOWNLINE_W,
          h: DOWNLINE_H,
          cx: childCenterX,
          downline: m.node,
          physicalDepth: m.physicalDepth,
          effectiveLayerToFocus: m.effectiveLayerToFocus,
        });

        maxBottomY = Math.max(maxBottomY, childY + DOWNLINE_H);

        const sharePct = Math.round((21 / Math.pow(2, m.effectiveLayerToFocus)) * 1000) / 1000;
        const variant: PlacedEdge['variant'] = m.node.is_referral_blocked
          ? 'blocked'
          : m.node.is_referral_hidden
          ? 'hidden'
          : 'normal';

        edges.push({
          key: `edge-${parentKey}-${m.node.user_id}`,
          fromX: parentCenterX,
          fromY: parentBottomY,
          toX: childCenterX,
          toY: childY,
          variant,
          label: m.node.is_referral_hidden
            ? `عمق ${n(m.physicalDepth)} · مخفی`
            : `L${n(m.physicalDepth)} · ${percent(sharePct)}`,
        });

        if (m.children.length > 0) {
          placeSubtrees(
            m.children,
            childCenterX,
            childY + DOWNLINE_H,
            childY,
            String(m.node.user_id)
          );
        }

        cursorRight = slotLeft - H_GAP;
      });
    };

    placeSubtrees(
      rootMeasures,
      focusCenterX,
      focusY + FOCUS_H,
      focusY,
      `focus-${treeData.user.id}`
    );

    const canvasH = Math.max(maxBottomY + PAD_Y + 24, 380);
    return { canvasW, canvasH, focusCenterX, focusY, nodes, edges };
  }, [treeData, expandedMap, showUplines, uplinesRootToTarget, n, percent]);

  const fitToViewport = useCallback(
    (focusOnly = false) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cw = rect.width || 900;
      const ch = rect.height || 560;

      if (focusOnly) {
        const nextScale = 1;
        setScale(nextScale);
        setPan({
          x: cw / 2 - layout.focusCenterX * nextScale,
          y: Math.max(24, ch / 2 - (layout.focusY + FOCUS_H / 2) * nextScale),
        });
        return;
      }

      const rawFit = Math.min((cw - 40) / layout.canvasW, (ch - 40) / layout.canvasH);
      const nextScale = Math.min(1, Math.max(0.35, Math.round(rawFit * 100) / 100));
      const scaledW = layout.canvasW * nextScale;
      const scaledH = layout.canvasH * nextScale;

      setScale(nextScale);
      setPan({
        x: (cw - scaledW) / 2,
        y: scaledH <= ch - 24 ? (ch - scaledH) / 2 : 20,
      });
    },
    [layout.canvasW, layout.canvasH, layout.focusCenterX, layout.focusY]
  );

  // Auto-fit when focused node changes, initial deep auto-expand finishes, or upline visibility toggles
  useEffect(() => {
    const key = `${treeData.user.id}-${showUplines}-${treeData.direct_downlines.length}-${fitVersion}`;
    if (lastFittedKeyRef.current !== key) {
      lastFittedKeyRef.current = key;
      const raf = requestAnimationFrame(() => fitToViewport(false));
      return () => cancelAnimationFrame(raf);
    }
  }, [treeData.user.id, treeData.direct_downlines.length, showUplines, fitVersion, fitToViewport]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [data-no-pan="true"]')) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const stopDragging = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Require Ctrl/Cmd so vertical page scrolling isn't hijacked unexpectedly
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setScale((prev) => Math.min(1.6, Math.max(0.3, Math.round((prev + delta) * 100) / 100)));
  };

  const expandedCount = Object.keys(expandedMap).length;
  const hasCollapsedVisibleNodes = layout.nodes.some(
    (item) =>
      item.kind === 'downline' &&
      item.downline &&
      item.downline.direct_children_count > 0 &&
      expandedMap[item.downline.user_id] === undefined
  );

  return (
    <div className="space-y-3" dir="rtl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-[#0b0f17] px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(1.6, Math.round((s + 0.15) * 100) / 100))}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80"
            title="بزرگ‌نمایی"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.3, Math.round((s - 0.15) * 100) / 100))}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80"
            title="کوچک‌نمایی"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => fitToViewport(false)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-[11px] font-semibold flex items-center gap-1"
            title="جاگذاری کامل شجره‌نامه در قاب"
          >
            <Maximize2 className="w-3.5 h-3.5 text-rose-400" />
            نمای کامل
          </button>
          <button
            type="button"
            onClick={() => fitToViewport(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-[11px] font-semibold flex items-center gap-1"
            title="پرش روی گره محور"
          >
            <Crosshair className="w-3.5 h-3.5 text-sky-400" />
            گره محور
          </button>

          {uplinesRootToTarget.length > 0 && (
            <button
              type="button"
              onClick={() => setShowUplines((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                showUplines
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                  : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              بالادست ({n(uplinesRootToTarget.length)})
            </button>
          )}

          {hasCollapsedVisibleNodes && onExpandAll && (
            <button
              type="button"
              disabled={expandingAll}
              onClick={onExpandAll}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50"
            >
              {expandingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Layers className="w-3.5 h-3.5" />
              )}
              باز کردن شاخه‌ها
            </button>
          )}

          {expandedCount > 0 && (
            <button
              type="button"
              onClick={onCollapseAll}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              بستن شاخه‌های باز ({n(expandedCount)})
            </button>
          )}
        </div>

        {/* Legend & Pan hint */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            گره محور / روح‌شده
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            عادی
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            مخفی (پرش لایه)
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-500">
            <Move className="w-3 h-3" />
            با کشیدن صفحه جابجا شوید
          </span>
        </div>
      </div>

      {/* Interactive Graph Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={stopDragging}
        onWheel={handleWheel}
        dir="ltr"
        className={`relative w-full h-[560px] rounded-2xl border border-slate-800 bg-[#070a10] overflow-hidden select-none touch-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          backgroundImage:
            'radial-gradient(rgba(148, 163, 184, 0.14) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        <div
          style={{
            width: layout.canvasW,
            height: layout.canvasH,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
          className="relative"
        >
          {/* SVG Connectors */}
          <svg
            width={layout.canvasW}
            height={layout.canvasH}
            className="absolute inset-0 pointer-events-none"
          >
            {layout.edges.map((edge) => {
              const midY = (edge.fromY + edge.toY) / 2;
              const d = `M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${midY}, ${edge.toX} ${midY}, ${edge.toX} ${edge.toY}`;
              const strokeColor =
                edge.variant === 'blocked'
                  ? 'rgba(244, 63, 94, 0.7)'
                  : edge.variant === 'hidden'
                  ? 'rgba(245, 158, 11, 0.75)'
                  : 'rgba(100, 116, 139, 0.65)';

              return (
                <g key={edge.key}>
                  <path
                    d={d}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={2}
                    strokeDasharray={edge.variant === 'hidden' ? '6 4' : undefined}
                  />
                  <circle cx={edge.fromX} cy={edge.fromY} r={3} fill={strokeColor} />
                  <circle cx={edge.toX} cy={edge.toY} r={3.5} fill={strokeColor} />
                </g>
              );
            })}
          </svg>

          {/* Edge Percentage / Mode Badges */}
          {layout.edges.map((edge) => {
            if (!edge.label) return null;
            const midX = (edge.fromX + edge.toX) / 2;
            const midY = (edge.fromY + edge.toY) / 2;
            const badgeTone =
              edge.variant === 'blocked'
                ? 'bg-rose-950/95 border-rose-500/40 text-rose-300'
                : edge.variant === 'hidden'
                ? 'bg-amber-950/95 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/95 border-slate-700/80 text-slate-300';

            return (
              <div
                key={`lbl-${edge.key}`}
                dir="rtl"
                style={{
                  left: midX,
                  top: midY,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute px-2 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap pointer-events-none shadow-sm ${badgeTone}`}
              >
                {edge.label}
              </div>
            );
          })}

          {/* Interactive Node Cards */}
          {layout.nodes.map((item) => {
            if (item.kind === 'upline' && item.upline) {
              const up = item.upline;
              const isRoot = item.uplineStepIndex === 0;
              return (
                <div
                  key={`up-card-${up.user_id}`}
                  dir="rtl"
                  data-no-pan="true"
                  style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
                  className={`absolute rounded-xl border px-3 py-2 flex flex-col justify-between transition-colors shadow-lg ${
                    up.is_referral_blocked
                      ? 'bg-[#1a0d14] border-rose-500/50'
                      : up.is_referral_hidden
                      ? 'bg-[#1a150b] border-amber-500/50 border-dashed'
                      : 'bg-[#0e1522] border-slate-700 hover:border-sky-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300">
                      {isRoot && <Crown className="w-3 h-3 text-amber-400" />}
                      {isRoot ? 'سرشاخه اصلی (Root)' : `معرف بالادست (-${n(up.level)})`}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onInspect(up.user_id)}
                        className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                        title="بازرسی پرونده"
                      >
                        <ScanSearch className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onFocus(up.user_id)}
                        className="p-1 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300"
                        title="تنظیم به‌عنوان محور درخت"
                      >
                        <GitFork className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white truncate">
                      {up.full_name || up.username}
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-0.5">
                      <span className="font-mono text-sky-300 truncate" dir="ltr">
                        @{up.username}
                      </span>
                      <span className={up.has_active_subscription ? 'text-emerald-400' : 'text-slate-500'}>
                        {up.has_active_subscription ? '● اشتراک فعال' : '○ بدون اشتراک'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (item.kind === 'focus') {
              const u = treeData.user;
              return (
                <div
                  key={`focus-card-${u.id}`}
                  dir="rtl"
                  data-no-pan="true"
                  style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
                  className="absolute rounded-2xl border-2 border-rose-500 bg-gradient-to-b from-[#1a0f17] to-[#0f131d] px-3.5 py-2.5 flex flex-col justify-between shadow-xl shadow-rose-950/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold">
                      محور فعلی
                    </span>
                    <div className="flex items-center gap-1">
                      {u.is_referral_hidden && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          مخفی
                        </span>
                      )}
                      {u.is_referral_blocked && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          روح‌شده
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onInspect(u.id)}
                        className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                      >
                        بازرسی
                      </button>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-white truncate">
                      {u.full_name || u.username}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-rose-300 font-mono" dir="ltr">
                      <span className="truncate">@{u.username}</span>
                      <span>#{u.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-rose-500/20 text-slate-300">
                    <span>
                      مستقیم: <strong className="text-white">{n(u.direct_children_count)}</strong> · کل:{' '}
                      <strong className="text-white">{n(u.total_subtree_count)}</strong>
                    </span>
                    <span className="text-emerald-300 font-mono tabular-nums truncate">
                      {price(treeData.wallet.total_earned_toman)}
                    </span>
                  </div>
                </div>
              );
            }

            // Downline Node
            const node = item.downline!;
            const isExpanded = expandedMap[node.user_id] !== undefined;
            const isLoading = loadingNodeId === node.user_id;
            const hasWarning = node.anomaly_flags.some(
              (f) => f === 'many_inactive_downlines' || f === 'zero_commission_cluster'
            );

            return (
              <div
                key={`down-card-${node.user_id}`}
                dir="rtl"
                data-no-pan="true"
                style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
                className={`absolute rounded-xl border px-3 py-2 flex flex-col justify-between transition-all shadow-lg ${
                  node.is_referral_blocked
                    ? 'bg-[#1a0d14] border-rose-500/60'
                    : node.is_referral_hidden
                    ? 'bg-[#19150b] border-amber-500/60 border-dashed'
                    : 'bg-[#0e1420] border-slate-700/90 hover:border-rose-400/60'
                }`}
              >
                {/* Header Badges & Quick Controls */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0">
                      L{n(item.physicalDepth ?? 1)}
                    </span>
                    {node.is_referral_hidden && (
                      <span className="inline-flex items-center text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0" title="مخفی Pass-Through">
                        <EyeOff className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {node.is_referral_blocked && (
                      <span className="inline-flex items-center text-[9px] px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 shrink-0" title="روح‌شده">
                        <ShieldBan className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {node.is_subscription_banned && (
                      <span className="inline-flex items-center text-[9px] px-1 py-0.5 rounded bg-slate-700 text-slate-200 shrink-0" title="تحریم اشتراک">
                        <Ban className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {hasWarning && (
                      <span
                        className="inline-flex items-center text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0"
                        title={node.anomaly_flags.map((f) => ANOMALY_FLAG_META[f]?.label).join(' · ')}
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onInspect(node.user_id)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold"
                    >
                      بازرسی
                    </button>
                    <button
                      type="button"
                      onClick={() => onFocus(node.user_id)}
                      className="px-1.5 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 text-[10px] font-semibold"
                    >
                      محور
                    </button>
                  </div>
                </div>

                {/* User Name & Username */}
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onInspect(node.user_id)}
                    className="font-bold text-xs text-white hover:text-rose-300 transition-colors truncate block w-full text-right"
                  >
                    {node.full_name || node.username}
                  </button>
                  <div className="flex items-center justify-between text-[10px] mt-0.5">
                    <span className="font-mono text-rose-300 truncate" dir="ltr">
                      @{node.username}
                    </span>
                    <span className={node.has_active_subscription ? 'text-emerald-400' : 'text-slate-500'}>
                      {node.has_active_subscription ? '● فعال' : '○ غیرفعال'}
                    </span>
                  </div>
                </div>

                {/* Stats Footer */}
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/90 text-slate-400">
                  <span>
                    زیرشاخه: <strong className="text-slate-200">{n(node.direct_children_count)}</strong> /{' '}
                    <strong className="text-slate-200">{n(node.total_subtree_count)}</strong>
                  </span>
                  {node.contributed_commission_toman > 0 ? (
                    <span className="text-emerald-300 font-mono tabular-nums truncate">
                      {price(node.contributed_commission_toman)}
                    </span>
                  ) : (
                    <span className="text-slate-500">بدون سفارش</span>
                  )}
                </div>

                {/* Bottom Expand / Collapse Handle for Subtree */}
                {node.direct_children_count > 0 && (
                  <button
                    type="button"
                    onClick={() => onToggleExpand(node)}
                    className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 shadow-md transition-colors ${
                      isExpanded
                        ? 'bg-rose-600 border-rose-400 text-white hover:bg-rose-500'
                        : 'bg-slate-800 border-slate-600 text-slate-200 hover:border-rose-400 hover:text-white'
                    }`}
                    title={isExpanded ? 'بستن شاخه‌های زیرمجموعه' : 'باز کردن شاخه‌های زیرمجموعه'}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isExpanded ? (
                      <>
                        <Minus className="w-2.5 h-2.5" />
                        بستن
                      </>
                    ) : (
                      <>
                        <Plus className="w-2.5 h-2.5" />
                        {n(node.direct_children_count)}
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty Downlines Overlay Caption (when no children exist) */}
        {treeData.direct_downlines.length === 0 && (
          <div
            dir="rtl"
            className="absolute bottom-3 right-1/2 translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] text-slate-400 pointer-events-none"
          >
            این گره هنوز هیچ زیرمجموعه مستقیمی معرفی نکرده است.
          </div>
        )}
      </div>
    </div>
  );
}
