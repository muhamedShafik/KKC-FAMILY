import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus, Trash2, Edit, Image, Upload, X } from 'lucide-react';
import { useGallery, useUpsertGalleryItem, useDeleteGalleryItem } from '@/hooks/useFamily';
import { uploadFile } from '@/lib/queries';
import { Button, Input, Textarea, Select, EmptyState, Skeleton, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { GalleryItem, GalleryCategory } from '@/types';
import toast from 'react-hot-toast';

const CATEGORY_OPTIONS = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'reunion', label: 'Family Reunion' },
  { value: 'historical', label: 'Historical' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'other', label: 'Other' },
];

function GalleryItemForm({ item, onSave, onDelete, onClose }: {
  item?: Partial<GalleryItem>;
  onSave: (data: Partial<GalleryItem>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<GalleryItem>>({
    title: '', category: 'other', is_published: true,
    ...item,
  });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(item?.image_url ?? null);
  const [saving, setSaving] = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]; if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `gallery-${Date.now()}-${sanitizedName}`;
      const url = await uploadFile('gallery', path, file);
      setPreview(url);
      setForm(f => ({ ...f, image_url: url }));
      toast.success('Photo uploaded');
    } catch (err: any) {
      setPreview(item?.image_url ?? null);
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }, [item?.image_url]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleSave = async () => {
    if (uploading) { toast.error('Please wait for photo upload to finish'); return; }
    if (!form.title) { toast.error('Title required'); return; }
    if (!form.image_url) { toast.error('Photo required'); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Photo */}
      {preview ? (
        <div className="relative rounded-xl overflow-hidden aspect-video">
          <img src={preview} alt="Preview" className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-50' : ''}`} />
          {uploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-white text-xs font-medium px-2.5 py-1 rounded-full bg-black/50">Optimizing & Uploading…</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setPreview(null); setForm(f => ({ ...f, image_url: undefined })); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 cursor-pointer text-center transition-colors ${
            uploading ? 'opacity-60 cursor-not-allowed bg-stone-50 border-stone-200' :
            isDragActive ? 'border-amber-400 bg-amber-50' : 'border-stone-300 hover:border-amber-300'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-amber-600 text-sm font-medium">Compressing & Uploading…</p>
            </div>
          ) : (
            <p className="text-stone-400 text-sm">Drop a photo here or click to browse</p>
          )}
        </div>
      )}

      <Input label="Title *" value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <Textarea label="Description" value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Category" options={CATEGORY_OPTIONS} value={form.category ?? 'other'} onChange={e => setForm(f => ({ ...f, category: e.target.value as GalleryCategory }))} />
        <Input label="Date Taken" type="date" value={form.date_taken ?? ''} onChange={e => setForm(f => ({ ...f, date_taken: e.target.value || null }))} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="pub" checked={form.is_published ?? true} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="rounded" />
        <label htmlFor="pub" className="text-sm text-stone-700">Publish to gallery</label>
      </div>
      <div className="flex gap-3 pt-2">
        {item?.id && onDelete && (
          <Button
            type="button"
            variant="danger"
            onClick={() => onDelete(item.id!)}
            className="px-3"
            title="Delete this photo"
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        )}
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={handleSave} loading={saving || uploading} disabled={uploading} className="flex-1">
          {uploading ? 'Uploading…' : 'Save Photo'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminGalleryPage() {
  const { data: items = [], isLoading } = useGallery(true);
  const upsert = useUpsertGalleryItem();
  const delItem = useDeleteGalleryItem();
  const [modal, setModal] = useState<{ open: boolean; item?: Partial<GalleryItem> }>({ open: false });

  const handleSave = async (data: Partial<GalleryItem>) => {
    await upsert.mutateAsync({ title: data.title!, image_url: data.image_url!, ...data });
    toast.success('Gallery item saved');
    setModal({ open: false });
  };

  const handleDelete = async (id: string, title?: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this photo'}"?`)) return;
    try {
      await delItem.mutateAsync(id);
      toast.success('Photo deleted');
      setModal({ open: false });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete photo');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Gallery</h1>
          <p className="text-stone-500 text-sm">Upload and manage family photos.</p>
        </div>
        <Button size="sm" onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" /> Add Photo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Image} title="No photos yet" description="Upload the first family photo." action={<Button onClick={() => setModal({ open: true })}><Plus className="w-4 h-4" /> Add Photo</Button>} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-stone-100 shadow-sm">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 inset-x-2">
                  <p className="text-white text-xs font-medium truncate">{item.title}</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => setModal({ open: true, item })}
                    className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.title); }}
                    className="w-7 h-7 rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {!item.is_published && (
                <div className="absolute top-2 left-2">
                  <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">Draft</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.item ? 'Edit Photo' : 'Add Photo'}
        size="md"
      >
        <GalleryItemForm
          item={modal.item}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal({ open: false })}
        />
      </Modal>
    </div>
  );
}

