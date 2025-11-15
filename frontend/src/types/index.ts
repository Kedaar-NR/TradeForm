export interface Project {
  id: string;
  name: string;
  componentType: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Criterion {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  weight: number;
  unit?: string;
  higherIsBetter: boolean;
  minimumRequirement?: number;
  maximumRequirement?: number;
}

export interface Component {
  id: string;
  projectId: string;
  manufacturer: string;
  partNumber: string;
  description?: string;
  datasheetUrl?: string;
  datasheetFilePath?: string;
  availability: 'in_stock' | 'limited' | 'obsolete';
  source: 'ai_discovered' | 'manually_added';
}

export interface Score {
  id: string;
  componentId: string;
  criterionId: string;
  rawValue?: number;
  score: number; // 1-10
  rationale?: string;
  extractionConfidence?: number; // 0-1
  manuallyAdjusted: boolean;
  adjustedBy?: string;
  adjustedAt?: string;
}

export interface DatasheetExtraction {
  criterionId: string;
  criterionName: string;
  value: string | number;
  unit?: string;
  confidence: number;
  rawText?: string;
}

export interface ComponentWithScores extends Component {
  scores: Record<string, Score>;
  totalScore?: number;
  rank?: number;
}

export interface ProjectWithDetails extends Project {
  criteria: Criterion[];
  components: ComponentWithScores[];
}

export interface DatasheetStatus {
  hasDatasheet: boolean;
  parsed: boolean;
  numPages?: number;
  parsedAt?: string;
  parseStatus?: string;
  parseError?: string;
}

export interface DatasheetCitation {
  pageNumber: number;
  snippet: string;
}

export interface DatasheetQueryAnswer {
  answer: string;
  citations: DatasheetCitation[];
  confidence?: number;
}

export interface DatasheetSuggestionsResponse {
  suggestions: string[];
}
