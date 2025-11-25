/**
 * Utility functions for score-related styling and formatting.
 * Used in Results, TradeStudyReportDialog, and other scoring components.
 */

/**
 * Returns a hex color code based on score value.
 * Used for chart colors and visual indicators.
 */
export function getScoreHexColor(score: number): string {
    if (score >= 8) return "#10b981"; // green-500
    if (score >= 6) return "#eab308"; // yellow-500
    return "#ef4444"; // red-500
}

/**
 * Returns Tailwind text color classes for inline score display.
 * Used in TradeStudyReportDialog for markdown score rendering.
 */
export function getScoreTextColor(score: number): string {
    if (score >= 8) return "text-green-600 font-semibold";
    if (score >= 6) return "text-yellow-600 font-semibold";
    if (score >= 4) return "text-orange-500 font-semibold";
    return "text-red-600 font-semibold";
}

/**
 * Returns Tailwind background color classes for score cells.
 * Used in tables for score cell highlighting.
 */
export function getScoreBgColor(score: number): string {
    if (score >= 8) return "bg-green-50";
    if (score >= 6) return "bg-yellow-50";
    if (score >= 4) return "bg-orange-50";
    return "bg-red-50";
}

/**
 * Returns combined Tailwind classes for score badges/pills.
 * Includes both background and text colors.
 */
export function getScoreColorClass(score: number): string {
    if (score >= 8) return "bg-gray-200 text-gray-900";
    if (score >= 6) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
}

/**
 * Formats a score for display (e.g., "8.5" or "8.50")
 */
export function formatScore(score: number, decimals: number = 2): string {
    return score.toFixed(decimals);
}

/**
 * Formats a score with suffix (e.g., "8.5/10")
 */
export function formatScoreWithMax(
    score: number,
    max: number = 10,
    decimals: number = 2
): string {
    return `${formatScore(score, decimals)}/${max}`;
}

