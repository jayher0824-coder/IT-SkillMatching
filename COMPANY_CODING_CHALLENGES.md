# Company Coding Challenge Guide

## Overview

Companies can now add **coding challenges** to their job posting assessments. Instead of just Q&A tests, you can evaluate candidates' actual programming skills by requiring them to solve real coding problems with automated test case validation.

## Benefits

✅ **Assess Real Skills** - Evaluate actual programming ability, not just knowledge
✅ **Objective Evaluation** - Automated test cases provide fair, unbiased scoring
✅ **Multiple Languages** - Support 10+ programming languages
✅ **Remote Interview** - Perfect for virtual hiring process
✅ **Reduce Bias** - Code is evaluated objectively by tests
✅ **Filter Quality** - Eliminate unqualified candidates early
✅ **Time Efficient** - Candidates take assessment on their time

## Supported Programming Languages

Companies can create challenges in any of these languages:

| Language | Use Cases |
|----------|-----------|
| **Python** | Data Science, Backend, Automation, Scripts |
| **JavaScript** | Web Development, Frontend, Full-Stack |
| **Java** | Enterprise, Backend, Android |
| **C++** | Performance-Critical, Systems, Games |
| **C#** | .NET, Desktop, Game Development |
| **PHP** | Web Development, CMS, Backend |
| **Ruby** | Web Development, Scripting |
| **Go** | Cloud, Backend, DevOps |
| **Rust** | Systems Programming, Performance |
| **TypeScript** | Full-Stack, Typed JavaScript |

## Step-by-Step: Create a Coding Challenge

### Step 1: Create or Edit Job Posting

1. Log in to your company account
2. Navigate to **Jobs** → **Create Job** or **Edit Job**
3. Fill in basic job information:
   - Job Title
   - Description
   - Requirements
   - Salary Range
   - Location
   - etc.

### Step 2: Add Assessment to Job

1. In the job details, find **Assessment** section
2. Click **"Add Assessment"** or **"Create Assessment"**
3. Choose **Assessment Type** → Select **"Coding Challenge"**

### Step 3: Create Coding Challenge

1. Click **"Add Coding Challenge"** button
2. Fill in challenge details:

   **Challenge Details**
   - **Challenge Title**: e.g., "FizzBuzz Algorithm Challenge"
   - **Programming Language**: Select the language (candidates can code in this language)
   - **Problem Description**: Describe what candidates need to solve
   - **Code Template** (Optional): Provide starter code if desired

3. Set **Time Limit** (default: 60 seconds)
   - Recommended: 30-120 seconds depending on complexity

4. Select **Difficulty Level**:
   - **Beginner** - Entry-level candidates
   - **Junior** - Junior developers
   - **Intermediate** - Mid-level developers  
   - **Advanced** - Senior developers

### Step 4: Add Test Cases

Test cases validate the candidate's code. Each test case includes:

1. **Input**: What the program receives
   - Example: `"3"`
   
2. **Expected Output**: Correct result
   - Example: `"Fizz"`
   
3. **Description**: What it tests
   - Example: `"Multiple of 3"`

4. **Visibility**:
   - ☐ Unchecked = **Visible** (shown before submission, helps guide candidates)
   - ☑ Checked = **Hidden** (shown only after submission, prevents gaming)

**Best Practice**: Mix visible and hidden test cases
- Visible: Help candidates understand the problem
- Hidden: Verify they actually solve it correctly

### Step 5: Save Challenge

1. Ensure all required fields are filled
2. Click **"Save Challenge"**
3. Challenge is linked to your job posting

## Example: FizzBuzz Challenge

### Challenge Setup
- **Title**: FizzBuzz Algorithm
- **Language**: Python
- **Problem**: "Write a program that reads a number and applies FizzBuzz rules"
- **Difficulty**: Beginner
- **Timeout**: 30 seconds

### Code Template (Optional)
```python
# Input: read the number
n = int(input())

# Write your FizzBuzz logic here
# Your code here

# Output the result
```

### Test Cases
| # | Input | Expected Output | Description | Visible? |
|---|-------|-----------------|-------------|----------|
| 1 | `3` | `Fizz` | Multiple of 3 | ✓ Visible |
| 2 | `5` | `Buzz` | Multiple of 5 | ✓ Visible |
| 3 | `15` | `FizzBuzz` | Multiple of both | ✓ Visible |
| 4 | `7` | `7` | Regular number | ✓ Visible |
| 5 | `30` | `FizzBuzz` | Edge case | ✗ Hidden |
| 6 | `100` | `Buzz` | Boundary | ✗ Hidden |

## Tips for Creating Good Challenges

### ✅ DO:

1. **Be Clear**: Write descriptive problem statements
   - What should the code do?
   - What format should output be in?
   - Any edge cases to consider?

2. **Provide Examples**: Include sample input/output
   - Shows candidates what's expected
   - Reduces ambiguity

3. **Use Code Templates**: For complex problems
   - Helps candidates focus on logic
   - Reduces syntax boilerplate

