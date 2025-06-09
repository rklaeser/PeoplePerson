export interface Friend {
    id: string;
    name: string;
    group_id?: string;
    group_name?: string;
    body: string;
    intent: string;
    birthday: string | null;
    mnemonic: string | null;
    createdAt: string;
    updatedAt: string;
    profile_pic_index: number;
    Groups?: Group[];
}

export interface Group {
    id: string;
    name: string;
    People?: Friend[];
}

export interface Journal {
    id: string;
    personId: string;
    title: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Associate {
    id: string;
    name: string;
    intent: string;
}

export interface ChatButton {
    text: string;
    action: 'update' | 'create_new' | string;
    personId?: string;
    personData?: any;
  }
  
  export interface ChatMessage {
    role: 'user' | 'system';
    success: boolean;
    action: 'create' | 'update' | 'error' | 'clarify' | 'clarify_create' | string;
    message: string;
    people: Friend[];
    buttons?: ChatButton[];
  }