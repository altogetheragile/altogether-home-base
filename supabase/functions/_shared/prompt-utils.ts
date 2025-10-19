/**
 * Prompt Utilities
 * Handles input sanitization, validation, and token estimation
 */

/**
 * Sanitize user input to prevent prompt injection attacks
 * Removes or escapes potentially malicious characters and patterns
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Limit length to prevent excessive token usage
  const MAX_LENGTH = 2000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Escape common prompt injection patterns
  const dangerousPatterns = [
    /ignore previous instructions/gi,
    /disregard all previous/gi,
    /forget everything/gi,
    /new instruction:/gi,
    /system:/gi,
    /assistant:/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      console.warn('Potential prompt injection detected:', sanitized.substring(0, 100));
      // Replace with safe placeholder
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }
  }

  return sanitized;
}

/**
 * Sanitize an object's string fields recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value) as any;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      ) as any;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    }
  }

  return sanitized;
}

/**
 * Estimate token count for a string (rough approximation)
 * 1 token ≈ 4 characters in English text
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  
  // More accurate estimation considering:
  // - Common words are often 1 token
  // - Special characters and numbers affect token count
  // - Average is ~4 chars per token for English
  
  const charCount = text.length;
  const wordCount = text.split(/\s+/).length;
  
  // Use a weighted average
  return Math.ceil((charCount / 4) * 0.7 + wordCount * 0.3);
}

/**
 * Validate that token count is within limits
 */
export function validateTokenLimit(
  prompt: string,
  maxTokens: number = 4000
): { valid: boolean; tokenCount: number; message?: string } {
  const tokenCount = estimateTokens(prompt);
  
  if (tokenCount > maxTokens) {
    return {
      valid: false,
      tokenCount,
      message: `Prompt is too long (${tokenCount} tokens). Maximum is ${maxTokens} tokens. Please shorten your input.`
    };
  }

  return { valid: true, tokenCount };
}

/**
 * Validate required fields based on story level
 */
export function validateRequiredFields(
  level: string,
  input: string,
  parentId?: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Input is always required
  if (!input || input.trim().length === 0) {
    errors.push('Input description is required');
  }

  if (input && input.trim().length < 5) {
    errors.push('Input description must be at least 5 characters');
  }

  // Feature, Story, and Task levels require a parent
  if (['feature', 'story', 'task'].includes(level) && !parentId) {
    errors.push(`A parent is required for ${level} generation`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format validation errors into a user-friendly message
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return `Validation errors:\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
}

/**
 * Generate a unique prompt version ID
 * Useful for A/B testing different prompt variations
 */
export function generatePromptVersion(level: string, variant: string = 'default'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${level}-${variant}-${timestamp}`;
}

/**
 * Log prompt metrics for analysis
 * (In production, this could be sent to analytics)
 */
export function logPromptMetrics(
  level: string,
  tokenCount: number,
  executionTime: number,
  success: boolean
): void {
  console.log(JSON.stringify({
    type: 'prompt_metrics',
    level,
    tokenCount,
    executionTimeMs: executionTime,
    success,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Extract and validate JSON from AI response
 * Handles cases where AI might include markdown code blocks
 */
export function extractJSON(response: string): any {
  if (!response) {
    throw new Error('Empty response from AI');
  }

  let cleaned = response.trim();

  // Remove markdown code blocks if present
  const codeBlockPattern = /```(?:json)?\s*([\s\S]*?)```/;
  const match = cleaned.match(codeBlockPattern);
  if (match) {
    cleaned = match[1].trim();
  }

  // Try to parse JSON
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse JSON:', cleaned.substring(0, 200));
    throw new Error('Invalid JSON response from AI');
  }
}

/**
 * Truncate text to a maximum length while preserving word boundaries
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Try to truncate at a word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}
