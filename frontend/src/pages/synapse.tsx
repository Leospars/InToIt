import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { useNavigate } from "react-router-dom";
import { X, RotateCcw, Play, Navigation, ChevronRight, CheckCircle2, XCircle } from "lucide-react";

type MasteryLevel = "untouched" | "struggling" | "learning" | "mastered";

interface GNode extends d3.SimulationNodeDatum {
  id: string;
  topic_name: string;
  category: string;
  course_id: string;
  p_know: number;
  mastery_level: MasteryLevel;
  attempts: number;
  last_updated: string;
}

interface GEdge extends d3.SimulationLinkDatum<GNode> {
  from: string;
  to: string;
  weight: number;
}

interface MockQuizEvent { correct: boolean; question: string; time_ms: number; date: string }

const MASTERY_COLOR: Record<MasteryLevel, string> = {
  mastered:   "#22c55e",
  learning:   "#3b82f6",
  struggling: "#f97316",
  untouched:  "#374151",
};

const GRAPH_NODES: GNode[] = [
  { id: "cpu-architecture",     topic_name: "CPU Architecture",        category: "Computer Architecture",        course_id: "COMP2140", p_know: 0.91, mastery_level: "mastered",   attempts: 24, last_updated: "2h ago" },
  { id: "instruction-cycle",    topic_name: "Instruction Cycle",       category: "Computer Architecture",        course_id: "COMP2140", p_know: 0.72, mastery_level: "learning",   attempts: 15, last_updated: "1d ago" },
  { id: "registers-and-buses",  topic_name: "Registers & Buses",       category: "Computer Architecture",        course_id: "COMP2140", p_know: 0.38, mastery_level: "struggling", attempts: 8,  last_updated: "3d ago" },
  { id: "alu-operations",       topic_name: "ALU Operations",          category: "Computer Architecture",        course_id: "COMP2140", p_know: 0.00, mastery_level: "untouched",  attempts: 0,  last_updated: "Never" },
  { id: "control-units",        topic_name: "Control Units",           category: "Computer Architecture",        course_id: "COMP2140", p_know: 0.88, mastery_level: "mastered",   attempts: 30, last_updated: "5h ago" },
  { id: "memory-hierarchy",     topic_name: "Memory Hierarchy",        category: "Computer Architecture",        course_id: "COMP2140", p_know: 0.55, mastery_level: "learning",   attempts: 12, last_updated: "2d ago" },
  { id: "recurrence-relations", topic_name: "Recurrence Relations",    category: "Algorithms & Data Structures", course_id: "COMP2190", p_know: 0.28, mastery_level: "struggling", attempts: 10, last_updated: "4d ago" },
  { id: "master-theorem",       topic_name: "Master Theorem",          category: "Algorithms & Data Structures", course_id: "COMP2190", p_know: 0.61, mastery_level: "learning",   attempts: 18, last_updated: "1d ago" },
  { id: "sorting-algorithms",   topic_name: "Sorting Algorithms",      category: "Algorithms & Data Structures", course_id: "COMP2190", p_know: 0.93, mastery_level: "mastered",   attempts: 35, last_updated: "6h ago" },
  { id: "graph-algorithms",     topic_name: "Graph Algorithms",        category: "Algorithms & Data Structures", course_id: "COMP2190", p_know: 0.44, mastery_level: "struggling", attempts: 9,  last_updated: "5d ago" },
  { id: "dynamic-programming",  topic_name: "Dynamic Programming",     category: "Algorithms & Data Structures", course_id: "COMP2190", p_know: 0.00, mastery_level: "untouched",  attempts: 0,  last_updated: "Never" },
  { id: "consumer-theory",      topic_name: "Consumer Theory",         category: "Microeconomics",               course_id: "ECON2001", p_know: 0.78, mastery_level: "learning",   attempts: 20, last_updated: "3h ago" },
  { id: "utility-maximization", topic_name: "Utility Maximization",    category: "Microeconomics",               course_id: "ECON2001", p_know: 0.35, mastery_level: "struggling", attempts: 7,  last_updated: "6d ago" },
  { id: "production-functions", topic_name: "Production Functions",    category: "Microeconomics",               course_id: "ECON2001", p_know: 0.00, mastery_level: "untouched",  attempts: 0,  last_updated: "Never" },
  { id: "cost-curves",          topic_name: "Cost Curves",             category: "Microeconomics",               course_id: "ECON2001", p_know: 0.87, mastery_level: "mastered",   attempts: 22, last_updated: "1d ago" },
  { id: "market-equilibrium",   topic_name: "Market Equilibrium",      category: "Microeconomics",               course_id: "ECON2001", p_know: 0.62, mastery_level: "learning",   attempts: 14, last_updated: "2d ago" },
  { id: "physical-geography",   topic_name: "Physical Geography",      category: "Caribbean Geography",          course_id: "GEOG1100", p_know: 0.90, mastery_level: "mastered",   attempts: 28, last_updated: "12h ago" },
  { id: "climate-systems",      topic_name: "Climate Systems",         category: "Caribbean Geography",          course_id: "GEOG1100", p_know: 0.53, mastery_level: "learning",   attempts: 11, last_updated: "3d ago" },
  { id: "population-dist",      topic_name: "Population Distribution", category: "Caribbean Geography",          course_id: "GEOG1100", p_know: 0.41, mastery_level: "struggling", attempts: 6,  last_updated: "7d ago" },
  { id: "urban-development",    topic_name: "Urban Development",       category: "Caribbean Geography",          course_id: "GEOG1100", p_know: 0.00, mastery_level: "untouched",  attempts: 0,  last_updated: "Never" },
  { id: "regional-trade",       topic_name: "Regional Trade",          category: "Caribbean Geography",          course_id: "GEOG1100", p_know: 0.69, mastery_level: "learning",   attempts: 16, last_updated: "4h ago" },
];

