// JSON contracts mirror the FastAPI backend (see ~/workspace/sai-sandesh/main.py).

export interface Discourse {
  title: string;
  date: string;
  occasion: string;
  volume: string;
  excerpt: string;
  theme: string;
}

export interface Video {
  title: string;
  url: string;
}

export interface Bhajan {
  title: string;
  url: string | null;
}

export interface Devotional {
  date: string;
  greeting: string;
  discourse: Discourse;
  reflection: string;
  video: Video | null;
  bhajan: Bhajan;
  seva_nudge: string;
  share_card: string | null;
  fallback: boolean;
}

export interface TopicSummary {
  slug: string;
  title: string;
}

export interface Definition {
  quote: string;
  citation: string;
}

export interface SourcedQuote {
  quote: string;
  citation?: string;
  source?: string;
}

export interface ActionStep {
  step: string;
  citation: string;
}

export interface TopicQA {
  slug: string;
  title: string;
  definition: Definition;
  vahinis: { quote: string; source: string }[];
  discourses: SourcedQuote[];
  actionable_steps: ActionStep[];
  make_it_real: string;
}

export interface SearchResult {
  title: string;
  volume: string;
  date: string;
  citation: string;
  excerpt: string;
}
