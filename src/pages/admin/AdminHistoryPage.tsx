import { useState } from 'react';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { useHistory, useUpsertHistoryEntry, useDeleteHistoryEntry } from '@/hooks/useFamily';
import { Button, Input, Textarea, Select, EmptyState, Skeleton, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { FamilyHistoryEntry, EventType } from '@/types';
import toast from 'react-hot-toast';

const EVENT_OPTIONS = [
  { value: 'birth', label: 'Birth' },
  { value: 'death', label: 'Passing' },
  { value: 'marriage', label: 'Marriage' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'migration', label: 'Migration' },
  { value: 'other', label: 'Other Event' },
];

function HistoryForm({ entry, onSave, onDelete, onClose }: {
  entry?: Partial<FamilyHistoryEntry>;
  onSave: (data: Partial<FamilyHistoryEntry>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<FamilyHistoryEntry>>({
    title: '', content: '', event_type: 'other', is_published: true, display_order: 0,
    ...entry,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title) { toast.error('Title required'); return; }
    if (!form.content) { toast.error('Content required'); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Input label="Title *" value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. The Family Moves to the City" />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Event Type" options={EVENT_OPTIONS} value={form.event_type ?? 'other'} onChange={e => setForm(f => ({ ...f, event_type: e.target.value as EventType }))} />
        <Input label="Date" type="date" value={form.event_date ?? ''} onChange={e => setForm(f => ({ ...f, event_date: e.target.value || null }))} />
      </div>
      <Textarea label="Story / Content *" value={form.content ?? ''} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} placeholder="Tell the story of this event…" />
      <Input label="Image URL (optional)" value={form.image_url ?? ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value || null }))} placeholder="https://…" />
      <div className="flex items-center gap-2">
        <input type="checkbox" id="pub-hist" checked={form.is_published ?? true} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="rounded" />
        <label htmlFor="pub-hist" className="text-sm text-stone-700">Publish to history section</label>
      </div>
      <div className="flex gap-3 pt-2">
        {entry?.id && onDelete && (
          <Button
            type="button"
            variant="danger"
            onClick={() => onDelete(entry.id!)}
            className="px-3"
            title="Delete this history entry"
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        )}
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={handleSave} loading={saving} className="flex-1">Save Entry</Button>
      </div>
    </div>
  );
}

export default function AdminHistoryPage() {
  const { data: entries = [], isLoading } = useHistory(true);
  const upsert = useUpsertHistoryEntry();
  const delEntry = useDeleteHistoryEntry();
  const [modal, setModal] = useState<{ open: boolean; entry?: Partial<FamilyHistoryEntry> }>({ open: false });

  const handleSave = async (data: Partial<FamilyHistoryEntry>) => {
    await upsert.mutateAsync({ title: data.title!, content: data.content!, ...data });
    toast.success('History entry saved');
    setModal({ open: false });
  };

  const handleDelete = async (id: string, title?: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this history entry'}"?`)) return;
    try {
      await delEntry.mutateAsync(id);
      toast.success('History entry deleted');
      setModal({ open: false });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete history entry');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Family History</h1>
          <p className="text-stone-500 text-sm">Manage stories, milestones, and important events.</p>
        </div>
        <Button size="sm" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> Add Entry
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No history entries yet"
          description="Add the first family story or milestone."
          action={<Button onClick={() => setModal({ open: true })}><Plus className="w-4 h-4" /> Add Entry</Button>}
        />
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium capitalize">
                      {entry.event_type}
                    </span>
                    {entry.event_date && (
                      <span className="text-xs text-stone-400">{formatDate(entry.event_date, 'yyyy')}</span>
                    )}
                    {!entry.is_published && (
                      <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">Draft</span>
                    )}
                  </div>
                  <h3 className="font-serif font-semibold text-stone-900 text-base">{entry.title}</h3>
                  <p className="text-stone-600 text-sm mt-1.5 leading-relaxed line-clamp-3">{entry.content}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setModal({ open: true, entry })}
                    className="p-2 rounded-xl hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition-colors"
                    title="Edit Entry"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id, entry.title)}
                    className="p-2 rounded-xl hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.entry ? 'Edit History Entry' : 'Add History Entry'}
        size="lg"
      >
        <HistoryForm
          entry={modal.entry}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal({ open: false })}
        />
      </Modal>
    </div>
  );
}

