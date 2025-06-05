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
}

export interface Group {
    id: string;
    name: string;
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