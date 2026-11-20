import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  ZoomIn, ZoomOut, Maximize, ChevronDown, ChevronRight,
  User, X, Search, Sparkles, Layers, RotateCcw
} from 'lucide-react';
import { useFamilyTree, usePrefetchMember } from '@/hooks/useFamily';
import { Avatar, EmptyState, Button, Badge } from '@/components/ui';
import type { TreeNode } from '@/types';
import { formatDate, calcAge, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ── Individual tree node card ──────────────────────────────────
function MemberCard({
  node, isRoot = false, isHighlighted = false, onSelect,
}: {
  node: TreeNode; isRoot?: boolean; isHighlighted?: boolean; onSelect: (n: TreeNode) => void;
}) {
  const age = node.dod ? null : calcAge(node.dob);
  const isDeceased = !!node.dod;

  return (
    <button
      onClick={() => onSelect(node)}
      className={cn(
        'flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all duration-200 group relative',
        'hover:bg-amber-50 hover:shadow-md border-2 bg-white text-center w-28 md:w-32',
        isHighlighted
          ? 'ring-4 ring-amber-400 border-amber-500 shadow-xl scale-105 bg-amber-50/50'
          : isRoot
          ? 'border-amber-400 shadow-md ring-2 ring-amber-200'
          : 'border-stone-200/80 hover:border-amber-300',
        isDeceased && 'opacity-85',
      )}
    >
      <div className="relative">
        <Avatar
          name={node.name}
          src={node.profile_photo_url}
          size="lg"
          className={cn(
            'ring-2 ring-offset-2',
            isHighlighted ? 'ring-amber-500' : isRoot ? 'ring-amber-400' : 'ring-stone-200 group-hover:ring-amber-300',
            isDeceased && 'grayscale',
          )}
        />
        {isDeceased && (
          <span className="absolute -bottom-1 -right-1 bg-stone-600 text-white text-[8px] px-1 rounded-full font-serif leading-tight">
            †
          </span>
        )}
      </div>
      <div className="w-full">
        <p className="text-xs font-semibold text-stone-900 leading-tight line-clamp-2">{node.name}</p>
        {node.branch && (
          <p className="text-[9px] text-amber-700/80 font-medium truncate mt-0.5">{node.branch}</p>
        )}
        {age !== null && <p className="text-[10px] text-stone-400">Age {age}</p>}
        {isDeceased && (
          <p className="text-[10px] text-stone-400">
            {formatDate(node.dob, 'yyyy')} – {formatDate(node.dod, 'yyyy')}
          </p>
        )}
      </div>
    </button>
  );
}

// ── Couple node (member + spouses side by side) ────────────────
function CoupleNode({
  node, onSelect, isRoot, highlightedId,
}: {
  node: TreeNode; onSelect: (n: TreeNode) => void; isRoot?: boolean; highlightedId?: string | null;
}) {
  return (
    <div className="flex items-start gap-1 z-10">
      <MemberCard
        node={node}
        isRoot={isRoot}
        isHighlighted={highlightedId === node.id}
        onSelect={onSelect}
      />
      {node.spouses.map((spouse) => (
        <div key={spouse.id} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <div className="w-5 h-0.5 bg-amber-400" />
            <span className="text-[8px] text-amber-500 font-medium leading-none my-0.5">♥</span>
          </div>
          <MemberCard
            node={spouse}
            isHighlighted={highlightedId === spouse.id}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  );
}

// ── Recursive tree renderer ────────────────────────────────────
function TreeBranch({
  node, depth = 0, onSelect, isRoot = false, globalExpandDepth, highlightedId,
}: {
  node: TreeNode;
  depth?: number;
  onSelect: (n: TreeNode) => void;
  isRoot?: boolean;
  globalExpandDepth: number;
  highlightedId?: string | null;
}) {
  const [expanded, setExpanded] = useState<boolean>(depth < globalExpandDepth);
  const hasChildren = node.children.length > 0;

  // Sync with global expand/collapse controls
  useEffect(() => {
    setExpanded(depth < globalExpandDepth);
  }, [globalExpandDepth, depth]);

  return (
    <div className="flex flex-col items-center">
      {/* Node / Couple */}
      <CoupleNode
        node={node}
        onSelect={onSelect}
        isRoot={isRoot}
        highlightedId={highlightedId}
      />

      {/* Expand / Collapse badge */}
      {hasChildren && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-1.5 px-2 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[10px] font-semibold text-amber-800 transition-colors shadow-xs z-10 flex items-center gap-1 cursor-pointer"
          title={expanded ? 'Collapse branch' : 'Expand children'}
        >
          {expanded ? (
            <>
              <ChevronDown className="w-3 h-3 text-amber-700" />
              <span>Hide ({node.children.length})</span>
            </>
          ) : (
            <>
              <ChevronRight className="w-3 h-3 text-amber-700" />
              <span>+ {node.children.length} {node.children.length === 1 ? 'child' : 'children'}</span>
            </>
          )}
        </button>
      )}

      {/* Children branches */}
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            {/* Top vertical connector from parent */}
            <div className="w-0.5 h-6 bg-amber-400" />

            {/* Children Row with continuous CSS bracket */}
            <div className="flex gap-4 md:gap-8 items-start">
              {node.children.map((child, i) => {
                const isFirst = i === 0;
                const isLast = i === node.children.length - 1;
                const isOnly = node.children.length === 1;

                return (
                  <div key={child.id} className="flex flex-col items-center relative">
                    {/* Horizontal connector line */}
                    {!isOnly && (
                      <div
                        className={cn(
                          'absolute top-0 h-0.5 bg-amber-400',
                          isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'
                        )}
                      />
                    )}
                    {/* Vertical drop line down to this child */}
                    <div className="w-0.5 h-6 bg-amber-400" />

                    <TreeBranch
                      node={child}
                      depth={depth + 1}
                      onSelect={onSelect}
                      globalExpandDepth={globalExpandDepth}
                      highlightedId={highlightedId}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Profile Side Panel ─────────────────────────────────────────
function ProfilePanel({ node, onClose }: { node: TreeNode; onClose: () => void }) {
  const age = calcAge(node.dob, node.dod);
  const isDeceased = !!node.dod;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-16 bottom-0 w-full sm:w-80 lg:w-96 bg-white shadow-2xl z-30 overflow-y-auto border-l border-stone-100"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-800 to-amber-900 p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col items-center text-center">
          <Avatar
            name={node.name}
            src={node.profile_photo_url}
            size="2xl"
            className={cn('ring-3 ring-amber-400 ring-offset-2 ring-offset-stone-800 mb-3', isDeceased && 'grayscale')}
          />
          <h2 className="font-serif text-2xl font-bold mb-1">{node.name}</h2>
          {node.branch && <Badge variant="amber" className="bg-amber-500/30 text-amber-200 border-0">{node.branch}</Badge>}
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {node.dob && (
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-stone-500 mb-0.5">Born</p>
              <p className="font-medium text-stone-900 text-sm">{formatDate(node.dob)}</p>
              {age !== null && <p className="text-xs text-amber-700">Age {age}</p>}
            </div>
          )}
          {node.dod && (
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-xs text-stone-500 mb-0.5">Passed Away</p>
              <p className="font-medium text-stone-900 text-sm">{formatDate(node.dod)}</p>
            </div>
          )}
        </div>

        {/* <div className="flex items-center gap-2 text-sm text-stone-600">
          <span className="font-medium">Generation:</span>
          <Badge variant="stone">Gen {node.generation}</Badge>
        </div> */}

        {node.spouses.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
              {node.spouses.length === 1 ? 'Spouse' : 'Spouses'}
            </p>
            <div className="space-y-2">
              {node.spouses.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <Avatar name={s.name} src={s.profile_photo_url} size="sm" />
                  <span className="text-sm font-medium text-stone-800">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {node.children.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
              Children ({node.children.length})
            </p>
            <div className="space-y-2">
              {node.children.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <Avatar name={c.name} src={c.profile_photo_url} size="sm" />
                  <span className="text-sm font-medium text-stone-800">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-stone-100">
          <Link to={`/members/${node.id}`}>
            <Button variant="primary" className="w-full">
              <User className="w-4 h-4" /> View Full Profile
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function FamilyTreePage() {
  const { data: tree, isLoading, refetch } = useFamilyTree();
  const prefetchMember = usePrefetchMember();
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [globalExpandDepth, setGlobalExpandDepth] = useState<number>(999);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const transformRef = useRef<any>(null);

  // Flatten the tree into an indexed list for fast search (supports 2000+ members)
  const allTreeMembers = useMemo(() => {
    if (!tree) return [];
    const list: TreeNode[] = [];
    const traverse = (node: TreeNode) => {
      list.push(node);
      node.spouses.forEach(s => list.push(s));
      node.children.forEach(c => traverse(c));
    };
    traverse(tree);
    return list;
  }, [tree]);

  // Tree stats calculation
  // const stats = useMemo(() => {
  //   if (!allTreeMembers.length) return { count: 0, maxGen: 1 };
  //   const maxGen = Math.max(...allTreeMembers.map(m => m.generation ?? 1));
  //   return { count: allTreeMembers.length, maxGen };
  // }, [allTreeMembers]);

  // Filtered members for search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allTreeMembers.filter(m => m.name.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, allTreeMembers]);

  const handleSelectMember = useCallback((node: TreeNode) => {
    setSelected(node);
    setHighlightedId(node.id);
    prefetchMember(node.id);
  }, [prefetchMember]);

  const handleSearchSelect = (node: TreeNode) => {
    setSearchQuery('');
    setHighlightedId(node.id);
    setSelected(node);
    prefetchMember(node.id);
    // Expand tree to show this node
    // setGlobalExpandDepth(Math.max(globalExpandDepth, (node.generation ?? 1) + 1));
  };

  return (
    <div className="min-h-screen bg-stone-50/60 pb-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Ancestral Lineage
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">Interactive Family Tree</h1>
            <p className="text-stone-500 text-sm mt-1 max-w-xl">
              Explore the KKKC lineage from our founding roots across all generations. Drag to pan, scroll to zoom, or search any member.
            </p>
          </div>

          {/* Quick Stats */}
          {tree && (
            <div className="flex items-center gap-3">
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                  🌳
                </div>
                <div>
                  <p className="text-xs text-stone-400 uppercase font-semibold">Total Tree</p>
                  {/* <p className="text-sm font-bold text-stone-900">
                    {stats.count.toLocaleString()} Members · Gen 1 to {stats.maxGen}
                  </p> */}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: Search & Depth Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200/80 shadow-xs">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name in the family tree..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
            />
            {/* Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-stone-200 shadow-xl z-50 overflow-hidden divide-y divide-stone-100 max-h-72 overflow-y-auto">
                {searchResults.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSearchSelect(m)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-amber-50/60 transition-colors text-left"
                  >
                    <Avatar name={m.name} src={m.profile_photo_url} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-900 truncate">{m.name}</p>
                      {/* <p className="text-[10px] text-stone-400">
                        Gen {m.generation || 1} {m.branch ? `· ${m.branch}` : ''}
                      </p> */}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Depth / Expand Controls */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-stone-400 font-medium text-xs hidden lg:inline flex-items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> View:
            </span>
            <button
              onClick={() => setGlobalExpandDepth(2)}
              className={cn(
                'px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer',
                globalExpandDepth === 2 ? 'bg-amber-500 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              )}
            >
              Gen 1–2
            </button>
            <button
              onClick={() => setGlobalExpandDepth(3)}
              className={cn(
                'px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer',
                globalExpandDepth === 3 ? 'bg-amber-500 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              )}
            >
              Gen 1–3
            </button>
            <button
              onClick={() => setGlobalExpandDepth(10)}
              className={cn(
                'px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer',
                globalExpandDepth >= 10 ? 'bg-amber-500 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              )}
            >
              Expand All
            </button>
            <button
              onClick={() => {
                setGlobalExpandDepth(1);
                setHighlightedId(null);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Collapse to Root"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Tree canvas */}
      <div className="relative mx-4 sm:mx-8 rounded-3xl bg-white shadow-sm border border-stone-200/80 overflow-hidden" style={{ height: 'calc(100vh - 270px)', minHeight: 480 }}>
        {isLoading && !tree && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-9 h-9 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-stone-600">Loading family tree...</p>
            </div>
          </div>
        )}

        {!isLoading && !tree && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <EmptyState
              icon={User}
              title="Family tree not initialized yet"
              description="Start the KKKC family tree by adding the first family head and their partner."
              action={
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link to="/admin/setup-founders">
                    <Button variant="primary">Setup First Family Head & Partner</Button>
                  </Link>
                  <Link to="/admin/members/add">
                    <Button variant="outline">Add Individual Member</Button>
                  </Link>
                </div>
              }
            />
          </div>
        )}

        {tree && (
          <TransformWrapper
            ref={transformRef}
            initialScale={0.75}
            minScale={0.2}
            maxScale={2.5}
            centerOnInit
            limitToBounds={false}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Floating Zoom Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20 bg-white/90 backdrop-blur-xs p-1.5 rounded-2xl shadow-md border border-stone-200/80">
                  <button
                    onClick={() => zoomIn()}
                    className="w-8 h-8 rounded-xl hover:bg-amber-50 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className="w-8 h-8 rounded-xl hover:bg-amber-50 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <div className="h-px bg-stone-200 my-0.5" />
                  <button
                    onClick={() => resetTransform()}
                    className="w-8 h-8 rounded-xl hover:bg-amber-50 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="Center on Root"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>

                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ padding: '80px 140px', minWidth: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  <TreeBranch
                    node={tree}
                    onSelect={handleSelectMember}
                    isRoot
                    globalExpandDepth={globalExpandDepth}
                    highlightedId={highlightedId}
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}
      </div>

      {/* Profile side panel */}
      <AnimatePresence>
        {selected && (
          <ProfilePanel node={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}


