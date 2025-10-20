// API Response types based on FastAPI models
export interface User {
  id: string
  firebase_uid: string
  name?: string
  email?: string
  email_verified?: string
  image?: string
  created_at: string
  updated_at: string
}

export interface Person {
  id: string
  name: string
  body: string
  birthday?: string
  mnemonic?: string
  zip?: string
  profile_pic_index: number
  email?: string
  phone_number?: string
  last_contact_date: string
  user_id: string
  created_at: string
  updated_at: string
  last_message?: string // For list display
  latest_notebook_entry_content?: string
  latest_notebook_entry_time?: string

  // Location fields
  street_address?: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number

  // Computed health score fields
  health_score: number
  health_status: 'healthy' | 'warning' | 'dormant'
  health_emoji: string
  days_since_contact: number

  // Tags
  tags: Tag[]
}

export interface PersonCreate {
  name: string
  body?: string
  birthday?: string
  mnemonic?: string
  zip?: string
  profile_pic_index?: number
  email?: string
  phone_number?: string
  last_contact_date?: string
  street_address?: string
  city?: string
  state?: string
}

export interface PersonUpdate {
  name?: string
  body?: string
  birthday?: string
  mnemonic?: string
  zip?: string
  profile_pic_index?: number
  email?: string
  phone_number?: string
  last_contact_date?: string
  street_address?: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
}

export interface Tag {
  id: string
  name: string
  category: string
  color?: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string

  // Location fields
  street_address?: string
  city?: string
  state?: string
  zip?: string
  latitude?: number
  longitude?: number
}

export interface TagCreate {
  name: string
  category?: string
  color?: string
  description?: string
}

export interface TagUpdate {
  name?: string
  category?: string
  color?: string
  description?: string
  street_address?: string
  city?: string
  state?: string
  zip?: string
  latitude?: number
  longitude?: number
}

export interface History {
  id: string
  change_type: 'prompt' | 'manual'
  field: string
  detail: string
  person_id: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface Entry {
  id: string
  content: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  processing_result?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  body: string
  direction: 'inbound' | 'outbound'
  person_id: string
  user_id: string
  created_at: string
  updated_at: string
  sent_at: string
  is_from_me?: boolean // Computed field for UI
}

export interface MessageCreate {
  body: string
  person_id: string
}

// Notebook Entry types
export interface NotebookEntry {
  id: string
  person_id: string
  user_id: string
  entry_date: string  // YYYY-MM-DD format (immutable after creation)
  content: string
  created_at: string
  updated_at: string
}

export interface NotebookEntryCreate {
  entry_date: string  // YYYY-MM-DD
  content: string
}

export interface NotebookEntryUpdate {
  content: string  // Only content is editable
}

// Search and filter types
export type PersonFilter = 'all' | 'needs-attention' | 'healthy' | 'dormant'
export type PersonSort = 'recent' | 'name' | 'health'
export type PanelType = 'messages' | 'profile' | 'activity'

// AI extraction types
export interface PersonExtraction {
  name: string
  attributes?: string
  email?: string
  phone_number?: string
}

export interface DuplicateWarning {
  extraction: PersonExtraction
  existing_id: string
  existing_name: string
  existing_notes?: string
  similarity: number
}

// Single matched person from backend
export interface PersonMatch {
  person_id: string
  person_name: string
  similarity: number
}

// Result of matching a name to existing people
export interface PersonMatchResult {
  extracted_name: string
  matches: PersonMatch[]  // Empty if no matches found
  is_ambiguous: boolean   // True if multiple matches found
}

export interface TagAssignmentMatch {
  tag_name: string
  operation: string
  matched_people: PersonMatchResult[]
}

export interface MemoryUpdateMatch {
  matched_person: PersonMatchResult
  entry_content: string
  parsed_date: string  // ISO format date
}

export interface ExtractionResponse {
  intent: 'create' | 'read' | 'update_tag' | 'update_memory' | 'update' | 'none'
  message?: string
  people?: PersonExtraction[]
  duplicates?: DuplicateWarning[]
  created_persons?: Person[]  // Actual Person objects created by the backend

  // For tag operations
  tag_assignments?: TagAssignmentMatch[]

  // For memory entries
  memory_updates?: MemoryUpdateMatch[]
}

export interface NarrativeRequest {
  narrative: string
}

export interface ConfirmPersonRequest {
  extraction: PersonExtraction
  action: 'create_new' | 'link_existing'
  existing_id?: string
}

export interface ConfirmTagAssignmentRequest {
  tag_name: string
  operation: string  // "add"
  person_ids: string[]
}

export interface ConfirmMemoryEntryRequest {
  person_id?: string
  person_name?: string  // Used when creating new person
  content: string
  date: string  // ISO format
}

// Map view types
export interface MapPerson {
  id: string
  name: string
  latitude: number
  longitude: number
  location_source: string
}