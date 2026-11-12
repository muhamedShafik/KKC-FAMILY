import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Users } from 'lucide-react';
import { usePublishedMembers } from '@/hooks/useFamily';
import { Avatar, Badge, EmptyState, SectionHeader, Skeleton, Input, Select } from '@/components/ui';
import { calcAge, formatDate, generationLabel } from '@/lib/utils';
import type { FamilyMember } from '@/types';
import { motion } from 'framer-motion';

function MemberCard({ member }: { member: FamilyMember }) {
  const age = calcAge(member.dob, member.dod);
  const isDeceased = !!member.dod;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <Link
        to={`/members/${member.id}`}
        className="group flex items-start gap-4 p-4 bg-white rounded-2xl border border-stone-100 hover:border-amber-200 hover:shadow-md transition-all duration-200"
      >
        <Avatar
          name={member.full_name}
          src={member.profile_photo_url}
          size="lg"
          className={`ring-2 ring-offset-1 ring-stone-200 group-hover:ring-amber-400 transition-all flex-shrink-0 ${isDeceased ? 'grayscale' : ''}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif font-semibold text-stone-900 group-hover:text-amber-800 transition-colors truncate">
              {member.full_name}
            </h3>
            {isDeceased && <Badge variant="stone">†</Badge>}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {member.branch && <Badge variant="amber">{member.branch}</Badge>}
            {member.generation && <Badge variant="stone">Gen {member.generation}</Badge>}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
            {member.dob && <span>{formatDate(member.dob, 'dd MMM yyyy')}</span>}
            {age !== null && <span>· {age} yrs</span>}
            {member.hometown && <span>· {member.hometown}</span>}
          </div>
          {member.occupation && (
            <p className="text-xs text-stone-500 mt-1 truncate">{member.occupation}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function MembersPage() {
  const { data: members = [], isLoading } = usePublishedMembers();
  const [search, setSearch] = useState('');
  const [genFilter, setGenFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const generations = useMemo(() => {
    const gens = [...new Set(members.map(m => m.generation).filter(Boolean))].sort() as number[];
    return gens.map(g => ({ value: String(g), label: generationLabel(g) }));
  }, [members]);

  const branches = useMemo(() => {
    const br = [...new Set(members.map(m => m.branch).filter(Boolean))] as string[];
    return br.map(b => ({ value: b, label: b }));
  }, [members]);

  const filtered = useMemo(() => {
    return members.filter(m => {
      const matchSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase())
        || m.occupation?.toLowerCase().includes(search.toLowerCase())
        || m.hometown?.toLowerCase().includes(search.toLowerCase());
      const matchGen = !genFilter || String(m.generation) === genFilter;
      const matchBranch = !branchFilter || m.branch === branchFilter;
      return matchSearch && matchGen && matchBranch;
    });
  }, [members, search, genFilter, branchFilter]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        title="Family Members"
        subtitle="Browse and search through all members of the KKC family."
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, occupation, or hometown…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder:text-stone-400"
          />
        </div>
        <Select
          options={generations}
          value={genFilter}
          onChange={e => setGenFilter(e.target.value)}
          placeholder="All Generations"
          className="sm:w-44"
        />
        <Select
          options={branches}
          value={branchFilter}
          onChange={e => setBranchFilter(e.target.value)}
          placeholder="All Branches"
          className="sm:w-40"
        />
        {(search || genFilter || branchFilter) && (
          <button
            onClick={() => { setSearch(''); setGenFilter(''); setBranchFilter(''); }}
            className="text-sm text-amber-700 hover:text-amber-900 px-3 py-2 rounded-xl hover:bg-amber-50 transition-colors whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-stone-500 mb-4">
          {filtered.length} {filtered.length === 1 ? 'member' : 'members'} found
          {members.length !== filtered.length && ` of ${members.length}`}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-100">
              <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search || genFilter || branchFilter ? 'No members match your search' : 'No family members yet'}
          description={
            search || genFilter || branchFilter
              ? 'Try adjusting your search or filters.'
              : 'Family administrators can add members in the admin area.'
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(m => <MemberCard key={m.id} member={m} />)}
        </div>
      )}
    </div>
  );
}

