import React, { useState, useMemo } from "react";
import { Brain, Filter } from "lucide-react";

type MasteryLevel = "untouched" | "struggling" | "learning" | "mastered";
type FilterOption = "All" | "Struggling" | "Learning" | "Mastered" | "Untouched";

interface BKTTopic {
  topic_id: string;
  topic_name: string;
  category: string;
  p_know: number;
  attempts: number;
  mastery_level: MasteryLevel;
  last_updated: string;
}

const MOCK_BKT: BKTTopic[] = [
  { topic_id: "cpu-architecture",     topic_name: "CPU Architecture",       category: "Computer Architecture",        p_know: 0.91, attempts: 24, mastery_level: "mastered",   last_updated: "2h ago" },
  { topic_id: "instruction-cycle",    topic_name: "Instruction Cycle",      category: "Computer Architecture",        p_know: 0.72, attempts: 15, mastery_level: "learning",   last_updated: "1d ago" },
  { topic_id: "registers-and-buses",  topic_name: "Registers & Buses",      category: "Computer Architecture",        p_know: 0.38, attempts: 8,  mastery_level: "struggling", last_updated: "3d ago" },
  { topic_id: "alu-operations",       topic_name: "ALU Operations",         category: "Computer Architecture",        p_know: 0.00, attempts: 0,  mastery_level: "untouched",  last_updated: "Never"  },
  { topic_id: "control-units",        topic_name: "Control Units",          category: "Computer Architecture",        p_know: 0.88, attempts: 30, mastery_level: "mastered",   last_updated: "5h ago" },
  { topic_id: "memory-hierarchy",     topic_name: "Memory Hierarchy",       category: "Computer Architecture",        p_know: 0.55, attempts: 12, mastery_level: "learning",   last_updated: "2d ago" },
  { topic_id: "recurrence-relations", topic_name: "Recurrence Relations",   category: "Algorithms & Data Structures", p_know: 0.28, attempts: 10, mastery_level: "struggling", last_updated: "4d ago" },
  { topic_id: "master-theorem",       topic_name: "Master Theorem",         category: "Algorithms & Data Structures", p_know: 0.61, attempts: 18, mastery_level: "learning",   last_updated: "1d ago" },
  { topic_id: "sorting-algorithms",   topic_name: "Sorting Algorithms",     category: "Algorithms & Data Structures", p_know: 0.93, attempts: 35, mastery_level: "mastered",   last_updated: "6h ago" },
  { topic_id: "graph-algorithms",     topic_name: "Graph Algorithms",       category: "Algorithms & Data Structures", p_know: 0.44, attempts: 9,  mastery_level: "struggling", last_updated: "5d ago" },
  { topic_id: "dynamic-programming",  topic_name: "Dynamic Programming",    category: "Algorithms & Data Structures", p_know: 0.00, attempts: 0,  mastery_level: "untouched",  last_updated: "Never"  },
  { topic_id: "consumer-theory",      topic_name: "Consumer Theory",        category: "Microeconomics",               p_know: 0.78, attempts: 20, mastery_level: "learning",   last_updated: "3h ago" },
  { topic_id: "utility-maximization", topic_name: "Utility Maximization",   category: "Microeconomics",               p_know: 0.35, attempts: 7,  mastery_level: "struggling", last_updated: "6d ago" },
  { topic_id: "production-functions", topic_name: "Production Functions",   category: "Microeconomics",               p_know: 0.00, attempts: 0,  mastery_level: "untouched",  last_updated: "Never"  },
  { topic_id: "cost-curves",          topic_name: "Cost Curves",            category: "Microeconomics",               p_know: 0.87, attempts: 22, mastery_level: "mastered",   last_updated: "1d ago" },
  { topic_id: "market-equilibrium",   topic_name: "Market Equilibrium",     category: "Microeconomics",               p_know: 0.62, attempts: 14, mastery_level: "learning",   last_updated: "2d ago" },
  { topic_id: "physical-geography",   topic_name: "Physical Geography",     category: "Caribbean Geography",          p_know: 0.90, attempts: 28, mastery_level: "mastered",   last_updated: "12h ago"},
  { topic_id: "climate-systems",      topic_name: "Climate Systems",        category: "Caribbean Geography",          p_know: 0.53, attempts: 11, mastery_level: "learning",   last_updated: "3d ago" },
  { topic_id: "population-dist",      topic_name: "Population Distribution",category: "Caribbean Geography",          p_know: 0.41, attempts: 6,  mastery_level: "struggling", last_updated: "7d ago" },
  { topic_id: "urban-development",    topic_name: "Urban Development",      category: "Caribbean Geography",          p_know: 0.00, attempts: 0,  mastery_level: "untouched",  last_updated: "Never"  },
  { topic_id: "regional-trade",       topic_name: "Regional Trade",         category: "Caribbean Geography",          p_know: 0.69, attempts: 16, mastery_level: "learning",   last_updated: "4h ago" },
];

