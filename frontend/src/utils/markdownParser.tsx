/**
 * Markdown parsing utilities for rendering trade study reports.
 * Extracted from TradeStudyReportDialog for reusability and maintainability.
 */

import React from "react";
import { getScoreTextColor, getScoreBgColor } from "./scoreHelpers";

/**
 * Parse and color-code scores in text (e.g., "8/10" or "7.5/10")
 */
export const parseScoreText = (text: string): React.ReactNode[] => {
    const scoreRegex = /(\d+(?:\.\d+)?)\s*\/\s*10/g;
    const matches = Array.from(text.matchAll(scoreRegex));

    if (matches.length === 0) {
        return [text];
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    for (const match of matches) {
        const matchIndex = match.index!;
        if (matchIndex > lastIndex) {
            parts.push(text.substring(lastIndex, matchIndex));
        }
        const score = parseFloat(match[1]);
        parts.push(
            <span key={`score-${matchIndex}`} className={getScoreTextColor(score)}>
                {match[0]}
            </span>
        );
        lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts;
};

/**
 * Parse bold text (**text**) and scores
 */
export const parseInlineFormatting = (text: string): React.ReactNode[] => {
    const boldRegex = /\*\*(.+?)\*\*/g;
    const matches = Array.from(text.matchAll(boldRegex));

    if (matches.length === 0) {
        return parseScoreText(text);
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    for (const match of matches) {
        const matchIndex = match.index!;
        if (matchIndex > lastIndex) {
            const beforeText = text.substring(lastIndex, matchIndex);
            parts.push(...parseScoreText(beforeText));
        }
        parts.push(
            <strong key={`bold-${matchIndex}`} className="font-semibold text-gray-900">
                {parseScoreText(match[1])}
            </strong>
        );
        lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(...parseScoreText(text.substring(lastIndex)));
    }

    return parts;
};

/**
 * Check if a line is a table row (must have at least 2 pipes for valid cell structure)
 */
export const isTableRow = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false;
    const pipeCount = (trimmed.match(/\|/g) || []).length;
    return pipeCount >= 2;
};

/**
 * Check if a line is a table separator (|---|---|)
 */
export const isTableSeparator = (line: string): boolean => {
    const trimmed = line.trim();
    return /^\|[\s\-:|]+\|$/.test(trimmed);
};

/**
 * Parse a table row into cells (handles escaped pipes \|)
 */
export const parseTableRow = (line: string): string[] => {
    const content = line.trim().slice(1, -1);
    const placeholder = "\x00ESCAPED_PIPE\x00";
    const withPlaceholders = content.replace(/\\\|/g, placeholder);
    const cells = withPlaceholders.split("|");
    return cells.map((cell) =>
        cell.replace(new RegExp(placeholder, "g"), "|").trim()
    );
};

/**
 * Render a markdown table
 */
export const renderTable = (tableLines: string[], startIndex: number): React.ReactNode => {
    const rows = tableLines.filter((line) => !isTableSeparator(line));
    if (rows.length === 0) return null;

    const headerCells = parseTableRow(rows[0]);
    const bodyRows = rows.slice(1).map((row) => parseTableRow(row));

    return (
        <div key={`table-${startIndex}`} className="my-6 overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gray-800 text-white">
                    <tr>
                        {headerCells.map((cell, i) => (
                            <th
                                key={`th-${startIndex}-${i}`}
                                className="px-4 py-3 text-left text-sm font-semibold border-b border-gray-300"
                            >
                                {parseInlineFormatting(cell)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {bodyRows.map((row, rowIdx) => {
                        const hasHighScore = row.some((cell) => {
                            const scoreMatch = cell.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
                            return scoreMatch && parseFloat(scoreMatch[1]) >= 8;
                        });
                        const isRecommended =
                            row.some((cell) => cell.toLowerCase().includes("recommended")) ||
                            (rowIdx === 0 && row.length > 0 && row[0].trim() === "1");

                        return (
                            <tr
                                key={`row-${startIndex}-${rowIdx}`}
                                className={`${
                                    isRecommended || hasHighScore
                                        ? "bg-green-50 font-medium"
                                        : rowIdx % 2 === 0
                                          ? "bg-white"
                                          : "bg-gray-50"
                                } hover:bg-blue-50 transition-colors`}
                            >
                                {row.map((cell, cellIdx) => {
                                    const scoreMatch = cell.match(/^(\d+(?:\.\d+)?)\s*\/\s*10$/);
                                    const totalMatch = cell.match(/^(\d+(?:\.\d+)?)$/);
                                    let cellClass = "px-4 py-3 text-sm border-b border-gray-200";

                                    if (scoreMatch) {
                                        const score = parseFloat(scoreMatch[1]);
                                        cellClass += ` ${getScoreBgColor(score)}`;
                                    } else if (totalMatch && cellIdx === row.length - 1) {
                                        const score = parseFloat(totalMatch[1]);
                                        if (score <= 10) {
                                            cellClass += ` ${getScoreBgColor(score)} font-semibold`;
                                        }
                                    }

                                    return (
                                        <td key={`cell-${startIndex}-${rowIdx}-${cellIdx}`} className={cellClass}>
                                            {parseInlineFormatting(cell)}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

/**
 * Check if a line is a bullet point
 */
export const isBulletPoint = (line: string): boolean => {
    const trimmed = line.trim();
    return /^[-*]\s+/.test(trimmed);
};

/**
 * Check if a line is a numbered list item
 */
export const isNumberedListItem = (line: string): boolean => {
    const trimmed = line.trim();
    return /^\d+\.\s+/.test(trimmed);
};

/**
 * Check if a line is a special element (not plain paragraph text)
 */
const isSpecialLine = (lineContent: string): boolean => {
    const t = lineContent.trim();
    if (t === "") return true;
    if (t.startsWith("#")) return true;
    if (isTableRow(t) || isTableSeparator(t)) return true;
    if (isBulletPoint(t)) return true;
    if (isNumberedListItem(t)) return true;
    if (/^[-*_]{3,}$/.test(t)) return true;
    return false;
};

/**
 * Main markdown parser that groups and renders content
 */
export const parseMarkdown = (report: string): React.ReactNode[] => {
    const lines = report.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines
        if (trimmed === "") {
            elements.push(<div key={`space-${i}`} className="h-2" />);
            i++;
            continue;
        }

        // Handle tables - collect consecutive table lines
        if (isTableRow(trimmed)) {
            const tableLines: string[] = [];
            const tableStart = i;
            while (i < lines.length && (isTableRow(lines[i].trim()) || isTableSeparator(lines[i].trim()))) {
                tableLines.push(lines[i]);
                i++;
            }
            elements.push(renderTable(tableLines, tableStart));
            continue;
        }

        // Handle headings
        if (trimmed.startsWith("#")) {
            const level = trimmed.match(/^#+/)?.[0].length || 1;
            const text = trimmed.replace(/^#+\s*/, "").trim();

            if (level === 1) {
                elements.push(
                    <h1
                        key={`h1-${i}`}
                        className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0 border-b-2 border-gray-200 pb-2"
                    >
                        {parseInlineFormatting(text)}
                    </h1>
                );
            } else if (level === 2) {
                elements.push(
                    <h2 key={`h2-${i}`} className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                        {parseInlineFormatting(text)}
                    </h2>
                );
            } else if (level === 3) {
                elements.push(
                    <h3 key={`h3-${i}`} className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                        {parseInlineFormatting(text)}
                    </h3>
                );
            } else {
                elements.push(
                    <h4 key={`h4-${i}`} className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                        {parseInlineFormatting(text)}
                    </h4>
                );
            }
            i++;
            continue;
        }

        // Handle bullet lists - collect consecutive bullet items
        if (isBulletPoint(trimmed)) {
            const listItems: string[] = [];
            const listStart = i;
            while (i < lines.length && isBulletPoint(lines[i].trim())) {
                const itemText = lines[i].trim().replace(/^[-*]\s+/, "");
                listItems.push(itemText);
                i++;
            }
            elements.push(
                <ul key={`ul-${listStart}`} className="my-4 ml-6 space-y-2">
                    {listItems.map((item, idx) => (
                        <li key={`ul-${listStart}-li-${idx}`} className="text-gray-700 leading-7 flex items-start">
                            <span className="text-blue-500 mr-2 mt-1">•</span>
                            <span>{parseInlineFormatting(item)}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Handle numbered lists - collect consecutive numbered items
        if (isNumberedListItem(trimmed)) {
            const listItems: string[] = [];
            const listStart = i;
            while (i < lines.length && isNumberedListItem(lines[i].trim())) {
                const itemText = lines[i].trim().replace(/^\d+\.\s+/, "");
                listItems.push(itemText);
                i++;
            }
            elements.push(
                <ol key={`ol-${listStart}`} className="my-4 ml-6 space-y-2 list-decimal list-inside">
                    {listItems.map((item, idx) => (
                        <li key={`ol-${listStart}-li-${idx}`} className="text-gray-700 leading-7">
                            {parseInlineFormatting(item)}
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // Handle horizontal rules
        if (/^[-*_]{3,}$/.test(trimmed)) {
            elements.push(<hr key={`hr-${i}`} className="my-6 border-gray-300" />);
            i++;
            continue;
        }

        // Regular paragraph - collect consecutive non-special lines
        const paragraphLines: string[] = [];
        const paragraphStart = i;

        while (i < lines.length && !isSpecialLine(lines[i])) {
            paragraphLines.push(lines[i].trim());
            i++;
        }

        if (paragraphLines.length > 0) {
            const paragraphText = paragraphLines.join(" ");
            elements.push(
                <p key={`p-${paragraphStart}`} className="mb-4 text-gray-700 leading-7">
                    {parseInlineFormatting(paragraphText)}
                </p>
            );
        }
    }

    return elements;
};

