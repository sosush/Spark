'use client'
import { useEffect, useState, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  ArrowLeft, Code2, Globe, Brain,
  Loader2, RefreshCw, Save, FileCode, FolderTree,
  ChevronRight, ChevronDown, File, Folder, Edit3, Check, X, Link as LinkIcon,
  Bold, Italic, Heading1, List
} from 'lucide-react'
import SparkLogo from '@/components/SparkLogo'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/Toast'

const supabase = createClient()

interface TreeItem {
  path: string
  type: 'blob' | 'tree'
}

function FileTreeNode({ item, depth = 0 }: { item: TreeItem & { children?: TreeItem[] }; depth?: number }) {
  const [open, setOpen] = useState(depth < 2)
  const isFolder = item.type === 'tree'
  const name = item.path.split('/').pop() || item.path

  if (isFolder && item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 py-1 px-2 w-full text-left hover:bg-white/5 rounded-lg transition-colors group"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {open ? <ChevronDown size={12} className="text-zinc-500" /> : <ChevronRight size={12} className="text-zinc-500" />}
          <Folder size={14} className="text-indigo-400" />
          <span className="text-sm text-zinc-300 font-medium group-hover:text-white transition-colors">{name}</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {item.children.map((child, i) => (
                <FileTreeNode key={child.path + i} item={child} depth={depth + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2 py-1 px-2 hover:bg-white/5 rounded-lg transition-colors"
      style={{ paddingLeft: `${depth * 16 + 28}px` }}
    >
      <File size={13} className="text-zinc-500" />
      <span className="text-sm text-zinc-400 font-light">{name}</span>
    </div>
  )
}

function buildTree(items: TreeItem[]): (TreeItem & { children?: TreeItem[] })[] {
  const root: (TreeItem & { children?: TreeItem[] })[] = []
  const map = new Map<string, TreeItem & { children?: TreeItem[] }>()

  // Sort: folders first, then files
  const sorted = [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
    return a.path.localeCompare(b.path)
  })

  for (const item of sorted) {
    const parts = item.path.split('/')
    if (parts.length === 1) {
      const node = { ...item, children: item.type === 'tree' ? [] : undefined }
      map.set(item.path, node)
      root.push(node)
    } else {
      const parentPath = parts.slice(0, -1).join('/')
      const parent = map.get(parentPath)
      const node = { ...item, path: item.path, children: item.type === 'tree' ? [] : undefined }
      map.set(item.path, node)
      if (parent && parent.children) {
        parent.children.push(node)
      } else {
        root.push(node)
      }
    }
  }

  return root
}

export default function ProjectDeepDive({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()

  const [p, setP] = useState<any>(null)
  const [loadingAi, setLoadingAi] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingUrl, setEditingUrl] = useState(false)
  const [tempUrl, setTempUrl] = useState('')
  const [fileTree, setFileTree] = useState<TreeItem[]>([])
  const [loadingTree, setLoadingTree] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single()
      setP(data)
      if (data?.file_tree) setFileTree(data.file_tree)
    }
    load()
  }, [id])

  const saveChanges = async () => {
    setIsSaving(true)
    const { error } = await supabase.from('projects').update({
      name: p.name,
      readme: p.readme,
      scratchpad: p.scratchpad,
      github_link: p.github_link,
    }).eq('id', id)
    if (!error) {
      setIsSaving(false)
      setEditMode(false)
    }
  }

  const injectMarkdown = (field: 'readme' | 'scratchpad', prefix: string, suffix: string = '') => {
    const el = document.getElementById(`${field}-editor`) as HTMLTextAreaElement;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = p[field] || '';
    
    const selectedText = start !== end ? text.substring(start, end) : 'text';
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    
    setP({ ...p, [field]: newText });
    
    setTimeout(() => {
      el.selectionStart = start + prefix.length;
      el.selectionEnd = start + prefix.length + selectedText.length;
      el.focus();
    }, 0);
  }

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, field: 'readme' | 'scratchpad') => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'i')) {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      if (start === end) return; // No text selected

      const text = p[field] || '';
      const marker = e.key === 'b' ? '**' : '*';

      const newText = text.substring(0, start) + marker + text.substring(start, end) + marker + text.substring(end);
      setP({ ...p, [field]: newText });
      
      // Keep selection after react re-renders
      setTimeout(() => {
        target.selectionStart = start + marker.length;
        target.selectionEnd = end + marker.length;
        target.focus();
      }, 0);
    }
  }

  const MarkdownToolbar = ({ field }: { field: 'readme' | 'scratchpad' }) => (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 backdrop-blur-xl shadow-2xl">
      <button onClick={() => injectMarkdown(field, '**', '**')} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors" title="Bold"><Bold size={14} /></button>
      <button onClick={() => injectMarkdown(field, '*', '*')} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors" title="Italic"><Italic size={14} /></button>
      <div className="w-px h-4 bg-white/10 mx-1" />
      <button onClick={() => injectMarkdown(field, '# ', '')} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors" title="Heading"><Heading1 size={14} /></button>
      <button onClick={() => injectMarkdown(field, '- ', '')} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors" title="Bullet List"><List size={14} /></button>
    </div>
  )

  const saveUrl = async () => {
    const { error } = await supabase.from('projects').update({ github_link: tempUrl }).eq('id', id)
    if (!error) {
      setP({ ...p, github_link: tempUrl })
      setEditingUrl(false)
      toast('Repository URL updated', 'success')
    }
  }

  const fetchFileTree = async () => {
    if (!p?.github_link) { toast('No GitHub URL set. Add one first.', 'error'); return }
    setLoadingTree(true)

    const { data: { session } } = await supabase.auth.getSession()

    try {
      // Extract owner/repo from GitHub URL
      const match = p.github_link.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (!match) { toast('Invalid GitHub URL format.', 'error'); setLoadingTree(false); return }
      const [, owner, repo] = match

      const headers: any = {}
      if (session?.provider_token) {
        headers['Authorization'] = `Bearer ${session.provider_token}`
      }

      // Try main branch first, fall back to master
      let res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, { headers })
      if (!res.ok) {
        res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, { headers })
      }

      if (res.ok) {
        const data = await res.json()
        const items: TreeItem[] = (data.tree || [])
          .filter((t: any) => !t.path.startsWith('.') && !t.path.includes('node_modules'))
          .map((t: any) => ({ path: t.path, type: t.type === 'tree' ? 'tree' : 'blob' }))
        setFileTree(items)

        // Cache in DB
        await supabase.from('projects').update({ file_tree: items }).eq('id', id)
        toast('File tree synced!', 'success')
      } else {
        toast('Could not fetch file tree. Check the repository or your permissions.', 'error')
      }
    } catch (e) {
      toast('Failed to fetch file tree.', 'error')
    }
    setLoadingTree(false)
  }

  const askAI = async (task: 'improve' | 'readme') => {
    setLoadingAi(task)
    try {
      const res = await fetch(`http://localhost:8000/${task}/${id}`)
      const data = await res.json()
      const field = task === 'improve' ? 'ai_report' : 'readme'
      await supabase.from('projects').update({ [field]: data.result }).eq('id', id)
      setP({ ...p, [field]: data.result })
    } catch (e) { toast('AI Brain is offline. Start the backend server.', 'error') }
    setLoadingAi(null)
  }

  if (!p) return <div className="h-screen flex items-center justify-center font-mono text-indigo-500 animate-pulse uppercase tracking-[1em]">decrypting_manifest...</div>

  const treeData = buildTree(fileTree)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1200px] mx-auto py-12 px-6 space-y-12 pb-40">

      {/* 1. TOP NAVIGATION & GLOBAL ACTIONS */}
      <div className="flex justify-between items-center">
        <Link href="/projects" className="inline-flex items-center gap-2 text-zinc-400 hover:text-indigo-400 transition text-sm font-medium group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> Back to Projects
        </Link>
        <div className="flex gap-3">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-6 py-3 rounded-full font-medium text-sm transition-all ${editMode ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300' : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'}`}
          >
            {editMode ? 'Preview' : 'Edit Document'}
          </button>
          <button
            onClick={saveChanges}
            disabled={isSaving}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin text-indigo-400"/> : <Save size={14} className="text-zinc-400"/>} Save
          </button>
        </div>
      </div>

      {/* 2. HEADER: EDITABLE TITLE, DOMAINS & REPO URL */}
      <header className="space-y-6">
        {editMode ? (
          <input
            value={p.name}
            onChange={(e) => setP({...p, name: e.target.value})}
            className="text-5xl md:text-6xl font-medium tracking-tight text-white bg-white/5 border border-white/10 rounded-2xl outline-none w-full p-4"
          />
        ) : (
          <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-white smooth-text break-words">
            {p.name}
          </h1>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {p.domains?.map((d: string) => (
            <span key={d} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-zinc-300 backdrop-blur-md">
              {d}
            </span>
          ))}
          {(!p.domains || p.domains.length === 0) && <span className="text-xs text-zinc-500 font-light">No domains assigned</span>}
        </div>

        {/* Repo URL — editable */}
        <div className="flex items-center gap-3 pt-2">
          <LinkIcon size={14} className="text-zinc-500" />
          {editingUrl ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white outline-none focus:border-indigo-500/50 backdrop-blur-md transition-colors"
              />
              <button onClick={saveUrl} className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                <Check size={14} />
              </button>
              <button onClick={() => setEditingUrl(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {p.github_link ? (
                <a href={p.github_link} target="_blank" className="flex items-center gap-2 text-sm text-indigo-400 hover:text-white transition-colors font-medium">
                  <Code2 size={16}/> Repository
                </a>
              ) : (
                <span className="text-sm text-zinc-500 font-light">No repository linked</span>
              )}
              <button
                onClick={() => { setTempUrl(p.github_link || ''); setEditingUrl(true) }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
              >
                <Edit3 size={12} />
              </button>
              {p.hosted_url && <a href={p.hosted_url} target="_blank" className="flex items-center gap-2 text-sm text-emerald-400 hover:text-white transition-colors font-medium"><Globe size={16}/> Live Site</a>}
            </div>
          )}
        </div>
      </header>

      {/* 3. FILE TREE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-medium text-zinc-400">
            <FolderTree size={16} className="text-teal-400" /> Repository Structure
          </div>
          <button
            onClick={fetchFileTree}
            disabled={loadingTree}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loadingTree ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {fileTree.length > 0 ? 'Refresh' : 'Fetch Tree'}
          </button>
        </div>

        <div className="ethereal-island p-6 max-h-[500px] overflow-y-auto scrollbar-hide">
          {treeData.length > 0 ? (
            <div className="space-y-0.5">
              {treeData.map((item, i) => (
                <FileTreeNode key={item.path + i} item={item} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 font-light text-sm">
              {p.github_link
                ? 'Click "Fetch Tree" to load the repository structure.'
                : 'Add a GitHub repository URL first to view the file tree.'}
            </div>
          )}
        </div>
      </section>

      {/* 4. MAIN DOCUMENTATION (Full Width) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-400">
          <FileCode size={16}/> Project Documentation
        </div>

        <div className="ethereal-island overflow-hidden min-h-[400px] relative">
          {editMode ? (
            <>
              <MarkdownToolbar field="readme" />
              <textarea
                id="readme-editor"
                value={p.readme || ''}
                onChange={(e) => setP({...p, readme: e.target.value})}
                onKeyDown={(e) => handleEditorKeyDown(e, 'readme')}
                className="w-full h-[600px] bg-transparent p-12 text-sm text-zinc-300 outline-none transition-all resize-none leading-relaxed relative z-10 block"
                placeholder="Paste Markdown content here (Supports CMD+B, CMD+I)..."
              />
            </>
          ) : (
            <div className="p-12 md:p-16">
              <article className="prose prose-invert prose-indigo max-w-none
                prose-p:text-zinc-400 prose-p:text-base prose-p:leading-relaxed prose-p:font-light
                prose-headings:text-white prose-headings:font-medium prose-headings:tracking-tight
                prose-pre:bg-black/40 prose-pre:p-8 prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/5
                prose-code:text-indigo-400 prose-img:rounded-2xl prose-table:border-white/5
                prose-strong:text-white prose-strong:font-semibold">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {p.readme || "_No documentation provided._"}
                </ReactMarkdown>
              </article>
            </div>
          )}
        </div>
      </section>

      {/* 5. AI ACTION CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => askAI('readme')} disabled={!!loadingAi} className="py-5 px-8 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full font-medium text-sm flex items-center justify-center gap-3 hover:bg-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 backdrop-blur-md">
          {loadingAi === 'readme' ? <RefreshCw className="animate-spin" size={16}/> : <Brain size={18}/>}
          AI Rewrite Documentation
        </button>
        <button onClick={() => askAI('improve')} disabled={!!loadingAi} className="py-5 px-8 bg-white/5 border border-white/10 text-white rounded-full font-medium text-sm flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-50 backdrop-blur-md">
          {loadingAi === 'improve' ? <RefreshCw className="animate-spin" size={16}/> : <SparkLogo size={18} className="text-amber-200"/>}
          AI Generate Feedback
        </button>
      </div>

      {/* 6. INTELLIGENCE FEEDBACK */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-sm font-medium text-indigo-400">
          <Brain size={16}/> Intelligence Report
        </div>
        <div className="ethereal-island p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] opacity-30 mix-blend-screen pointer-events-none" />
          <div className="prose prose-invert max-w-none prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:font-light prose-headings:text-white prose-headings:font-medium prose-strong:text-white prose-strong:font-semibold relative z-10">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {p.ai_report || "_Architecture analysis not initialized. Use the AI Feedback button above to generate a report._"}
            </ReactMarkdown>
          </div>
        </div>
      </section>

      {/* 7. STRATEGIC SCRATCHPAD */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-sm font-medium text-amber-400">
          <Edit3 size={16}/> Strategic Scratchpad
        </div>

        <div className="ethereal-island overflow-hidden min-h-[300px] border-amber-500/10 relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] group-hover:bg-amber-500/10 transition-colors pointer-events-none mix-blend-screen" />
          
          {editMode ? (
            <>
              <MarkdownToolbar field="scratchpad" />
              <textarea
                id="scratchpad-editor"
                value={p.scratchpad || ''}
                onChange={(e) => setP({...p, scratchpad: e.target.value})}
                onKeyDown={(e) => handleEditorKeyDown(e, 'scratchpad')}
                className="w-full h-[400px] bg-transparent p-12 text-sm text-amber-100/70 outline-none transition-all resize-none leading-relaxed placeholder:text-amber-500/30 relative z-10"
                placeholder="Jot down features, implementation logs, and master plans (Select text + CMD+B, CMD+I)..."
              />
            </>
          ) : (
            <div className="p-12 md:p-16 relative z-10">
              <article className="prose prose-invert prose-indigo max-w-none
                prose-p:text-amber-100/70 prose-p:text-sm prose-p:leading-relaxed prose-p:font-light
                prose-headings:text-amber-200 prose-headings:font-medium prose-headings:tracking-tight
                prose-pre:bg-black/40 prose-pre:p-6 prose-pre:rounded-2xl prose-pre:border prose-pre:border-amber-500/10
                prose-code:text-amber-400 prose-img:rounded-2xl prose-table:border-white/5
                prose-strong:text-amber-300 prose-strong:font-semibold">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {p.scratchpad || "_Scratchpad empty. Enter edit mode to brainstorm._"}
                </ReactMarkdown>
              </article>
            </div>
          )}
        </div>
      </section>

    </motion.div>
  )
}