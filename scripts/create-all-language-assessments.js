const mongoose = require('mongoose');
const { Assessment } = require('../server/database/models/Assessment');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-ojt-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Helper function to generate assessment with category
async function createLanguageAssessment(language, category, questions) {
  try {
    // Calculate total points
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    
    const assessment = await Assessment.create({
      title: `${language} Programming Assessment`,
      description: `Comprehensive ${language} programming assessment covering fundamentals to advanced concepts`,
      category: category,
      difficulty: 'mixed',
      timeLimit: 45,
      passingScore: 70,
      totalPoints: totalPoints,
      questions: questions,
      isActive: true,
    });
    console.log(`✓ Created ${language} assessment (${questions.length} questions, ${totalPoints} points)`);
    return assessment;
  } catch (error) {
    console.error(`✗ Error creating ${language} assessment:`, error.message);
    throw error;
  }
}

// Python Questions
const pythonQuestions = [
  {
    question: "What is the output of: print(type([]))?",
    type: "multiple-choice",
    options: ["<class 'array'>", "<class 'list'>", "<class 'tuple'>", "<class 'dict'>"],
    correctAnswer: "<class 'list'>",
    difficulty: "easy",
    category: "python",
    points: 1,
  },
  {
    question: "Which keyword is used to create a function in Python?",
    type: "multiple-choice",
    options: ["function", "def", "func", "define"],
    correctAnswer: "def",
    difficulty: "easy",
    category: "python",
    points: 1,
  },
  {
    question: "What does the 'self' parameter represent in Python class methods?",
    type: "multiple-choice",
    options: ["The class itself", "The instance of the class", "A global variable", "The parent class"],
    correctAnswer: "The instance of the class",
    difficulty: "medium",
    category: "python",
    points: 2,
  },
  {
    question: "What is a Python decorator used for?",
    type: "multiple-choice",
    options: ["Styling code", "Modifying function behavior", "Creating classes", "Error handling"],
    correctAnswer: "Modifying function behavior",
    difficulty: "hard",
    category: "python",
    points: 3,
  },
  {
    question: "What is the difference between list and tuple in Python?",
    type: "short-answer",
    correctAnswer: "Lists are mutable, tuples are immutable",
    difficulty: "medium",
    category: "python",
    points: 2,
  }
];

// Java Questions
const javaQuestions = [
  {
    question: "Which keyword is used to create a subclass in Java?",
    type: "multiple-choice",
    options: ["extends", "implements", "inherits", "subclass"],
    correctAnswer: "extends",
    difficulty: "easy",
    category: "java",
    points: 1,
  },
  {
    question: "What is the entry point of a Java application?",
    type: "multiple-choice",
    options: ["start()", "main()", "run()", "init()"],
    correctAnswer: "main()",
    difficulty: "easy",
    category: "java",
    points: 1,
  },
  {
    question: "What is the difference between abstract class and interface in Java?",
    type: "short-answer",
    correctAnswer: "Abstract classes can have implementation, interfaces cannot (before Java 8)",
    difficulty: "medium",
    category: "java",
    points: 2,
  },
  {
    question: "What is Java's garbage collection?",
    type: "multiple-choice",
    options: ["Manual memory management", "Automatic memory management", "Disk cleanup", "Code optimization"],
    correctAnswer: "Automatic memory management",
    difficulty: "medium",
    category: "java",
    points: 2,
  },
  {
    question: "What is the purpose of the 'synchronized' keyword in Java?",
    type: "multiple-choice",
    options: ["Speed optimization", "Thread safety", "Memory management", "Exception handling"],
    correctAnswer: "Thread safety",
    difficulty: "hard",
    category: "java",
    points: 3,
  }
];

// JavaScript Questions
const javascriptQuestions = [
  {
    question: "What is the correct way to declare a constant in JavaScript?",
    type: "multiple-choice",
    options: ["var x = 10", "let x = 10", "const x = 10", "constant x = 10"],
    correctAnswer: "const x = 10",
    difficulty: "easy",
    category: "javascript",
    points: 1,
  },
  {
    question: "What does '===' operator check in JavaScript?",
    type: "multiple-choice",
    options: ["Value only", "Type only", "Both value and type", "Reference only"],
    correctAnswer: "Both value and type",
    difficulty: "medium",
    category: "javascript",
    points: 2,
  },
  {
    question: "What is a closure in JavaScript?",
    type: "short-answer",
    correctAnswer: "Function with access to outer function's variables",
    difficulty: "hard",
    category: "javascript",
    points: 3,
  },
  {
    question: "What is the purpose of 'async/await' in JavaScript?",
    type: "multiple-choice",
    options: ["Parallel processing", "Synchronous code", "Asynchronous programming", "Error handling"],
    correctAnswer: "Asynchronous programming",
    difficulty: "medium",
    category: "javascript",
    points: 2,
  },
  {
    question: "What is the event loop in JavaScript?",
    type: "short-answer",
    correctAnswer: "Mechanism that handles asynchronous callbacks",
    difficulty: "hard",
    category: "javascript",
    points: 3,
  }
];

