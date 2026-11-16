import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Briefcase, Calendar, Heart, Users, Star, Book, Lock, Edit, Phone, Mail, FileText } from 'lucide-react';
import { useMemberWithRelations, usePrefetchMember } from '@/hooks/useFamily';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, Badge, Button, Skeleton } from '@/components/ui';
import { calcAge, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';

function InfoBlock({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-amber-700" />
      </div>
      <div>
        <p className="text-xs text-stone-500 mb-0.5">{label}</p>
        <p className="font-medium text-stone-900 text-sm">{value}</p>
      </div>
    </div>
  );
}

function RelationRow({
  member,
  rel,
  onHover,
}: {
  member: { id: string; full_name: string; profile_photo_url: string | null };
  rel: string;
  onHover?: (id: string) => void;
}) {
  return (
    <Link
      to={`/members/${member.id}`}
      onMouseEnter={() => onHover?.(member.id)}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors border border-transparent hover:border-amber-100"
    >
      <Avatar name={member.full_name} src={member.profile_photo_url} size="sm" />
      <div>
        <p className="font-medium text-stone-900 text-sm">{member.full_name}</p>
        <p className="text-xs text-stone-400">{rel}</p>
      </div>
    </Link>
  );
}

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: member, isLoading, isFetching } = useMemberWithRelations(id);
  const prefetchMember = usePrefetchMember();
  const { isAdmin } = useAuth();

  if (isLoading && !member) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <p className="font-serif text-2xl text-stone-700">Member not found</p>
        <Link to="/members" className="mt-4 inline-block text-amber-600 hover:underline">← Back to Members</Link>
      </div>
    );
  }

  const age = calcAge(member.dob, member.dod);
  const isDeceased = !!member.dod;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back */}
      <Link to="/members" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Members
      </Link>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-stone-800 to-amber-900 rounded-3xl overflow-hidden mb-6"
      >
        <div className="p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <Avatar
            name={member.full_name}
            src={member.profile_photo_url}
            size="2xl"
            className={`ring-4 ring-amber-400/50 ring-offset-2 ring-offset-stone-800 flex-shrink-0 ${isDeceased ? 'grayscale' : ''}`}
          />
          <div className="text-center md:text-left text-white">
            <div className="flex flex-wrap items-center gap-2 mb-1 justify-center md:justify-start">
              {member.branch && <Badge variant="amber" className="bg-amber-500/30 text-amber-200 border-0">{member.branch}</Badge>}
              {isDeceased && <Badge variant="stone" className="bg-white/10 text-white border-0">Passed Away</Badge>}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">{member.full_name}</h1>
            {member.occupation && <p className="text-amber-300 text-sm">{member.occupation}</p>}
            {member.hometown && (
              <p className="flex items-center gap-1.5 text-stone-400 text-sm mt-1 justify-center md:justify-start">
                <MapPin className="w-3.5 h-3.5" /> {member.hometown}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-4 text-sm text-stone-300 justify-center md:justify-start">
              {member.dob && <span>Born {formatDate(member.dob)}</span>}
              {age !== null && <span>· Age {age}</span>}
              {member.dod && <span>· Passed {formatDate(member.dod)}</span>}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="md:col-span-2 space-y-6">
          {/* Bio */}
          {member.bio && (
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Book className="w-4 h-4 text-amber-600" />
                <h2 className="font-serif text-lg font-semibold text-stone-900">Biography</h2>
              </div>
              <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{member.bio}</p>
            </div>
          )}

          {/* Details grid */}
          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4">Details</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {member.dob && <InfoBlock icon={Calendar} label="Date of Birth" value={formatDate(member.dob)} />}
              {member.dod && <InfoBlock icon={Calendar} label="Date of Passing" value={formatDate(member.dod)} />}
              {member.occupation && <InfoBlock icon={Briefcase} label="Occupation" value={member.occupation} />}
              {member.hometown && <InfoBlock icon={MapPin} label="Hometown" value={member.hometown} />}
              {member.gender && <InfoBlock icon={Star} label="Gender" value={member.gender.charAt(0).toUpperCase() + member.gender.slice(1)} />}
            </div>
          </div>

          {/* Admin-only Private Details (strictly protected) */}
          {isAdmin && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <h2 className="font-serif text-lg font-semibold text-stone-900">Private Records (Admin Only)</h2>
                </div>
                <Link to={`/admin/members/${member.id}/edit`}>
                  <Button size="sm" variant="outline">
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-amber-800 mb-3">
                This sensitive information is confidential and hidden from public visitors.
              </p>
              <div className="space-y-2 text-sm text-stone-700">
                {member.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-stone-400" /> {member.phone}</p>}
                {member.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-stone-400" /> {member.email}</p>}
                {member.private_notes && (
                  <div className="mt-3 p-3 bg-white/80 rounded-xl border border-amber-200/50">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Confidential Notes</p>
                    <p className="text-stone-800 text-xs whitespace-pre-wrap">{member.private_notes}</p>
                  </div>
                )}
                {!member.phone && !member.email && !member.private_notes && (
                  <p className="text-stone-400 text-xs italic">No private contact details recorded.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Relations sidebar */}
        <div className="space-y-4">
          {member.spouses.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-semibold text-stone-900 text-sm">
                  {member.spouses.length > 1 ? 'Spouses' : 'Spouse'}
                </h3>
              </div>
              {member.spouses.map(s => <RelationRow key={s.id} member={s} rel="Spouse" onHover={prefetchMember} />)}
            </div>
          )}

          {member.parents.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-semibold text-stone-900 text-sm">Parents</h3>
              </div>
              {member.parents.map(p => <RelationRow key={p.id} member={p} rel="Parent" onHover={prefetchMember} />)}
            </div>
          )}

          {member.children.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-semibold text-stone-900 text-sm">
                  Children ({member.children.length})
                </h3>
              </div>
              {member.children.map(c => <RelationRow key={c.id} member={c} rel="Child" onHover={prefetchMember} />)}
            </div>
          )}

          {member.siblings.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-semibold text-stone-900 text-sm">
                  Siblings ({member.siblings.length})
                </h3>
              </div>
              {member.siblings.map(s => <RelationRow key={s.id} member={s} rel="Sibling" onHover={prefetchMember} />)}
            </div>
          )}

          {/* Fallback state when relations are empty */}
          {member.spouses.length === 0 && member.parents.length === 0 && member.children.length === 0 && member.siblings.length === 0 && (
            isFetching ? (
              <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm text-center py-6">
                <Users className="w-6 h-6 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-500 font-medium">No family connections recorded yet</p>
                <p className="text-[11px] text-stone-400 mt-1">Relations can be linked via the Family Tree or Admin.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

