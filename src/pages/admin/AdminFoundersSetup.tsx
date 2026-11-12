import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  TreePine, Heart, Upload, Sparkles, Check, ArrowRight,
  ShieldAlert, RotateCcw, Image, User, Camera
} from 'lucide-react';
import { useSetupFounders, useAllMembers } from '@/hooks/useFamily';
import { Button, Input, Textarea, Select, Card, Badge } from '@/components/ui';
import { uploadFile } from '@/lib/queries';
import toast from 'react-hot-toast';

export default function AdminFoundersSetup() {
  const navigate = useNavigate();
  const setupFoundersMutation = useSetupFounders();
  const { data: allMembers = [] } = useAllMembers();

  // Founder IDs if editing existing founders
  const [headId, setHeadId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  // Group / Archival portrait
  const [archivalPhotoUrl, setArchivalPhotoUrl] = useState<string>('/uploads/founders.jpg');

  // Founder 1: Head of Family
  const [headName, setHeadName] = useState('');
  const [headGender, setHeadGender] = useState<'male' | 'female' | 'other'>('male');
  const [headDob, setHeadDob] = useState('');
  const [headDod, setHeadDod] = useState('');
  const [headOccupation, setHeadOccupation] = useState('');
  const [headHometown, setHeadHometown] = useState('');
  const [headBio, setHeadBio] = useState('');
  const [headPhotoUrl, setHeadPhotoUrl] = useState('/uploads/founders.jpg');

  // Founder 2: Partner / Spouse
  const [partnerName, setPartnerName] = useState('');
  const [partnerGender, setPartnerGender] = useState<'male' | 'female' | 'other'>('female');
  const [partnerDob, setPartnerDob] = useState('');
  const [partnerDod, setPartnerDod] = useState('');
  const [partnerOccupation, setPartnerOccupation] = useState('');
  const [partnerHometown, setPartnerHometown] = useState('');
  const [partnerBio, setPartnerBio] = useState('');
  const [partnerPhotoUrl, setPartnerPhotoUrl] = useState('/uploads/founders.jpg');

  const [branchName, setBranchName] = useState('KKC Ancestral Lineage');

  // Pre-load existing founders if already in database
  useEffect(() => {
    const gen1 = allMembers.filter(m => (m.generation ?? 1) === 1);
    if (gen1.length > 0) {
      const existingHead = gen1.find(m => m.gender === 'male') || gen1[0];
      const existingPartner = gen1.find(m => m.id !== existingHead.id);

      if (existingHead) {
        setHeadId(existingHead.id);
        setHeadName(existingHead.full_name || '');
        setHeadGender(existingHead.gender || 'male');
        setHeadDob(existingHead.dob || '');
        setHeadDod(existingHead.dod || '');
        setHeadOccupation(existingHead.occupation || '');
        setHeadHometown(existingHead.hometown || '');
        setHeadBio(existingHead.bio || '');
        if (existingHead.profile_photo_url) {
          setHeadPhotoUrl(existingHead.profile_photo_url);
          setArchivalPhotoUrl(existingHead.profile_photo_url);
        }
        if (existingHead.branch) setBranchName(existingHead.branch);
      }

      if (existingPartner) {
        setPartnerId(existingPartner.id);
        setPartnerName(existingPartner.full_name || '');
        setPartnerGender(existingPartner.gender || 'female');
        setPartnerDob(existingPartner.dob || '');
        setPartnerDod(existingPartner.dod || '');
        setPartnerOccupation(existingPartner.occupation || '');
        setPartnerHometown(existingPartner.hometown || '');
        setPartnerBio(existingPartner.bio || '');
        if (existingPartner.profile_photo_url) {
          setPartnerPhotoUrl(existingPartner.profile_photo_url);
        }
      }
    }
  }, [allMembers]);

  // Upload handler for Archival Group Portrait
  const onDropArchival = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    try {
      const path = `founders-archival-${Date.now()}-${file.name}`;
      const url = await uploadFile('profile-photos', path, file);
      setArchivalPhotoUrl(url);
      setHeadPhotoUrl(url);
      setPartnerPhotoUrl(url);
      toast.success('Archival portrait updated and linked to founders');
    } catch {
      toast.error('Upload failed');
    }
  }, []);
  const archivalDropzone = useDropzone({ onDrop: onDropArchival, accept: { 'image/*': [] }, maxFiles: 1 });

  // Upload handler for Head Photo
  const onDropHead = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    try {
      const path = `founders-head-${Date.now()}-${file.name}`;
      const url = await uploadFile('profile-photos', path, file);
      setHeadPhotoUrl(url);
      toast.success('Head photo updated');
    } catch {
      toast.error('Upload failed');
    }
  }, []);
  const headDropzone = useDropzone({ onDrop: onDropHead, accept: { 'image/*': [] }, maxFiles: 1 });

  // Upload handler for Partner Photo
  const onDropPartner = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    try {
      const path = `founders-partner-${Date.now()}-${file.name}`;
      const url = await uploadFile('profile-photos', path, file);
      setPartnerPhotoUrl(url);
      toast.success('Partner photo updated');
    } catch {
      toast.error('Upload failed');
    }
  }, []);
  const partnerDropzone = useDropzone({ onDrop: onDropPartner, accept: { 'image/*': [] }, maxFiles: 1 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headName.trim()) {
      toast.error('Please enter the name of the First Family Head');
      return;
    }
    if (!partnerName.trim()) {
      toast.error("Please enter the partner's name");
      return;
    }

    try {
      await setupFoundersMutation.mutateAsync({
        headId: headId || undefined,
        headName: headName.trim(),
        headGender,
        headDob: headDob || null,
        headDod: headDod || null,
        headOccupation: headOccupation || null,
        headHometown: headHometown || null,
        headBio: headBio || null,
        headPhotoUrl: headPhotoUrl || archivalPhotoUrl || '/uploads/founders.jpg',

        partnerId: partnerId || undefined,
        partnerName: partnerName.trim(),
        partnerGender,
        partnerDob: partnerDob || null,
        partnerDod: partnerDod || null,
        partnerOccupation: partnerOccupation || null,
        partnerHometown: partnerHometown || null,
        partnerBio: partnerBio || null,
        partnerPhotoUrl: partnerPhotoUrl || archivalPhotoUrl || '/uploads/founders.jpg',

        branchName: branchName.trim() || 'KKC Ancestral Heritage',
      });

      toast.success(headId ? 'Family founders updated successfully!' : 'Family founders initialized successfully!');
      navigate('/tree');
    } catch (err: any) {
      toast.error(err.message || 'Failed to setup founders');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Starting Point Setup
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Setup First Family Head & Partner
        </h1>
        <p className="text-stone-600 mt-2 max-w-2xl leading-relaxed">
          The family tree begins with the first generation head and their partner.
          Enter their real names, life dates, stories, and photos below. Once saved, they form the root of the interactive family tree.
        </p>
      </div>

      {/* Uploaded founders portrait preview */}
      <div className="mb-8 bg-gradient-to-r from-stone-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-xl flex-shrink-0 bg-stone-800 group">
            <img
              src={archivalPhotoUrl}
              alt="KKC Founders"
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.src = '/uploads/founders.jpg';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div {...archivalDropzone.getRootProps()} className="cursor-pointer text-center p-2">
                <input {...archivalDropzone.getInputProps()} />
                <Camera className="w-6 h-6 text-amber-300 mx-auto mb-1" />
                <p className="text-[10px] text-white font-medium">Click to Change</p>
              </div>
            </div>
            <div className="absolute bottom-1 right-1 bg-amber-500 text-[10px] text-white px-1.5 py-0.5 rounded font-medium">
              Founders Photo
            </div>
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <Badge variant="amber" className="bg-amber-500/20 text-amber-300 border border-amber-400/30">
                {headId ? 'Edit Existing Founders & Photos' : 'Archival Founders Portrait Ready'}
              </Badge>
            </div>
            <h3 className="font-serif text-2xl font-bold text-white mb-2">
              Archival Founders Portrait
            </h3>
            <p className="text-stone-300 text-sm leading-relaxed mb-4">
              Upload or edit the master photograph of the founding generation. This photo represents the roots of the KKC lineage across the Homepage and Family Tree.
            </p>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <div
                {...archivalDropzone.getRootProps()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold text-xs cursor-pointer transition-colors shadow"
              >
                <input {...archivalDropzone.getInputProps()} />
                <Upload className="w-3.5 h-3.5" /> Change Founders Photo
              </div>
              {archivalPhotoUrl !== '/uploads/founders.jpg' && (
                <button
                  type="button"
                  onClick={() => {
                    setArchivalPhotoUrl('/uploads/founders.jpg');
                    setHeadPhotoUrl('/uploads/founders.jpg');
                    setPartnerPhotoUrl('/uploads/founders.jpg');
                    toast.success('Reset to default archival portrait');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to Original
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Branch Name */}
        <Card className="border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <TreePine className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif font-semibold text-stone-900">Ancestral Family Branch Name</h3>
          </div>
          <Input
            value={branchName}
            onChange={e => setBranchName(e.target.value)}
            placeholder="e.g. KKC Roots Branch, Main Lineage"
            hint="The primary branch label assigned to Generation 1"
          />
        </Card>

        {/* Side-by-Side Founder Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* ── FOUNDER 1: FIRST FAMILY HEAD ── */}
          <Card className="border-amber-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold font-serif">
                    1
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-stone-900 text-lg">First Family Head</h2>
                    <p className="text-xs text-stone-500">Patriarch / Head of the lineage</p>
                  </div>
                </div>
                <Badge variant="amber">Generation 1</Badge>
              </div>

              {/* Photo preview & upload */}
              <div className="mb-5 flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-100 border-2 border-amber-300 flex-shrink-0">
                  <img
                    src={headPhotoUrl}
                    alt="Head"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="flex-1 text-xs space-y-2">
                  <div
                    {...headDropzone.getRootProps()}
                    className="border border-dashed border-stone-300 hover:border-amber-400 rounded-xl p-2.5 text-center cursor-pointer transition-colors"
                  >
                    <input {...headDropzone.getInputProps()} />
                    <p className="text-stone-600 font-medium">Upload custom photo</p>
                    <p className="text-stone-400 text-[10px]">or uses archival portrait</p>
                  </div>
                  {headPhotoUrl !== '/uploads/founders.jpg' && (
                    <button
                      type="button"
                      onClick={() => setHeadPhotoUrl('/uploads/founders.jpg')}
                      className="text-amber-700 hover:underline"
                    >
                      Reset to archival portrait
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Full Name *"
                  value={headName}
                  onChange={e => setHeadName(e.target.value)}
                  placeholder="Enter full name of family head"
                  required
                />

                <Select
                  label="Gender"
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                  value={headGender}
                  onChange={e => setHeadGender(e.target.value as any)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={headDob}
                    onChange={e => setHeadDob(e.target.value)}
                  />
                  <Input
                    label="Date of Passing"
                    type="date"
                    value={headDod}
                    onChange={e => setHeadDod(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Occupation"
                    value={headOccupation}
                    onChange={e => setHeadOccupation(e.target.value)}
                    placeholder="e.g. Teacher, Farmer"
                  />
                  <Input
                    label="Hometown"
                    value={headHometown}
                    onChange={e => setHeadHometown(e.target.value)}
                    placeholder="e.g. Ancestral Village"
                  />
                </div>

                <Textarea
                  label="Biography & Memories"
                  value={headBio}
                  onChange={e => setHeadBio(e.target.value)}
                  placeholder="Add his/her story, values, life achievements, and family legacy..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* ── FOUNDER 2: PARTNER / SPOUSE ── */}
          <Card className="border-amber-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold font-serif">
                    2
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-stone-900 text-lg">Partner / Spouse</h2>
                    <p className="text-xs text-stone-500">Matriarch / First generation partner</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                  <Heart className="w-3 h-3 text-red-500 fill-current" /> Spouse
                </div>
              </div>

              {/* Photo preview & upload */}
              <div className="mb-5 flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-100 border-2 border-amber-300 flex-shrink-0">
                  <img
                    src={partnerPhotoUrl}
                    alt="Partner"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="flex-1 text-xs space-y-2">
                  <div
                    {...partnerDropzone.getRootProps()}
                    className="border border-dashed border-stone-300 hover:border-amber-400 rounded-xl p-2.5 text-center cursor-pointer transition-colors"
                  >
                    <input {...partnerDropzone.getInputProps()} />
                    <p className="text-stone-600 font-medium">Upload custom photo</p>
                    <p className="text-stone-400 text-[10px]">or uses archival portrait</p>
                  </div>
                  {partnerPhotoUrl !== '/uploads/founders.jpg' && (
                    <button
                      type="button"
                      onClick={() => setPartnerPhotoUrl('/uploads/founders.jpg')}
                      className="text-amber-700 hover:underline"
                    >
                      Reset to archival portrait
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Full Name *"
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  placeholder="Enter full name of partner"
                  required
                />

                <Select
                  label="Gender"
                  options={[
                    { value: 'female', label: 'Female' },
                    { value: 'male', label: 'Male' },
                    { value: 'other', label: 'Other' },
                  ]}
                  value={partnerGender}
                  onChange={e => setPartnerGender(e.target.value as any)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={partnerDob}
                    onChange={e => setPartnerDob(e.target.value)}
                  />
                  <Input
                    label="Date of Passing"
                    type="date"
                    value={partnerDod}
                    onChange={e => setPartnerDod(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Occupation"
                    value={partnerOccupation}
                    onChange={e => setPartnerOccupation(e.target.value)}
                    placeholder="e.g. Homemaker, Scholar"
                  />
                  <Input
                    label="Hometown"
                    value={partnerHometown}
                    onChange={e => setPartnerHometown(e.target.value)}
                    placeholder="e.g. Birthplace / Town"
                  />
                </div>

                <Textarea
                  label="Biography & Memories"
                  value={partnerBio}
                  onChange={e => setPartnerBio(e.target.value)}
                  placeholder="Add her/his story, traditions, life highlights, and memories..."
                  rows={4}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-stone-200">
          <Link to="/admin">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button
            type="submit"
            size="lg"
            loading={setupFoundersMutation.isPending}
            className="w-full sm:w-auto px-8"
          >
            <Check className="w-5 h-5 mr-1" />
            Save Founders & Launch Family Tree
          </Button>
        </div>
      </form>
    </div>
  );
}

