// ============================================================
// Sample Placeholder Content (Clearly Marked Fictional)
// Per instruction: All placeholder content is explicitly tagged
// as fictional sample data until replaced with real family details.
// ============================================================

import type { FamilyMember, Relationship, FamilyHistoryEntry, GalleryItem } from '@/types';

export const SAMPLE_FOUNDER_HEAD: FamilyMember = {
  id: 'founder-head-sample',
  full_name: 'First Family Head (Sample Founder)',
  gender: 'male',
  dob: '1915-05-12',
  dod: '1992-11-20',
  bio: 'Founding patriarch of the KKC Family. [Sample placeholder text: Please update with real biography, birthplace, and memories in the Admin Founders Setup].',
  occupation: 'Family Patriarch & Scholar (Sample)',
  hometown: 'Ancestral Hometown (Sample)',
  branch: 'Roots & Heritage Branch',
  generation: 1,
  status: 'published',
  profile_photo_url: '/uploads/founders.jpg',
  is_public: true,
  private_notes: 'Fictional demo record. Replace via Admin > Founders Setup.',
  phone: null,
  email: null,
  created_at: new Date('2026-01-01').toISOString(),
  updated_at: new Date('2026-01-01').toISOString(),
};

export const SAMPLE_FOUNDER_PARTNER: FamilyMember = {
  id: 'founder-partner-sample',
  full_name: 'First Family Matriarch (Sample Founder)',
  gender: 'female',
  dob: '1920-08-18',
  dod: '1998-04-10',
  bio: 'Founding matriarch of the KKC Family. [Sample placeholder text: Please update with real details in Admin Founders Setup].',
  occupation: 'Homemaker & Pillar of Family (Sample)',
  hometown: 'Ancestral Hometown (Sample)',
  branch: 'Roots & Heritage Branch',
  generation: 1,
  status: 'published',
  profile_photo_url: '/uploads/founders.jpg',
  is_public: true,
  private_notes: 'Fictional demo record. Replace via Admin > Founders Setup.',
  phone: null,
  email: null,
  created_at: new Date('2026-01-01').toISOString(),
  updated_at: new Date('2026-01-01').toISOString(),
};

