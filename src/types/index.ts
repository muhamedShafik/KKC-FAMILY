// ============================================================
// KKKC Family Website – Core Types
// ============================================================

export type Gender = 'male' | 'female' | 'other';
export type RelationshipType = 'spouse' | 'parent' | 'child' | 'sibling';
export type MemberStatus = 'draft' | 'published' | 'archived';
export type EventType = 'birth' | 'death' | 'marriage' | 'achievement' | 'migration' | 'other';
export type GalleryCategory = 'portrait' | 'reunion' | 'historical' | 'wedding' | 'celebration' | 'other';

export interface FamilyMember {
  id: string;
  full_name: string;
  gender: Gender;
  dob: string | null;           // ISO date string
  dod: string | null;           // ISO date string
  bio: string | null;
  occupation: string | null;
  hometown: string | null;
  branch: string | null;        // family branch label
  status: MemberStatus;
  profile_photo_url: string | null;
  is_public: boolean;
  private_notes: string | null; // hidden from public
  phone: string | null;         // hidden from public
  email: string | null;         // hidden from public
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  member_id: string;
  related_member_id: string;
  relationship_type: RelationshipType;
  created_at: string;
}

export interface FamilyMemberWithRelations extends FamilyMember {
  parents: FamilyMember[];
  spouses: FamilyMember[];
  children: FamilyMember[];
  siblings: FamilyMember[];
}

export interface LifeEvent {
  id: string;
  member_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_type: EventType;
  created_at: string;
}

export interface MemberPhoto {
  id: string;
  member_id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
  is_public: boolean;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: GalleryCategory;
  date_taken: string | null;
  members_featured: string[];   // array of member IDs
  is_published: boolean;
  created_at: string;
}

export interface FamilyHistoryEntry {
  id: string;
  title: string;
  content: string;
  event_date: string | null;
  event_type: EventType;
  image_url: string | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
}

export interface TreeNode {
  id: string;
  name: string;
  gender: Gender;
  dob: string | null;
  dod: string | null;
  profile_photo_url: string | null;
  branch: string | null;
  spouses: TreeNode[];
  children: TreeNode[];
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'editor';
}

export interface InviteToken {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
  created_by: string | null;
  is_active: boolean;
}