// C# Questions
const csharpQuestions = [
  {
    question: "What is the base class for all classes in C#?",
    type: "multiple-choice",
    options: ["Object", "Base", "Class", "System"],
    correctAnswer: "Object",
    difficulty: "easy",
    category: "csharp",
    points: 1,
  },
  {
    question: "What does LINQ stand for in C#?",
    type: "multiple-choice",
    options: ["Language Integrated Query", "Linear Query", "List Query", "Logic Query"],
    correctAnswer: "Language Integrated Query",
    difficulty: "medium",
    category: "csharp",
    points: 2,
  },
  {
    question: "What is the difference between 'ref' and 'out' parameters in C#?",
    type: "short-answer",
    correctAnswer: "ref requires initialization, out does not",
    difficulty: "hard",
    category: "csharp",
    points: 3,
  },
  {
    question: "What is a delegate in C#?",
    type: "multiple-choice",
    options: ["A class", "A type-safe function pointer", "An interface", "A struct"],
    correctAnswer: "A type-safe function pointer",
    difficulty: "medium",
    category: "csharp",
    points: 2,
  },
  {
    question: "What is the purpose of 'async' keyword in C#?",
    type: "multiple-choice",
    options: ["Parallel execution", "Asynchronous programming", "Thread management", "Error handling"],
    correctAnswer: "Asynchronous programming",
    difficulty: "medium",
    category: "csharp",
    points: 2,
  }
];

// PHP Questions
const phpQuestions = [
  {
    question: "How do you start a PHP script?",
    type: "multiple-choice",
    options: ["<php>", "<?php", "<script>", "<?"],
    correctAnswer: "<?php",
    difficulty: "easy",
    category: "php",
    points: 1,
  },
  {
    question: "What is the correct way to declare a variable in PHP?",
    type: "multiple-choice",
    options: ["var $name", "$name", "name$", "variable name"],
    correctAnswer: "$name",
    difficulty: "easy",
    category: "php",
    points: 1,
  },
  {
    question: "What is the difference between '==' and '===' in PHP?",
    type: "short-answer",
    correctAnswer: "== checks value, === checks value and type",
    difficulty: "medium",
    category: "php",
    points: 2,
  },
  {
    question: "What does PSR stand for in PHP?",
    type: "multiple-choice",
    options: ["PHP Standard Request", "PHP Standard Recommendation", "PHP System Request", "PHP Syntax Rule"],
    correctAnswer: "PHP Standard Recommendation",
    difficulty: "hard",
    category: "php",
    points: 3,
  },
  {
    question: "What is a trait in PHP?",
    type: "multiple-choice",
    options: ["A class type", "Code reuse mechanism", "An interface", "A function"],
    correctAnswer: "Code reuse mechanism",
    difficulty: "medium",
    category: "php",
    points: 2,
  }
];

// SQL Questions
const sqlQuestions = [
  {
    question: "Which SQL statement is used to extract data from a database?",
    type: "multiple-choice",
    options: ["GET", "SELECT", "EXTRACT", "OPEN"],
    correctAnswer: "SELECT",
    difficulty: "easy",
    category: "sql",
    points: 1,
  },
  {
    question: "What does the SQL JOIN clause do?",
    type: "multiple-choice",
    options: ["Merges databases", "Combines rows from tables", "Creates tables", "Deletes data"],
    correctAnswer: "Combines rows from tables",
    difficulty: "medium",
    category: "sql",
    points: 2,
  },
  {
    question: "What is the difference between INNER JOIN and LEFT JOIN?",
    type: "short-answer",
    correctAnswer: "INNER JOIN returns matching rows, LEFT JOIN returns all left table rows",
    difficulty: "hard",
    category: "sql",
    points: 3,
  },
  {
    question: "What is a primary key in SQL?",
    type: "multiple-choice",
    options: ["First column", "Unique identifier", "Foreign reference", "Index"],
    correctAnswer: "Unique identifier",
    difficulty: "easy",
    category: "sql",
    points: 1,
  },
  {
    question: "What does the GROUP BY clause do?",
    type: "multiple-choice",
    options: ["Sorts data", "Groups rows with same values", "Filters data", "Joins tables"],
    correctAnswer: "Groups rows with same values",
    difficulty: "medium",
    category: "sql",
    points: 2,
  }
];