const RAW_EDGES: { from: string; to: string; weight: number }[] = [
  { from: "registers-and-buses",  to: "cpu-architecture",     weight: 1.0 },
  { from: "registers-and-buses",  to: "alu-operations",       weight: 0.8 },
  { from: "instruction-cycle",    to: "cpu-architecture",     weight: 1.0 },
  { from: "cpu-architecture",     to: "control-units",        weight: 0.9 },
  { from: "memory-hierarchy",     to: "cpu-architecture",     weight: 0.7 },
  { from: "recurrence-relations", to: "master-theorem",       weight: 1.0 },
  { from: "master-theorem",       to: "dynamic-programming",  weight: 0.9 },
  { from: "sorting-algorithms",   to: "graph-algorithms",     weight: 0.8 },
  { from: "graph-algorithms",     to: "dynamic-programming",  weight: 0.9 },
  { from: "utility-maximization", to: "consumer-theory",      weight: 1.0 },
  { from: "consumer-theory",      to: "market-equilibrium",   weight: 0.8 },
  { from: "production-functions", to: "cost-curves",          weight: 1.0 },
  { from: "cost-curves",          to: "market-equilibrium",   weight: 0.9 },
  { from: "physical-geography",   to: "climate-systems",      weight: 1.0 },
  { from: "climate-systems",      to: "population-dist",      weight: 0.8 },
  { from: "population-dist",      to: "urban-development",    weight: 0.9 },
  { from: "urban-development",    to: "regional-trade",       weight: 0.8 },
];

const QUIZ_EVENTS: Record<string, MockQuizEvent[]> = {
  "cpu-architecture":     [{ correct: true, question: "What does the ALU stand for?", time_ms: 2100, date: "2h ago" }, { correct: true, question: "Describe the fetch-decode-execute cycle.", time_ms: 4500, date: "1d ago" }, { correct: false, question: "How does pipelining reduce CPI?", time_ms: 8200, date: "2d ago" }, { correct: true, question: "What is a register?", time_ms: 1800, date: "3d ago" }, { correct: true, question: "Compare RISC vs CISC.", time_ms: 5600, date: "4d ago" }],
  "sorting-algorithms":   [{ correct: true, question: "What is the worst-case for quicksort?", time_ms: 3200, date: "6h ago" }, { correct: true, question: "Explain merge sort's space complexity.", time_ms: 4100, date: "1d ago" }, { correct: true, question: "When is insertion sort optimal?", time_ms: 2900, date: "2d ago" }, { correct: false, question: "Describe heapify.", time_ms: 7800, date: "3d ago" }, { correct: true, question: "What is a stable sort?", time_ms: 2200, date: "4d ago" }],
};

