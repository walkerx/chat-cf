/**
 * HTML Sanitizer
 * Safely sanitize HTML content using DOMPurify
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html The HTML content to sanitize
 * @param extraTags Optional list of additional tags to allow (e.g. from regex scripts)
 */
export function sanitizeHTML(html: string, extraTags: string[] = []): string {
    return DOMPurify.sanitize(html, {
        // Allowed HTML tags
        ALLOWED_TAGS: [
            // Standard HTML
            'div', 'span', 'p', 'br', 'hr',
            'a', 'img', 'video', 'audio',
            'table', 'thead', 'tbody', 'tr', 'td', 'th',
            'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'strong', 'em', 'u', 's', 'code', 'pre',
            'blockquote',
            'details', 'summary',
            'marquee',
            'font', 'center', 'small', 'big',

            // Add dynamically provided tags
            ...extraTags
        ],

        // Allowed attributes
        ALLOWED_ATTR: [
            'style', 'class', 'id',
            'src', 'href', 'alt', 'title',
            'width', 'height',
            'scrollamount', 'direction',
            'data-*',
        ],

        // Forbidden attributes (security)
        FORBID_ATTR: [
            'onclick', 'onerror', 'onload', 'onmouseover',
            'onmouseout', 'onmouseenter', 'onmouseleave',
            'onfocus', 'onblur', 'onchange', 'onsubmit',
        ],

        // Allow data URIs for images (optional, can be disabled for more security)
        ALLOW_DATA_ATTR: false,

        // Keep HTML comments (optional)
        ALLOW_UNKNOWN_PROTOCOLS: false,
    });
}

/**
 * Sanitize with custom configuration
 */
export function sanitizeHTMLWithConfig(
    html: string,
    config: {
        allowedTags?: string[];
        allowedAttr?: string[];
        forbiddenAttr?: string[];
    }
): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: config.allowedTags,
        ALLOWED_ATTR: config.allowedAttr,
        FORBID_ATTR: config.forbiddenAttr,
    });
}
