# Code Testing Feature - Visual Guide & Flow Diagrams

## User Experience Flow

### 👨‍🎓 Student Flow

```
┌─────────────────────┐
│  Open Assessment    │
│                     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ View Question List  │
│  (includes coding)  │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────────┐
│   Coding Question Displayed      │
│  - Problem Description           │
│  - Visible Test Cases            │
│  - Code Template (if provided)   │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│    Code Editor Appears           │
│  - Language: [Dropdown]          │
│  - Textarea with code            │
│  - Run | Clear | Submit buttons  │
└──────────┬───────────────────────┘
           │
      ┌────┴────────────────────────────┐
      │                                 │
      ▼                                 ▼
┌──────────────────┐          ┌──────────────────┐
│   Write Code     │          │  Run Code Test   │
│  or Modify       │          │  (click button)  │
│  Template        │          └────────┬─────────┘
│                  │                   │
└──────────────────┘          ┌────────▼──────────────┐
      │                       │  Execution Results   │
      │                       │  - Pass/Fail Status  │
      │                       │  - Expected vs Actual│
      │                       │  - Execution Time    │
      │                       └────────┬──────────────┘
      │                                │
      │         ┌──────────────────────┘
      │         │
      │         ├─► ✗ Tests Failed ──┐
      │         │                     │
      │         │                     ▼
      │         │              ┌──────────────┐
      │         │              │ Modify Code  │
      │         │              │ Try Again    │
      │         │              └──────┬───────┘
      │         │                     │
      │         │    ┌────────────────┘
      │         │    │
      │         └─► ✓ Tests Passed
      │                     │
      └─────────┬───────────┘
                │
                ▼
    ┌────────────────────┐
    │  Submit Answer     │
    │  (click button)    │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │  Code Submitted    │
    │  with Assessment   │
    └────────────────────┘
```

### 👨‍🏫 Teacher Flow

```
┌─────────────────────────┐
│  Open Assessment Builder│
└──────────┬──────────────┘
           │
           ▼
┌──────────────────────────────┐
│  Click "Add Coding Question" │
└──────────┬───────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│  Question Details Form             │
│  - Title: [text field]             │
│  - Language: [dropdown]            │
│  - Description: [textarea]         │
│  - Category: [dropdown]            │
└──────────┬─────────────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│  Code Template (Optional)          │
│  - Starter code: [textarea]        │
│  - Time Limit: [number field]      │
└──────────┬─────────────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│  Test Cases Configuration          │
│  Click "Add Test Case" button      │
└──────────┬─────────────────────────┘
           │
     ┌─────┴──────┬─────────┬──────────┐
     │            │         │          │
     ▼            ▼         ▼          ▼
  Test 1      Test 2    Test 3    Test N
  - Input     - Input   - Input   - Input
  - Expected  - Expected- Expected- Expected
  - Desc      - Desc    - Desc    - Desc
  - Hidden?   - Hidden? - Hidden? - Hidden?
     │            │         │          │
     └─────┬──────┴─────────┴──────────┘
           │
           ▼
┌────────────────────────────┐
│  All Test Cases Added      │
│  (Minimum 1 required)      │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│  Click "Save Question"     │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│  Question Created &        │
│  Added to Assessment       │
└────────────────────────────┘
```

## Code Editor Interface