// TypeScript Questions
const typescriptQuestions = [
  {
    question: "What is TypeScript?",
    type: "multiple-choice",
    options: ["A new language", "Superset of JavaScript", "JavaScript framework", "Database language"],
    correctAnswer: "Superset of JavaScript",
    difficulty: "easy",
    category: "typescript",
    points: 1,
  },
  {
    question: "How do you define an interface in TypeScript?",
    type: "multiple-choice",
    options: ["class", "interface", "type", "struct"],
    correctAnswer: "interface",
    difficulty: "easy",
    category: "typescript",
    points: 1,
  },
  {
    question: "What is the 'any' type in TypeScript?",
    type: "multiple-choice",
    options: ["Error type", "Type that can be anything", "Number type", "String type"],
    correctAnswer: "Type that can be anything",
    difficulty: "medium",
    category: "typescript",
    points: 2,
  },
  {
    question: "What is a generic in TypeScript?",
    type: "short-answer",
    correctAnswer: "Type parameter that allows reusable components",
    difficulty: "hard",
    category: "typescript",
    points: 3,
  },
  {
    question: "What does 'strictNullChecks' do in TypeScript?",
    type: "multiple-choice",
    options: ["Allows nulls", "Prevents null/undefined errors", "Disables nulls", "Converts nulls"],
    correctAnswer: "Prevents null/undefined errors",
    difficulty: "medium",
    category: "typescript",
    points: 2,
  }
];

// C++ Questions
const cppQuestions = [
  {
    question: "What is the correct way to declare a pointer in C++?",
    type: "multiple-choice",
    options: ["int *ptr", "int ptr*", "pointer int ptr", "*int ptr"],
    correctAnswer: "int *ptr",
    difficulty: "easy",
    category: "cpp",
    points: 1,
  },
  {
    question: "What is the difference between 'new' and 'malloc' in C++?",
    type: "short-answer",
    correctAnswer: "new calls constructor, malloc does not",
    difficulty: "hard",
    category: "cpp",
    points: 3,
  },
  {
    question: "What is a virtual function in C++?",
    type: "multiple-choice",
    options: ["Abstract function", "Function for polymorphism", "Static function", "Inline function"],
    correctAnswer: "Function for polymorphism",
    difficulty: "medium",
    category: "cpp",
    points: 2,
  },
  {
    question: "What does RAII stand for in C++?",
    type: "multiple-choice",
    options: ["Resource Acquisition Is Initialization", "Runtime Array Initialization", "Reference And Interface Inheritance", "Random Access Index Iterator"],
    correctAnswer: "Resource Acquisition Is Initialization",
    difficulty: "hard",
    category: "cpp",
    points: 3,
  },
  {
    question: "What is the STL in C++?",
    type: "multiple-choice",
    options: ["Standard Template Library", "System Type Library", "Static Template Link", "String Template Language"],
    correctAnswer: "Standard Template Library",
    difficulty: "medium",
    category: "cpp",
    points: 2,
  }
];

// Go Questions
const goQuestions = [
  {
    question: "What is a goroutine in Go?",
    type: "multiple-choice",
    options: ["A function", "Lightweight thread", "A package", "A variable"],
    correctAnswer: "Lightweight thread",
    difficulty: "medium",
    category: "go",
    points: 2,
  },
  {
    question: "How do you declare a variable in Go?",
    type: "multiple-choice",
    options: ["var x int", "int x", "x := 0", "Both var x int and x := 0"],
    correctAnswer: "Both var x int and x := 0",
    difficulty: "easy",
    category: "go",
    points: 1,
  },
  {
    question: "What is a channel in Go?",
    type: "short-answer",
    correctAnswer: "Communication mechanism between goroutines",
    difficulty: "hard",
    category: "go",
    points: 3,
  },
  {
    question: "What is the purpose of 'defer' in Go?",
    type: "multiple-choice",
    options: ["Delay execution", "Execute function at end of scope", "Error handling", "Memory management"],
    correctAnswer: "Execute function at end of scope",
    difficulty: "medium",
    category: "go",
    points: 2,
  },
  {
    question: "What is an interface in Go?",
    type: "multiple-choice",
    options: ["A class", "Collection of method signatures", "A struct", "A function"],
    correctAnswer: "Collection of method signatures",
    difficulty: "medium",
    category: "go",
    points: 2,
  }
];

