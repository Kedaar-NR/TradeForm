/**
 * Utility functions for sensitivity analysis in trade studies.
 * Calculates how changing criterion weights affects component rankings.
 */

import type { Criterion } from "../types";

export interface ComponentScore {
    id: string;
    manufacturer: string;
    partNumber: string;
    criteria: Record<string, { score: number; rationale: string; weight: number }>;
    totalScore: number;
    rank: number;
}

export interface SensitivityResult {
    component: string;
    score: number;
}

/**
 * Calculates how component rankings change when a criterion's weight is adjusted.
 */
export function calculateSensitivity(
    components: ComponentScore[],
    criteria: Criterion[],
    criterionName: string,
    weightChange: number
): SensitivityResult[] {
    if (!components.length || !criteria.length) return [];

    const criterion = criteria.find((c) => c.name === criterionName);
    if (!criterion) return [];

    const newWeight = Math.max(1, Math.min(10, criterion.weight + weightChange));

    // Calculate total weight and build weight map in single pass
    const weightMap = new Map<string, number>();
    let totalWeight = 0;
    for (const c of criteria) {
        const weight = c.name === criterionName ? newWeight : c.weight;
        weightMap.set(c.name, weight);
        totalWeight += weight;
    }

    return components
        .map((comp) => {
            let weightedSum = 0;
            for (const c of criteria) {
                const score = comp.criteria[c.name]?.score || 0;
                weightedSum += score * (weightMap.get(c.name) || 0);
            }
            return {
                component: `${comp.manufacturer} ${comp.partNumber}`,
                score: weightedSum / totalWeight,
            };
        })
        .sort((a, b) => b.score - a.score);
}

/**
 * Prepares data for bar chart visualization
 */
export function prepareBarChartData(components: ComponentScore[]) {
    return components.map((comp) => ({
        name: `${comp.manufacturer} ${comp.partNumber}`,
        ...Object.fromEntries(
            Object.entries(comp.criteria).map(([key, val]) => [key, val.score])
        ),
        total: comp.totalScore,
    }));
}

/**
 * Prepares data for spider/radar chart visualization
 */
export function prepareSpiderChartData(component: ComponentScore | null) {
    if (!component) return [];
    
    return [
        { criterion: "", value: 0, fullMark: 10 },
        ...Object.entries(component.criteria).map(([name, data]) => ({
            criterion: name,
            value: data.score,
            fullMark: 10,
        })),
    ];
}

