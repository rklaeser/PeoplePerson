export interface Friend {
    id: string;
    name: string;
    intent: string;
    county: string;
    region: string;
    zip: number;
    body: string;
    birthday: string | null;
    mnemonic: string | null;
    createdAt: Date;
    updatedAt: Date;
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