export interface Stratagem {
  name: string;
  keys: string[];
  uses: string;
  imageUrl: string;
  codename: string | null;
  cooldown: number | null;
  activation: number | null;
}

export interface StratagemCategory {
  name: string;
  entries: Stratagem[];
}

export interface StratagemMap {
  [key: string]: StratagemCategory;
}