// Ruby Questions
const rubyQuestions = [
  {
    question: "What is the correct way to define a method in Ruby?",
    type: "multiple-choice",
    options: ["function name", "def name", "method name", "define name"],
    correctAnswer: "def name",
    difficulty: "easy",
    category: "ruby",
    points: 1,
  },
  {
    question: "What is a symbol in Ruby?",
    type: "multiple-choice",
    options: ["A string", "Immutable identifier", "A number", "A variable"],
    correctAnswer: "Immutable identifier",
    difficulty: "medium",
    category: "ruby",
    points: 2,
  },
  {
    question: "What does the 'yield' keyword do in Ruby?",
    type: "short-answer",
    correctAnswer: "Calls the block passed to a method",
    difficulty: "hard",
    category: "ruby",
    points: 3,
  },
  {
    question: "What is the difference between 'include' and 'extend' in Ruby?",
    type: "short-answer",
    correctAnswer: "include adds instance methods, extend adds class methods",
    difficulty: "hard",
    category: "ruby",
    points: 3,
  },
  {
    question: "What is a proc in Ruby?",
    type: "multiple-choice",
    options: ["A process", "Object that holds block of code", "A function", "A class"],
    correctAnswer: "Object that holds block of code",
    difficulty: "medium",
    category: "ruby",
    points: 2,
  }
];

// Swift Questions
const swiftQuestions = [
  {
    question: "What is the difference between 'var' and 'let' in Swift?",
    type: "short-answer",
    correctAnswer: "var is mutable, let is immutable",
    difficulty: "easy",
    category: "swift",
    points: 1,
  },
  {
    question: "What is an optional in Swift?",
    type: "multiple-choice",
    options: ["A nullable value", "An array", "A function", "A class"],
    correctAnswer: "A nullable value",
    difficulty: "medium",
    category: "swift",
    points: 2,
  },
  {
    question: "What does the '?' operator do in Swift?",
    type: "multiple-choice",
    options: ["Division", "Optional unwrapping", "Comparison", "Assignment"],
    correctAnswer: "Optional unwrapping",
    difficulty: "medium",
    category: "swift",
    points: 2,
  },
  {
    question: "What is a protocol in Swift?",
    type: "multiple-choice",
    options: ["A class", "Blueprint of methods", "A function", "A variable"],
    correctAnswer: "Blueprint of methods",
    difficulty: "medium",
    category: "swift",
    points: 2,
  },
  {
    question: "What is ARC in Swift?",
    type: "multiple-choice",
    options: ["Automatic Reference Counting", "Array Reference Control", "Auto Release Code", "Advanced Runtime Compiler"],
    correctAnswer: "Automatic Reference Counting",
    difficulty: "hard",
    category: "swift",
    points: 3,
  }
];

// Kotlin Questions
const kotlinQuestions = [
  {
    question: "What is the correct way to declare a variable in Kotlin?",
    type: "multiple-choice",
    options: ["var name: String", "String name", "name: String", "variable name"],
    correctAnswer: "var name: String",
    difficulty: "easy",
    category: "kotlin",
    points: 1,
  },
  {
    question: "What is the difference between 'val' and 'var' in Kotlin?",
    type: "short-answer",
    correctAnswer: "val is immutable, var is mutable",
    difficulty: "easy",
    category: "kotlin",
    points: 1,
  },
  {
    question: "What is a data class in Kotlin?",
    type: "multiple-choice",
    options: ["Regular class", "Class for holding data", "Abstract class", "Interface"],
    correctAnswer: "Class for holding data",
    difficulty: "medium",
    category: "kotlin",
    points: 2,
  },
  {
    question: "What is null safety in Kotlin?",
    type: "short-answer",
    correctAnswer: "Feature that prevents null pointer exceptions",
    difficulty: "medium",
    category: "kotlin",
    points: 2,
  },
  {
    question: "What is a coroutine in Kotlin?",
    type: "multiple-choice",
    options: ["A thread", "Lightweight async operation", "A function", "A class"],
    correctAnswer: "Lightweight async operation",
    difficulty: "hard",
    category: "kotlin",
    points: 3,
  }
];

