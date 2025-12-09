# Custom Assessment Coding Challenges

## Overview

You can now add **Coding Challenges** directly to Custom Assessments! This allows companies to include debugging/programming tests alongside traditional Q&A questions in job application assessments.

## Creating a Coding Challenge in Custom Assessment

### Step 1: Open Create Custom Assessment Modal
- Click on a job posting
- Click **"Create Custom Assessment"** button
- Fill in Assessment Title, Description, Duration, and Passing Score

### Step 2: Add a Coding Challenge Question
1. Click **"Add Question"** button
2. In the question that appears:
   - **Question Type**: Select **"Coding Challenge"** from dropdown
   - **Question Text**: Enter the problem statement (e.g., "Write a function that calculates factorial")
   - The "Category" field will be ignored for coding challenges (automatically set to "Coding Challenge")

### Step 3: Configure the Coding Challenge

When you select "Coding Challenge", you'll see these fields:

#### Programming Language *required*
- Python
- JavaScript
- Java
- C++
- C#
- PHP
- Ruby
- Go
- Rust
- TypeScript

#### Difficulty Level *required*
- **Beginner** (5-15 minutes) - Basic syntax, simple algorithms
- **Junior** (15-30 minutes) - Intermediate problems, common data structures
- **Intermediate** (30-60 minutes) - Complex algorithms, optimization
- **Advanced** (60+ minutes) - System design, advanced algorithms

#### Code Template (Optional)
Provide starter code that candidates will build upon:
```python
def factorial(n):
    # Your code here
    pass
```

#### Test Cases *required* (JSON Format)
Define test cases in JSON array format:
```json
[
  {"input": "5", "output": "120"},
  {"input": "0", "output": "1"},
  {"input": "1", "output": "1"}
]
```

**Important**: Test cases must be valid JSON. Each test case should have:
- `input`: What the function receives (as string)
- `output`: Expected output (as string)

#### Time Limit (seconds)
- Minimum: 5 seconds
- Maximum: 300 seconds
- Default: 30 seconds

### Step 4: Save Assessment
- Click **"Save Assessment"** button
- The assessment with all questions (Q&A + Coding Challenges) will be created

## Taking a Coding Challenge Assessment

### As a Student/Candidate

When taking an assessment with coding challenges:

1. **Navigate to Challenge Question**: Use Previous/Next buttons to reach the coding challenge
2. **View Challenge Details**:
   - Language requirement
   - Difficulty level
   - Time limit for code execution
   - Number of test cases

3. **Write Code**:
   - Use the code editor textarea
   - Paste code or write directly
   - Can use the code template provided (or start from scratch)

4. **Run Test Cases**:
   - Click **"Run Test Cases"** button
   - Code will execute against all test cases
   - Results show Pass/Fail for each test case
   - See expected vs actual output for failed cases
   - View execution time for each test

5. **Submit Assessment**:
   - After completing all questions, click **"Submit Assessment"** button
   - Code answers are saved along with traditional answers

## Example: Factorial Problem

### Creating the Challenge

**Question Type**: Coding Challenge
**Language**: Python
**Difficulty**: Beginner
**Time Limit**: 30 seconds

**Code Template**:
```python
def factorial(n):
    # Calculate factorial of n
    # Return the result
    pass
```

**Test Cases**:
```json
[
  {"input": "5", "output": "120"},
  {"input": "0", "output": "1"},
  {"input": "3", "output": "6"},
  {"input": "10", "output": "3628800"}
]
```

### Candidate Takes the Challenge

1. Reads: "Calculate the factorial of a number"
2. Sees language is Python, difficulty is Beginner
3. Views code template
4. Writes solution:
```python
def factorial(n):
    if n == 0 or n == 1:
        return 1
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result
```

5. Clicks "Run Test Cases"
6. Sees results:
   - Test Case 1: PASS (input: 5, output: 120) ✓
   - Test Case 2: PASS (input: 0, output: 1) ✓
   - Test Case 3: PASS (input: 3, output: 6) ✓
   - Test Case 4: PASS (input: 10, output: 3628800) ✓

## Mixing Question Types

You can combine multiple question types in one assessment:

```
Assessment: Full Stack Developer Test
├── Question 1: Multiple Choice (JavaScript basics) - 1 point
├── Question 2: Coding Challenge (Python data processing) - 5 points
├── Question 3: True/False (React concepts) - 1 point
├── Question 4: Coding Challenge (JavaScript sorting) - 5 points
└── Question 5: Short Answer (Explain MVC pattern) - 1 point

Total Points: 13
```

Candidates must complete all question types to submit the assessment.

## Test Case Best Practices

### Valid Test Case Format
```json
[
  {"input": "hello", "output": "5"},
  {"input": "world", "output": "5"},
  {"input": "", "output": "0"}
]
```

### Common Input/Output Types

**String Input/Output:**
```json
[
  {"input": "hello", "output": "olleh"}
]
```

**Number Input/Output:**
```json
[
  {"input": "10", "output": "100"}
]
```

**Array Input/Output:**
```json
[
  {"input": "[1,2,3]", "output": "[3,2,1]"}
]
```

### Invalid Test Case Examples ❌

```json
// ❌ Not an array
{"input": "5", "output": "120"}

// ❌ Missing output
[{"input": "5"}]

// ❌ Invalid JSON
[{"input": "5", "output": 120}] // Missing quotes around 120 is OK actually

// ❌ Empty array
[]
```

## Language-Specific Considerations

### Python
- Function must match test case expectations
- Indentation is critical
- Common entry point: Function definition

### JavaScript
- Output must match string format exactly
- Use `console.log()` or return values
- Entry point: Function definition

### Java
- Requires class and method structure
- Must follow Java naming conventions
- Compilation happens automatically

### C++
- Include standard headers if needed
- Use `cout` for output
- Compilation errors prevent execution

### C#
- Must define class if needed
- Use `Console.WriteLine()` for output
- .NET framework compatibility required

## Scoring

- **Traditional Questions** (Multiple Choice, True/False, Short Answer): 1 point each
- **Coding Challenges**: 5 points each

All test cases must pass to earn full points for a coding challenge.

## Troubleshooting

### Test Cases Show "Invalid JSON"
- Check that your JSON is properly formatted
- Ensure all strings are in double quotes
- Use a JSON validator: https://jsonlint.com/

### Code Doesn't Run
- Check for syntax errors in your test code
- Verify the language selected matches your code
- Ensure execution time limit is sufficient

### Different Output Than Expected
- Check for whitespace differences (spaces, newlines)
- Verify number formatting (decimals, scientific notation)
- Check case sensitivity (uppercase vs lowercase)

### Timeout Error
- Code is taking too long to execute
- Check for infinite loops
- Optimize algorithm performance
- Increase time limit if appropriate for problem complexity

## Features

✅ **10 Programming Languages** - Support for popular languages
✅ **4 Difficulty Levels** - Tailored to hiring needs
✅ **Multiple Test Cases** - Comprehensive validation
✅ **Real-time Testing** - Candidates can test before submitting
✅ **Instant Feedback** - See pass/fail for each test case
✅ **Mixed Assessments** - Combine coding with Q&A questions
✅ **Code Templates** - Provide starter code to candidates
✅ **Time Limits** - Set execution boundaries

## Next Steps

1. **Create Assessment**: Add coding challenges to your job posting assessments
2. **Share with Candidates**: Job application includes coding test requirement
3. **Review Results**: Candidates' code submissions are saved with test results
4. **Evaluate**: Review code quality and test performance to assess candidates
