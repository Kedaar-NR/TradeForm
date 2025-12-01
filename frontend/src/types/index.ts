export interface ProjectGroup {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface ProjectGroupWithProjects extends ProjectGroup {
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  componentType: string;
  description?: string;
  projectGroupId?: string;
  status: 'draft' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tradeStudyReport?: string | null;
  reportGeneratedAt?: string | null;
  createdViaTemplateGroup?: boolean;
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
  originalFilename?: string;
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

export interface ProjectChange {
  id: string;
  projectId: string;
  userId: string;
  userName?: string | null;
  changeType: string;
  changeDescription: string;
  entityType?: string;
  entityId?: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

// Onboarding types
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';
export type UserDocumentType = 'criteria' | 'rating_doc' | 'report_template';
export type ProcessingStatus = 'uploaded' | 'processing' | 'ready' | 'failed';

export interface UserDocument {
  id: string;
  originalFilename: string;
  type: UserDocumentType;
  processingStatus: ProcessingStatus;
  processingError?: string;
  fileSize: number;
  createdAt: string;
}

export interface OnboardingStatusData {
  onboardingStatus: OnboardingStatus;
  criteriaCount: number;
  ratingDocsCount: number;
  reportTemplatesCount: number;
}