export const SAMPLE_MEMBERS: FamilyMember[] = [
  SAMPLE_FOUNDER_HEAD,
  SAMPLE_FOUNDER_PARTNER,
  {
    id: 'sample-gen2-1',
    full_name: 'Eldest Son (Sample - Fictional)',
    gender: 'male',
    dob: '1945-03-10',
    dod: null,
    bio: '[Fictional Demo Record]: Represents Generation 2 branch in the family tree demonstration.',
    occupation: 'Engineer (Sample)',
    hometown: 'Ancestral Hometown (Sample)',
    branch: 'Elder Branch',
    generation: 2,
    status: 'published',
    profile_photo_url: null,
    is_public: true,
    private_notes: null,
    phone: null,
    email: null,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'sample-gen2-2',
    full_name: 'Daughter-in-Law (Sample - Fictional)',
    gender: 'female',
    dob: '1948-07-22',
    dod: null,
    bio: '[Fictional Demo Record]: Spouse of eldest son in demonstration tree.',
    occupation: 'Teacher (Sample)',
    hometown: 'City (Sample)',
    branch: 'Elder Branch',
    generation: 2,
    status: 'published',
    profile_photo_url: null,
    is_public: true,
    private_notes: null,
    phone: null,
    email: null,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'sample-gen2-3',
    full_name: 'Second Daughter (Sample - Fictional)',
    gender: 'female',
    dob: '1950-11-04',
    dod: null,
    bio: '[Fictional Demo Record]: Represents Generation 2 second branch.',
    occupation: 'Doctor (Sample)',
    hometown: 'Ancestral Hometown (Sample)',
    branch: 'Southern Branch',
    generation: 2,
    status: 'published',
    profile_photo_url: null,
    is_public: true,
    private_notes: null,
    phone: null,
    email: null,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'sample-gen3-1',
    full_name: 'Grandchild (Sample - Fictional)',
    gender: 'female',
    dob: '1975-09-14',
    dod: null,
    bio: '[Fictional Demo Record]: Demonstrates 3rd generation expansion in the interactive tree.',
    occupation: 'Architect (Sample)',
    hometown: 'Metro Area (Sample)',
    branch: 'Elder Branch',
    generation: 3,
    status: 'published',
    profile_photo_url: null,
    is_public: true,
    private_notes: null,
    phone: null,
    email: null,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
];

export const SAMPLE_RELATIONSHIPS: Relationship[] = [
  // Founders marriage
  {
    id: 'rel-sample-1',
    member_id: 'founder-head-sample',
    related_member_id: 'founder-partner-sample',
    relationship_type: 'spouse',
    created_at: new Date('2026-01-01').toISOString(),
  },
  // Head is parent to Eldest Son
  {
    id: 'rel-sample-2',
    member_id: 'founder-head-sample',
    related_member_id: 'sample-gen2-1',
    relationship_type: 'parent',
    created_at: new Date('2026-01-01').toISOString(),
  },
  // Partner is parent to Eldest Son
  {
    id: 'rel-sample-3',
    member_id: 'founder-partner-sample',
    related_member_id: 'sample-gen2-1',
    relationship_type: 'parent',
    created_at: new Date('2026-01-01').toISOString(),
  },
  // Head is parent to Second Daughter
  {
    id: 'rel-sample-4',
    member_id: 'founder-head-sample',
    related_member_id: 'sample-gen2-3',
    relationship_type: 'parent',
    created_at: new Date('2026-01-01').toISOString(),
  },
  // Partner is parent to Second Daughter
  {
    id: 'rel-sample-5',
    member_id: 'founder-partner-sample',
    related_member_id: 'sample-gen2-3',
    relationship_type: 'parent',
    created_at: new Date('2026-01-01').toISOString(),
  },
  // Eldest Son married to Daughter-in-Law
  {
    id: 'rel-sample-6',
    member_id: 'sample-gen2-1',
    related_member_id: 'sample-gen2-2',
    relationship_type: 'spouse',
    created_at: new Date('2026-01-01').toISOString(),
  },
  // Eldest Son is parent to Grandchild
  {
    id: 'rel-sample-7',
    member_id: 'sample-gen2-1',
    related_member_id: 'sample-gen3-1',
    relationship_type: 'parent',
    created_at: new Date('2026-01-01').toISOString(),
  },
];

export const SAMPLE_HISTORY: FamilyHistoryEntry[] = [
  {
    id: 'sample-hist-1',
    title: 'The Ancestral Beginnings (Sample Story)',
    content: '[Sample Fictional Story]: This placeholder demonstrates how family milestones, founding memories, and migration stories will be displayed. You can add your authentic family oral history, ancestral house memories, and life milestones in the Admin Portal under "Family History".',
    event_date: '1940-01-01',
    event_type: 'achievement',
    image_url: '/uploads/founders.jpg',
    is_published: true,
    display_order: 1,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'sample-hist-2',
    title: 'First Family Reunion & Celebration (Sample Story)',
    content: '[Sample Fictional Story]: Celebrating our shared heritage and bringing cousins, aunts, uncles, and descendants together. Replace this with your actual KKC family reunion stories, annual festivals, and traditions.',
    event_date: '1975-12-25',
    event_type: 'other',
    image_url: null,
    is_published: true,
    display_order: 2,
    created_at: new Date('2026-01-01').toISOString(),
  },
];

export const SAMPLE_GALLERY: GalleryItem[] = [
  {
    id: 'sample-gal-1',
    title: 'Founders Portrait — First Generation',
    description: 'Original vintage portrait of the KKC Family founders.',
    image_url: '/uploads/founders.jpg',
    category: 'historical',
    date_taken: '1960-01-01',
    members_featured: ['founder-head-sample', 'founder-partner-sample'],
    is_published: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
];