```
┌────────────────────────────────────────────────────────┐
│                   Code Editor                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Programming Language: [Python           ▼]           │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ def fizzbuzz(n):                                 │ │
│  │     if n % 15 == 0:                             │ │
│  │         return "FizzBuzz"                       │ │
│  │     elif n % 3 == 0:                            │ │
│  │         return "Fizz"                           │ │
│  │     elif n % 5 == 0:                            │ │
│  │         return "Buzz"                           │ │
│  │     else:                                       │ │
│  │         return str(n)                           │ │
│  │                                                  │ │
│  │ n = int(input())                                │ │
│  │ print(fizzbuzz(n))                              │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  [▶ Run Code]  [🗑 Clear]  [✓ Submit]                 │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Test Cases                                            │
│  □ Basic test: Input: 3 → Output: Fizz               │
│  □ Complex test: Input: 15 → Output: FizzBuzz        │
├────────────────────────────────────────────────────────┤
│  Execution Results                                     │
│                                                        │
│  ┌─────────┬────────┬──────────┬────────────┬─────┐  │
│  │Test Case│ Input  │ Expected │   Actual   │Pass?│  │
│  ├─────────┼────────┼──────────┼────────────┼─────┤  │
│  │   #1    │   3    │  Fizz    │   Fizz     │  ✓  │  │
│  ├─────────┼────────┼──────────┼────────────┼─────┤  │
│  │   #2    │   15   │FizzBuzz  │  FizzBuzz  │  ✓  │  │
│  └─────────┴────────┴──────────┴────────────┴─────┘  │
│                                                        │
│  ✓ 2/2 tests passed                                   │
│  ⏱ Execution time: 125ms                             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Execution Results Display

### Success Case
```
┌─────────────────────────────────────────────────┐
│  ✓ Execution Results                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  Test Results:                                  │
│  ┌──────┬──────┬──────────┬──────────┬────────┐│
│  │Test #│Input │ Expected │  Actual  │ Status ││
│  ├──────┼──────┼──────────┼──────────┼────────┤│
│  │  #1  │  3   │  Fizz    │  Fizz    │   ✓    ││
│  │  #2  │  5   │  Buzz    │  Buzz    │   ✓    ││
│  │  #3  │  15  │FizzBuzz  │FizzBuzz  │   ✓    ││
│  │  #4  │  7   │    7     │    7     │   ✓    ││
│  └──────┴──────┴──────────┴──────────┴────────┘│
│                                                 │
│  ✓ 4/4 tests passed                             │
│  ⏱ Execution time: 89ms                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Failure Case
```
┌─────────────────────────────────────────────────┐
│  ✗ Execution Results                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  Test Results:                                  │
│  ┌──────┬──────┬──────────┬──────────┬────────┐│
│  │Test #│Input │ Expected │  Actual  │ Status ││
│  ├──────┼──────┼──────────┼──────────┼────────┤│
│  │  #1  │  3   │  Fizz    │   3      │   ✗    ││
│  │  #2  │  5   │  Buzz    │   5      │   ✗    ││
│  │  #3  │  15  │FizzBuzz  │  Buzz    │   ✗    ││
│  │  #4  │  7   │    7     │    7     │   ✓    ││
│  └──────┴──────┴──────────┴──────────┴────────┘│
│                                                 │
│  ✗ 1/4 tests passed                             │
│  ⏱ Execution time: 102ms                       │
│                                                 │
│  Error: Your if-elif logic needs adjustment.   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Error Case
```
┌─────────────────────────────────────────────────┐
│  ✗ Execution Error                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Error:                                         │
│  ┌─────────────────────────────────────────────┐│
│  │ SyntaxError: invalid syntax on line 5       ││
│  │   elif n % 3 == 0:                          ││
│  │        ^                                     ││
│  │                                             ││
│  │ Check your parentheses and indentation      ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  ⏱ Execution time: 12ms                        │
│                                                 │
│  [✏ Fix Code] [Try Again]                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Create Question Modal Interface