// Rust Questions
const rustQuestions = [
  {
    question: "What is Rust's ownership system?",
    type: "multiple-choice",
    options: ["Memory management", "Class hierarchy", "Package system", "Type system"],
    correctAnswer: "Memory management",
    difficulty: "hard",
    category: "rust",
    points: 3,
  },
  {
    question: "What does 'mut' keyword mean in Rust?",
    type: "multiple-choice",
    options: ["Method", "Mutable", "Multiple", "Mutex"],
    correctAnswer: "Mutable",
    difficulty: "easy",
    category: "rust",
    points: 1,
  },
  {
    question: "What is borrowing in Rust?",
    type: "short-answer",
    correctAnswer: "Passing references without transferring ownership",
    difficulty: "hard",
    category: "rust",
    points: 3,
  },
  {
    question: "What is a trait in Rust?",
    type: "multiple-choice",
    options: ["A class", "Shared behavior interface", "A function", "A variable"],
    correctAnswer: "Shared behavior interface",
    difficulty: "medium",
    category: "rust",
    points: 2,
  },
  {
    question: "What does 'cargo' do in Rust?",
    type: "multiple-choice",
    options: ["Compiler", "Package manager", "Debugger", "Formatter"],
    correctAnswer: "Package manager",
    difficulty: "easy",
    category: "rust",
    points: 1,
  }
];

// C Questions
const cQuestions = [
  {
    question: "What is the correct way to declare a pointer in C?",
    type: "multiple-choice",
    options: ["int *ptr", "int ptr*", "pointer int", "*int ptr"],
    correctAnswer: "int *ptr",
    difficulty: "easy",
    category: "c",
    points: 1,
  },
  {
    question: "What does 'malloc' do in C?",
    type: "multiple-choice",
    options: ["Memory allocation", "Math calculation", "Main loop", "Module allocation"],
    correctAnswer: "Memory allocation",
    difficulty: "medium",
    category: "c",
    points: 2,
  },
  {
    question: "What is the difference between 'struct' and 'union' in C?",
    type: "short-answer",
    correctAnswer: "struct allocates memory for all members, union shares memory",
    difficulty: "hard",
    category: "c",
    points: 3,
  },
  {
    question: "What is a header file in C?",
    type: "multiple-choice",
    options: ["Main file", "File with declarations", "Binary file", "Text file"],
    correctAnswer: "File with declarations",
    difficulty: "easy",
    category: "c",
    points: 1,
  },
  {
    question: "What does 'sizeof' operator return in C?",
    type: "multiple-choice",
    options: ["File size", "Memory size of type", "Array length", "String length"],
    correctAnswer: "Memory size of type",
    difficulty: "medium",
    category: "c",
    points: 2,
  }
];

// R Questions
const rQuestions = [
  {
    question: "What is R primarily used for?",
    type: "multiple-choice",
    options: ["Web development", "Statistical computing", "Game development", "Mobile apps"],
    correctAnswer: "Statistical computing",
    difficulty: "easy",
    category: "r",
    points: 1,
  },
  {
    question: "How do you assign a value to a variable in R?",
    type: "multiple-choice",
    options: ["x = 5", "x <- 5", "Both = and <-", "x := 5"],
    correctAnswer: "Both = and <-",
    difficulty: "easy",
    category: "r",
    points: 1,
  },
  {
    question: "What is a data frame in R?",
    type: "multiple-choice",
    options: ["A plot", "Table-like structure", "A function", "A package"],
    correctAnswer: "Table-like structure",
    difficulty: "medium",
    category: "r",
    points: 2,
  },
  {
    question: "What is the purpose of the 'ggplot2' package in R?",
    type: "multiple-choice",
    options: ["Data manipulation", "Data visualization", "Statistical testing", "Machine learning"],
    correctAnswer: "Data visualization",
    difficulty: "medium",
    category: "r",
    points: 2,
  },
  {
    question: "What is a factor in R?",
    type: "short-answer",
    correctAnswer: "Categorical variable with levels",
    difficulty: "hard",
    category: "r",
    points: 3,
  }
];

