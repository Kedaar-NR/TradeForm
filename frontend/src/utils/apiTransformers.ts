/**
 * Transformation functions to convert API responses (snake_case) to frontend types (camelCase).
 * Centralizes the data transformation logic used across hooks and components.
 */

import type { Component, Criterion, Score, Project, ProjectGroup, DatasheetStatus, ProjectChange } from "../types";
import type {
    ApiComponent,
    ApiCriterion,
    ApiScore,
    ApiProject,
    ApiProjectGroup,
    ApiDatasheetStatus,
    ApiProjectChange,
} from "../types/api";

/**
 * Transforms API component data to frontend Component type.
 */
export function transformComponent(data: ApiComponent, fallbackProjectId?: string): Component {
    return {
        id: data.id,
        projectId: data.project_id || fallbackProjectId || "",
        manufacturer: data.manufacturer,
        partNumber: data.part_number,
        description: data.description,
        datasheetUrl: data.datasheet_url,
        datasheetFilePath: data.datasheet_file_path,
        availability: data.availability,
        source: data.source,
    };
}

/**
 * Transforms an array of API components.
 */
export function transformComponents(data: ApiComponent[], fallbackProjectId?: string): Component[] {
    return data.map((c) => transformComponent(c, fallbackProjectId));
}

/**
 * Transforms API criterion data to frontend Criterion type.
 */
export function transformCriterion(data: ApiCriterion, fallbackProjectId?: string): Criterion {
    return {
        id: data.id,
        projectId: data.project_id || fallbackProjectId || "",
        name: data.name,
        description: data.description,
        weight: data.weight,
        unit: data.unit,
        higherIsBetter: data.higher_is_better,
        minimumRequirement: data.minimum_requirement,
        maximumRequirement: data.maximum_requirement,
    };
}

/**
 * Transforms an array of API criteria.
 */
export function transformCriteria(data: ApiCriterion[], fallbackProjectId?: string): Criterion[] {
    return data.map((c) => transformCriterion(c, fallbackProjectId));
}

/**
 * Transforms API score data to frontend Score type.
 */
export function transformScore(data: ApiScore): Score {
    return {
        id: data.id,
        componentId: data.component_id,
        criterionId: data.criterion_id,
        rawValue: data.raw_value,
        score: data.score,
        rationale: data.rationale,
        extractionConfidence: data.extraction_confidence,
        manuallyAdjusted: data.manually_adjusted || false,
        adjustedBy: data.adjusted_by,
        adjustedAt: data.adjusted_at,
    };
}

/**
 * Transforms an array of API scores.
 */
export function transformScores(data: ApiScore[]): Score[] {
    return data.map(transformScore);
}

/**
 * Transforms API project data to frontend Project type.
 */
export function transformProject(data: ApiProject): Project {
    return {
        id: data.id,
        name: data.name,
        componentType: data.component_type,
        description: data.description,
        projectGroupId: data.project_group_id,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        tradeStudyReport: data.trade_study_report,
        reportGeneratedAt: data.report_generated_at,
    };
}

/**
 * Transforms an array of API projects.
 */
export function transformProjects(data: ApiProject[]): Project[] {
    return data.map(transformProject);
}

/**
 * Transforms API project group data to frontend ProjectGroup type.
 */
export function transformProjectGroup(data: ApiProjectGroup): ProjectGroup {
    return {
        id: data.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
    };
}

/**
 * Transforms an array of API project groups.
 */
export function transformProjectGroups(data: ApiProjectGroup[]): ProjectGroup[] {
    return data.map(transformProjectGroup);
}

/**
 * Transforms API datasheet status to frontend DatasheetStatus type.
 */
export function transformDatasheetStatus(data: ApiDatasheetStatus): DatasheetStatus {
    return {
        hasDatasheet: data.has_datasheet,
        parsed: data.parsed,
        numPages: data.num_pages,
        parsedAt: data.parsed_at,
        parseStatus: data.parse_status,
        parseError: data.parse_error,
        originalFilename: data.original_filename,
    };
}

/**
 * Transforms API project change to frontend ProjectChange type.
 */
export function transformProjectChange(data: ApiProjectChange): ProjectChange {
    return {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        userName: data.user_name,
        changeType: data.change_type,
        changeDescription: data.change_description,
        entityType: data.entity_type,
        entityId: data.entity_id,
        oldValue: data.old_value,
        newValue: data.new_value,
        createdAt: data.created_at,
    };
}

/**
 * Transforms an array of API project changes.
 */
export function transformProjectChanges(data: ApiProjectChange[]): ProjectChange[] {
    return data.map(transformProjectChange);
}

