// sanitize.js - XSS Protection Utility
// Sanitize HTML to prevent XSS attacks

/**
 * Sanitize HTML string to prevent XSS attacks
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - Sanitized HTML string
 */
function sanitizeHTML(html) {
    if (!html) return '';
    
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Create a safe HTML element with text content
 * @param {string} tag - The HTML tag to create
 * @param {string} text - The text content
 * @param {object} attributes - Optional attributes to set
 * @returns {HTMLElement} - The created element
 */
function createSafeElement(tag, text, attributes = {}) {
    const element = document.createElement(tag);
    element.textContent = text;
    
    Object.keys(attributes).forEach(key => {
        if (key === 'class') {
            element.className = attributes[key];
        } else if (key === 'style' && typeof attributes[key] === 'object') {
            Object.assign(element.style, attributes[key]);
        } else {
            element.setAttribute(key, attributes[key]);
        }
    });
    
    return element;
}

/**
 * Sanitize and render HTML with limited safe tags
 * Allows basic formatting like <br>, <b>, <i>, <strong>, <em>
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - Sanitized HTML string with safe tags
 */
function sanitizeHTMLWithTags(html) {
    if (!html) return '';
    
    // Create a temporary div to parse HTML
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Allowed tags and their attributes
    const allowedTags = {
        'b': [],
        'i': [],
        'strong': [],
        'em': [],
        'u': [],
        'br': [],
        'p': [],
        'span': ['class'],
        'div': ['class']
    };
    
    // Recursively clean nodes
    function cleanNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.cloneNode(false);
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            
            // If tag is not allowed, return only text content
            if (!allowedTags[tagName]) {
                return document.createTextNode(node.textContent);
            }
            
            // Create new clean element
            const cleanElement = document.createElement(tagName);
            const allowedAttrs = allowedTags[tagName];
            
            // Copy allowed attributes
            allowedAttrs.forEach(attr => {
                if (node.hasAttribute(attr)) {
                    cleanElement.setAttribute(attr, node.getAttribute(attr));
                }
            });
            
            // Recursively clean children
            Array.from(node.childNodes).forEach(child => {
                const cleanChild = cleanNode(child);
                if (cleanChild) {
                    cleanElement.appendChild(cleanChild);
                }
            });
            
            return cleanElement;
        }
        
        return null;
    }
    
    const cleanDiv = document.createElement('div');
    Array.from(div.childNodes).forEach(child => {
        const cleanChild = cleanNode(child);
        if (cleanChild) {
            cleanDiv.appendChild(cleanChild);
        }
    });
    
    return cleanDiv.innerHTML;
}

/**
 * Escape HTML entities
 * @param {string} text - The text to escape
 * @returns {string} - Escaped text
 */
function escapeHTML(text) {
    if (!text) return '';
    
    const entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    };
    
    return String(text).replace(/[&<>"'\/]/g, s => entityMap[s]);
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 * @param {string} url - The URL to sanitize
 * @returns {string} - Sanitized URL or empty string if dangerous
 */
function sanitizeURL(url) {
    if (!url) return '';
    
    const trimmed = url.trim().toLowerCase();
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(protocol => trimmed.startsWith(protocol))) {
        return '';
    }
    
    return url;
}

/**
 * Safe innerHTML replacement - sets content using textContent for safety
 * Use this instead of element.innerHTML when setting user-generated content
 * @param {HTMLElement} element - The element to update
 * @param {string} content - The content to set
 * @param {boolean} allowBasicHTML - If true, allows basic formatting tags
 */
function setHTMLSafely(element, content, allowBasicHTML = false) {
    if (!element) return;
    
    if (allowBasicHTML) {
        element.innerHTML = sanitizeHTMLWithTags(content);
    } else {
        element.textContent = content;
    }
}

/**
 * Create HTML template safely by replacing placeholders with escaped values
 * @param {string} template - HTML template with {{placeholder}} markers
 * @param {object} values - Object with values to replace
 * @returns {string} - HTML string with escaped values
 */
function createSafeTemplate(template, values) {
    let result = template;
    
    Object.keys(values).forEach(key => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        const safeValue = escapeHTML(values[key]);
        result = result.replace(placeholder, safeValue);
    });
    
    return result;
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.sanitizeHTML = sanitizeHTML;
    window.createSafeElement = createSafeElement;
    window.sanitizeHTMLWithTags = sanitizeHTMLWithTags;
    window.escapeHTML = escapeHTML;
    window.sanitizeURL = sanitizeURL;
    window.setHTMLSafely = setHTMLSafely;
    window.createSafeTemplate = createSafeTemplate;
}
