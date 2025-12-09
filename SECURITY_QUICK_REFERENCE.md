# 🛡️ Security Quick Reference Guide

## For Developers: Preventing XSS Attacks

### ❌ DANGEROUS - Never Do This:
```javascript
// DON'T: Direct innerHTML with user input
element.innerHTML = userInput;
element.innerHTML = `<div>${user.name}</div>`;
modalContent.innerHTML = `<p>${message}</p>`;
```

### ✅ SAFE - Always Do This:

#### Option 1: Use textContent (Recommended)
```javascript
element.textContent = userInput; // Automatically escapes HTML
```

#### Option 2: Use the Sanitize Utility
```javascript
// For plain text with line breaks
setHTMLSafely(element, userInput, false);

// For text with basic formatting (bold, italic, etc.)
setHTMLSafely(element, userInput, true);

// Manual escaping
const safeText = escapeHTML(userInput);
element.innerHTML = `<p>${safeText}</p>`;

// For complex templates
const safeHTML = createSafeTemplate(
  '<div class="user">{{name}}</div>',
  { name: user.name }
);
element.innerHTML = safeHTML;
```

#### Option 3: Create Safe Elements
```javascript
const div = createSafeElement('div', userText, { 
  class: 'my-class',
  'data-id': userId 
});
parentElement.appendChild(div);
```

---

## Common Scenarios

### 1. Displaying User Names
```javascript
// ✅ SAFE
nameElement.textContent = student.firstName;

// ❌ DANGEROUS
nameElement.innerHTML = student.firstName;
```

### 2. Displaying Messages/Chat
```javascript
// ✅ SAFE
const messageDiv = document.createElement('div');
messageDiv.className = 'message';
messageDiv.textContent = message.content;

// OR use the utility
setHTMLSafely(messageDiv, message.content, true); // allows <br>, <b>, etc.
```

### 3. Building Lists
```javascript
// ✅ SAFE
const html = users.map(user => {
  const safeName = escapeHTML(user.name);
  const safeEmail = escapeHTML(user.email);
  return `<li>${safeName} - ${safeEmail}</li>`;
}).join('');
listElement.innerHTML = html;

// OR even better
users.forEach(user => {
  const li = createSafeElement('li', `${user.name} - ${user.email}`);
  listElement.appendChild(li);
});
```

### 4. URLs from User Input
```javascript
// ✅ SAFE
const safeURL = sanitizeURL(userProvidedURL);
if (safeURL) {
  linkElement.href = safeURL;
} else {
  console.warn('Invalid or dangerous URL blocked');
}
```

---

## Available Sanitize Functions

All functions are globally available (loaded in sanitize.js):

| Function | Purpose | Example |
|----------|---------|---------|
| `sanitizeHTML(html)` | Escape all HTML | `sanitizeHTML('<script>alert("xss")</script>')` |
| `escapeHTML(text)` | Escape HTML entities | `escapeHTML('A & B < C')` |
| `sanitizeHTMLWithTags(html)` | Allow safe tags only | Allows `<b>`, `<i>`, `<br>`, etc. |
| `createSafeElement(tag, text, attrs)` | Create safe DOM element | `createSafeElement('div', 'text', {class: 'my-class'})` |
| `sanitizeURL(url)` | Validate URL | Blocks `javascript:`, `data:`, etc. |
| `setHTMLSafely(elem, content, allowHTML)` | Safe innerHTML | `setHTMLSafely(div, text, true)` |
| `createSafeTemplate(tmpl, values)` | Template with escaping | `createSafeTemplate('{{name}}', {name: 'John'})` |

---

## Rate Limiting Information

### Authentication Endpoints
- **Login/Register**: 5 attempts per 15 minutes per IP
- **Password Reset**: 3 attempts per hour per IP

### API Endpoints
- **General API**: 100 requests per 15 minutes per IP

### What to Tell Users
If rate limited, users will see:
- "Too many authentication attempts, please try again after 15 minutes"
- "Too many password attempts, please try again after an hour"
- "Too many requests from this IP, please try again later"

---

## Testing for XSS Vulnerabilities

### Test Inputs (Use in Development Only!)
```javascript
// These should be escaped/blocked:
const xssTests = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror="alert(\'XSS\')">',
  'javascript:alert("XSS")',
  '<svg onload="alert(\'XSS\')">',
  '"><script>alert(String.fromCharCode(88,83,83))</script>'
];

// Test each input - none should execute scripts
xssTests.forEach(test => {
  element.textContent = test; // Should display as text
  console.log('Safe:', test);
});
```

---

## Security Headers (Automatic)

These are automatically set by Helmet:
- ✅ Content-Security-Policy
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Strict-Transport-Security (production)

---

## When to Use Each Method

### Use `textContent`:
- Simple text display
- User names, emails
- Plain messages
- Any time formatting is NOT needed

### Use `setHTMLSafely()`:
- Need basic formatting (bold, italic)
- Multi-line text with line breaks
- Known safe content structure

### Use `createSafeElement()`:
- Building complex UI programmatically
- Need full DOM manipulation
- Creating lists, tables, cards

### Use `escapeHTML()` in templates:
- Building HTML strings
- Server-side rendered content
- Email templates

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Trusting "Admin" Input
```javascript
// Even admin input should be sanitized
element.innerHTML = adminMessage; // STILL DANGEROUS
```

### ❌ Mistake 2: Partial Escaping
```javascript
// This is still vulnerable
element.innerHTML = `<div class="${escapeHTML(className)}">${userInput}</div>`;
// userInput is not escaped!
```

### ❌ Mistake 3: Sanitizing Too Late
```javascript
// Store sanitized data
user.name = escapeHTML(user.name); // ❌ Don't modify source data
// Instead, sanitize when displaying
element.textContent = user.name; // ✅ Sanitize on output
```

---

## Checklist Before Deploying

- [ ] No direct use of `innerHTML` with user data
- [ ] All user input is escaped or sanitized
- [ ] URLs are validated with `sanitizeURL()`
- [ ] Rate limiting is appropriate for your traffic
- [ ] CSP is not blocking necessary resources
- [ ] Test with XSS payloads (in development)
- [ ] Review browser console for CSP violations

---

## Need Help?

1. Check `SECURITY_IMPLEMENTATION.md` for full details
2. Review `client/public/js/sanitize.js` for all utility functions
3. Test in development with browser DevTools console
4. Use `npm audit` to check for vulnerable dependencies

---

**Remember**: Security is not a one-time task. Always sanitize user input!
