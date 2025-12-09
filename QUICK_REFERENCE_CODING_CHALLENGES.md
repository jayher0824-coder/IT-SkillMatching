# Coding Challenges in Custom Assessments - Quick Reference

## 🎯 What You Asked
**"Where in create custom assessment is the Debugging test?"**

## ✅ Answer
**It's now in the Question Type dropdown!**

When you create a custom assessment and click "Add Question", you'll see:

```
Question Type ▼
├── Multiple Choice
├── True/False
├── Short Answer
└── Coding Challenge ◀── SELECT THIS
```

## 🚀 Quick Start (1 minute)

### Create Coding Challenge
1. Click "Create Custom Assessment" on any job posting
2. Click "Add Question"
3. **Question Type** → Select **"Coding Challenge"**
4. Enter problem description
5. Select **Programming Language** (Python, JavaScript, Java, etc.)
6. Select **Difficulty Level** (Beginner, Junior, Intermediate, Advanced)
7. Add **Test Cases** in JSON:
   ```json
   [
     {"input": "5", "output": "120"},
     {"input": "0", "output": "1"}
   ]
   ```
8. (Optional) Provide **Code Template** for starter code
9. Set **Time Limit** (default 30 seconds)
10. Save Assessment

### Student Takes Coding Challenge
1. See problem description
2. Write code in editor
3. Click **"Run Test Cases"** to test
4. See results (pass/fail per test)
5. Submit assessment

## 🛠️ Supported Languages (10)
✓ Python
✓ JavaScript
✓ Java
✓ C++
✓ C#
✓ PHP
✓ Ruby
✓ Go
✓ Rust
✓ TypeScript

## 📊 Difficulty Levels (4)
- **Beginner** - 5-15 minutes - Basic syntax, simple algorithms
- **Junior** - 15-30 minutes - Intermediate problems, data structures
- **Intermediate** - 30-60 minutes - Complex algorithms, optimization
- **Advanced** - 60+ minutes - System design, advanced concepts

## 📝 Test Case Format

**Valid JSON Array Format:**
```json
[
  {"input": "hello", "output": "5"},
  {"input": "world", "output": "5"},
  {"input": "", "output": "0"}
]
```

**Each test case needs:**
- `input` - What the function receives (as string)
- `output` - Expected result (as string)

## ✨ Features

✅ **10 Programming Languages** supported
✅ **4 Difficulty Levels** for different job requirements
✅ **Automatic Code Testing** with immediate feedback
✅ **Multiple Test Cases** per challenge
✅ **Code Templates** for starter code (optional)
✅ **Time Limits** for execution (5-300 seconds)
✅ **Mixed Assessments** - Combine with Q&A questions
✅ **Instant Results** - Pass/fail per test case
✅ **Code Storage** - Answers saved with submission

## 💾 How Answers Are Saved

- Code is saved as the answer to that question
- Test results are recorded
- Automatic scoring: **5 points per coding challenge** (vs 1 point for Q&A)
- Full code submission available for review

## 🔗 Integration

Works seamlessly with:
- **Multiple Choice** questions
- **True/False** questions
- **Short Answer** questions
- All in **one assessment**

## 📚 Full Documentation

For complete guides and examples, see:
- **CUSTOM_ASSESSMENT_CODING.md** - Complete guide
- **CUSTOM_ASSESSMENT_UI_PREVIEW.md** - Visual mockups
- **CODING_CHALLENGES_SUMMARY.md** - Implementation details

## ⚡ Use Cases

**For Companies:**
- Evaluate programming skills objectively
- Test multiple languages in single assessment
- Provide starter code templates
- Adjust difficulty for different roles
- Review candidate code quality

**For Students/Candidates:**
- Get instant feedback on code
- See which test cases pass/fail
- Learn from test results
- Complete entire application in one assessment

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid JSON" | Check test case format is valid JSON |
| Code won't run | Check syntax for selected language |
| Different output | Check whitespace, case sensitivity |
| Timeout error | Code too slow, optimize or increase time limit |
| No test cases showing | Test cases must be valid JSON array |

## 📈 Scoring Example

**Assessment: Full Stack Developer Test**
```
Question 1: Multiple Choice         → 1 point
Question 2: Coding Challenge        → 5 points ✨
Question 3: True/False              → 1 point
Question 4: Coding Challenge        → 5 points ✨
Question 5: Short Answer            → 1 point
─────────────────────────────────────────────
Total Possible Score:                 13 points
```

## 🎓 Example Challenge: Factorial

**Problem:** "Write a function that calculates the factorial of a number"

**Language:** Python
**Difficulty:** Beginner
**Time Limit:** 30 seconds

**Test Cases:**
```json
[
  {"input": "5", "output": "120"},
  {"input": "0", "output": "1"},
  {"input": "3", "output": "6"},
  {"input": "10", "output": "3628800"}
]
```

**Code Template (optional):**
```python
def factorial(n):
    # Calculate factorial of n
    # Return the result
    pass
```

**Student's Solution:**
```python
def factorial(n):
    if n == 0 or n == 1:
        return 1
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result
```

**Results:**
- Test 1: PASS ✓
- Test 2: PASS ✓
- Test 3: PASS ✓
- Test 4: PASS ✓
- **Score: 5 points**

## 🚀 Get Started Now!

1. Go to any job posting
2. Click "Create Custom Assessment"
3. Click "Add Question"
4. Select **"Coding Challenge"** from Question Type
5. Follow the prompts!

---

**Status:** ✅ **Ready for Production**
**Latest Commit:** a2485b5
**Documentation:** Complete (1,500+ lines)
**Languages Supported:** 10
**Difficulty Levels:** 4