const MASTERY_CONFIG: Record<MasteryLevel, { color: string; orbClass: string; label: string; dot: string }> = {
  mastered:   { color: "#22c55e", orbClass: "orb-mastered",   label: "Mastered",   dot: "bg-green-500" },
  learning:   { color: "#3b82f6", orbClass: "orb-learning",   label: "Learning",   dot: "bg-blue-500"  },
  struggling: { color: "#f97316", orbClass: "orb-struggling", label: "Struggling", dot: "bg-orange-500"},
  untouched:  { color: "#374151", orbClass: "orb-untouched",  label: "Untouched",  dot: "bg-gray-600"  },
};

const FILTERS: FilterOption[] = ["All", "Mastered", "Learning", "Struggling", "Untouched"];

function orbSize(attempts: number): number {
  return Math.max(48, Math.min(84, 48 + attempts * 1.3));
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, pct: number): string {
  if (pct >= 1) pct = 0.9999;
  const startDeg = 0;
  const endDeg = 360 * pct;
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end   = polarToCartesian(cx, cy, r, endDeg);
  const large = endDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

interface OrbProps { topic: BKTTopic }

const Orb: React.FC<OrbProps> = ({ topic }) => {
  const [hovered, setHovered] = useState(false);
  const cfg = MASTERY_CONFIG[topic.mastery_level];
  const size = orbSize(topic.attempts);
  const innerSize = hovered ? size + 20 : size;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size + 32, height: size + 32 }}>
      <div
        className={`${cfg.orbClass} rounded-full cursor-pointer flex items-center justify-center transition-all duration-300`}
        style={{
          width: innerSize,
          height: innerSize,
          backgroundColor: `${cfg.color}22`,
          border: `2px solid ${cfg.color}88`,
          transform: hovered ? "scale(1.12)" : "scale(1)",
          zIndex: hovered ? 20 : 1,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span
          className="font-mono text-xs font-semibold leading-none select-none"
          style={{ color: cfg.color }}
        >
          {topic.attempts > 0 ? `${Math.round(topic.p_know * 100)}%` : "–"}
        </span>
      </div>

      {hovered && (
        <div
          className="absolute bottom-full mb-2 z-30 pointer-events-none"
          style={{ left: "50%", transform: "translateX(-50%)" }}
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-48 text-left">
            <p className="font-semibold text-gray-900 text-sm tracking-tight truncate mb-1">{topic.topic_name}</p>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-xs text-gray-500 capitalize">{cfg.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              <span className="text-gray-400">p_know</span>
              <span className="font-mono font-semibold text-gray-800">{topic.p_know.toFixed(3)}</span>
              <span className="text-gray-400">attempts</span>
              <span className="font-mono font-semibold text-gray-800">{topic.attempts}</span>
              <span className="text-gray-400">last active</span>
              <span className="font-semibold text-gray-700">{topic.last_updated}</span>
            </div>
          </div>
        </div>
      )}

      <p
        className="absolute -bottom-5 left-1/2 text-xs text-gray-500 tracking-tight whitespace-nowrap"
        style={{ transform: "translateX(-50%)", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {topic.topic_name}
      </p>
    </div>
  );
};

interface MasteryRingProps { pct: number; masteredCount: number; totalCount: number }

const MasteryRing: React.FC<MasteryRingProps> = ({ pct, masteredCount, totalCount }) => {
  const cx = 64, cy = 64, r = 52;
  return (
    <svg width={128} height={128} className="overflow-visible">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
      <path
        d={arcPath(cx, cy, r, pct)}
        fill="none"
        stroke="#22c55e"
        strokeWidth={8}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 6px #22c55e80)" }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" className="font-mono" style={{ fontSize: 18, fontWeight: 700, fill: "#111827" }}>
        {Math.round(pct * 100)}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 10, fill: "#6b7280" }}>
        {masteredCount}/{totalCount}
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" style={{ fontSize: 9, fill: "#9ca3af" }}>
        mastered
      </text>
    </svg>
  );
};