const RECOMMENDED_ACTIONS: Record<MasteryLevel, (name: string, prereqs: string[]) => string> = {
  mastered:   (n) => `${n} is mastered. Explore dependent topics to apply your knowledge.`,
  learning:   (n, p) => p.length ? `Keep practicing ${n}. Ensure you've reviewed: ${p.slice(0,2).join(", ")}.` : `Keep practicing ${n} to solidify your understanding.`,
  struggling: (n, p) => p.length ? `Review before continuing ${n}: ${p.slice(0,2).join(", ")}.` : `Revisit fundamentals of ${n} — targeted practice recommended.`,
  untouched:  (n) => `Start with ${n} — no attempts yet. Complete prerequisite topics first.`,
};

function bfsPath(start: string, goal: string, edges: { from: string; to: string }[]): string[] {
  const queue: string[][] = [[start]];
  const visited = new Set<string>([start]);
  while (queue.length) {
    const path = queue.shift()!;
    const cur = path[path.length - 1];
    if (cur === goal) return path;
    for (const e of edges) {
      if (e.from === cur && !visited.has(e.to)) {
        visited.add(e.to);
        queue.push([...path, e.to]);
      }
    }
  }
  return [];
}

function nodeRadius(p_know: number): number {
  return Math.max(16, p_know * 32 + 12);
}