// Perl Questions
const perlQuestions = [
  {
    question: "What does PERL stand for?",
    type: "multiple-choice",
    options: ["Practical Extraction and Report Language", "Programming Execution Runtime Language", "Portable Execution Runtime Language", "Process Extraction Report Language"],
    correctAnswer: "Practical Extraction and Report Language",
    difficulty: "easy",
    category: "perl",
    points: 1,
  },
  {
    question: "How do you declare a scalar variable in Perl?",
    type: "multiple-choice",
    options: ["$var", "@var", "%var", "&var"],
    correctAnswer: "$var",
    difficulty: "easy",
    category: "perl",
    points: 1,
  },
  {
    question: "What is the purpose of 'use strict' in Perl?",
    type: "multiple-choice",
    options: ["Speed optimization", "Enforce coding standards", "Error handling", "Module loading"],
    correctAnswer: "Enforce coding standards",
    difficulty: "medium",
    category: "perl",
    points: 2,
  },
  {
    question: "What is a hash in Perl?",
    type: "multiple-choice",
    options: ["Array", "Key-value pairs", "Function", "String"],
    correctAnswer: "Key-value pairs",
    difficulty: "medium",
    category: "perl",
    points: 2,
  },
  {
    question: "What is CPAN in Perl?",
    type: "multiple-choice",
    options: ["Compiler", "Module repository", "Debugger", "Editor"],
    correctAnswer: "Module repository",
    difficulty: "hard",
    category: "perl",
    points: 3,
  }
];

// HTML Questions
const htmlQuestions = [
  {
    question: "What does HTML stand for?",
    type: "multiple-choice",
    options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks Text Markup Language"],
    correctAnswer: "Hyper Text Markup Language",
    difficulty: "easy",
    category: "html",
    points: 1,
  },
  {
    question: "Which tag is used for creating a hyperlink?",
    type: "multiple-choice",
    options: ["<link>", "<a>", "<href>", "<url>"],
    correctAnswer: "<a>",
    difficulty: "easy",
    category: "html",
    points: 1,
  },
  {
    question: "What is the purpose of the <head> tag?",
    type: "multiple-choice",
    options: ["Page content", "Metadata", "Header section", "Navigation"],
    correctAnswer: "Metadata",
    difficulty: "medium",
    category: "html",
    points: 2,
  },
  {
    question: "What is semantic HTML?",
    type: "short-answer",
    correctAnswer: "Using tags that describe content meaning",
    difficulty: "hard",
    category: "html",
    points: 3,
  },
  {
    question: "What is the difference between <div> and <span>?",
    type: "short-answer",
    correctAnswer: "div is block-level, span is inline",
    difficulty: "medium",
    category: "html",
    points: 2,
  }
];

// CSS Questions
const cssQuestions = [
  {
    question: "What does CSS stand for?",
    type: "multiple-choice",
    options: ["Cascading Style Sheets", "Creative Style System", "Computer Style Sheets", "Colorful Style Sheets"],
    correctAnswer: "Cascading Style Sheets",
    difficulty: "easy",
    category: "css",
    points: 1,
  },
  {
    question: "Which property is used to change text color in CSS?",
    type: "multiple-choice",
    options: ["text-color", "color", "font-color", "text-style"],
    correctAnswer: "color",
    difficulty: "easy",
    category: "css",
    points: 1,
  },
  {
    question: "What is the CSS Box Model?",
    type: "multiple-choice",
    options: ["Design pattern", "Layout system with margin/border/padding", "Animation model", "Grid system"],
    correctAnswer: "Layout system with margin/border/padding",
    difficulty: "medium",
    category: "css",
    points: 2,
  },
  {
    question: "What is Flexbox used for in CSS?",
    type: "multiple-choice",
    options: ["Animations", "Flexible layouts", "Fonts", "Colors"],
    correctAnswer: "Flexible layouts",
    difficulty: "medium",
    category: "css",
    points: 2,
  },
  {
    question: "What is the difference between 'relative' and 'absolute' positioning?",
    type: "short-answer",
    correctAnswer: "relative positions relative to normal position, absolute relative to parent",
    difficulty: "hard",
    category: "css",
    points: 3,
  }
];

