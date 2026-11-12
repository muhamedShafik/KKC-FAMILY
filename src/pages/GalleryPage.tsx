import { useState } from 'react';
import { Image, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGallery } from '@/hooks/useFamily';
import { EmptyState, SectionHeader, Skeleton } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { GalleryCategory } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES: { value: GalleryCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'portrait', label: 'Portraits' },
  { value: 'reunion', label: 'Reunions' },
  { value: 'historical', label: 'Historical' },
  { value: 'wedding', label: 'Weddings' },
  { value: 'celebration', label: 'Celebrations' },
  { value: 'other', label: 'Other' },
];

export default function GalleryPage() {
  const { data: items = [], isLoading } = useGallery();
  const [category, setCategory] = useState<GalleryCategory | ''>('');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = category ? items.filter(i => i.category === category) : items;

  const prev = () => setLightbox(l => (l !== null ? Math.max(0, l - 1) : null));
  const next = () => setLightbox(l => (l !== null ? Math.min(filtered.length - 1, l + 1) : null));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        title="Family Gallery"
        subtitle="Portraits, reunions, historical photos and precious family memories."
      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(value as GalleryCategory | '')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === value
                ? 'bg-amber-500 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Image}
          title="No photos yet"
          description="Family administrators can upload photos in the admin gallery."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((item, idx) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setLightbox(idx)}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-stone-100 cursor-pointer"
            >
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 inset-x-0 p-3 text-left">
                  <p className="text-white text-xs font-medium line-clamp-1">{item.title}</p>
                  {item.date_taken && (
                    <p className="text-white/70 text-xs">{formatDate(item.date_taken, 'yyyy')}</p>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && filtered[lightbox] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={e => { e.stopPropagation(); setLightbox(null); }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {lightbox > 0 && (
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <motion.div
              key={lightbox}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-full"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={filtered[lightbox].image_url}
                alt={filtered[lightbox].title}
                className="max-h-[80vh] max-w-full rounded-xl object-contain"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl p-4">
                <p className="text-white font-medium">{filtered[lightbox].title}</p>
                {filtered[lightbox].description && (
                  <p className="text-white/70 text-sm mt-0.5">{filtered[lightbox].description}</p>
                )}
              </div>
            </motion.div>

            {lightbox < filtered.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
              {lightbox + 1} / {filtered.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

