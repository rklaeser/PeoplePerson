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
}

export interface MessageCreate {
  body: string
  person_id: string
}