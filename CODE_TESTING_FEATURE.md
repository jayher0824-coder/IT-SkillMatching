# Code Testing in Assessments - Feature Documentation

## Overview

The platform now supports **interactive code testing** in assessments, allowing students to write and execute actual code with automatic test case validation. This feature enables **companies** to assess programming language skills through practical coding challenges in their job postings, going beyond Q&A assessments.

## Supported Use Cases

1. **Job Posting Requirements** - Companies add coding challenges to their job application assessment
2. **Skill Verification** - Test actual programming skills with real code execution
3. **Technical Interviews** - Remote coding assessment as part of hiring process
4. **Internship/OJT Programs** - Evaluate practical programming capability

## Features Implemented

### 1. **Code Editor Component** 
- Interactive code editor with syntax highlighting
- Support for 9 programming languages:
  - Python 3
  - JavaScript
  - Java
  - C++
  - C#
  - PHP
  - Ruby
  - Go
  - Rust
  - TypeScript

### 2. **Test Case Management**
- Teachers can create multiple test cases per question
- Each test case includes:
  - Input parameters
  - Expected output
  - Description/label
  - Visibility flag (visible/hidden before submission)

### 3. **Code Execution Service**
- Sandboxed code execution environment
- Timeout protection (5-15 seconds per language)
- Automatic temporary file cleanup
- Support for multiple programming languages

### 4. **Student Experience**
- Write code in the assessment interface
- Run/test code before submission
- View test case results with pass/fail status
- Automatic code persistence when navigating between questions
- Code template support for guided challenges

### 5. **Teacher/Admin Tools**
- Create coding questions with test cases
- Define code templates/starter code
- Set execution timeouts
- Mark test cases as hidden (revealed after submission)

## File Structure

### Frontend Components
```
client/public/components/
├── code-editor.html          # Interactive code editor UI
└── create-coding-question.html # Teacher tool for creating coding questions

client/public/js/
├── assessment.js             # Updated with code editor integration
└── app.js                    # Main application logic
```

### Backend Services
```
server/
├── services/
│   └── codeExecutionService.js        # Code execution sandbox & test validation
├── api/routes/
│   └── assessments.js                 # Updated with code testing endpoints
└── database/models/
    └── Assessment.js                  # Extended with coding question schema
```

## Database Schema Updates

### Test Case Schema
```javascript
{
  input: String,              // Test input parameters
  expectedOutput: String,     // Expected output
  description: String,        // Test case description
  isHidden: Boolean          // Visibility flag
}
```

### Question Schema Extensions (for coding questions)
```javascript
{
  type: 'coding',
  question: String,                    // Question title
  description: String,                 // Problem description
  programmingLanguage: String,         // Required language
  codeTemplate: String,                // Optional starter code
  testCases: [testCaseSchema],         // Array of test cases
  timeLimit: Number                    // Execution timeout in seconds
}
```

## API Endpoints

### 1. Execute Code with Test Cases
```
POST /api/assessments/test-code
Headers: Authorization: Bearer {token}
Body: {
  code: String,
  language: String,
  testCases: [{input, expectedOutput}, ...]
}
Response: {
  success: Boolean,
  allTestsPassed: Boolean,
  passedCount: Number,
  totalTests: Number,
  results: [{
    passed: Boolean,
    input: String,
    expectedOutput: String,
    actualOutput: String
  }, ...],
  executionTime: Number,
  error?: String
}
```

### 2. Get Supported Languages
```
GET /api/assessments/languages
Response: {
  success: Boolean,
  languages: [
    {name: 'Python', id: 'python'},
    {name: 'JavaScript', id: 'javascript'},
    ...
  ]
}
```

### 3. Create Coding Question
```
POST /api/assessments/create-question
Headers: Authorization: Bearer {token}
Body: {
  type: 'coding',
  question: String,
  description: String,
  programmingLanguage: String,
  codeTemplate?: String,
  testCases: [{input, expectedOutput, description, isHidden}, ...],
  timeLimit: Number,
  category: String
}
Response: {
  success: Boolean,
  question: {...}
}
```

## Usage Guide

### For Students

1. **Access Coding Question**
   - When a coding question is displayed, the code editor automatically loads
   - View the problem description and available test cases

2. **Write Code**
   - Type code in the editor textarea
   - Select the programming language (if not pre-selected)
   - Use provided code template as starting point if available

3. **Test Your Code**
   - Click "Run Code" button to execute
   - View results in the execution results panel
   - See which test cases pass/fail
   - Check execution time and any errors

