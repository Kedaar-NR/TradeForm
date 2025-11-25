/**
 * API response types for backend data structures.
 * These represent the snake_case format returned by the Python backend.
 */

// Component API response
export interface ApiComponent {
    id: string;
    project_id: string;
    manufacturer: string;
    part_number: string;
    description?: string;
    datasheet_url?: string;
    datasheet_file_path?: string;
    availability: "in_stock" | "limited" | "obsolete";
    source: "ai_discovered" | "manually_added";
}

// Criterion API response
export interface ApiCriterion {
    id: string;
    project_id: string;
    name: string;
    description?: string;
    weight: number;
    unit?: string;
    higher_is_better: boolean;
    minimum_requirement?: number;
    maximum_requirement?: number;
}

// Score API response
export interface ApiScore {
    id: string;
    component_id: string;
    criterion_id: string;
    raw_value?: number;
    score: number;
    rationale?: string;
    extraction_confidence?: number;
    manually_adjusted: boolean;
    adjusted_by?: string;
    adjusted_at?: string;
}

// Project API response
export interface ApiProject {
    id: string;
    name: string;
    component_type: string;
    description?: string;
    project_group_id?: string;
    status: "draft" | "in_progress" | "completed";
    created_at: string;
    updated_at: string;
    created_by?: string;
    trade_study_report?: string | null;
    report_generated_at?: string | null;
}

// Project Group API response
export interface ApiProjectGroup {
    id: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
}

// Project Change API response
export interface ApiProjectChange {
    id: string;
    project_id: string;
    user_id: string;
    user_name?: string | null;
    change_type: string;
    change_description: string;
    entity_type?: string;
    entity_id?: string;
    old_value?: string | null;
    new_value?: string | null;
    created_at: string;
}

// Datasheet Status API response
export interface ApiDatasheetStatus {
    has_datasheet: boolean;
    parsed: boolean;
    num_pages?: number;
    parsed_at?: string;
    parse_status?: string;
    parse_error?: string;
    original_filename?: string;
}

// Discovery response
export interface ApiDiscoveryResponse {
    status: string;
    discovered_count: number;
    components: ApiComponent[];
}

// Score response
export interface ApiScoreResponse {
    status: string;
    scores_created: number;
    scores_updated: number;
    total_scores: number;
}

// Report response
export interface ApiReportResponse {
    status: string;
    report: string;
    generated_at?: string;
}

// User Document API response
export interface ApiUserDocument {
    id: string;
    original_filename: string;
    type: "criteria" | "rating_doc" | "report_template";
    processing_status: "uploaded" | "processing" | "ready" | "failed";
    processing_error?: string;
    file_size: number;
    created_at: string;
}

