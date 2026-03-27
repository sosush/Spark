'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'
import type { NodeObject } from 'react-force-graph-3d'

// FIX: Define Types to prevent 'never[]' error
interface GraphNode extends NodeObject {
  id: string;
  name: string;
  domains: string[];
}

interface GraphLink {
  source: string;
  target: string;
}

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false })

export default function StarMap() {
  const fgRef = useRef<any>(null)
  const supabase = createClient()

  // FIX: Explicitly type the state
  const [data, setData] = useState<{ nodes: GraphNode[], links: GraphLink[] }>({ nodes: [], links: [] })

  const fetchGraph = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: projs } = await supabase.from('projects')
      .select('id, name, domains')
      .eq('user_id', session.user.id) // SECURITY FIX: Isolation

    if (!projs) return

    const nodes: GraphNode[] = projs.map(p => ({
      id: p.id,
      name: p.name,
      domains: p.domains || [],
      x: 0, y: 0, z: 0
    }))

    const links: GraphLink[] = []

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const shared = nodes[i].domains.filter(d => nodes[j].domains.includes(d))
        if (shared.length > 0) {
          links.push({ source: nodes[i].id, target: nodes[j].id })
        }
      }
    }

    setData({ nodes, links })
  }, [supabase])

  useEffect(() => { fetchGraph() }, [fetchGraph])

  return (
    <div className="w-full h-full bg-black">
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        backgroundColor="#000000"
        nodeColor={() => "#ffffff"}
        nodeRelSize={4}
        linkColor={() => "#ffffff"} // WHITE LINES as requested
        linkWidth={0.5}
        showNavInfo={false}
        nodeLabel="name"
      />
    </div>
  )
}