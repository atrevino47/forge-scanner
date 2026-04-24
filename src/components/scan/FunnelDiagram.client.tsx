'use client';

import { useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type {
  BlueprintDiagram,
  DiagramNode,
  DiagramStageCategory,
} from '../../../contracts/types';
import { cn } from '@/lib/utils';

interface FunnelDiagramProps {
  diagram: BlueprintDiagram;
}

const STAGE_TONE: Record<DiagramStageCategory, string> = {
  traffic: 'bg-forge-surface border-forge-border-strong',
  attraction: 'bg-forge-accent/5 border-forge-accent/40',
  capture: 'bg-forge-opportunity/5 border-forge-opportunity/30',
  nurture: 'bg-forge-card border-forge-border-strong',
  offer: 'bg-forge-accent/10 border-forge-accent/50',
  upsell: 'bg-forge-warning/5 border-forge-warning/30',
  continuity: 'bg-forge-positive/5 border-forge-positive/30',
};

const STAGE_LABEL: Record<DiagramStageCategory, string> = {
  traffic: 'Traffic',
  attraction: 'Attraction',
  capture: 'Capture',
  nurture: 'Nurture',
  offer: 'Offer',
  upsell: 'Upsell/Downsell',
  continuity: 'Continuity',
};

type StageNodeData = DiagramNode & { isMobile: boolean };

function StageNode({ data }: NodeProps<Node<StageNodeData>>) {
  const handlePosTop = data.isMobile ? Position.Top : Position.Left;
  const handlePosBottom = data.isMobile ? Position.Bottom : Position.Right;

  return (
    <div
      className={cn(
        'relative rounded-[10px] border-2 px-4 py-3 shadow-sm transition-all',
        STAGE_TONE[data.stage_category],
        data.is_missing_in_prospect && 'border-dashed opacity-80',
        data.is_critical_upgrade &&
          'ring-2 ring-forge-accent ring-offset-2 ring-offset-forge-base',
      )}
      style={{ width: 220 }}
    >
      <Handle type="target" position={handlePosTop} className="!bg-forge-border-strong" />

      {data.is_critical_upgrade && (
        <div className="absolute -top-3 left-3 rounded-full bg-forge-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Start here
        </div>
      )}

      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-forge-text-muted">
        {STAGE_LABEL[data.stage_category]}
      </div>
      <div className="mb-2 font-display text-sm font-semibold leading-tight text-forge-text">
        {data.label}
      </div>
      <div className="font-body text-[11.5px] leading-snug text-forge-text-secondary">
        {data.description}
      </div>
      {data.is_missing_in_prospect && (
        <div className="mt-2 inline-flex rounded-sm bg-forge-critical/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-forge-critical">
          Missing in your funnel
        </div>
      )}

      <Handle type="source" position={handlePosBottom} className="!bg-forge-border-strong" />
    </div>
  );
}

const nodeTypes = { stage: StageNode };

/**
 * FunnelDiagram — renders the ideal Hormozi-stacked funnel as a React Flow
 * graph. Left-to-right on desktop (>=768px), top-to-bottom on smaller.
 *
 * Layout: naive column-based auto-layout grouped by stage_category.
 * Good enough for 5-12 nodes per spec; swap in elkjs if node count grows.
 */
export function FunnelDiagram({ diagram }: FunnelDiagramProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      setIsMobile(mq.matches);
      setReduced(rm.matches);
    };
    apply();
    mq.addEventListener('change', apply);
    rm.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      rm.removeEventListener('change', apply);
    };
  }, []);

  const { nodes, edges } = useMemo(
    () => buildFlow(diagram.diagram.nodes, diagram.diagram.edges, isMobile),
    [diagram, isMobile],
  );

  return (
    <div
      className="relative w-full rounded-xl border border-forge-border-strong bg-forge-surface"
      style={{ height: isMobile ? 640 : 520 }}
      role="img"
      aria-label={`Ideal ${diagram.industry} funnel diagram with ${diagram.diagram.nodes.length} stages`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll={false}
        panOnDrag
        zoomOnScroll={!reduced}
        zoomOnPinch
      >
        <Background color="#D9D6CE" gap={24} size={1} />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}

function buildFlow(
  nodes: DiagramNode[],
  edges: BlueprintDiagram['diagram']['edges'],
  isMobile: boolean,
): { nodes: Node<StageNodeData>[]; edges: Edge[] } {
  const stageOrder: DiagramStageCategory[] = [
    'traffic',
    'attraction',
    'capture',
    'nurture',
    'offer',
    'upsell',
    'continuity',
  ];

  // Group nodes by stage_category in canonical order.
  const byStage = new Map<DiagramStageCategory, DiagramNode[]>();
  for (const n of nodes) {
    const arr = byStage.get(n.stage_category) ?? [];
    arr.push(n);
    byStage.set(n.stage_category, arr);
  }

  const COL_STEP = 280;
  const ROW_STEP = 140;
  const flowNodes: Node<StageNodeData>[] = [];

  let colIdx = 0;
  for (const stage of stageOrder) {
    const stageNodes = byStage.get(stage);
    if (!stageNodes?.length) continue;
    stageNodes.forEach((n, i) => {
      const x = isMobile ? 0 : colIdx * COL_STEP;
      const y = isMobile ? (colIdx * stageNodes.length + i) * ROW_STEP : i * ROW_STEP;
      flowNodes.push({
        id: n.id,
        type: 'stage',
        position: { x, y },
        data: { ...n, isMobile },
        sourcePosition: isMobile ? Position.Bottom : Position.Right,
        targetPosition: isMobile ? Position.Top : Position.Left,
      });
    });
    colIdx += 1;
  }

  const flowEdges: Edge[] = edges.map((e, i) => ({
    id: `e${i}-${e.from}-${e.to}`,
    source: e.from,
    target: e.to,
    label: e.label,
    labelBgStyle: { fill: '#FAFAF7' },
    labelStyle: {
      fontFamily: 'var(--font-mono), monospace',
      fontSize: 10,
      fill: '#6B6860',
    },
    style: { stroke: '#D9D6CE', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#D9D6CE' },
    type: 'smoothstep',
  }));

  return { nodes: flowNodes, edges: flowEdges };
}
