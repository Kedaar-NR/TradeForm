import { useState, useEffect, useCallback } from "react";
import { Component, Score, Criterion } from "../types";
import DatasheetTab from "./DatasheetTab";
import { formatEnumValue } from "../utils/datasheetHelpers";
import { scoresApi, criteriaApi } from "../services/api";

interface ComponentDetailDrawerProps {
    component: Component;
    isOpen: boolean;
    onClose: () => void;
    projectId?: string;
}

type TabType = "datasheet" | "details" | "scores";

const ComponentDetailDrawer: React.FC<ComponentDetailDrawerProps> = ({
    component,
    isOpen,
    onClose,
    projectId,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>("datasheet");
    const [scores, setScores] = useState<Score[]>([]);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [isLoadingScores, setIsLoadingScores] = useState(false);

    const loadScores = useCallback(async () => {
        if (!projectId) return;

        setIsLoadingScores(true);
        try {
            const [scoresRes, criteriaRes] = await Promise.all([
                scoresApi.getByProject(projectId),
                criteriaApi.getByProject(projectId),
            ]);

            // Transform API response (snake_case) to frontend format (camelCase)
            const transformedScores: Score[] = scoresRes.data.map((s: any) => ({
                id: s.id,
                componentId: s.component_id,
                criterionId: s.criterion_id,
                rawValue: s.raw_value,
                score: s.score,
                rationale: s.rationale,
                extractionConfidence: s.extraction_confidence,
                manuallyAdjusted: s.manually_adjusted || false,
                adjustedBy: s.adjusted_by,
                adjustedAt: s.adjusted_at,
            }));

            // Filter scores for this component
            const componentScores = transformedScores.filter(
                (score) => score.componentId === component.id
            );

            // Transform criteria from snake_case to camelCase
            const transformedCriteria: Criterion[] = criteriaRes.data.map(
                (c: any) => ({
                    id: c.id,
                    projectId: c.project_id || projectId,
                    name: c.name,
                    description: c.description,
                    weight: c.weight,
                    unit: c.unit,
                    higherIsBetter: c.higher_is_better,
                    minimumRequirement: c.minimum_requirement,
                    maximumRequirement: c.maximum_requirement,
                })
            );

            setScores(componentScores);
            setCriteria(transformedCriteria);
        } catch (error) {
            console.error("Failed to load scores:", error);
            setScores([]);
            setCriteria([]);
        } finally {
            setIsLoadingScores(false);
        }
    }, [projectId, component.id]);

    // Fetch scores and criteria when scores tab is active or when component changes
    useEffect(() => {
        if (activeTab === "scores" && projectId && isOpen) {
            loadScores();
        }
    }, [activeTab, projectId, isOpen, loadScores, component.id]);

    // Get score for a specific criterion
    const getScoreForCriterion = (criterionId: string): Score | undefined => {
        return scores.find((score) => score.criterionId === criterionId);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-3/5 xl:w-1/2 bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 truncate">
                            {component.manufacturer}
                        </h2>
                        <p className="text-sm text-gray-600 font-mono">
                            {component.partNumber}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-white px-6">
                    <button
                        onClick={() => setActiveTab("datasheet")}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === "datasheet"
                                ? "border-black text-black"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Datasheet
                    </button>
                    <button
                        onClick={() => setActiveTab("details")}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === "details"
                                ? "border-black text-black"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab("scores")}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === "scores"
                                ? "border-black text-black"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Scores
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === "datasheet" && (
                        <DatasheetTab
                            component={component}
                            projectId={projectId}
                        />
                    )}
                    {activeTab === "details" && (
                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Manufacturer
                                    </label>
                                    <p className="text-base text-gray-900">
                                        {component.manufacturer}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Part Number
                                    </label>
                                    <p className="text-base text-gray-900 font-mono">
                                        {component.partNumber}
                                    </p>
                                </div>
                                {component.description && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <p className="text-base text-gray-900">
                                            {component.description}
                                        </p>
                                    </div>
                                )}
                                {component.datasheetUrl && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Datasheet URL
                                        </label>
                                        <a
                                            href={component.datasheetUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-base text-black hover:text-gray-700 underline break-all"
                                        >
                                            {component.datasheetUrl}
                                        </a>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Availability
                                    </label>
                                    <p className="text-base text-gray-900 capitalize">
                                        {formatEnumValue(
                                            component.availability
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Source
                                    </label>
                                    <p className="text-base text-gray-900 capitalize">
                                        {formatEnumValue(component.source)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "scores" && (
                        <div className="p-6">
                            {isLoadingScores ? (
                                <div className="text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                    <p className="mt-4 text-sm text-gray-500">
                                        Loading scores...
                                    </p>
                                </div>
                            ) : criteria.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        No Criteria Defined
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Define evaluation criteria for this
                                        project to see component scores.
                                    </p>
                                </div>
                            ) : scores.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        No Scores Available
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        This component hasn't been scored yet.
                                        Use the "Score All Components" button to
                                        generate AI scores.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Component Scores
                                        </h3>
                                        <button
                                            onClick={loadScores}
                                            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
                                            title="Refresh scores"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                />
                                            </svg>
                                            Refresh
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {criteria.map((criterion) => {
                                            const score = getScoreForCriterion(
                                                criterion.id
                                            );
                                            const hasScore =
                                                score !== undefined;

                                            return (
                                                <div
                                                    key={criterion.id}
                                                    className="border border-gray-200 rounded-lg p-4 bg-white"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <h4 className="text-base font-medium text-gray-900">
                                                                {criterion.name}
                                                            </h4>
                                                            {criterion.description && (
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {
                                                                        criterion.description
                                                                    }
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                <span>
                                                                    Weight:{" "}
                                                                    {
                                                                        criterion.weight
                                                                    }
                                                                </span>
                                                                {criterion.unit && (
                                                                    <span>
                                                                        Unit:{" "}
                                                                        {
                                                                            criterion.unit
                                                                        }
                                                                    </span>
                                                                )}
                                                                <span>
                                                                    {criterion.higherIsBetter
                                                                        ? "Higher is better"
                                                                        : "Lower is better"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {hasScore && (
                                                            <div className="ml-4 flex flex-col items-end">
                                                                <div className="text-2xl font-bold text-gray-900">
                                                                    {
                                                                        score.score
                                                                    }
                                                                    <span className="text-sm font-normal text-gray-500 ml-1">
                                                                        /10
                                                                    </span>
                                                                </div>
                                                                {score.extractionConfidence !==
                                                                    undefined && (
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        Confidence:{" "}
                                                                        {Math.round(
                                                                            score.extractionConfidence *
                                                                                100
                                                                        )}
                                                                        %
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {hasScore &&
                                                        score.rationale && (
                                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                                <p className="text-sm text-gray-700">
                                                                    <span className="font-medium">
                                                                        Rationale:{" "}
                                                                    </span>
                                                                    {
                                                                        score.rationale
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                    {hasScore &&
                                                        score.rawValue !==
                                                            undefined &&
                                                        score.rawValue !==
                                                            null && (
                                                            <div className="mt-2 text-sm text-gray-600">
                                                                <span className="font-medium">
                                                                    Raw Value:{" "}
                                                                </span>
                                                                {score.rawValue}
                                                                {criterion.unit &&
                                                                    ` ${criterion.unit}`}
                                                            </div>
                                                        )}
                                                    {!hasScore && (
                                                        <div className="mt-3 text-sm text-gray-400 italic">
                                                            No score available
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ComponentDetailDrawer;