// Objective-C Questions
const objectivecQuestions = [
  {
    question: "What is Objective-C primarily used for?",
    type: "multiple-choice",
    options: ["Android development", "iOS/macOS development", "Web development", "Game development"],
    correctAnswer: "iOS/macOS development",
    difficulty: "easy",
    category: "objectivec",
    points: 1,
  },
  {
    question: "What is the syntax for declaring a method in Objective-C?",
    type: "multiple-choice",
    options: ["- (void)methodName", "void methodName()", "method methodName", "def methodName"],
    correctAnswer: "- (void)methodName",
    difficulty: "medium",
    category: "objectivec",
    points: 2,
  },
  {
    question: "What is a protocol in Objective-C?",
    type: "multiple-choice",
    options: ["Class", "Interface-like contract", "Function", "Variable"],
    correctAnswer: "Interface-like contract",
    difficulty: "medium",
    category: "objectivec",
    points: 2,
  },
  {
    question: "What is ARC in Objective-C?",
    type: "multiple-choice",
    options: ["Automatic Reference Counting", "Array Reference Control", "Auto Release Code", "Application Runtime Compiler"],
    correctAnswer: "Automatic Reference Counting",
    difficulty: "hard",
    category: "objectivec",
    points: 3,
  },
  {
    question: "What is the purpose of '@property' in Objective-C?",
    type: "short-answer",
    correctAnswer: "Declares property with automatic getter/setter",
    difficulty: "medium",
    category: "objectivec",
    points: 2,
  }
];

// Visual Basic Questions
const visualbasicQuestions = [
  {
    question: "What is Visual Basic primarily used for?",
    type: "multiple-choice",
    options: ["Web development", "Windows applications", "Mobile apps", "System programming"],
    correctAnswer: "Windows applications",
    difficulty: "easy",
    category: "visualbasic",
    points: 1,
  },
  {
    question: "How do you declare a variable in VB?",
    type: "multiple-choice",
    options: ["Dim x As Integer", "var x", "int x", "x : Integer"],
    correctAnswer: "Dim x As Integer",
    difficulty: "easy",
    category: "visualbasic",
    points: 1,
  },
  {
    question: "What is the purpose of 'Option Explicit' in VB?",
    type: "multiple-choice",
    options: ["Speed optimization", "Require variable declaration", "Error handling", "Memory management"],
    correctAnswer: "Require variable declaration",
    difficulty: "medium",
    category: "visualbasic",
    points: 2,
  },
  {
    question: "What is an event handler in Visual Basic?",
    type: "multiple-choice",
    options: ["Error handler", "Procedure that responds to events", "Data handler", "File handler"],
    correctAnswer: "Procedure that responds to events",
    difficulty: "medium",
    category: "visualbasic",
    points: 2,
  },
  {
    question: "What is the difference between 'ByVal' and 'ByRef' in VB?",
    type: "short-answer",
    correctAnswer: "ByVal passes value copy, ByRef passes reference",
    difficulty: "hard",
    category: "visualbasic",
    points: 3,
  }
];

// Assembly Questions
const assemblyQuestions = [
  {
    question: "What is Assembly language?",
    type: "multiple-choice",
    options: ["High-level language", "Low-level language close to machine code", "Scripting language", "Markup language"],
    correctAnswer: "Low-level language close to machine code",
    difficulty: "easy",
    category: "assembly",
    points: 1,
  },
  {
    question: "What is a register in Assembly?",
    type: "multiple-choice",
    options: ["Memory location", "Fast CPU storage", "Hard disk", "Cache"],
    correctAnswer: "Fast CPU storage",
    difficulty: "medium",
    category: "assembly",
    points: 2,
  },
  {
    question: "What does MOV instruction do in Assembly?",
    type: "multiple-choice",
    options: ["Move mouse", "Move data", "Move files", "Move window"],
    correctAnswer: "Move data",
    difficulty: "easy",
    category: "assembly",
    points: 1,
  },
  {
    question: "What is the purpose of the stack in Assembly?",
    type: "short-answer",
    correctAnswer: "Store temporary data and return addresses",
    difficulty: "hard",
    category: "assembly",
    points: 3,
  },
  {
    question: "What is an assembler?",
    type: "multiple-choice",
    options: ["Debugger", "Converts assembly to machine code", "Compiler", "Linker"],
    correctAnswer: "Converts assembly to machine code",
    difficulty: "medium",
    category: "assembly",
    points: 2,
  }
];

