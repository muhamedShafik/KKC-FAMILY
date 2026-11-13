import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, Plus, Trash2, Eye, Save, Check } from 'lucide-react';
import { useAllMembers, useUpsertMember, useUpdateMemberStatus } from '@/hooks/useFamily';
import { fetchMemberWithRelations, addRelationship, removeRelationship, uploadFile } from '@/lib/queries';
import { Button, Input, Textarea, Select, Avatar, Badge, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { FamilyMember, FamilyMemberWithRelations, RelationshipType } from '@/types';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const GENERATION_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `Generation ${i + 1}`,
}));

// ── Photo Upload Drop Zone ─────────────────────────────────────
function PhotoUpload({ value, onChange }: { value: string | null; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const path = `profile-${Date.now()}-${file.name}`;
      const url = await uploadFile('profile-photos', path, file);
      onChange(url);
      toast.success('Photo uploaded');
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  });

  return (
    <div>
      <label className="text-sm font-medium text-stone-700 mb-2 block">Profile Photo</label>
      <div className="flex items-start gap-4">
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Profile preview" className="w-20 h-20 rounded-xl object-cover border-2 border-amber-200" />
            <button
              onClick={() => { setPreview(null); onChange(''); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-xl bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400">
            <Upload className="w-6 h-6" />
          </div>
        )}
        <div
          {...getRootProps()}
          className={cn(
            'flex-1 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors text-center',
            isDragActive ? 'border-amber-400 bg-amber-50' : 'border-stone-300 hover:border-amber-300 hover:bg-amber-50/50',
          )}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <p className="text-sm text-amber-600">Uploading…</p>
          ) : isDragActive ? (
            <p className="text-sm text-amber-600">Drop the photo here</p>
          ) : (
            <>
              <p className="text-sm text-stone-600">Drag & drop a photo, or click to browse</p>
              <p className="text-xs text-stone-400 mt-1">JPG, PNG, WEBP · Max 5MB</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Relationship Picker ────────────────────────────────────────
function RelationPicker({
  label, relType, memberRelations, allMembers, memberId, onAdd, onRemove,
}: {
  label: string;
  relType: RelationshipType;
  memberRelations: FamilyMember[];
  allMembers: FamilyMember[];
  memberId: string;
  onAdd: (relatedId: string, type: RelationshipType) => Promise<void>;
  onRemove: (memberId: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const available = allMembers.filter(m =>
    m.id !== memberId &&
    !memberRelations.find(r => r.id === m.id) &&
    m.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-stone-700">{label}</label>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {memberRelations.length === 0 ? (
        <p className="text-sm text-stone-400 italic">None added yet</p>
      ) : (
        <div className="space-y-1.5">
          {memberRelations.map(m => (
            <div key={m.id} className="flex items-center gap-2.5 p-2 bg-stone-50 rounded-lg">
              <Avatar name={m.full_name} src={m.profile_photo_url} size="xs" />
              <span className="text-sm text-stone-800 flex-1">{m.full_name}</span>
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                className="text-stone-400 hover:text-red-500 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showPicker} onClose={() => setShowPicker(false)} title={`Add ${label}`} size="sm">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members…"
          className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {available.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-4">No members found</p>
          ) : (
            available.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={async () => {
                  await onAdd(m.id, relType);
                  setShowPicker(false);
                  setSearch('');
                }}
                className="flex items-center gap-2.5 w-full p-2.5 rounded-lg hover:bg-amber-50 transition-colors text-left"
              >
                <Avatar name={m.full_name} src={m.profile_photo_url} size="xs" />
                <div>
                  <p className="text-sm font-medium text-stone-900">{m.full_name}</p>
                  {m.branch && <p className="text-xs text-stone-400">{m.branch}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}

// ── Main Form ──────────────────────────────────────────────────
export default function AdminMemberForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const upsert = useUpsertMember();
  const updateStatus = useUpdateMemberStatus();
  const { data: allMembers = [] } = useAllMembers();

  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    status: 'published',
    is_public: true,
    gender: 'male',
    generation: 1,
  });
  const [memberRelations, setMemberRelations] = useState<{
    parents: FamilyMember[];
    spouses: FamilyMember[];
    children: FamilyMember[];
    siblings: FamilyMember[];
  }>({ parents: [], spouses: [], children: [], siblings: [] });
  const [savedId, setSavedId] = useState<string | null>(id ?? null);
  const [loading, setLoading] = useState(isEditing);
  const [tab, setTab] = useState<'info' | 'relations' | 'review'>('info');

  useEffect(() => {
    if (isEditing && id) {
      fetchMemberWithRelations(id).then(m => {
        if (m) {
          setFormData(m);
          setMemberRelations({
            parents: m.parents,
            spouses: m.spouses,
            children: m.children,
            siblings: m.siblings,
          });
        }
        setLoading(false);
      });
    }
  }, [id, isEditing]);

  const set = (key: keyof FamilyMember, value: unknown) =>
    setFormData(d => ({ ...d, [key]: value }));

  const handleSave = async () => {
    if (!formData.full_name?.trim()) {
      toast.error('Full name is required');
      return;
    }
    try {
      const saved = await upsert.mutateAsync({
        ...formData,
        full_name: formData.full_name!.trim(),
        status: formData.status || 'published',
        generation: formData.generation ?? 1,
      });
      setSavedId(saved.id);
      setFormData(saved);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['family-tree'] });
      toast.success(isEditing ? 'Member updated' : 'Member saved successfully');
      if (!isEditing) navigate(`/admin/members/${saved.id}/edit`, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handlePublish = async () => {
    if (!savedId) { toast.error('Save first'); return; }
    await updateStatus.mutateAsync({ id: savedId, status: 'published' });
    toast.success('Member published!');
  };

  const handleAddRelation = async (relatedId: string, type: RelationshipType) => {
    if (!savedId) {
      toast.error('Save the member first, then add relations');
      return;
    }
    try {
      await addRelationship(savedId, relatedId, type);
      queryClient.removeQueries({ queryKey: ['family-tree'] });
      queryClient.invalidateQueries({ queryKey: ['family-tree'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member'] });

      // Refresh relations directly from DB
      const updated = await fetchMemberWithRelations(savedId);
      if (updated) {
        setMemberRelations({
          parents: updated.parents,
          spouses: updated.spouses,
          children: updated.children,
          siblings: updated.siblings,
        });
      }
      const label =
        type === 'child'
          ? 'Child connected (bidirectionally linked parent & child)'
          : type === 'parent'
          ? 'Parent connected (bidirectionally linked child & parent)'
          : `${type.charAt(0).toUpperCase() + type.slice(1)} connected`;
      toast.success(label);
    } catch (err: any) {
      console.error('Relationship save error:', err);
      toast.error(err.message || 'Failed to add relationship');
    }
  };

  const handleRemoveRelation = async (relatedId: string, _type: 'parents' | 'spouses' | 'children' | 'siblings') => {
    if (!savedId) return;
    try {
      await removeRelationship(savedId, relatedId);
      queryClient.removeQueries({ queryKey: ['family-tree'] });
      queryClient.invalidateQueries({ queryKey: ['family-tree'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member'] });

      const updated = await fetchMemberWithRelations(savedId);
      if (updated) {
        setMemberRelations({
          parents: updated.parents,
          spouses: updated.spouses,
          children: updated.children,
          siblings: updated.siblings,
        });
      }
      toast.success('Relationship removed');
    } catch (err: any) {
      console.error('Relationship remove error:', err);
      toast.error(err.message || 'Failed to remove relationship');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const TABS = [
    { id: 'info', label: 'Basic Info' },
    { id: 'relations', label: 'Relationships' },
    { id: 'review', label: 'Review & Publish' },
  ] as const;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/members" className="p-2 rounded-xl hover:bg-stone-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-stone-600" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            {isEditing ? 'Edit Family Member' : 'Add Family Member'}
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {isEditing ? 'Update details and relationships' : 'Fill in details and save as draft first'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-8">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
              tab === t.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Info Tab ─────────────────────────────────────────── */}
      {tab === 'info' && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-6">
          <PhotoUpload
            value={formData.profile_photo_url ?? null}
            onChange={url => set('profile_photo_url', url)}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={formData.full_name ?? ''}
              onChange={e => set('full_name', e.target.value)}
              placeholder="e.g. Krishnan Kumaraswamy"
            />
            <Select
              label="Gender"
              options={GENDER_OPTIONS}
              value={formData.gender ?? 'male'}
              onChange={e => set('gender', e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dob ?? ''}
              onChange={e => set('dob', e.target.value || null)}
            />
            <Input
              label="Date of Death (if applicable)"
              type="date"
              value={formData.dod ?? ''}
              onChange={e => set('dod', e.target.value || null)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Occupation"
              value={formData.occupation ?? ''}
              onChange={e => set('occupation', e.target.value || null)}
              placeholder="e.g. Farmer, Teacher"
            />
            <Input
              label="Hometown / Place"
              value={formData.hometown ?? ''}
              onChange={e => set('hometown', e.target.value || null)}
              placeholder="e.g. Palakkad, Kerala"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Generation"
              options={GENERATION_OPTIONS}
              value={String(formData.generation ?? 1)}
              onChange={e => set('generation', parseInt(e.target.value))}
            />
            <Input
              label="Family Branch"
              value={formData.branch ?? ''}
              onChange={e => set('branch', e.target.value || null)}
              placeholder="e.g. Main Branch, Southern Branch"
            />
          </div>

          <Textarea
            label="Biography"
            value={formData.bio ?? ''}
            onChange={e => set('bio', e.target.value || null)}
            placeholder="Write a biography, life story, or meaningful description…"
            rows={5}
          />

          <Textarea
            label="Private Notes (not shown publicly)"
            value={formData.private_notes ?? ''}
            onChange={e => set('private_notes', e.target.value || null)}
            placeholder="Private contact info, notes for admins only…"
            rows={3}
          />

          <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl">
            <input
              id="is_public"
              type="checkbox"
              checked={formData.is_public ?? true}
              onChange={e => set('is_public', e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded"
            />
            <label htmlFor="is_public" className="text-sm text-stone-700">
              Visible on public family website <span className="text-stone-400">(when published)</span>
            </label>
          </div>
        </div>
      )}

      {/* ── Relations Tab ─────────────────────────────────────── */}
      {tab === 'relations' && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-8">
          {!savedId && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              💡 Save the member first (in Basic Info) before adding relationships.
            </div>
          )}

          <RelationPicker
            label="Parents"
            relType="parent"
            memberRelations={memberRelations.parents}
            allMembers={allMembers}
            memberId={savedId ?? ''}
            onAdd={handleAddRelation}
            onRemove={id => handleRemoveRelation(id, 'parents')}
          />

          <RelationPicker
            label="Spouse / Partner"
            relType="spouse"
            memberRelations={memberRelations.spouses}
            allMembers={allMembers}
            memberId={savedId ?? ''}
            onAdd={handleAddRelation}
            onRemove={id => handleRemoveRelation(id, 'spouses')}
          />

          <RelationPicker
            label="Children"
            relType="child"
            memberRelations={memberRelations.children}
            allMembers={allMembers}
            memberId={savedId ?? ''}
            onAdd={handleAddRelation}
            onRemove={id => handleRemoveRelation(id, 'children')}
          />

          <RelationPicker
            label="Siblings"
            relType="sibling"
            memberRelations={memberRelations.siblings}
            allMembers={allMembers}
            memberId={savedId ?? ''}
            onAdd={handleAddRelation}
            onRemove={id => handleRemoveRelation(id, 'siblings')}
          />
        </div>
      )}

      {/* ── Review Tab ────────────────────────────────────────── */}
      {tab === 'review' && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar name={formData.full_name ?? 'Member'} src={formData.profile_photo_url} size="xl" />
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900">{formData.full_name || '—'}</h2>
              <p className="text-stone-500 text-sm">{formData.occupation ?? ''}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={formData.status === 'published' ? 'green' : 'amber'}>
                  {formData.status ?? 'draft'}
                </Badge>
                {!formData.is_public && <Badge variant="stone">Private</Badge>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            {[
              ['Full Name', formData.full_name],
              ['Gender', formData.gender],
              ['Date of Birth', formData.dob],
              ['Date of Death', formData.dod],
              ['Occupation', formData.occupation],
              ['Hometown', formData.hometown],
              ['Generation', formData.generation ? `Gen ${formData.generation}` : null],
              ['Branch', formData.branch],
            ].map(([label, value]) => (
              value ? (
                <div key={label as string} className="p-3 bg-stone-50 rounded-xl">
                  <p className="text-xs text-stone-400 mb-0.5">{label}</p>
                  <p className="font-medium text-stone-900">{value}</p>
                </div>
              ) : null
            ))}
          </div>

          {formData.bio && (
            <div className="p-4 bg-amber-50 rounded-xl mb-6">
              <p className="text-xs text-stone-500 mb-1">Biography</p>
              <p className="text-sm text-stone-700">{formData.bio}</p>
            </div>
          )}

          <div className="border-t border-stone-100 pt-6 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleSave}
              loading={upsert.isPending}
              className="flex-1"
            >
              <Save className="w-4 h-4" /> Save as Draft
            </Button>
            <Button
              onClick={handlePublish}
              loading={updateStatus.isPending}
              className="flex-1"
            >
              <Check className="w-4 h-4" /> Publish to Website
            </Button>
            {savedId && (
              <Link to={`/members/${savedId}`} target="_blank">
                <Button variant="ghost" className="flex-1">
                  <Eye className="w-4 h-4" /> Preview
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Sticky save bar */}
      {tab !== 'review' && (
        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/admin/members')}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={upsert.isPending}>
            <Save className="w-4 h-4" />
            {isEditing ? 'Save Changes' : 'Save as Draft'}
          </Button>
        </div>
      )}
    </div>
  );
}