```
┌──────────────────────────────────────────────────────┐
│  Create Coding Question                        [×]   │
│  Set up a programming challenge with test cases     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Question Details                                   │
│  ┌────────────────────────────────────────────────┐ │
│  │ Question Title: [FizzBuzz Challenge          ] │ │
│  │ Programming Language: [Python              ▼] │ │
│  │ Problem Description:                         │ │
│  │ ┌─────────────────────────────────────────┐  │ │
│  │ │Write a program that prints numbers...   │  │ │
│  │ └─────────────────────────────────────────┘  │ │
│  │ Code Template (optional):                    │ │
│  │ ┌─────────────────────────────────────────┐  │ │
│  │ │n = int(input())                         │  │ │
│  │ │# Write your solution here               │  │ │
│  │ └─────────────────────────────────────────┘  │ │
│  │ Time Limit (seconds): [60               ]    │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Test Cases                        [+ Add Test Case]│
│  ┌────────────────────────────────────────────────┐ │
│  │ Test Case #1                            [🗑]  │ │
│  │ Input: [3              ]                      │ │
│  │ Expected Output: [Fizz             ]          │ │
│  │ Description: [Multiple of 3        ]          │ │
│  │ ☐ Hidden test case                           │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │ Test Case #2                            [🗑]  │ │
│  │ Input: [15             ]                      │ │
│  │ Expected Output: [FizzBuzz         ]          │ │
│  │ Description: [Multiple of 3 and 5 ]           │ │
│  │ ☑ Hidden test case                           │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Category                                           │
│  [Python                           ▼]              │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [Cancel]                        [💾 Save Question] │
└──────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────┐
│   Student    │
│  Writes Code │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│  Code Editor (Frontend)          │
│  - Captures code text            │
│  - Stores language selection     │
│  - Persists to sessionStorage    │
└──────┬───────────────────────────┘
       │
       ├─────────────────────────────┐
       │                             │
       ▼                             ▼
   [Run Code]               [Submit Assessment]
       │                             │
       ▼                             ▼
   POST /api/assessments/      POST /api/assessments/
   test-code                   submit
       │                             │
       ▼                             ▼
┌──────────────────────────────┐  ┌─────────────────┐
│ CodeExecutionService         │  │ Assessment DB   │
│ 1. Validate syntax           │  │ - Store answer  │
│ 2. Create temp directory     │  │ - Record time   │
│ 3. Write code to file        │  │ - Process score │
│ 4. Execute code              │  └─────────────────┘
│ 5. Run test cases            │
│ 6. Capture output            │
│ 7. Compare results           │
│ 8. Cleanup temp files        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Results Object               │
│ - allTestsPassed: Boolean    │
│ - passedCount: Number        │
│ - results: [...]             │
│ - executionTime: Number      │
│ - error?: String             │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Return to Frontend           │
│ Display Results              │
│ Show Pass/Fail Status        │
│ Show Expected vs Actual      │
└──────────────────────────────┘
```

## Technology Stack Visualization

```
┌─────────────────────────────────────────┐
│           Frontend (Client)              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   code-editor.html              │   │
│  │  - Textarea for code input      │   │
│  │  - Language selector            │   │
│  │  - Run/Clear/Submit buttons     │   │
│  │  - Results display              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ create-coding-question.html     │   │
│  │  - Question builder form        │   │
│  │  - Test case manager            │   │
│  │  - Code template input          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  assessment.js Integration      │   │
│  │  - Display code questions       │   │
│  │  - Save code answers            │   │
│  │  - Restore code from history    │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
        API Calls (JSON/HTTP)
                 │
┌────────────────▼────────────────────────┐
│      Backend (Server/Node.js)           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  assessments.js (Routes)        │   │
│  │  - POST /test-code              │   │
│  │  - POST /create-question        │   │
│  │  - GET /languages               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  codeExecutionService.js        │   │
│  │  - executeCode()                │   │
│  │  - runCode()                    │   │
│  │  - runTestCase()                │   │
│  │  - validateCodeSyntax()         │   │
│  │  - getSupportedLanguages()      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Assessment.js (Model)          │   │
│  │  - questionSchema               │   │
│  │  - testCaseSchema               │   │
│  │  - Database persistence         │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
       Process Execution (Child Processes)
                 │
┌────────────────▼────────────────────────┐
│      System Environments                │
│                                         │
│  Python 3      JavaScript   Java        │
│  PHP           Ruby         C++         │
│  C#            Go           Rust        │
│  TypeScript                             │
└─────────────────────────────────────────┘
```

## Language Support Matrix

```
┌──────────┬────────────┬──────────┬────────────────────┐
│ Language │ Runtime    │ Timeout  │ Execution Command  │
├──────────┼────────────┼──────────┼────────────────────┤
│ Python   │ Python 3   │  5s      │ python3            │
│ JS       │ Node.js    │  5s      │ node               │
│ Java     │ JDK 11+    │ 10s      │ javac & java       │
│ C++      │ g++        │ 10s      │ g++ -o out         │
│ C#       │ Mono/csc   │ 10s      │ csc & mono         │
│ PHP      │ PHP CLI    │  5s      │ php                │
│ Ruby     │ Ruby 2.7+  │  5s      │ ruby               │
│ Go       │ Go 1.15+   │ 10s      │ go run             │
│ Rust     │ Rustc      │ 15s      │ rustc & ./program  │
│ TypeScript│ ts-node    │  5s      │ ts-node            │
└──────────┴────────────┴──────────┴────────────────────┘
```

---

**Version**: 1.0
**Last Updated**: Current Session
**Status**: Production Ready
