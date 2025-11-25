/**
 * Utility functions for score-related styling and formatting.
 * Used in Results, TradeStudyReportDialog, and other scoring components.
 */

/**
 * Returns a hex color code based on score value.
 * Used for chart colors and visual indicators.
 * 1-4: red, 5-7: yellow, 8: blue, 9-10: green
 */
export function getScoreHexColor(score: number): string {
    if (score >= 9) return "#10b981"; // green-500
    if (score === 8) return "#3b82f6"; // blue-500
    if (score >= 5) return "#eab308"; // yellow-500
    return "#ef4444"; // red-500
}

/**
 * Returns Tailwind text color classes for inline score display.
 * Used in TradeStudyReportDialog for markdown score rendering.
 * 1-4: red, 5-7: yellow, 8: blue, 9-10: green
 */
export function getScoreTextColor(score: number): string {
    if (score >= 9) return "text-green-600 font-semibold";
    if (score === 8) return "text-blue-600 font-semibold";
    if (score >= 5) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
}

/**
 * Returns Tailwind background color classes for score cells.
 * Used in tables for score cell highlighting.
 * 1-4: red, 5-7: yellow, 8: blue, 9-10: green
 */
export function getScoreBgColor(score: number): string {
    if (score >= 9) return "bg-green-50";
    if (score === 8) return "bg-blue-50";
    if (score >= 5) return "bg-yellow-50";
    return "bg-red-50";
}

/**
 * Returns combined Tailwind classes for score badges/pills.
 * Includes both background and text colors.
 * 1-4: red, 5-7: yellow, 8: blue, 9-10: green
 */
export function getScoreColorClass(score: number): string {
    if (score >= 9) return "bg-green-100 text-green-700";
    if (score === 8) return "bg-blue-100 text-blue-700";
    if (score >= 5) return "bg-yellow-100 text-yellow-700";
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

