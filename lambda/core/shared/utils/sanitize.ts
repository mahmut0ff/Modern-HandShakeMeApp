// Input sanitization utilities

/**
 * Sanitize HTML content to prevent XSS attacks
 * Simple implementation without external dependencies
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: URLs (can be used for XSS)
  sanitized = sanitized.replace(/data:/gi, '');
  
  // Only allow specific tags
  const allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br'];
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // For anchor tags, only keep href attribute
      if (tagName.toLowerCase() === 'a') {
        const hrefMatch = match.match(/href\s*=\s*["']([^"']*)["']/i);
        if (hrefMatch && hrefMatch[1] && !hrefMatch[1].toLowerCase().startsWith('javascript:')) {
          return match.startsWith('</') ? '</a>' : `<a href="${hrefMatch[1]}">`;
        }
        return match.startsWith('</') ? '</a>' : '<a>';
      }
      // For other allowed tags, strip all attributes
      return match.startsWith('</') ? `</${tagName}>` : `<${tagName}>`;
    }
    return '';
  });
  
  return sanitized;
}

/**
 * Escape special characters for SQL-like queries
 */
export function escapeSpecialChars(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x00/g, '\\0')
    .replace(/\x1a/g, '\\Z');
}

/**
 * Remove potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Remove control characters except newline and tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized.trim();
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  
  // Remove special characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    sanitized = sanitized.substring(0, 250) + '.' + ext;
  }
  
  return sanitized;
}
