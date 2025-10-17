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
  intent: 'romantic' | 'core' | 'archive' | 'new' | 'invest' | 'associate'
  birthday?: string
  mnemonic?: string
  zip?: string
  profile_pic_index: number
  phone_number?: string
  user_id: string
  created_at: string
  updated_at: string
  last_message?: string // For list display
}

export interface PersonCreate {
  name: string
  body?: string
  intent?: 'romantic' | 'core' | 'archive' | 'new' | 'invest' | 'associate'
  birthday?: string
  mnemonic?: string
  zip?: string
  profile_pic_index?: number
  phone_number?: string
}

export interface PersonUpdate {
  name?: string
  body?: string
  intent?: 'romantic' | 'core' | 'archive' | 'new' | 'invest' | 'associate'
  birthday?: string
  mnemonic?: string
  zip?: string
  profile_pic_index?: number
  phone_number?: string
}

export interface Group {
  id: string
  name: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface GroupCreate {
  name: string
  description?: string
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
}

export interface TagCreate {
  name: string
  category?: string
  color?: string
  description?: string
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

// Search and filter types
export type PersonFilter = 'all' | 'unread' | 'important'
export type PersonSort = 'recent' | 'name' | 'intent'
export type PanelType = 'messages' | 'profile' | 'activity'