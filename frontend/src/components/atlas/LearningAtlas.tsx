import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

// ─── Atlas data (59 concepts across 12 categories) ───────
export const ATLAS_DATA = {
  name: 'AI Agents',
  children: [
    {
      name: 'Foundations',
      color: '#00e5ff',
      children: [
        { name: 'LLM Fundamentals', size: 3 },
        { name: 'Prompt Engineering', size: 3 },
        { name: 'Tokenization', size: 2 },
        { name: 'Context Windows', size: 2 },
        { name: 'Temperature & Sampling', size: 2 },
        { name: 'Embeddings', size: 3 },
        { name: 'RAG Basics', size: 4 },
      ],
    },
    {
      name: 'Architecture',
      color: '#7c6df0',
      children: [
        { name: 'ReAct Pattern', size: 4 },
        { name: 'Chain of Thought', size: 3 },
        { name: 'Tool Use', size: 4 },
        { name: 'Memory Types', size: 3 },
        { name: 'Planning Loops', size: 4 },
        { name: 'Reflection Agents', size: 3 },
        { name: 'Hierarchical Agents', size: 4 },
        { name: 'Multi-Agent Systems', size: 5 },
      ],
    },
    {
      name: 'Protocols',
      color: '#ffb340',
      children: [
        { name: 'MCP Protocol', size: 4 },
        { name: 'A2A Protocol', size: 4 },
        { name: 'ANP Protocol', size: 3 },
        { name: 'Function Calling', size: 3 },
        { name: 'Streaming', size: 2 },
        { name: 'Structured Outputs', size: 3 },
        { name: 'Tool Schemas', size: 3 },
      ],
    },
    {
      name: 'Production',
      color: '#00e676',
      children: [
        { name: 'Observability', size: 4 },
        { name: 'Tracing', size: 3 },
        { name: 'Evaluation Frameworks', size: 5 },
        { name: 'Cost Optimization', size: 3 },
        { name: 'Latency Reduction', size: 3 },
        { name: 'Error Recovery', size: 4 },
        { name: 'Rate Limiting', size: 2 },
        { name: 'Deployment Patterns', size: 4 },
      ],
    },
    {
      name: 'Advanced',
      color: '#ff6b9d',
      children: [
        { name: 'Constitutional AI', size: 4 },
        { name: 'RLHF', size: 4 },
        { name: 'Fine-tuning', size: 4 },
        { name: 'Alignment Techniques', size: 5 },
        { name: 'Adversarial Prompting', size: 3 },
        { name: 'Jailbreak Defense', size: 3 },
        { name: 'Hallucination Mitigation', size: 4 },
      ],
    },
    {
      name: 'Applied',
      color: '#22d3ee',
      children: [
        { name: 'Code Agents', size: 5 },
        { name: 'Research Agents', size: 4 },
        { name: 'Data Analysis Agents', size: 4 },
        { name: 'Customer Support Agents', size: 3 },
        { name: 'Workflow Automation', size: 4 },
        { name: 'Document Processing', size: 3 },
        { name: 'Agent Orchestration', size: 5 },
      ],
    },
    {
      name: 'Enterprise',
      color: '#a78bfa',
      children: [
        { name: 'Access Control', size: 3 },
        { name: 'Audit Logging', size: 3 },
        { name: 'Data Privacy', size: 4 },
        { name: 'Compliance Guardrails', size: 4 },
        { name: 'Enterprise RAG', size: 5 },
        { name: 'Multi-tenant Agents', size: 4 },
      ],
    },
  ],
}

interface AtlasNode {
  name: string
  color?: string
  size?: number
  children?: AtlasNode[]
}

