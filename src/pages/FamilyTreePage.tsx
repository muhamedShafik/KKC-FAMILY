import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize, ChevronDown, ChevronRight, User, X } from 'lucide-react';
import { useFamilyTree } from '@/hooks/useFamily';
import { Avatar, EmptyState, Button, Badge } from '@/components/ui';
import type { TreeNode } from '@/types';
import { formatDate, calcAge, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ── Individual tree node card ──────────────────────────────────
function MemberCard({
  node, isRoot = false, onSelect,
}: {
  node: TreeNode; isRoot?: boolean; onSelect: (n: TreeNode) => void;
}) {
  const age = node.dod ? null : calcAge(node.dob);
  const isDeceased = !!node.dod;

  return (
    <button
      onClick={() => onSelect(node)}
      className={cn(
        'flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200 group',
        'hover:bg-amber-50 hover:shadow-md border-2 bg-white text-center w-28 md:w-32',
        isRoot ? 'border-amber-400 shadow-md' : 'border-transparent hover:border-amber-200',
        isDeceased && 'opacity-80',
      )}
    >
      <div className="relative">
        <Avatar
          name={node.name}
          src={node.profile_photo_url}
          size="lg"
          className={cn(
            'ring-2 ring-offset-2',
            isRoot ? 'ring-amber-400' : 'ring-stone-200 group-hover:ring-amber-300',
            isDeceased && 'grayscale',
          )}
        />
        {isDeceased && (
          <span className="absolute -bottom-1 -right-1 bg-stone-500 text-white text-[8px] px-1 rounded-full">†</span>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-stone-900 leading-tight line-clamp-2">{node.name}</p>
        {age !== null && <p className="text-[10px] text-stone-400">Age {age}</p>}
        {isDeceased && <p className="text-[10px] text-stone-400">{formatDate(node.dob, 'yyyy')} – {formatDate(node.dod, 'yyyy')}</p>}
      </div>
    </button>
  );
}

// ── Couple node (member + spouse side by side) ─────────────────
function CoupleNode({
  node, onSelect, isRoot,
}: {
  node: TreeNode; onSelect: (n: TreeNode) => void; isRoot?: boolean;
}) {
  return (
    <div className="flex items-start gap-1">
      <MemberCard node={node} isRoot={isRoot} onSelect={onSelect} />
      {node.spouses.map((spouse) => (
        <div key={spouse.id} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <div className="w-6 h-0.5 bg-amber-300" />
            <span className="text-[8px] text-amber-500 font-medium">♥</span>
          </div>
          <MemberCard node={spouse} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}

// ── Recursive tree renderer ────────────────────────────────────
function TreeBranch({
  node, depth = 0, onSelect, isRoot = false,
}: {
  node: TreeNode; depth?: number; onSelect: (n: TreeNode) => void; isRoot?: boolean;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* This node */}
      <CoupleNode node={node} onSelect={onSelect} isRoot={isRoot} />

      {/* Expand toggle */}
      {hasChildren && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-1 w-5 h-5 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-700 transition-colors z-10"
          title={expanded ? 'Collapse' : 'Expand children'}
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      )}

      {/* Children */}
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-visible"
          >
            {/* Vertical line */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-amber-300" />
            </div>

            {/* Horizontal bracket */}
            {node.children.length > 1 && (
              <div className="relative">
                <div
                  className="h-0.5 bg-amber-300"
                  style={{ width: `${(node.children.length - 1) * 100}%`, margin: '0 auto' }}
                />
              </div>
            )}

            {/* Children row */}
            <div className="flex gap-4 md:gap-6 items-start mt-0">
              {node.children.map((child, i) => (
                <div key={child.id} className="flex flex-col items-center">
                  {node.children.length > 1 && (
                    <div className="w-0.5 h-4 bg-amber-300" />
                  )}
                  <TreeBranch
                    node={child}
                    depth={depth + 1}
                    onSelect={onSelect}
                  />
                </div>
              ))}
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
        {/* Dates */}
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

        {/* Generation */}
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <span className="font-medium">Generation:</span>
          <Badge variant="stone">Gen {node.generation}</Badge>
        </div>

        {/* Spouse */}
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

        {/* Children */}
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
  const { data: tree, isLoading, error } = useFamilyTree();
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const transformRef = useRef<any>(null);

  const handleSelect = useCallback((node: TreeNode) => {
    setSelected(node);
  }, []);

  return (
    <div className="min-h-screen bg-amber-50/30">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <p className="text-amber-600 text-sm font-medium uppercase tracking-widest mb-2">Our Roots</p>
          <h1 className="font-serif text-4xl font-bold text-stone-900 mb-3">Family Tree</h1>
          <p className="text-stone-500 max-w-lg">
            Explore the KKC family tree. Click any member to view their profile. Use pinch-to-zoom on mobile, or the controls below.
          </p>
        </div>

        {/* Controls hint */}
        <div className="flex flex-wrap gap-2 text-xs text-stone-500 mb-6">
          <span className="bg-white border border-stone-200 rounded-full px-3 py-1">🖱 Scroll to zoom</span>
          <span className="bg-white border border-stone-200 rounded-full px-3 py-1">🤚 Drag to pan</span>
          <span className="bg-white border border-stone-200 rounded-full px-3 py-1">👆 Click a member to open profile</span>
          <span className="bg-white border border-stone-200 rounded-full px-3 py-1">▼ Arrow expands children</span>
        </div>
      </div>

      {/* Tree canvas */}
      <div className="relative mx-4 rounded-2xl bg-white shadow-sm border border-stone-100 overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: 400 }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-stone-500">Building family tree…</p>
            </div>
          </div>
        )}

        {!isLoading && !tree && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <EmptyState
              icon={User}
              title="Family tree not initialized yet"
              description="Start the KKC family tree by adding the first family head and their partner."
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
            initialScale={0.8}
            minScale={0.3}
            maxScale={2.5}
            centerOnInit
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Zoom controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                  <button
                    onClick={() => zoomIn()}
                    className="w-9 h-9 bg-white rounded-lg shadow-sm border border-stone-200 flex items-center justify-center hover:bg-amber-50 transition-colors"
                  >
                    <ZoomIn className="w-4 h-4 text-stone-600" />
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className="w-9 h-9 bg-white rounded-lg shadow-sm border border-stone-200 flex items-center justify-center hover:bg-amber-50 transition-colors"
                  >
                    <ZoomOut className="w-4 h-4 text-stone-600" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="w-9 h-9 bg-white rounded-lg shadow-sm border border-stone-200 flex items-center justify-center hover:bg-amber-50 transition-colors"
                  >
                    <Maximize className="w-4 h-4 text-stone-600" />
                  </button>
                </div>

                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ padding: '80px 120px' }}
                >
                  <TreeBranch node={tree} onSelect={handleSelect} isRoot />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}
      </div>

      {/* Profile panel */}
      <AnimatePresence>
        {selected && (
          <ProfilePanel node={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