4. **Mix Test Case Visibility**:
   - 2-3 visible (guide candidates)
   - 2-3 hidden (verify correctness)

5. **Test Yourself**: Try the challenge before publishing
   - Make sure test cases work
   - Verify time limit is reasonable

6. **Set Appropriate Difficulty**:
   - Beginner: 5-10 minute problem
   - Junior: 15-30 minute problem
   - Intermediate: 30-60 minute problem
   - Advanced: 60+ minute problem

### ❌ DON'T:

1. **Avoid Ambiguity**: Be specific about expectations
2. **Don't Make it Too Hard**: Especially for junior roles
3. **Don't Use Obscure Syntax**: Focus on logic, not tricks
4. **Don't Change Requirements**: Keep problem statement stable
5. **Don't Have Ambiguous Output**: Be specific about format

## How Candidates Experience It

1. **Find Your Job**: Search and view job posting
2. **See Assessment Required**: Notice "Assessment Required" badge
3. **Start Challenge**: Click "Start Assessment" or "Begin Challenge"
4. **Read Problem**: See description and visible test cases
5. **Write Code**: Type code in editor
   - Optional template is pre-filled
   - Can modify or replace completely
6. **Test Code**: Click "Run Code" button
   - See test results in real-time
   - Green ✓ = Test passed
   - Red ✗ = Test failed
7. **Debug**: Review expected vs actual output
8. **Refine**: Modify code and test again
9. **Submit**: Click "Submit" when ready

## Evaluating Candidate Submissions

After candidates submit their assessments:

1. **View Submissions**: Go to job applications
2. **Review Code**: See submitted code
3. **Check Results**: View test case results
   - Passed tests
   - Failed tests
   - Error messages (if any)
4. **Assess Quality**:
   - Did they pass all tests?
   - Code readability
   - Efficiency
   - Comments/documentation
5. **Make Decision**:
   - Shortlist for interview
   - Request revision
   - Reject with feedback

## Best Practices for Your Company

### Difficulty Matching

**Entry-Level Job** → Beginner Challenge
- Simple algorithms
- Basic syntax
- Clear problem statement

**Junior Developer Job** → Junior Challenge  
- Medium difficulty
- Real-world scenario
- 20-40 minute solve time

**Mid-Level Job** → Intermediate Challenge
- Complex logic
- Multiple edge cases
- 30-60 minute solve time

**Senior Job** → Advanced Challenge
- System design aspects
- Performance optimization
- Advanced features

### Challenge Library

Create a library of challenges:
- **Algorithm Challenges** - Test logic skills
- **Data Structure Challenges** - Test structure knowledge
- **API Challenges** - Test integration skills
- **Full-Stack Challenges** - Test overall ability

Reuse challenges across similar job postings.

### Quality Control

1. **Test Before Publishing**:
   - Try solving it yourself
   - Verify time limits
   - Check test cases

2. **Get Feedback**:
   - Ask current team members
   - Adjust if too hard/easy
   - Refine based on submissions

3. **Update Regularly**:
   - Remove outdated challenges
   - Keep library fresh
   - Add trending topics

## Common Challenge Ideas by Role

### Backend Developer
- REST API design
- Database queries
- Algorithm optimization
- Concurrency problems

### Frontend Developer
- DOM manipulation
- Algorithm solving
- Data transformation
- Performance optimization

### Full-Stack Developer
- Full project (backend + frontend)
- API building and consumption
- Database design
- End-to-end feature

### Data Scientist
- Data cleaning
- Algorithm implementation
- Performance calculation
- Pattern recognition

### DevOps Engineer
- Script automation
- Configuration management
- System optimization
- Performance tuning

## Frequently Asked Questions

**Q: Can candidates use external resources?**
A: They can if you want - they can Google during the test. If you want to prevent this, use invigilation or require them to complete in a monitored environment.

**Q: What if a candidate's code times out?**
A: The system will report a timeout error. This might indicate:
- Infinite loop
- Inefficient algorithm
- Processing too much data

**Q: Can we change a challenge after publishing?**
A: Yes, but be careful - it affects current and past candidates. Consider creating a new version instead.

**Q: What if a candidate passes all visible tests but fails hidden ones?**
A: This is intentional! It means they understood the sample cases but didn't fully solve the problem. Good filter for real understanding.

**Q: Can we set multiple challenges per job?**
A: Yes! Create multiple questions in the same assessment to test multiple skills.

**Q: How do we know a candidate didn't cheat?**
A: Code submission timestamps, execution time, and behavioral patterns help. For critical roles, follow with live coding interview.

## Support

For technical issues or questions:
- Contact: support@skillsync.com
- Documentation: See CODE_TESTING_FEATURE.md
- Examples: See CODE_TESTING_IMPLEMENTATION.md

---

**Ready to improve your hiring with coding challenges?**

Start by creating your first challenge today! The data will quickly show you which candidates have real programming skills.
