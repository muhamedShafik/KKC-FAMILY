import { useState } from 'react';
import { BookOpen, Calendar, ChevronRight } from 'lucide-react';
import { useHistory } from '@/hooks/useFamily';
import { EmptyState, SectionHeader, Skeleton, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { FamilyHistoryEntry, EventType } from '@/types';

const EVENT_COLORS: Record<EventType, string> = {
  birth: 'bg-green-100 text-green-800',
  death: 'bg-stone-100 text-stone-700',
  marriage: 'bg-pink-100 text-pink-800',
  achievement: 'bg-blue-100 text-blue-800',
  migration: 'bg-purple-100 text-purple-800',
  other: 'bg-amber-100 text-amber-800',
};

const EVENT_LABELS: Record<EventType, string> = {
  birth: 'Birth', death: 'Passing', marriage: 'Marriage',
  achievement: 'Achievement', migration: 'Migration', other: 'Event',
};

function HistoryCard({ entry, index }: { entry: FamilyHistoryEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -24 : 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className={`flex gap-8 ${index % 2 !== 0 ? 'flex-row-reverse' : ''}`}
    >
      {/* Timeline dot */}
      <div className="hidden md:flex flex-col items-center flex-shrink-0">
        <div className="w-4 h-4 rounded-full bg-amber-400 ring-4 ring-amber-100 z-10" />
        <div className="flex-1 w-0.5 bg-amber-200 mt-2" />
      </div>

      {/* Card */}
      <div className="flex-1 pb-10">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
          {entry.image_url && (
            <div className="aspect-video overflow-hidden">
              <img src={entry.image_url} alt={entry.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${EVENT_COLORS[entry.event_type]}`}>
                {EVENT_LABELS[entry.event_type]}
              </span>
              {entry.event_date && (
                <span className="flex items-center gap-1 text-xs text-stone-400">
                  <Calendar className="w-3 h-3" /> {formatDate(entry.event_date, 'yyyy')}
                </span>
              )}
            </div>
            <h3 className="font-serif text-xl font-semibold text-stone-900 mb-3">{entry.title}</h3>
            <div
              className="prose prose-sm text-stone-600 max-w-none"
              dangerouslySetInnerHTML={{ __html: entry.content.replace(/\n/g, '<br/>') }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function FamilyHistoryPage() {
  const { data: entries = [], isLoading } = useHistory();
  const [filter, setFilter] = useState<EventType | ''>('');

  const filtered = filter ? entries.filter(e => e.event_type === filter) : entries;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        title="Family History"
        subtitle="Stories, milestones, traditions, and important events that shaped the KKKC family."
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-10">
        {(['', 'birth', 'marriage', 'achievement', 'migration', 'other'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilter(type as EventType | '')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === type
                ? 'bg-amber-500 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-800'
            }`}
          >
            {type === '' ? 'All' : EVENT_LABELS[type as EventType]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={filter ? 'No entries for this category' : 'No history entries yet'}
          description="Family administrators can add stories and milestones in the admin area."
        />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute hidden md:block left-[7.5px] top-2 bottom-0 w-0.5 bg-amber-200" />
          <div className="space-y-0">
            {filtered.map((entry, i) => (
              <HistoryCard key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


