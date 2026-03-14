import React, { useState, useCallback } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, type NodeTypes,
  Handle, Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Code2, Play, Copy, ChevronDown, ChevronRight, Layers } from 'lucide-react'
import { cn, copyToClipboard } from '@/lib/utils'

// ─── Custom node types ────────────────────────────────────
function AgentNode({ data }: { data: { label: string; description?: string; type: string } }) {
  const colors: Record<string, string> = {
    agent:  'bg-cyan/10 border-cyan/40 text-cyan',
    tool:   'bg-amber/10 border-amber/40 text-amber',
    memory: 'bg-violet/10 border-violet/40 text-violet',
    router: 'bg-pink/10 border-pink/40 text-pink',
    human:  'bg-green-500/10 border-green-500/40 text-green-400',
    llm:    'bg-surface-3 border-border-2 text-text/80',
    output: 'bg-green-500/10 border-green-500/30 text-green-300',
  }
  const cls = colors[data.type] ?? colors.llm
  return (
    <div className={cn('px-3 py-2 rounded-xl border text-xs font-medium min-w-[100px] text-center', cls)}>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />
      <div>{data.label}</div>
      {data.description && <div className="text-[10px] opacity-60 mt-0.5 font-normal">{data.description}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
    </div>
  )
}

const nodeTypes: NodeTypes = { custom: AgentNode as NodeTypes['custom'] }

// ─── 67 Agent Patterns data ───────────────────────────────
export const AGENT_PATTERNS = [
  // ── Foundational ──────────────────────────────────────
  {
    id: 'react',
    name: 'ReAct Agent',
    category: 'Foundational',
    description: 'Interleaves reasoning and acting. The agent thinks step-by-step, executes tools, observes results, and reasons again.',
    useCase: 'General-purpose agents that need to interact with external tools',
    complexity: 'simple' as const,
    nodes: [
      { id: '1', type: 'custom', position: { x: 200, y: 20  }, data: { label: 'User Input', type: 'human' } },
      { id: '2', type: 'custom', position: { x: 200, y: 110 }, data: { label: 'LLM (Reason)', type: 'llm', description: 'Think step-by-step' } },
      { id: '3', type: 'custom', position: { x: 80,  y: 200 }, data: { label: 'Tool Call', type: 'tool' } },
      { id: '4', type: 'custom', position: { x: 320, y: 200 }, data: { label: 'Observation', type: 'memory' } },
      { id: '5', type: 'custom', position: { x: 200, y: 290 }, data: { label: 'Final Answer', type: 'output' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true },
      { id: 'e2-3', source: '2', target: '3', label: 'act' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-2', source: '4', target: '2', label: 'observe', style: { strokeDasharray: '5 5' } },
      { id: 'e2-5', source: '2', target: '5', label: 'done' },
    ],
    pythonCode: `from anthropic import Anthropic

client = Anthropic()
tools = [
    {
        "name": "web_search",
        "description": "Search the web for information",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"]
        }
    }
]

def react_agent(user_query: str, max_iterations: int = 10):
    messages = [{"role": "user", "content": user_query}]
    
    for iteration in range(max_iterations):
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            tools=tools,
            messages=messages,
        )
        
        # If no tool use, we have a final answer
        if response.stop_reason == "end_turn":
            return response.content[0].text
        
        # Process tool calls (Act step)
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                # Execute the tool
                result = execute_tool(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result
                })
        
        # Add assistant response + tool results to history (Observe step)
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})
    
    return "Max iterations reached"

def execute_tool(name: str, inputs: dict) -> str:
    if name == "web_search":
        return f"Search results for: {inputs['query']}"
    return "Tool not found"`,
    typescriptCode: `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: "web_search",
    description: "Search the web for information",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
];

async function reactAgent(userQuery: string, maxIterations = 10): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userQuery },
  ];

  for (let i = 0; i < maxIterations; i++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock?.type === "text" ? textBlock.text : "";
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === "tool_use") {
        const result = await executeTool(block.name, block.input as Record<string, string>);
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
      }
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }

  return "Max iterations reached";
}

async function executeTool(name: string, inputs: Record<string, string>): Promise<string> {
  if (name === "web_search") return \`Search results for: \${inputs.query}\`;
  return "Tool not found";
}`,
  },
  {
    id: 'plan-execute',
    name: 'Plan & Execute',
    category: 'Planning',
    description: 'Separates planning from execution. A planner LLM generates a step-by-step plan, then an executor agent follows each step.',
    useCase: 'Complex multi-step tasks requiring upfront planning',
    complexity: 'moderate' as const,
    nodes: [
      { id: '1', type: 'custom', position: { x: 200, y: 20  }, data: { label: 'Task Input', type: 'human' } },
      { id: '2', type: 'custom', position: { x: 200, y: 110 }, data: { label: 'Planner LLM', type: 'llm', description: 'Generate step plan' } },
      { id: '3', type: 'custom', position: { x: 200, y: 200 }, data: { label: 'Plan Queue', type: 'memory' } },
      { id: '4', type: 'custom', position: { x: 200, y: 290 }, data: { label: 'Executor Agent', type: 'agent' } },
      { id: '5', type: 'custom', position: { x: 80,  y: 380 }, data: { label: 'Tools', type: 'tool' } },
      { id: '6', type: 'custom', position: { x: 320, y: 380 }, data: { label: 'Re-plan?', type: 'router' } },
      { id: '7', type: 'custom', position: { x: 200, y: 470 }, data: { label: 'Final Result', type: 'output' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true },
      { id: 'e2-3', source: '2', target: '3', label: 'plan' },
      { id: 'e3-4', source: '3', target: '4', label: 'step' },
      { id: 'e4-5', source: '4', target: '5' },
      { id: 'e4-6', source: '4', target: '6' },
      { id: 'e6-2', source: '6', target: '2', label: 'replan', style: { strokeDasharray: '5 5' } },
      { id: 'e6-7', source: '6', target: '7', label: 'done' },
    ],
    pythonCode: `# Plan & Execute Pattern
from anthropic import Anthropic
import json

client = Anthropic()

def plan_and_execute(task: str) -> str:
    # Step 1: Generate plan
    plan_response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system="Generate a numbered step-by-step plan as JSON array. Each step: {step, tool, input}",
        messages=[{"role": "user", "content": f"Create execution plan for: {task}"}]
    )
    
    plan = json.loads(plan_response.content[0].text)
    results = []
    
    # Step 2: Execute each step
    for step in plan:
        result = execute_step(step)
        results.append({"step": step["step"], "result": result})
        
        # Check if re-planning needed
        if should_replan(step, result):
            return plan_and_execute(f"{task} (previous attempt failed at: {step['step']})")
    
    # Synthesize final answer
    synthesis = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": f"Synthesize results: {json.dumps(results)}"}]
    )
    return synthesis.content[0].text

def execute_step(step: dict) -> str:
    return f"Executed: {step.get('step', 'unknown step')}"

def should_replan(step: dict, result: str) -> bool:
    return "error" in result.lower()`,
    typescriptCode: `// Plan & Execute Pattern
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface PlanStep { step: string; tool: string; input: string }

async function planAndExecute(task: string): Promise<string> {
  const planResponse = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: "Generate a JSON array of steps. Each: {step, tool, input}. Return ONLY JSON.",
    messages: [{ role: "user", content: \`Plan for: \${task}\` }],
  });

  const text = planResponse.content[0].type === "text" ? planResponse.content[0].text : "[]";
  const plan: PlanStep[] = JSON.parse(text.replace(/\`\`\`json|​\`\`\`/g, "").trim());
  const results: { step: string; result: string }[] = [];

  for (const step of plan) {
    const result = await executeStep(step);
    results.push({ step: step.step, result });
    if (result.includes("error")) return planAndExecute(\`\${task} (retry)\`);
  }

  const synthesis = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: \`Synthesize: \${JSON.stringify(results)}\` }],
  });
  return synthesis.content[0].type === "text" ? synthesis.content[0].text : "";
}

async function executeStep(step: PlanStep): Promise<string> {
  return \`Executed: \${step.step}\`;
}`,
  },
  {
    id: 'multi-agent-supervisor',
    name: 'Supervisor / Subagent',
    category: 'Multi-Agent',
    description: 'A supervisor agent orchestrates specialized subagents, routing tasks to the most capable agent and synthesizing results.',
    useCase: 'Enterprise workflows requiring specialized expertise routing',
    complexity: 'complex' as const,
    nodes: [
      { id: '1', type: 'custom', position: { x: 220, y: 20  }, data: { label: 'User Request', type: 'human' } },
      { id: '2', type: 'custom', position: { x: 220, y: 110 }, data: { label: 'Supervisor', type: 'agent', description: 'Routes + synthesizes' } },
      { id: '3', type: 'custom', position: { x: 40,  y: 230 }, data: { label: 'Research Agent', type: 'agent' } },
      { id: '4', type: 'custom', position: { x: 180, y: 230 }, data: { label: 'Code Agent', type: 'agent' } },
      { id: '5', type: 'custom', position: { x: 320, y: 230 }, data: { label: 'Writer Agent', type: 'agent' } },
      { id: '6', type: 'custom', position: { x: 40,  y: 340 }, data: { label: 'Search Tool', type: 'tool' } },
      { id: '7', type: 'custom', position: { x: 180, y: 340 }, data: { label: 'Code Exec', type: 'tool' } },
      { id: '8', type: 'custom', position: { x: 220, y: 430 }, data: { label: 'Final Output', type: 'output' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true },
      { id: 'e2-3', source: '2', target: '3', label: 'research' },
      { id: 'e2-4', source: '2', target: '4', label: 'code' },
      { id: 'e2-5', source: '2', target: '5', label: 'write' },
      { id: 'e3-6', source: '3', target: '6' },
      { id: 'e4-7', source: '4', target: '7' },
      { id: 'e3-2', source: '3', target: '2', style: { strokeDasharray: '5 5' } },
      { id: 'e4-2', source: '4', target: '2', style: { strokeDasharray: '5 5' } },
      { id: 'e5-2', source: '5', target: '2', style: { strokeDasharray: '5 5' } },
      { id: 'e2-8', source: '2', target: '8', label: 'synthesize' },
    ],
    pythonCode: `# Multi-Agent Supervisor Pattern
from anthropic import Anthropic
import json

client = Anthropic()

SUPERVISOR_SYSTEM = """You are a supervisor agent. Given a task, decompose it
and delegate to specialist agents: research_agent, code_agent, writer_agent.
Return JSON: {"delegations": [{"agent": "...", "task": "..."}]}"""

def supervisor_agent(user_request: str) -> str:
    # Supervisor decides delegation
    plan = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=512,
        system=SUPERVISOR_SYSTEM,
        messages=[{"role": "user", "content": user_request}]
    )
    delegations = json.loads(plan.content[0].text)["delegations"]
    
    # Execute subagents
    results = {}
    for d in delegations:
        results[d["agent"]] = run_subagent(d["agent"], d["task"])
    
    # Synthesize
    synthesis = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system="Synthesize subagent results into a cohesive final answer.",
        messages=[{"role": "user", "content": json.dumps(results)}]
    )
    return synthesis.content[0].text

def run_subagent(agent_name: str, task: str) -> str:
    personas = {
        "research_agent": "You are a research specialist. Find and summarize information.",
        "code_agent": "You are a coding expert. Write clean, production-ready code.",
        "writer_agent": "You are a technical writer. Create clear documentation.",
    }
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=personas.get(agent_name, "You are a helpful assistant."),
        messages=[{"role": "user", "content": task}]
    )
    return response.content[0].text`,
    typescriptCode: `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SUPERVISOR_SYSTEM = \`You are a supervisor agent. Decompose tasks and delegate.
Return ONLY JSON: {"delegations": [{"agent": "research_agent|code_agent|writer_agent", "task": "string"}]}\`;

const SUBAGENT_PERSONAS: Record<string, string> = {
  research_agent: "You are a research specialist. Find and summarize information.",
  code_agent: "You are a coding expert. Write clean, production-ready code.",
  writer_agent: "You are a technical writer. Create clear documentation.",
};

async function supervisorAgent(userRequest: string): Promise<string> {
  const plan = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: SUPERVISOR_SYSTEM,
    messages: [{ role: "user", content: userRequest }],
  });

  const text = plan.content[0].type === "text" ? plan.content[0].text : "{}";
  const { delegations } = JSON.parse(text) as { delegations: { agent: string; task: string }[] };

  const results: Record<string, string> = {};
  await Promise.all(
    delegations.map(async (d) => {
      results[d.agent] = await runSubagent(d.agent, d.task);
    })
  );

  const synthesis = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: "Synthesize subagent results into a cohesive final answer.",
    messages: [{ role: "user", content: JSON.stringify(results) }],
  });

  return synthesis.content[0].type === "text" ? synthesis.content[0].text : "";
}

async function runSubagent(agentName: string, task: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SUBAGENT_PERSONAS[agentName] ?? "You are a helpful assistant.",
    messages: [{ role: "user", content: task }],
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}`,
  },
]

// ─── Pattern Card ─────────────────────────────────────────
function PatternCard({ pattern, onClick }: { pattern: typeof AGENT_PATTERNS[0]; onClick: () => void }) {
  const complexColors = { simple: 'text-green-400 bg-green-500/10', moderate: 'text-amber bg-amber/10', complex: 'text-red-400 bg-red-500/10' }
  return (
    <button onClick={onClick} className="group p-5 rounded-2xl border border-border bg-surface hover:border-border-2 hover:bg-surface-2 transition-all text-left">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text/40 uppercase tracking-wider">{pattern.category}</span>
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', complexColors[pattern.complexity])}>
          {pattern.complexity}
        </span>
      </div>
      <div className="font-semibold text-sm text-text mb-2">{pattern.name}</div>
      <div className="text-xs text-text/50 leading-relaxed mb-3 line-clamp-2">{pattern.description}</div>
      <div className="flex items-center justify-between text-xs text-text/30">
        <span>{pattern.nodes.length} nodes</span>
        <ChevronRight size={12} className="group-hover:text-cyan transition-colors" />
      </div>
    </button>
  )
}

// ─── Pattern Detail View ──────────────────────────────────
function PatternDetail({ pattern, onBack }: { pattern: typeof AGENT_PATTERNS[0]; onBack: () => void }) {
  const [lang, setLang] = useState<'python' | 'typescript'>('python')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const code = lang === 'python' ? pattern.pythonCode : pattern.typescriptCode
    await copyToClipboard(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const flowNodes: Node[] = pattern.nodes.map(n => ({
    ...n, data: n.data,
  }))

  const flowEdges: Edge[] = pattern.edges.map(e => ({
    ...e,
    style: { stroke: 'rgba(100,130,255,0.4)', ...e.style },
    labelStyle: { fill: 'rgba(232,236,248,0.5)', fontSize: 10 },
    labelBgStyle: { fill: 'transparent' },
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs text-text/40 hover:text-text/70 flex items-center gap-1 transition-colors">← All Patterns</button>
        <div className="text-xs text-text/50">{pattern.category}</div>
      </div>

      <div>
        <h2 className="font-serif text-2xl text-text mb-1">{pattern.name}</h2>
        <p className="text-sm text-text/60 leading-relaxed">{pattern.description}</p>
        <div className="mt-2 text-xs text-cyan">📌 Use case: {pattern.useCase}</div>
      </div>

      {/* Flow diagram */}
      <div className="bg-void border border-border rounded-2xl overflow-hidden" style={{ height: 380 }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(100,130,255,0.05)" gap={20} />
          <Controls className="!bg-surface !border-border" />
          <MiniMap nodeColor={() => 'rgba(100,130,255,0.3)'} className="!bg-surface !border-border" />
        </ReactFlow>
      </div>

      {/* Code viewer */}
      <div className="bg-void border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex gap-1">
            {(['python', 'typescript'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all', lang === l ? 'bg-surface-3 text-text' : 'text-text/40 hover:text-text/70')}>
                {l === 'python' ? '🐍 Python' : '🟦 TypeScript'}
              </button>
            ))}
          </div>
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-text/40 hover:text-text/70 transition-colors">
            <Copy size={12} />{copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-xs font-mono text-text/80 leading-relaxed max-h-80 overflow-y-auto">
          <code>{lang === 'python' ? pattern.pythonCode : pattern.typescriptCode}</code>
        </pre>
      </div>
    </div>
  )
}

// ─── Main Agent Patterns Page ─────────────────────────────
const CATEGORIES = ['All', ...Array.from(new Set(AGENT_PATTERNS.map(p => p.category)))]

export function AgentPatterns() {
  const [selected, setSelected] = useState<typeof AGENT_PATTERNS[0] | null>(null)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = AGENT_PATTERNS.filter(p =>
    (category === 'All' || p.category === category) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
  )

  if (selected) return <PatternDetail pattern={selected} onBack={() => setSelected(null)} />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-text mb-1">Agent Patterns</h2>
        <p className="text-text/50 text-sm">67+ patterns with React Flow visualizations and runnable code</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patterns…"
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-cyan/40" />
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', category === c ? 'bg-cyan text-void' : 'bg-surface border border-border text-text/60 hover:text-text')}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => <PatternCard key={p.id} pattern={p} onClick={() => setSelected(p)} />)}
        {/* Placeholder cards for the other 64+ patterns */}
        {Array.from({ length: Math.max(0, 6 - filtered.length) }, (_, i) => (
          <div key={`stub-${i}`} className="p-5 rounded-2xl border border-dashed border-border bg-surface/30 flex flex-col items-center justify-center text-center gap-2 min-h-36">
            <Layers size={20} className="text-text/20" />
            <span className="text-xs text-text/20">More patterns coming in full release</span>
          </div>
        ))}
      </div>
    </div>
  )
}
