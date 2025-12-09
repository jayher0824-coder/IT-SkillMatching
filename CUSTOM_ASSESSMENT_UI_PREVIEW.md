# Custom Assessment Coding Challenges - UI Preview

## Where to Find Coding Challenge Option

### Create Custom Assessment Modal

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Create Custom Assessment                           [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Assessment Title *                                         │
│  [Frontend Developer Technical Assessment ___________]      │
│                                                              │
│  Description                                                │
│  [Comprehensive test for frontend skills _________]         │
│                                                              │
│  Duration (minutes)    Passing Score (%)                    │
│  [30]                  [60]                                 │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  Questions          [+ Add Question]                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Question 1                                      [🗑]      │
│  │                                                  │      │
│  │ [Enter your question _________________]         │      │
│  │                                                  │      │
│  │ Question Type ▼        Category ▼              │      │
│  │ ┌──────────────────┐  ┌──────────────────┐    │      │
│  │ │ Multiple Choice  │  │ Technical        │    │      │
│  │ │ True/False       │  │ Behavioral       │    │      │
│  │ │ Short Answer     │  │ Situational      │    │      │
│  │ │ Coding Challenge │◀─ NEW!             │    │      │
│  │ └──────────────────┘  └──────────────────┘    │      │
│  │                                                  │      │
│  │ Answer Options                                  │      │
│  │ [Option A _____________________]                │      │
│  │ [Option B _____________________]                │      │
│  │ [Option C _____________________]                │      │
│  │ [Option D _____________________]                │      │
│  │                                                  │      │
│  │ Correct Answer                                  │      │
│  │ [Enter the exact correct answer ____]          │      │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                              [Cancel]  [💾 Save Assessment]  │
└─────────────────────────────────────────────────────────────┘
```

## When "Coding Challenge" is Selected

```
┌────────────────────────────────────────────────────┐
│ Question 1                                      [🗑]  │
│                                                  │  │
│ [Create a function that calculates factorial___]│  │
│                                                  │  │
│ Question Type ▼        Category ▼              │  │
│ [Coding Challenge] ──────────────────────────   │  │
│                                                  │  │
│ Programming Language ▼    Difficulty Level ▼   │  │
│ ┌────────────────────┐  ┌────────────────────┐ │  │
│ │ Python             │  │ Beginner (5-15m)   │ │  │
│ │ JavaScript         │  │ Junior (15-30m)    │ │  │
│ │ Java               │  │ Intermediate (30m) │ │  │
│ │ C++                │  │ Advanced (60m+)    │ │  │
│ │ C#                 │  └────────────────────┘ │  │
│ │ PHP                │                          │  │
│ │ Ruby               │                          │  │
│ │ Go                 │                          │  │
│ │ Rust               │                          │  │
│ │ TypeScript         │                          │  │
│ └────────────────────┘                          │  │
│                                                  │  │
│ Code Template (Optional)                        │  │
│ ┌──────────────────────────────────────────┐   │  │
│ │ def factorial(n):                         │   │  │
│ │     # Calculate factorial of n            │   │  │
│ │     # Return the result                   │   │  │
│ │     pass                                  │   │  │
│ └──────────────────────────────────────────┘   │  │
│                                                  │  │
│ Test Cases (JSON Format)                       │  │
│ ┌──────────────────────────────────────────┐   │  │
│ │ [                                        │   │  │
│ │   {"input": "5", "output": "120"},      │   │  │
│ │   {"input": "0", "output": "1"},        │   │  │
│ │   {"input": "3", "output": "6"}         │   │  │
│ │ ]                                        │   │  │
│ └──────────────────────────────────────────┘   │  │
│                                                  │  │
│ Time Limit (seconds)                           │  │
│ [30] ◀─ seconds (5-300)                       │  │
│                                                  │  │
└────────────────────────────────────────────────────┘
```

## Student Taking Assessment with Coding Challenge

```
┌──────────────────────────────────────────────────────────┐
│ Coding Challenge Assessment                         │    │
│ Comprehensive programming skills test               │    │
│                              Time Remaining: 25:30 ◀──┐  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Question 2 of 3                                         │
│                                                          │
│ [Coding Challenge] ◀─ Badge                             │
│                                                          │
│ 2. Write a function that reverses a string             │
│                                                          │
│ Language: PYTHON                                        │
│ Difficulty: Beginner                                    │
│ Time Limit: 30s                                         │
│ Test Cases: 4                                           │
│                                                          │
│ Your Code                                               │
│ ┌──────────────────────────────────────────────────┐   │
│ │ def reverse_string(s):                           │   │
│ │     return s[::-1]                               │   │
│ │                                                  │   │
│ │                                                  │   │
│ │                                                  │   │
│ │                                                  │   │
│ │                                                  │   │
│ │                                                  │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ [▶ Run Test Cases]                                      │
│                                                          │
│ Test Results:                                           │
│ ┌──────────────────────────────────────────────────┐   │
│ │ ✓ Test Case 1: PASS                             │   │
│ │   Time: 12ms                                     │   │
│ │ ✓ Test Case 2: PASS                             │   │
│ │   Time: 10ms                                     │   │
│ │ ✓ Test Case 3: PASS                             │   │
│ │   Time: 11ms                                     │   │
│ │ ✓ Test Case 4: PASS                             │   │
│ │   Time: 9ms                                      │   │
│ │ Passed: 4/4                                      │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Question 2 of 3     [◀ Previous] [Next ▶]              │
└──────────────────────────────────────────────────────────┘
```

## Failed Test Case Example

```
│ Test Results:                                           │
│ ┌──────────────────────────────────────────────────┐   │
│ │ ✓ Test Case 1: PASS                             │   │
│ │   Time: 12ms                                     │   │
│ │ ✗ Test Case 2: FAIL                             │   │
│ │   Expected: "olleh"                              │   │
│ │   Got: "h"                                       │   │
│ │ ✓ Test Case 3: PASS                             │   │
│ │   Time: 11ms                                     │   │
│ │ ✓ Test Case 4: PASS                             │   │
│ │   Time: 9ms                                      │   │
│ │ Passed: 3/4                                      │   │
│ └──────────────────────────────────────────────────┘   │
```

## Key Features Visible in UI

### In Assessment Creation (Company Side)
✅ "Coding Challenge" option in Question Type dropdown
✅ Programming language selector (10 languages)
✅ Difficulty level dropdown (4 levels)
✅ Code template textarea for starter code
✅ Test cases JSON editor
✅ Time limit input (seconds)

### During Assessment Taking (Student Side)
✅ Code editor textarea for writing solution
✅ Language and difficulty display
✅ "Run Test Cases" button for immediate feedback
✅ Test results with pass/fail status per case
✅ Expected vs actual output comparison for failures
✅ Execution time tracking

### Integration
✅ Works seamlessly with other question types
✅ Same assessment submission process
✅ Code answers saved with assessment response
✅ Points awarded (5 points for coding vs 1 point for Q&A)

## File Changes Summary

| File | Changes |
|------|---------|
| `client/public/js/customAssessments.js` | Added coding challenge support (236 lines added) |
| `CUSTOM_ASSESSMENT_CODING.md` | Complete guide and documentation |

## Next Steps for Users

1. **Company**: Open a job posting
2. **Company**: Click "Create Custom Assessment"
3. **Company**: Select "Coding Challenge" for programming skills evaluation
4. **Company**: Configure language, difficulty, test cases
5. **Student**: Take assessment and test code with "Run Test Cases"
6. **Student**: Submit to compete the assessment
7. **Company**: Review results and assess candidate coding ability
