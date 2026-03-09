/**
 * Utility functions for exporting and formatting story analysis results.
 */

/** Represents an item that may be a string or an object with text/content fields. */
export type AnalysisTextItem = string | { text?: string; content?: string; question?: string };

export interface SplitStory {
  title: string;
  description: string;
  acceptanceCriteria: AnalysisTextItem[];
}

export interface SpidrAnalysis {
  spike: AnalysisTextItem[];
  path: AnalysisTextItem[];
  interface: AnalysisTextItem[];
  data: AnalysisTextItem[];
  rules: AnalysisTextItem[];
}

export interface StoryAnalysisResult {
  analysisType: string;
  title?: string;
  description?: string;
  suggestions?: AnalysisTextItem[];
  acceptanceCriteria?: AnalysisTextItem[];
  refinementQuestions?: AnalysisTextItem[];
  splitStories?: SplitStory[];
  spidrAnalysis?: SpidrAnalysis;
}

/** Extract display text from an AnalysisTextItem. */
export function getItemText(item: AnalysisTextItem): string {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    return item.text || item.content || item.question || JSON.stringify(item);
  }
  return String(item);
}

/**
 * Format an analysis result as plain text for export/clipboard.
 * Pure function: returns the formatted string without side effects.
 */
export function formatForExport(
  analysisResult: StoryAnalysisResult | null,
  title: string,
  description: string
): string {
  let content = `Title: ${title}\n`;
  if (description) content += `Description: ${description}\n`;

  if (analysisResult) {
    content += `\nAnalysis Type: ${analysisResult.analysisType}\n`;

    if (analysisResult.acceptanceCriteria) {
      content += '\nAcceptance Criteria:\n';
      analysisResult.acceptanceCriteria.forEach((criteria, idx) => {
        content += `${idx + 1}. ${getItemText(criteria)}\n`;
      });
    }

    if (analysisResult.suggestions) {
      content += '\nSuggestions:\n';
      analysisResult.suggestions.forEach((suggestion, idx) => {
        content += `${idx + 1}. ${getItemText(suggestion)}\n`;
      });
    }

    if (analysisResult.splitStories) {
      content += '\nSplit Stories:\n';
      analysisResult.splitStories.forEach((story, idx) => {
        content += `\n${idx + 1}. ${story.title}\n`;
        content += `   Description: ${story.description}\n`;
        if (story.acceptanceCriteria.length > 0) {
          content += '   Acceptance Criteria:\n';
          story.acceptanceCriteria.forEach((criteria) => {
            content += `   - ${getItemText(criteria)}\n`;
          });
        }
      });
    }
  }

  return content;
}

/**
 * Trigger a file download with the given content.
 */
export function downloadAsFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
