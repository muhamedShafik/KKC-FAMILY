import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { TreePine, Users, Image as ImageIcon, BookOpen, CheckCircle, Clock, ArrowLeft, Upload, X } from 'lucide-react';
import { Button, Card, Input, Textarea, Select } from '@/components/ui';
import { useVerifyToken } from '@/hooks/useInviteTokens';
import { useUpsertMember, useUpsertGalleryItem, useUpsertHistoryEntry } from '@/hooks/useFamily';
import { uploadFile } from '@/lib/queries';
import toast from 'react-hot-toast';

type Tab = 'member' | 'gallery' | 'history';

function formatExpiry(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `Expires in ${h}h ${m}m`;
  return `Expires in ${m}m`;
}

// ── Reusable Photo Upload Dropzone ──────────────────────────────
function PhotoUploader({
  bucket,
  label,
  value,
  onChange,
}: {
  bucket: 'profile-photos' | 'gallery';
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${bucket}-${Date.now()}-${sanitizedName}`;
      const url = await uploadFile(bucket, path, file);
      setPreview(url);
      onChange(url);
      toast.success('Photo uploaded successfully');
    } catch (err: any) {
      console.error(err);
      setPreview(value);
      toast.error(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }, [bucket, value, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-stone-700">{label}</label>
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Upload preview"
            className={`w-28 h-28 object-cover rounded-xl border border-stone-200 shadow-sm transition-opacity ${
              uploading ? 'opacity-50' : ''
            }`}
          />
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setPreview(null); onChange(null); }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            uploading ? 'opacity-60 cursor-not-allowed bg-stone-50 border-stone-200' :
            isDragActive
              ? 'border-amber-400 bg-amber-50'
              : 'border-stone-300 hover:border-amber-300 bg-stone-50/50 hover:bg-amber-50/30'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-7 h-7 text-stone-400 mx-auto mb-2" />
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-amber-600">Compressing & uploading…</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-stone-700">Click to upload or drag photo here</p>
              <p className="text-xs text-stone-400 mt-0.5">JPG, PNG, or WEBP (instant upload)</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add Member Form ────────────────────────────────────────────
function AddMemberForm({ onSuccess }: { onSuccess: () => void }) {
  const upsert = useUpsertMember();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    gender: 'male',
    dob: '',
    occupation: '',
    hometown: '',
    branch: '',
    phone: '',
    bio: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }
    try {
      await upsert.mutateAsync({
        full_name: form.full_name.trim(),
        gender: form.gender as 'male' | 'female' | 'other',
        dob: form.dob || null,
        occupation: form.occupation || null,
        hometown: form.hometown || null,
        branch: form.branch || null,
        phone: form.phone || null,
        bio: form.bio || null,
        profile_photo_url: photoUrl || null,
        status: 'draft',
        is_public: false,
        generation: 1,
        dod: null,
        private_notes: null,
        email: null,
      });
      toast.success('Family member submitted! Admin will review and publish.');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PhotoUploader
        bucket="profile-photos"
        label="Profile Photo (Optional)"
        value={photoUrl}
        onChange={setPhotoUrl}
      />
      <Input
        label="Full Name *"
        value={form.full_name}
        onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
        placeholder="e.g. Ramesh Kumar"
        required
      />
      <Select
        label="Gender"
        value={form.gender}
        onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
        options={[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' },
        ]}
      />
      <Input
        label="Date of Birth"
        type="date"
        value={form.dob}
        onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
      />
      <Input
        label="Occupation"
        value={form.occupation}
        onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
        placeholder="e.g. Teacher, Engineer, Entrepreneur"
      />
      <Input
        label="Hometown / Native Place"
        value={form.hometown}
        onChange={e => setForm(f => ({ ...f, hometown: e.target.value }))}
        placeholder="e.g. Karaikudi"
      />
      <Input
        label="Family Branch"
        value={form.branch}
        onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
        placeholder="e.g. KKKC Main Branch"
      />
      <Input
        label="Phone Number"
        type="tel"
        value={form.phone}
        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        placeholder="+91 ..."
      />
      <Textarea
        label="Short Bio / Notes"
        value={form.bio}
        onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
        placeholder="Add any information about this person, achievements, or memories..."
        rows={3}
      />
      <Button type="submit" loading={upsert.isPending} className="w-full" size="lg">
        Submit Family Member
      </Button>
      <p className="text-xs text-stone-400 text-center">
        Your submission will be reviewed and published by the family administrator.
      </p>
    </form>
  );
}

// ── Add Gallery Form ───────────────────────────────────────────
function AddGalleryForm({ onSuccess }: { onSuccess: () => void }) {
  const upsert = useUpsertGalleryItem();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'reunion',
    date_taken: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Photo title is required');
      return;
    }
    if (!photoUrl) {
      toast.error('Please upload a photo');
      return;
    }
    try {
      await upsert.mutateAsync({
        title: form.title.trim(),
        image_url: photoUrl,
        category: form.category as any,
        date_taken: form.date_taken || null,
        description: form.description || null,
        is_published: false,
        members_featured: [],
      });
      toast.success('Photo submitted! Admin will review and publish.');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit photo.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PhotoUploader
        bucket="gallery"
        label="Photo *"
        value={photoUrl}
        onChange={setPhotoUrl}
      />
      <Input
        label="Photo Title *"
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="e.g. Annual Family Gathering 2024"
        required
      />
      <Select
        label="Category"
        value={form.category}
        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
        options={[
          { value: 'reunion', label: 'Family Reunion' },
          { value: 'portrait', label: 'Portrait' },
          { value: 'wedding', label: 'Wedding' },
          { value: 'celebration', label: 'Celebration' },
          { value: 'historical', label: 'Historical' },
          { value: 'other', label: 'Other' },
        ]}
      />
      <Input
        label="Date Taken"
        type="date"
        value={form.date_taken}
        onChange={e => setForm(f => ({ ...f, date_taken: e.target.value }))}
      />
      <Textarea
        label="Description / Caption"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="Where was this photo taken? Who is in the photo?"
        rows={2}
      />
      <Button type="submit" loading={upsert.isPending} className="w-full" size="lg">
        Submit Photo to Gallery
      </Button>
      <p className="text-xs text-stone-400 text-center">
        Your photo will be reviewed by the administrator before appearing in the gallery.
      </p>
    </form>
  );
}

// ── Add History Form ───────────────────────────────────────────
function AddHistoryForm({ onSuccess }: { onSuccess: () => void }) {
  const upsert = useUpsertHistoryEntry();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    event_type: 'achievement',
    event_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.content.trim()) {
      toast.error('Story content is required');
      return;
    }
    try {
      await upsert.mutateAsync({
        title: form.title.trim(),
        content: form.content.trim(),
        event_type: form.event_type as any,
        event_date: form.event_date || null,
        image_url: photoUrl || null,
        is_published: false,
        display_order: 0,
      });
      toast.success('History story submitted! Admin will review and publish.');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit history entry.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Event / Story Title *"
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="e.g. The Establishment of KKKC House in 1952"
        required
      />
      <Select
        label="Event Type"
        value={form.event_type}
        onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
        options={[
          { value: 'achievement', label: 'Achievement' },
          { value: 'migration', label: 'Migration / Move' },
          { value: 'marriage', label: 'Marriage' },
          { value: 'birth', label: 'Birth' },
          { value: 'death', label: 'Memorial' },
          { value: 'other', label: 'Other Event' },
        ]}
      />
      <Input
        label="Event Date"
        type="date"
        value={form.event_date}
        onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
      />
      <PhotoUploader
        bucket="gallery"
        label="Story Photo (Optional)"
        value={photoUrl}
        onChange={setPhotoUrl}
      />
      <Textarea
        label="Story Content *"
        value={form.content}
        onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
        placeholder="Describe the historical event or family story in detail..."
        rows={6}
        required
      />
      <Button type="submit" loading={upsert.isPending} className="w-full" size="lg">
        Submit History Story
      </Button>
      <p className="text-xs text-stone-400 text-center">
        Your story will be reviewed by the administrator before being added to family history.
      </p>
    </form>
  );
}

// ── Success Screen ─────────────────────────────────────────────
function SuccessScreen({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Thank You!</h2>
      <p className="text-stone-500 text-sm mb-6 max-w-xs mx-auto">
        Your submission has been recorded. The family administrator will review and publish it soon.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onReset} variant="secondary">
          Submit Another
        </Button>
        <Link to="/">
          <Button variant="outline">
            Go to Family Website
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function PublicContributePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [activeTab, setActiveTab] = useState<Tab>('member');
  const [submitted, setSubmitted] = useState(false);

  const { data: verification, isLoading } = useVerifyToken(token);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm">Verifying invite link...</p>
        </div>
      </div>
    );
  }

  // No token or invalid/expired token
  if (!token || !verification?.valid) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="font-serif text-xl font-bold text-stone-900 mb-2">
            {!token ? 'Invalid Invite Link' : 'Invite Link Expired'}
          </h1>
          <p className="text-stone-500 text-sm mb-6">
            {!token
              ? 'This invite link is missing or invalid. Please ask the family administrator for a valid link.'
              : 'This invite link has expired. Links are valid for 7 hours. Please ask the family administrator to generate a new invite link.'}
          </p>
          <Link to="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4" /> Back to Family Website
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'member' as Tab, label: 'Add Member', icon: Users },
    { id: 'gallery' as Tab, label: 'Add Photo', icon: ImageIcon },
    { id: 'history' as Tab, label: 'Add History', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-amber-400 shadow-sm bg-stone-900 flex-shrink-0">
              <img
                src="/uploads/founders.jpg"
                alt="KKKC Founder"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <p className="font-serif font-bold text-stone-900 text-sm leading-none">KKKC Family</p>
              <p className="text-amber-600 text-xs leading-none mt-0.5">Contribution Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {verification.expiresAt && (
              <span className="text-xs text-stone-500 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full hidden sm:inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {formatExpiry(verification.expiresAt)}
              </span>
            )}
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" /> Back to Website
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Family Contribution Portal</h1>
          <p className="text-stone-500 text-sm">
            Help preserve our family heritage. Add family members, photos, or memorable history stories below.
          </p>
        </div>

        {submitted ? (
          <Card>
            <SuccessScreen onReset={() => setSubmitted(false)} />
          </Card>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-stone-200/70 rounded-xl mb-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-amber-800 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Form */}
            <Card>
              <h2 className="font-serif font-semibold text-stone-900 mb-5 text-lg">
                {activeTab === 'member' && 'Add a Family Member'}
                {activeTab === 'gallery' && 'Add a Photo to Gallery'}
                {activeTab === 'history' && 'Add a History Entry'}
              </h2>
              {activeTab === 'member' && <AddMemberForm onSuccess={() => setSubmitted(true)} />}
              {activeTab === 'gallery' && <AddGalleryForm onSuccess={() => setSubmitted(true)} />}
              {activeTab === 'history' && <AddHistoryForm onSuccess={() => setSubmitted(true)} />}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