const Cortex: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");

  const categories = useMemo(() => {
    const map = new Map<string, BKTTopic[]>();
    for (const t of MOCK_BKT) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === "All") return MOCK_BKT;
    return MOCK_BKT.filter(
      (t) => t.mastery_level === activeFilter.toLowerCase()
    );
  }, [activeFilter]);

  const filteredByCategory = useMemo(() => {
    const map = new Map<string, BKTTopic[]>();
    for (const t of filtered) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return map;
  }, [filtered]);

  const overallMastery = useMemo(() => {
    const total = MOCK_BKT.length;
    const masteredCount = MOCK_BKT.filter((t) => t.mastery_level === "mastered").length;
    const avgPKnow = MOCK_BKT.reduce((s, t) => s + t.p_know, 0) / total;
    return { pct: avgPKnow, masteredCount, total };
  }, []);

  const categoryBreakdown = useMemo(() => {
    const result: Record<string, Record<MasteryLevel, number>> = {};
    categories.forEach((topics, cat) => {
      result[cat] = { mastered: 0, learning: 0, struggling: 0, untouched: 0 };
      for (const t of topics) result[cat][t.mastery_level]++;
    });
    return result;
  }, [categories]);

  return (
    <div className="min-h-full" style={{ background: "#faf9f6" }}>
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">

        {/* ── Header ── */}
        <div className="flex flex-col gap-5 border-b border-gray-200 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white shadow border border-gray-100">
                  <Brain size={18} className="text-gray-600" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Cortex</h1>
              </div>
              <p className="text-sm text-gray-500 max-w-md">
                Neural mastery map — your knowledge state visualised as a living cortex. Orb size = attempts, glow intensity = mastery.
              </p>
            </div>

            {/* ── Overall Mastery Ring ── */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <MasteryRing
                pct={overallMastery.pct}
                masteredCount={overallMastery.masteredCount}
                totalCount={overallMastery.total}
              />
              <span className="text-xs text-gray-400 tracking-tight">overall mastery</span>
            </div>
          </div>

          {/* ── Legend ── */}
          <div className="flex items-center gap-5 flex-wrap">
            {(Object.entries(MASTERY_CONFIG) as [MasteryLevel, typeof MASTERY_CONFIG[MasteryLevel]][]).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className="text-xs text-gray-500">{cfg.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-4 text-xs text-gray-400">
              <span className="font-mono">size</span>
              <span>= attempts</span>
            </div>
          </div>
        </div>

        {/* ── Filter chips ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-400" />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                activeFilter === f
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
              }`}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 font-mono">
            {filtered.length} topic{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Category lanes ── */}
        {filteredByCategory.size === 0 ? (
          <div className="text-center text-gray-400 py-20 text-sm">No topics match this filter.</div>
        ) : (
          Array.from(filteredByCategory.entries()).map(([cat, topics]) => {
            const breakdown = categoryBreakdown[cat] ?? {};
            return (
              <div key={cat} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold tracking-tight text-gray-800 text-sm uppercase">{cat}</h2>
                  <div className="flex-1 h-px bg-gray-200" />
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                    {(["mastered", "learning", "struggling", "untouched"] as MasteryLevel[]).map((lvl) =>
                      breakdown[lvl] ? (
                        <span key={lvl} style={{ color: MASTERY_CONFIG[lvl].color }}>
                          {breakdown[lvl]}{lvl[0].toUpperCase()}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 items-end pl-2 pb-8">
                  {topics.map((topic) => (
                    <Orb key={topic.topic_id} topic={topic} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Cortex;