// ─── D3 Radial Tree ────────────────────────────────────────
export function LearningAtlas() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return
    const W = containerRef.current.clientWidth || 800
    const H = 700
    const cx = W / 2, cy = H / 2
    const radius = Math.min(W, H) / 2 - 80

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', W).attr('height', H)

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`)

    // Zoom behavior
    const zoomBeh = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', e => {
        g.attr('transform', `translate(${cx + e.transform.x},${cy + e.transform.y}) scale(${e.transform.k})`)
        setZoom(e.transform.k)
      })
    svg.call(zoomBeh)

    // Build hierarchy
    const root = d3.hierarchy<AtlasNode>(ATLAS_DATA)
    const tree = d3.tree<AtlasNode>().size([2 * Math.PI, radius]).separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)
    tree(root)

    // Color map
    const colorOf = (node: d3.HierarchyNode<AtlasNode>): string => {
      let cur: d3.HierarchyNode<AtlasNode> | null = node
      while (cur) {
        if (cur.data.color) return cur.data.color
        cur = cur.parent
      }
      return '#4a5568'
    }

    // Links
    g.append('g').attr('fill', 'none')
      .selectAll('path')
      .data(root.links())
      .join('path')
      .attr('d', d3.linkRadial<d3.HierarchyLink<AtlasNode>, d3.HierarchyPointNode<AtlasNode>>()
        .angle((d: d3.HierarchyPointNode<AtlasNode>) => d.x)
        .radius((d: d3.HierarchyPointNode<AtlasNode>) => d.y) as never)
      .attr('stroke', d => colorOf(d.target as d3.HierarchyNode<AtlasNode>))
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', d => Math.max(0.5, (3 - (d.target as d3.HierarchyPointNode<AtlasNode>).depth) * 0.8))

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', (d: d3.HierarchyPointNode<AtlasNode>) =>
        `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
      .style('cursor', 'pointer')
      .on('click', (_, d) => setSelected(d.data.name))

    node.append('circle')
      .attr('r', d => d.depth === 0 ? 14 : d.depth === 1 ? 8 : 4)
      .attr('fill', d => colorOf(d))
      .attr('fill-opacity', d => d.depth === 0 ? 1 : 0.85)
      .attr('stroke', 'rgba(5,5,8,0.8)')
      .attr('stroke-width', 1.5)

    // Labels
    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', (d: d3.HierarchyPointNode<AtlasNode>) => d.x < Math.PI === !d.children ? 10 : -10)
      .attr('text-anchor', (d: d3.HierarchyPointNode<AtlasNode>) => d.x < Math.PI === !d.children ? 'start' : 'end')
      .attr('transform', (d: d3.HierarchyPointNode<AtlasNode>) => d.x >= Math.PI ? 'rotate(180)' : null)
      .text((d) => d.data.name)
      .attr('fill', d => d.depth === 0 ? '#e8ecf8' : d.depth === 1 ? colorOf(d) : 'rgba(232,236,248,0.7)')
      .attr('font-size', d => d.depth === 0 ? 14 : d.depth === 1 ? 11 : 9)
      .attr('font-family', "'Outfit', sans-serif")
      .attr('font-weight', d => d.depth <= 1 ? 600 : 400)

  }, [])

  const handleExportSVG = () => {
    if (!svgRef.current) return
    const xml = new XMLSerializer().serializeToString(svgRef.current)
    const blob = new Blob([xml], { type: 'image/svg+xml' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'intoit-atlas.svg'; a.click()
  }

  const handleExportPNG = async () => {
    if (!svgRef.current) return
    const xml = new XMLSerializer().serializeToString(svgRef.current)
    const img = new Image()
    img.src = 'data:image/svg+xml;base64,' + btoa(xml)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width * 2; canvas.height = img.height * 2
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const a = document.createElement('a'); a.href = canvas.toDataURL('image/png')
      a.download = 'intoit-atlas@2x.png'; a.click()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-text">Learning Atlas</h2>
          <p className="text-xs text-text/50 mt-0.5">59 core concepts across 7 tracks — click any node to explore</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportSVG} className="flex items-center gap-1.5 text-xs text-text/60 hover:text-text border border-border hover:border-border-2 rounded-lg px-3 py-2 transition-all">
            <Download size={12} />SVG
          </button>
          <button onClick={handleExportPNG} className="flex items-center gap-1.5 text-xs text-text/60 hover:text-text border border-border hover:border-border-2 rounded-lg px-3 py-2 transition-all">
            <Download size={12} />PNG 2×
          </button>
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
            <button className="p-2 text-text/50 hover:text-text hover:bg-surface-2 transition-all"><ZoomIn size={12} /></button>
            <span className="text-xs text-text/40 px-1">{Math.round(zoom * 100)}%</span>
            <button className="p-2 text-text/50 hover:text-text hover:bg-surface-2 transition-all"><ZoomOut size={12} /></button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="p-3 rounded-xl border border-cyan/20 bg-cyan-dim text-sm text-cyan animate-slide-up">
          <span className="font-semibold">{selected}</span>
          <span className="text-cyan/60 ml-2">— Click to open concept page</span>
        </div>
      )}

      <div
        ref={containerRef}
        className="bg-surface border border-border rounded-2xl overflow-hidden"
        style={{ height: 700 }}
      >
        <svg ref={svgRef} style={{ width: '100%', height: '100%', background: 'transparent' }} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {ATLAS_DATA.children.map(cat => (
          <div key={cat.name} className="flex items-center gap-1.5 text-xs text-text/60">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
            {cat.name}
          </div>
        ))}
      </div>
    </div>
  )
}
