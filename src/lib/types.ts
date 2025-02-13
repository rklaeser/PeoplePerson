export interface Friend {
    id: string;
    name: string;
    intent: string;
    county: string;
    group_id: string;
    group_name: string;
    body: string;
    birthday: string;
    mnemonic: string;
  }

export interface Group {
    id: string;
    name: string;
  }

export interface Journal {
    id: string;
    person_id: string;
    title: string;
    body: string;
  }

  export interface Associate {
    primary_id: string;
    associate_id: string;
  }