4. **Submit Answer**
   - Click "Submit" button to save code as answer
   - Code is automatically persisted when navigating questions

### For Teachers/Admins

1. **Create Coding Question**
   - Access assessment creation interface
   - Click "Create Coding Question"
   - Fill in question details and description

2. **Configure Test Cases**
   - Add at least one test case
   - Specify input and expected output
   - Mark cases as visible/hidden
   - Add descriptions for each test case

3. **Set Code Template**
   - Optionally provide starter code for students
   - Define execution timeout (default: 60 seconds)

4. **Save Question**
   - Question is saved and available in assessment builder

## Security Features

1. **Sandboxed Execution**
   - Code runs in isolated processes
   - Timeout protection (5-15 seconds per language)
   - Automatic cleanup of temporary files

2. **Input Validation**
   - Code length limits
   - Language syntax pre-validation
   - Test case input/output validation

3. **Error Handling**
   - Compilation/syntax errors captured
   - Runtime errors reported safely
   - Timeout errors detected

## Code Execution Details

### Supported Execution Environments

| Language   | Runtime      | Timeout | Command              |
|------------|-------------|---------|---------------------|
| Python     | Python 3    | 5s      | `python3`           |
| JavaScript | Node.js     | 5s      | `node`              |
| Java       | JDK 11+     | 10s     | `javac` then `java` |
| C++        | g++         | 10s     | `g++ -o out`        |
| C#         | Mono        | 10s     | `csc`               |
| PHP        | PHP CLI     | 5s      | `php`               |
| Ruby       | Ruby        | 5s      | `ruby`              |
| Go         | Go 1.15+    | 10s     | `go run`            |
| Rust       | Rustc       | 15s     | `rustc`             |
| TypeScript | ts-node     | 5s      | `ts-node`           |

## Example Usage

### Creating a FizzBuzz Challenge

1. **Question Details**
   - Title: "FizzBuzz Challenge"
   - Language: Python
   - Description: "Write a program that prints numbers 1-100. For multiples of 3, print 'Fizz'; for multiples of 5, print 'Buzz'; for both, print 'FizzBuzz'."

2. **Test Cases**
   - Test 1 (Visible): Input: "3" → Output: "Fizz"
   - Test 2 (Visible): Input: "15" → Output: "FizzBuzz"
   - Test 3 (Hidden): Input: "7" → Output: "7"

3. **Code Template** (Optional)
```python
# Write your FizzBuzz solution here
def fizzbuzz(n):
    # Your code here
    pass

# Main execution
n = int(input())
print(fizzbuzz(n))
```

## Performance Considerations

- **Execution Timeout**: Default 60 seconds per question, configurable per language
- **Code Size**: Recommended limit 50KB per submission
- **Test Case Limit**: Recommended 10-20 test cases per question
- **Concurrent Executions**: Uses process queue to prevent resource exhaustion

## Troubleshooting

### "Code Execution Failed" Error
- Check code syntax for the selected language
- Verify input/output format matches test case expectations
- Increase timeout limit if code runs slow

### "Test Case Failed" Result
- Review the expected vs actual output
- Check for whitespace differences
- Verify input is being read correctly

### "No Output" in Results
- Ensure code prints/returns results to stdout
- Check for infinite loops (will timeout)
- Verify proper input/output handling

## Future Enhancements

- [ ] Code syntax highlighting with Monaco Editor
- [ ] Real-time execution feedback
- [ ] Code coverage analysis
- [ ] Performance profiling
- [ ] Collaborative code submission
- [ ] Code style/quality checks
- [ ] Plagiarism detection
- [ ] Custom test case creation by students
- [ ] Partial credit scoring
- [ ] Code submission history/versioning

## Integration Notes

The code testing feature integrates seamlessly with the existing assessment system:

1. **Question Types**: Extends existing question types with new 'coding' type
2. **Answer Storage**: Code answers stored in `userAnswers` with language metadata
3. **Assessment Submission**: Code answers included in normal assessment submission
4. **Results Tracking**: Test results can be stored in assessment results

## Security and Compliance

✅ All code execution is sandboxed  
✅ Timeouts prevent infinite loops  
✅ Temporary files are cleaned up  
✅ No file system access allowed  
✅ Input/output validation enforced  
✅ Code length limits enforced  

---

**Last Updated**: Current Session
**Status**: Production Ready
**Commit**: b291dc7
