# Content Security Policy (CSP) Fix - Quiz Questions Proxy

## Problem
The gamified quiz system was failing with a CSP error:
```
Refused to connect to raw.githubusercontent.com because it violates the document's Content Security Policy directive "connect-src 'self'"
```

The frontend JavaScript was attempting to directly fetch quiz questions from GitHub, but the CSP policy only allows connections to same-origin (`'self'`).

## Root Cause
- **Frontend attempted direct GitHub access**: `fetchSkillQuestions()` called `fetch('https://raw.githubusercontent.com/...')`
- **CSP blocked external requests**: Content Security Policy directive `connect-src 'self'` only allows same-origin connections
- **No browser bypass possible**: CSP restrictions are enforced client-side and cannot be bypassed from the browser

## Solution
Created a backend proxy endpoint that:
1. Receives quiz requests from the frontend
2. Fetches markdown from GitHub on the server (no CSP restrictions on backend)
3. Parses questions on the backend
4. Returns formatted JSON to the frontend

## Implementation

### Backend Changes (server/api/routes/assessments.js)
**New Endpoint**: `GET /api/assessments/quiz-questions/:skill`

```javascript
router.get('/quiz-questions/:skill', async (req, res) => {
  // Maps skill names to GitHub file paths
  const skillToGitHubPath = {
    'python': 'python/python-quiz.md',
    'javascript': 'javascript/javascript-quiz.md',
    'java': 'java/java-quiz.md',
    // ... 25+ more skills
  };
  
  // Fetch from GitHub server-side (bypasses CSP)
  const githubUrl = `https://raw.githubusercontent.com/Ebazhanov/linkedin-skill-assessments-quizzes/main/${githubPath}`;
  const response = await fetch(githubUrl);
  
  // Parse markdown to extract questions
  const questions = parseQuestionsFromMarkdown(await response.text());
  
  // Return JSON to frontend
  res.json({ success: true, data: questions });
});
```

**Helper Function**: `parseQuestionsFromMarkdown(markdown)`
- Extracts questions marked with `###` or `####` headers
- Parses options from bullet points (`-` or `*`)
- Identifies correct answers (marked with `**` or backticks)
- Returns array of question objects with: `question`, `options`, `correctAnswer`

### Frontend Changes (client/public/js/dashboard.js)
**Updated Function**: `fetchSkillQuestions(skill)`

**Before**:
```javascript
// Direct GitHub fetch - BLOCKED BY CSP
const url = `https://raw.githubusercontent.com/Ebazhanov/.../${skill}`;
const response = await fetch(url);
```

**After**:
```javascript
// Backend proxy call - ALLOWED (same-origin)
const response = await fetch(`/api/assessments/quiz-questions/${skill.toLowerCase()}`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});

// Parse response and format for quiz display
const result = await response.json();
let questions = result.data.map(q => ({
  id: idx + 1,
  question: q.question,
  options: q.options,
  correctAnswer: q.correctAnswer,
  hint: `Think about ${skill}...`,
  difficulty: 'medium'
}));
```

## Supported Skills (25+)
- **Languages**: Python, JavaScript, Java, C#, C++, Go, Rust, Swift, Kotlin, TypeScript, PHP, Ruby
- **Web**: HTML, CSS, React, Vue, Angular, Node.js
- **Cloud/DevOps**: AWS, Docker, Kubernetes
- **Databases**: SQL, Database General
- **General**: Git, Linux, Networking, Problem-Solving, Web Development

## Testing Checklist
- ✅ Backend endpoint syntax validated
- ✅ Frontend function updated to call backend
- ✅ Code deployed to production (commit: 7f80290)
- ⏳ Test quiz functionality with production server:
  1. Navigate to Assessment section
  2. Click any quiz category
  3. Verify questions load without CSP errors
  4. Confirm gamification points update correctly

## Expected Behavior After Fix
1. User clicks quiz category (Python, JavaScript, etc.)
2. Frontend calls `/api/assessments/quiz-questions/python`
3. Backend fetches from GitHub and parses questions
4. Questions display in gamified UI
5. User answers questions and earns points
6. No CSP errors in browser console

## Deployment Info
- **Commit**: 7f80290
- **Repository**: https://github.com/jayher0824-coder/IT-SkillMatching
- **Branch**: production
- **Date**: [Current deployment date]
- **Changes**: 2 files modified, 206 insertions(+), 105 deletions(-)

## Files Modified
1. `/server/api/routes/assessments.js` - Added new endpoint + helper function
2. `/client/public/js/dashboard.js` - Updated fetchSkillQuestions() to use backend

## Architecture
```
User → Browser (Same-origin request)
     ↓
Backend (/api/assessments/quiz-questions/:skill)
     ↓
Server (Fetch from GitHub - no CSP restrictions)
     ↓
GitHub Raw Content (raw.githubusercontent.com)
     ↓
Parse Markdown
     ↓
Return JSON to Frontend
     ↓
Display Quiz in Gamified UI
```

## Future Improvements
- Add caching to avoid repeated GitHub calls
- Add fallback hardcoded questions if GitHub is unavailable
- Implement question difficulty classification
- Add rate limiting to prevent abuse
- Cache parsed questions in database for performance

## References
- CSP Specification: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- LinkedIn Assessments Repo: https://github.com/Ebazhanov/linkedin-skill-assessments-quizzes
- Server-Side Fetch: Bypasses client-side CSP restrictions