// MATLAB Questions
const matlabQuestions = [
  {
    question: "What is MATLAB primarily used for?",
    type: "multiple-choice",
    options: ["Web development", "Numerical computing", "Game development", "Mobile apps"],
    correctAnswer: "Numerical computing",
    difficulty: "easy",
    category: "matlab",
    points: 1,
  },
  {
    question: "How do you create a matrix in MATLAB?",
    type: "multiple-choice",
    options: ["A = [1 2; 3 4]", "A = {1,2,3,4}", "A = (1,2,3,4)", "A = <1,2,3,4>"],
    correctAnswer: "A = [1 2; 3 4]",
    difficulty: "easy",
    category: "matlab",
    points: 1,
  },
  {
    question: "What is the purpose of the ':' operator in MATLAB?",
    type: "multiple-choice",
    options: ["Division", "Create ranges/sequences", "Assignment", "Comparison"],
    correctAnswer: "Create ranges/sequences",
    difficulty: "medium",
    category: "matlab",
    points: 2,
  },
  {
    question: "What is Simulink in MATLAB?",
    type: "multiple-choice",
    options: ["Debugger", "Graphical programming environment", "Package manager", "Editor"],
    correctAnswer: "Graphical programming environment",
    difficulty: "hard",
    category: "matlab",
    points: 3,
  },
  {
    question: "What does the 'plot' function do in MATLAB?",
    type: "multiple-choice",
    options: ["Calculate plot", "Create 2D line plots", "Plot files", "Plot points"],
    correctAnswer: "Create 2D line plots",
    difficulty: "medium",
    category: "matlab",
    points: 2,
  }
];

// Scala Questions
const scalaQuestions = [
  {
    question: "What is Scala?",
    type: "multiple-choice",
    options: ["Pure OOP language", "Functional and OOP language", "Scripting language", "Markup language"],
    correctAnswer: "Functional and OOP language",
    difficulty: "easy",
    category: "scala",
    points: 1,
  },
  {
    question: "What does 'val' mean in Scala?",
    type: "multiple-choice",
    options: ["Variable", "Immutable value", "Function", "Class"],
    correctAnswer: "Immutable value",
    difficulty: "easy",
    category: "scala",
    points: 1,
  },
  {
    question: "What is a case class in Scala?",
    type: "multiple-choice",
    options: ["Regular class", "Immutable class with pattern matching", "Abstract class", "Interface"],
    correctAnswer: "Immutable class with pattern matching",
    difficulty: "medium",
    category: "scala",
    points: 2,
  },
  {
    question: "What is the purpose of traits in Scala?",
    type: "short-answer",
    correctAnswer: "Shared interfaces and methods for classes",
    difficulty: "hard",
    category: "scala",
    points: 3,
  },
  {
    question: "What is pattern matching in Scala?",
    type: "multiple-choice",
    options: ["String matching", "Powerful switch statement", "Regular expressions", "Type checking"],
    correctAnswer: "Powerful switch statement",
    difficulty: "medium",
    category: "scala",
    points: 2,
  }
];

// Main execution
async function main() {
  try {
    console.log('🚀 Creating programming language assessments...\n');

    const assessments = [
      { name: 'Python', category: 'python', questions: pythonQuestions },
      { name: 'Java', category: 'java', questions: javaQuestions },
      { name: 'JavaScript', category: 'javascript', questions: javascriptQuestions },
      { name: 'C#', category: 'csharp', questions: csharpQuestions },
      { name: 'PHP', category: 'php', questions: phpQuestions },
      { name: 'SQL', category: 'sql', questions: sqlQuestions },
      { name: 'TypeScript', category: 'typescript', questions: typescriptQuestions },
      { name: 'C++', category: 'cpp', questions: cppQuestions },
      { name: 'Go', category: 'go', questions: goQuestions },
      { name: 'Ruby', category: 'ruby', questions: rubyQuestions },
      { name: 'Swift', category: 'swift', questions: swiftQuestions },
      { name: 'Kotlin', category: 'kotlin', questions: kotlinQuestions },
      { name: 'Rust', category: 'rust', questions: rustQuestions },
      { name: 'C', category: 'c', questions: cQuestions },
      { name: 'R', category: 'r', questions: rQuestions },
      { name: 'Perl', category: 'perl', questions: perlQuestions },
      { name: 'HTML', category: 'html', questions: htmlQuestions },
      { name: 'CSS', category: 'css', questions: cssQuestions },
      { name: 'Objective-C', category: 'objectivec', questions: objectivecQuestions },
      { name: 'Visual Basic', category: 'visualbasic', questions: visualbasicQuestions },
      { name: 'Assembly', category: 'assembly', questions: assemblyQuestions },
      { name: 'MATLAB', category: 'matlab', questions: matlabQuestions },
      { name: 'Scala', category: 'scala', questions: scalaQuestions },
    ];

    for (const { name, category, questions } of assessments) {
      await createLanguageAssessment(name, category, questions);
    }

    console.log('\n✅ All programming language assessments created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating assessments:', error);
    process.exit(1);
  }
}

main();
