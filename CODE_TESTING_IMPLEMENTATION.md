# Code Testing Implementation Guide

## Quick Start for Teachers

### Step 1: Access Assessment Creation
1. Log in as Admin/Company user
2. Navigate to Assessment Builder
3. Create new assessment or edit existing

### Step 2: Add Coding Question
1. In question list, click "Add Coding Question" button
2. Fill in question details:
   - Question Title
   - Programming Language
   - Problem Description
   - Category

### Step 3: Create Test Cases
1. Click "Add Test Case" button
2. For each test case, enter:
   - **Input**: What the program receives as input
   - **Expected Output**: What the correct output should be
   - **Description**: Brief explanation (e.g., "Basic test case")
   - **Visibility**: Check if hidden (revealed after submission)

### Step 4: Optional - Add Code Template
1. In "Code Template" field, add starter code
2. Students will see this code pre-filled in the editor
3. Leave empty if students should write from scratch

### Step 5: Save Question
1. Set execution timeout (default: 60 seconds)
2. Click "Save Question"
3. Question is added to assessment

---

## Quick Start for Students

### Step 1: Start Assessment
1. Open assessment from dashboard
2. Navigate to coding question

### Step 2: View Problem
- Read problem description
- Review visible test cases
- View code template if provided

### Step 3: Write Code
1. Select programming language (if not pre-selected)
2. Write code in the editor
3. Code is automatically saved as you navigate

### Step 4: Test Your Code
1. Click "Run Code" button
2. View test results:
   - ✓ Green = Test passed
   - ✗ Red = Test failed
3. Review actual vs expected output
4. Modify code if needed

### Step 5: Submit Answer
1. Click "Submit" button
2. Code is submitted with assessment
3. View detailed results after assessment completion

---

## API Integration Examples

### JavaScript: Run Code Test
```javascript
async function testCode(code, language, testCases) {
  const response = await fetch('/api/assessments/test-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      code: code,
      language: language,
      testCases: testCases
    })
  });

  return await response.json();
}

// Example usage
const result = await testCode(
  'print("Hello")',
  'python',
  [{input: '', expectedOutput: 'Hello'}]
);

console.log(`Passed: ${result.passedCount}/${result.totalTests}`);
console.log(`Time: ${result.executionTime}ms`);
```

### Python: Prepare Test Cases
```python
test_cases = [
    {
        "input": "3",
        "expectedOutput": "Fizz",
        "description": "Multiple of 3",
        "isHidden": False
    },
    {
        "input": "15",
        "expectedOutput": "FizzBuzz",
        "description": "Multiple of 3 and 5",
        "isHidden": False
    },
    {
        "input": "7",
        "expectedOutput": "7",
        "description": "Regular number",
        "isHidden": True
    }
]
```

---

## Language-Specific Examples

### Python Example
```python
# Template provided
n = int(input())
if n % 15 == 0:
    print("FizzBuzz")
elif n % 3 == 0:
    print("Fizz")
elif n % 5 == 0:
    print("Buzz")
else:
    print(n)
```

### JavaScript Example
```javascript
// Template provided
const n = parseInt(readline());
if (n % 15 === 0) {
    console.log("FizzBuzz");
} else if (n % 3 === 0) {
    console.log("Fizz");
} else if (n % 5 === 0) {
    console.log("Buzz");
} else {
    console.log(n);
}
```

### Java Example
```java
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        
        if (n % 15 == 0) {
            System.out.println("FizzBuzz");
        } else if (n % 3 == 0) {
            System.out.println("Fizz");
        } else if (n % 5 == 0) {
            System.out.println("Buzz");
        } else {
            System.out.println(n);
        }
    }
}
```

---

## Troubleshooting Guide

### "Timeout Error"
**Problem**: Code takes too long to execute
**Solution**: 
- Optimize algorithm efficiency
- Ask teacher to increase timeout
- Default: 60 seconds per question

### "Compilation Error"
**Problem**: Code has syntax errors
**Solution**:
- Check language syntax
- Verify all brackets/parentheses match
- Test locally before submitting

### "Output Mismatch"
**Problem**: Actual output doesn't match expected
**Solution**:
- Check for whitespace differences
- Verify input/output format
- Check data types (int vs string)
- Review test case description

### "No Output"
**Problem**: Code runs but produces no output
**Solution**:
- Add print/console.log statements
- Verify output goes to stdout
- Check for infinite loops

---

## Assessment Settings

### Per Question Settings
```
- Type: coding
- Language: (python, javascript, java, etc.)
- Time Limit: 5-300 seconds (default: 60)
- Code Template: Optional starter code
- Test Cases: Minimum 1 required
```

### Scoring Recommendations

**Option 1: All-or-Nothing**
- Full points if all tests pass
- 0 points if any test fails

**Option 2: Partial Credit**
- Points = (Passed Tests / Total Tests) × Question Points
- E.g., 5/10 tests pass = 50% of points

**Option 3: Bonus System**
- Base points for attempt
- Bonus points for passing visible tests
- Full bonus for passing hidden tests

---

## Best Practices

### For Teachers Creating Questions

1. **Clear Descriptions**: Be specific about input/output format
2. **Varied Test Cases**: Include edge cases and typical cases
3. **Hidden Tests**: Use hidden tests to verify real understanding
4. **Code Templates**: Provide when appropriate to guide students
5. **Reasonable Timeouts**: Set 30-120 seconds based on complexity

### For Students Writing Code

1. **Read Carefully**: Understand input/output format exactly
2. **Test Locally**: Write and test on your computer first
3. **Start Simple**: Get basic cases working before optimization
4. **Handle Edge Cases**: Consider boundary conditions
5. **Test Before Submit**: Always click "Run Code" before submitting

---

## Limitations & Constraints

- **Code Size**: Maximum 50KB per submission
- **Test Cases**: Recommended max 20 per question
- **Execution Time**: 5-15 seconds per language
- **Memory**: Limited sandbox environment
- **File System**: No file access allowed
- **Network**: No network access allowed
- **Languages**: Only pre-configured languages supported

---

## Support Resources

- **Code Testing Documentation**: `CODE_TESTING_FEATURE.md`
- **Assessment API**: `/api/assessments/test-code`
- **Supported Languages**: `/api/assessments/languages`
- **Execution Service**: `server/services/codeExecutionService.js`

---

**Version**: 1.0
**Last Updated**: Current Session
**Status**: Production Ready
