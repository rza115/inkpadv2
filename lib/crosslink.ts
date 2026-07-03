/**
 * Cross-Link Utility
 * Parses [[Name]] syntax and renders links to characters or world entries
 */

export interface CrossLinkResolution {
  type: 'character' | 'world';
  id: string;
}

export type CrossLinkResolver = (name: string) => CrossLinkResolution | null;

/**
 * Render text with [[Name]] syntax as HTML with clickable links
 * @param text - Text containing [[Name]] patterns
 * @param resolver - Function to resolve names to characters or world entries
 * @returns HTML string with rendered links
 */
export function renderCrossLinks(text: string, resolver: CrossLinkResolver): string {
  if (!text) return '';
  
  const escaped = escapeHtml(text);
  
  return escaped.replace(/\[\[([^[\]]+)\]\]/g, (match, name) => {
    const trimmed = name.trim();
    const resolved = resolver(trimmed);
    
    if (resolved) {
      return `<a class="xlink-link" data-type="${resolved.type}" data-id="${resolved.id}">${escapeHtml(trimmed)}</a>`;
    }
    
    return `<span class="xlink-broken" title="Belum ada karakter/entry dengan nama ini">${escapeHtml(trimmed)}</span>`;
  });
}

/**
 * Strip [[Name]] syntax from text, leaving just the names
 * @param text - Text containing [[Name]] patterns
 * @returns Plain text with brackets removed
 */
export function stripCrossLinks(text: string): string {
  if (!text) return '';
  return text.replace(/\[\[([^[\]]+)\]\]/g, '$1');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}