const SynapsePage: React.FC = () => {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const nodesRef = useRef<GNode[]>(GRAPH_NODES.map(n => ({ ...n })));
  const edgesRef = useRef<GEdge[]>(RAW_EDGES.map(e => ({ ...e, source: e.from, target: e.to })));
  const simRef = useRef<d3.Simulation<GNode, GEdge> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });

  const [, forceUpdate] = useState(0);
  const [selectedNode, setSelectedNode] = useState<GNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [masteryFilter, setMasteryFilter] = useState<MasteryLevel | "all">("all");
  const [pathHighlight, setPathHighlight] = useState<string[]>([]);
  const [goalNodeId, setGoalNodeId] = useState<string>("");
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  // Init D3 simulation
  useEffect(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const width = svgRef.current?.clientWidth ?? 900;
    const height = svgRef.current?.clientHeight ?? 600;

    const sim = d3.forceSimulation<GNode>(nodes)
      .force("link", d3.forceLink<GNode, GEdge>(edges).id(d => d.id).distance(130).strength(0.5))
      .force("charge", d3.forceManyBody<GNode>().strength(-420))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<GNode>(d => nodeRadius(d.p_know) + 22))
      .on("tick", () => forceUpdate(n => n + 1));

    simRef.current = sim;

    // D3 zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on("zoom", (event) => {
        transformRef.current = { x: event.transform.x, y: event.transform.y, k: event.transform.k };
        if (gRef.current) {
          d3.select(gRef.current).attr("transform", event.transform.toString());
        }
      });

    zoomRef.current = zoom;
    if (svgRef.current) d3.select(svgRef.current).call(zoom);

    return () => { sim.stop(); };
  }, []);

  const prereqsOf = useCallback((nodeId: string): string[] => {
    return RAW_EDGES.filter(e => e.to === nodeId).map(e => {
      const n = GRAPH_NODES.find(nd => nd.id === e.from);
      return n?.topic_name ?? e.from;
    });
  }, []);

  const hoveredConnectedEdges = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const set = new Set<string>();
    for (const e of RAW_EDGES) {
      if (e.from === hoveredNodeId || e.to === hoveredNodeId) {
        set.add(`${e.from}->${e.to}`);
      }
    }
    return set;
  }, [hoveredNodeId]);

  const pathEdgeSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < pathHighlight.length - 1; i++) {
      set.add(`${pathHighlight[i]}->${pathHighlight[i + 1]}`);
    }
    return set;
  }, [pathHighlight]);

  const visibleNodes = useMemo(() => {
    if (masteryFilter === "all") return nodesRef.current;
    return nodesRef.current.filter(n => n.mastery_level === masteryFilter);
  }, [masteryFilter]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  const handleZoomReset = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition().duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  };

  const runLearningPath = useCallback((goalId: string) => {
    const bestStart = nodesRef.current
      .filter(n => n.id !== goalId && (n.mastery_level === "mastered" || n.mastery_level === "learning"))
      .sort((a, b) => b.p_know - a.p_know)[0];
    if (!bestStart) return;
    const path = bfsPath(bestStart.id, goalId, RAW_EDGES);
    setPathHighlight(path);
  }, []);

  const handleLearningPath = () => {
    if (!goalNodeId) { setShowGoalPicker(true); return; }
    runLearningPath(goalNodeId);
  };

  const quizEvents = selectedNode ? (QUIZ_EVENTS[selectedNode.id] ?? []) : [];
  const prereqs = selectedNode ? prereqsOf(selectedNode.id) : [];

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#0a0a0f" }}>

      {/* ── Top controls overlay ── */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-[#12121e] border border-[#1e1e2e] rounded-xl px-3 py-2 shadow-lg">
          <span className="text-[#f1f5f9] text-sm font-semibold tracking-tight mr-2">Synapse Map</span>
          <div className="w-px h-4 bg-[#1e1e2e]" />
          <button onClick={handleZoomReset} className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#f1f5f9] transition-colors px-2 py-1 rounded-lg hover:bg-[#1e1e2e]">
            <RotateCcw size={13} /> Reset
          </button>
        </div>

        {/* Mastery filter */}
        <div className="flex items-center gap-1 bg-[#12121e] border border-[#1e1e2e] rounded-xl px-2 py-1.5 shadow-lg">
          {(["all", "mastered", "learning", "struggling", "untouched"] as const).map(f => (
            <button
              key={f}
              onClick={() => setMasteryFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                masteryFilter === f
                  ? "bg-[#1e1e2e] text-[#f1f5f9]"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
              style={masteryFilter === f && f !== "all" ? { color: MASTERY_COLOR[f] } : undefined}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Learning path button */}
        <div className="relative">
          <button
            onClick={handleLearningPath}
            className="flex items-center gap-1.5 bg-[#12121e] border border-[#1e1e2e] rounded-xl px-3 py-2 text-xs font-medium text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#3b82f6] transition-all shadow-lg"
          >
            <Navigation size={13} /> Next Learning Path
          </button>
          {showGoalPicker && (
            <div className="absolute top-full mt-1 left-0 bg-[#12121e] border border-[#1e1e2e] rounded-xl shadow-2xl p-2 w-56 z-30">
              <p className="text-[10px] text-[#64748b] px-2 pb-1 font-medium uppercase tracking-wider">Select goal topic</p>
              <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                {GRAPH_NODES.map(n => (
                  <button
                    key={n.id}
                    onClick={() => { setGoalNodeId(n.id); setShowGoalPicker(false); runLearningPath(n.id); }}
                    className="text-left px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] hover:bg-[#1e1e2e] hover:text-[#f1f5f9] transition-colors truncate"
                    style={{ color: goalNodeId === n.id ? MASTERY_COLOR[n.mastery_level] : undefined }}
                  >
                    {n.topic_name}
                  </button>
                ))}
              </div>
              {pathHighlight.length > 0 && (
                <button onClick={() => setPathHighlight([])} className="mt-1 w-full text-center text-[10px] text-[#64748b] hover:text-[#f1f5f9] py-1">
                  Clear path
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── SVG canvas ── */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ userSelect: "none" }}
      >
        <defs>
          <marker id="arrow-dim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#2a2a3a" />
          </marker>
          <marker id="arrow-hover" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
          </marker>
          <marker id="arrow-path" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
          </marker>
          {GRAPH_NODES.map(n => (
            <radialGradient key={n.id} id={`glow-${n.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={MASTERY_COLOR[n.mastery_level]} stopOpacity="0.3" />
              <stop offset="100%" stopColor={MASTERY_COLOR[n.mastery_level]} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        <g ref={gRef}>
          {/* ── Edges ── */}
          {edgesRef.current.map(edge => {
            const src = edge.source as GNode;
            const tgt = edge.target as GNode;
            if (src?.x == null || src?.y == null || tgt?.x == null || tgt?.y == null) return null;
            if (!visibleNodeIds.has(src.id) || !visibleNodeIds.has(tgt.id)) return null;

            const edgeKey = `${edge.from}->${edge.to}`;
            const isPath = pathEdgeSet.has(edgeKey);
            const isHovered = hoveredConnectedEdges.has(edgeKey);

            const dx = tgt.x - src.x, dy = tgt.y - src.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return null;
            const rSrc = nodeRadius(src.p_know) + 3;
            const rTgt = nodeRadius(tgt.p_know) + 11;
            const x1 = src.x + (dx / dist) * rSrc;
            const y1 = src.y + (dy / dist) * rSrc;
            const x2 = tgt.x - (dx / dist) * rTgt;
            const y2 = tgt.y - (dy / dist) * rTgt;

            return (
              <line
                key={edgeKey}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isPath ? "#22c55e" : isHovered ? "#3b82f6" : "#1e1e2e"}
                strokeWidth={isPath ? edge.weight * 2.5 : isHovered ? edge.weight * 2 : edge.weight * 1.2}
                strokeOpacity={isPath ? 0.9 : isHovered ? 0.8 : 0.5}
                markerEnd={isPath ? "url(#arrow-path)" : isHovered ? "url(#arrow-hover)" : "url(#arrow-dim)"}
                style={{ transition: "stroke 0.2s, stroke-opacity 0.2s" }}
              />
            );
          })}

          {/* ── Nodes ── */}
          {nodesRef.current.map(node => {
            if (!visibleNodeIds.has(node.id)) return null;
            if (node.x == null || node.y == null) return null;
            const r = nodeRadius(node.p_know);
            const color = MASTERY_COLOR[node.mastery_level];
            const isSelected = selectedNode?.id === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isInPath = pathHighlight.includes(node.id);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedNode(prev => prev?.id === node.id ? null : node)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Glow halo */}
                {(node.mastery_level === "mastered" || isHovered || isInPath) && (
                  <circle r={r + 14} fill={`url(#glow-${node.id})`} />
                )}
                {/* Struggling pulse ring */}
                {node.mastery_level === "struggling" && (
                  <circle r={r + 6} fill="none" stroke="#f97316" strokeWidth={1.5} strokeOpacity={0.4} />
                )}
                {/* Main node */}
                <circle
                  r={r}
                  fill={`${color}22`}
                  stroke={isSelected || isInPath ? color : `${color}88`}
                  strokeWidth={isSelected || isInPath ? 2.5 : 1.5}
                />
                {/* p_know fill arc - simple inner circle */}
                <circle r={r * node.p_know * 0.65} fill={color} fillOpacity={0.35} />
                {/* Label */}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#f1f5f9"
                  fontSize={Math.max(9, Math.min(11, r * 0.42))}
                  fontFamily="monospace"
                  fontWeight={isSelected ? 700 : 500}
                >
                  {node.topic_name.length > 14 ? node.topic_name.slice(0, 12) + "…" : node.topic_name}
                </text>
                <text
                  y={r + 13}
                  textAnchor="middle"
                  fill={color}
                  fontSize={9}
                  fontFamily="monospace"
                  fontWeight={600}
                >
                  {node.p_know > 0 ? `${Math.round(node.p_know * 100)}%` : "–"}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* ── Side Panel ── */}
      <div
        className="absolute top-0 right-0 h-full w-80 flex flex-col border-l border-[#1e1e2e] overflow-y-auto"
        style={{
          background: "#0d0d1a",
          transform: selectedNode ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 25,
        }}
      >
        {selectedNode && (
          <>
            <div className="flex items-start justify-between p-4 border-b border-[#1e1e2e]">
              <div>
                <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-medium mb-1">{selectedNode.category}</p>
                <h3 className="font-semibold tracking-tight text-[#f1f5f9] text-base leading-tight">{selectedNode.topic_name}</h3>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-[#64748b] hover:text-[#f1f5f9] transition-colors mt-0.5">
                <X size={16} />
              </button>
            </div>

            {/* p_know bar */}
            <div className="px-4 py-4 border-b border-[#1e1e2e] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Mastery (p_know)</span>
                <span className="font-mono text-sm font-semibold" style={{ color: MASTERY_COLOR[selectedNode.mastery_level] }}>
                  {selectedNode.p_know.toFixed(3)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#1e1e2e] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${selectedNode.p_know * 100}%`,
                    background: MASTERY_COLOR[selectedNode.mastery_level],
                    boxShadow: `0 0 8px ${MASTERY_COLOR[selectedNode.mastery_level]}80`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[#64748b]">
                <span className="capitalize">{selectedNode.mastery_level}</span>
                <span className="font-mono">{selectedNode.attempts} attempts · {selectedNode.last_updated}</span>
              </div>
            </div>

            {/* Quiz events */}
            <div className="px-4 py-4 border-b border-[#1e1e2e] flex flex-col gap-2">
              <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-medium mb-1">Last 5 Quiz Events</p>
              {quizEvents.length > 0 ? quizEvents.map((ev, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  {ev.correct
                    ? <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                    : <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#94a3b8] leading-tight truncate">{ev.question}</p>
                    <p className="text-[10px] text-[#475569] font-mono mt-0.5">{(ev.time_ms / 1000).toFixed(1)}s · {ev.date}</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-[#475569] italic">No quiz attempts yet.</p>
              )}
            </div>

            {/* Recommended action */}
            <div className="px-4 py-4 border-b border-[#1e1e2e] flex flex-col gap-2">
              <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-medium">Recommended Action</p>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                {RECOMMENDED_ACTIONS[selectedNode.mastery_level](selectedNode.topic_name, prereqs)}
              </p>
              {prereqs.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {prereqs.map(p => (
                    <span key={p} className="text-[10px] bg-[#1e1e2e] text-[#64748b] px-2 py-0.5 rounded-md border border-[#2a2a3a]">{p}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Find path button */}
            <div className="px-4 py-3 border-b border-[#1e1e2e]">
              <button
                onClick={() => {
                  const bestStart = GRAPH_NODES
                    .filter(n => n.id !== selectedNode.id && (n.mastery_level === "mastered" || n.mastery_level === "learning"))
                    .sort((a, b) => b.p_know - a.p_know)[0];
                  if (bestStart) {
                    const path = bfsPath(bestStart.id, selectedNode.id, RAW_EDGES);
                    setPathHighlight(path);
                    setGoalNodeId(selectedNode.id);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium text-[#3b82f6] border border-[#1e1e2e] hover:border-[#3b82f6] hover:bg-[#3b82f610] rounded-lg py-2 transition-all"
              >
                <ChevronRight size={13} /> Highlight Learning Path Here
              </button>
            </div>

            {/* Start Quiz button */}
            <div className="px-4 py-4 mt-auto">
              <button
                onClick={() => navigate(`/course/${selectedNode.course_id}/topic/${selectedNode.id}`)}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all"
                style={{
                  background: MASTERY_COLOR[selectedNode.mastery_level],
                  boxShadow: `0 0 16px ${MASTERY_COLOR[selectedNode.mastery_level]}50`,
                }}
              >
                <Play size={14} fill="white" /> Start Quiz
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SynapsePage;
