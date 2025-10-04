export interface EntryMetadata {
  url: string;
  article: string;
  section?: string;
  joins: string[];
  img_url?: string;
}

export interface WikipediaImage {
  source: string;
  width: number;
  height: number;
}

export interface Entry {
  id: string;
  data: string;
  metadata: EntryMetadata;
  created_at: Date;
  updated_at: Date;
}

export interface SearchResult {
  entry: Entry;
  similarity: number;
}