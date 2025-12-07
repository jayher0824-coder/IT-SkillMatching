const mongoose = require('mongoose');
const { Assessment } = require('../server/database/models/Assessment');
require('dotenv').config();

// This script will create assessments in your production database
// Make sure your .env file has the correct MONGODB_URI for production

async function createProductionAssessments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Check if assessments already exist
    const existingAssessments = await Assessment.find({});
    if (existingAssessments.length > 0) {
      console.log(`Found ${existingAssessments.length} existing assessments.`);
      console.log('Do you want to continue? This will add more assessments.');
      // For safety, exit if assessments exist
      console.log('Exiting to prevent duplicates. Delete existing assessments first if needed.\n');
      process.exit(0);
    }

    console.log('Creating comprehensive IT Skills Assessment...\n');

    // All questions for the general assessment
    const allQuestions = [
      // Programming Questions (10)
      {
        question: "What is the main difference between a compiled and an interpreted language?",
        type: "multiple-choice",
        options: ["Interpreted languages are faster than compiled ones", "Compiled languages require a compiler before execution", "Interpreted languages don't need any software to run", "Compiled languages are only for web applications"],
        correctAnswer: "Compiled languages require a compiler before execution",
        difficulty: "easy",
        category: "programming",
        points: 1,
        explanation: "Compiled languages need to be translated into machine code before execution."
      },
      {
        question: "What is an algorithm?",
        type: "multiple-choice",
        options: ["A computer language", "A set of step-by-step instructions to solve a problem", "A type of compiler", "A debugging process"],
        correctAnswer: "A set of step-by-step instructions to solve a problem",
        difficulty: "easy",
        category: "programming",
        points: 1,
        explanation: "An algorithm is a sequence of steps to solve a problem."
      },
      {
        question: "Which of the following is a linear data structure?",
        type: "multiple-choice",
        options: ["Tree", "Graph", "Queue", "Hash Table"],
        correctAnswer: "Queue",
        difficulty: "easy",
        category: "programming",
        points: 1,
        explanation: "Queue is a linear data structure that follows FIFO."
      },
      {
        question: "What is recursion?",
        type: "multiple-choice",
        options: ["A process of looping through data structures", "A function that calls itself", "An error handling mechanism", "A database query"],
        correctAnswer: "A function that calls itself",
        difficulty: "easy",
        category: "programming",
        points: 1,
        explanation: "Recursion is a function calling itself to solve problems."
      },
      {
        question: "Which of the following represents the LIFO (Last In, First Out) principle?",
        type: "multiple-choice",
        options: ["Queue", "Stack", "Array", "Linked List"],
        correctAnswer: "Stack",
        difficulty: "easy",
        category: "programming",
        points: 1,
        explanation: "Stack follows LIFO principle."
      },
      {
        question: "Which of these is NOT a data type?",
        type: "multiple-choice",
        options: ["Integer", "Boolean", "While", "String"],
        correctAnswer: "While",
        difficulty: "easy",
        category: "programming",
        points: 1,
        explanation: "While is a loop construct, not a data type."
      },
      {
        question: "What is an example of an object-oriented programming language?",
        type: "multiple-choice",
        options: ["C", "HTML", "Python", "SQL"],
        correctAnswer: "Python",
        difficulty: "easy",
        category: "programming",
        points: 1,
        explanation: "Python supports object-oriented programming."
      },
      {
        question: "What is the purpose of functions?",
        type: "multiple-choice",
        options: ["To create loops", "To store data", "To make code reusable and organized", "To connect to databases"],
        correctAnswer: "To make code reusable and organized",
        difficulty: "easy",
        category: "programming",
        points: 1,
        explanation: "Functions help in code reusability and organization."
      },
      {
        question: "Which of the following is a conditional statement?",
        type: "multiple-choice",
        options: ["for loop", "while loop", "if-else", "function"],
        correctAnswer: "if-else",
        difficulty: "easy",
        category: "programming",
        points: 1,
        explanation: "if-else is a conditional statement that executes code based on conditions."
      },
      {
        question: "What does API stand for?",
        type: "multiple-choice",
        options: ["Application Programming Interface", "Advanced Programming Integration", "Automated Program Interaction", "Application Process Interface"],
        correctAnswer: "Application Programming Interface",
        difficulty: "easy",
        category: "programming",
        points: 1,
        explanation: "API stands for Application Programming Interface."
      },

      // Database Questions (10)
      {
        question: "What does SQL stand for?",
        type: "multiple-choice",
        options: ["Structured Query Language", "Simple Query Language", "Standard Question Language", "System Query Logic"],
        correctAnswer: "Structured Query Language",
        difficulty: "easy",
        category: "database",
        points: 1,
        explanation: "SQL stands for Structured Query Language."
      },
      {
        question: "Which command is used to retrieve data from a database?",
        type: "multiple-choice",
        options: ["GET", "FETCH", "SELECT", "RETRIEVE"],
        correctAnswer: "SELECT",
        difficulty: "easy",
        category: "database",
        points: 1,
        explanation: "SELECT is used to query and retrieve data from a database."
      },
      {
        question: "What is a primary key?",
        type: "multiple-choice",
        options: ["A key that can have duplicate values", "A unique identifier for a record", "A foreign key reference", "An index for faster searches"],
        correctAnswer: "A unique identifier for a record",
        difficulty: "easy",
        category: "database",
        points: 1,
        explanation: "A primary key uniquely identifies each record in a table."
      },
      {
        question: "What does CRUD stand for in database operations?",
        type: "multiple-choice",
        options: ["Create, Read, Update, Delete", "Copy, Run, Update, Deploy", "Connect, Retrieve, Upload, Download", "Compile, Read, Use, Debug"],
        correctAnswer: "Create, Read, Update, Delete",
        difficulty: "easy",
        category: "database",
        points: 1,
        explanation: "CRUD represents the four basic database operations."
      },
      {
        question: "Which type of database uses tables to store data?",
        type: "multiple-choice",
        options: ["NoSQL", "Document", "Relational", "Graph"],
        correctAnswer: "Relational",
        difficulty: "easy",
        category: "database",
        points: 1,
        explanation: "Relational databases use tables with rows and columns."
      },
      {
        question: "What is normalization in databases?",
        type: "multiple-choice",
        options: ["Making all data uppercase", "Organizing data to reduce redundancy", "Creating backups", "Indexing tables"],
        correctAnswer: "Organizing data to reduce redundancy",
        difficulty: "medium",
        category: "database",
        points: 1,
        explanation: "Normalization organizes data to minimize redundancy and dependency."
      },
      {
        question: "What is a foreign key?",
        type: "multiple-choice",
        options: ["A key from another country", "A key that references a primary key in another table", "An encrypted key", "A backup key"],
        correctAnswer: "A key that references a primary key in another table",
        difficulty: "medium",
        category: "database",
        points: 1,
        explanation: "A foreign key creates a relationship between two tables."
      },
      {
        question: "Which SQL clause is used to filter results?",
        type: "multiple-choice",
        options: ["FILTER", "WHERE", "HAVING", "SELECT"],
        correctAnswer: "WHERE",
        difficulty: "easy",
        category: "database",
        points: 1,
        explanation: "WHERE clause filters records based on specified conditions."
      },
      {
        question: "What is an index in a database?",
        type: "multiple-choice",
        options: ["A backup of the database", "A data structure that improves query speed", "A list of all tables", "A type of constraint"],
        correctAnswer: "A data structure that improves query speed",
        difficulty: "medium",
        category: "database",
        points: 1,
        explanation: "Indexes improve the speed of data retrieval operations."
      },
      {
        question: "Which database is an example of NoSQL?",
        type: "multiple-choice",
        options: ["MySQL", "PostgreSQL", "MongoDB", "Oracle"],
        correctAnswer: "MongoDB",
        difficulty: "easy",
        category: "database",
        points: 1,
        explanation: "MongoDB is a popular NoSQL document database."
      },

      // Web Development Questions (10)
      {
        question: "What does HTML stand for?",
        type: "multiple-choice",
        options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"],
        correctAnswer: "Hyper Text Markup Language",
        difficulty: "easy",
        category: "webDevelopment",
        points: 1,
        explanation: "HTML stands for Hyper Text Markup Language."
      },
      {
        question: "Which language is used for styling web pages?",
        type: "multiple-choice",
        options: ["HTML", "CSS", "JavaScript", "Python"],
        correctAnswer: "CSS",
        difficulty: "easy",
        category: "webDevelopment",
        points: 1,
        explanation: "CSS (Cascading Style Sheets) is used for styling."
      },
      {
        question: "What does CSS stand for?",
        type: "multiple-choice",
        options: ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"],
        correctAnswer: "Cascading Style Sheets",
        difficulty: "easy",
        category: "webDevelopment",
        points: 1,
        explanation: "CSS stands for Cascading Style Sheets."
      },
      {
        question: "Which tag is used to create a hyperlink in HTML?",
        type: "multiple-choice",
        options: ["<link>", "<a>", "<href>", "<url>"],
        correctAnswer: "<a>",
        difficulty: "easy",
        category: "webDevelopment",
        points: 1,
        explanation: "The <a> tag is used to create hyperlinks."
      },
      {
        question: "What is the purpose of JavaScript in web development?",
        type: "multiple-choice",
        options: ["To style web pages", "To structure web pages", "To add interactivity", "To host websites"],
        correctAnswer: "To add interactivity",
        difficulty: "easy",
        category: "webDevelopment",
        points: 1,
        explanation: "JavaScript adds dynamic behavior and interactivity to web pages."
      },
      {
        question: "Which HTTP method is used to submit form data?",
        type: "multiple-choice",
        options: ["GET", "POST", "PUT", "DELETE"],
        correctAnswer: "POST",
        difficulty: "easy",
        category: "webDevelopment",
        points: 1,
        explanation: "POST is commonly used to submit form data."
      },
      {
        question: "What is responsive web design?",
        type: "multiple-choice",
        options: ["Designing websites that respond quickly", "Designing websites that adapt to different screen sizes", "Designing websites with animations", "Designing websites with forms"],
        correctAnswer: "Designing websites that adapt to different screen sizes",
        difficulty: "easy",
        category: "webDevelopment",
        points: 1,
        explanation: "Responsive design ensures websites work well on all devices."
      },
      {
        question: "Which framework is used for building user interfaces in JavaScript?",
        type: "multiple-choice",
        options: ["Django", "React", "Flask", "Laravel"],
        correctAnswer: "React",
        difficulty: "easy",
        category: "webDevelopment",
        points: 1,
        explanation: "React is a popular JavaScript library for building UIs."
      },
      {
        question: "What does DOM stand for?",
        type: "multiple-choice",
        options: ["Document Object Model", "Data Object Management", "Digital Operating Mode", "Document Oriented Markup"],
        correctAnswer: "Document Object Model",
        difficulty: "easy",
        category: "webDevelopment",
        points: 1,
        explanation: "DOM represents the structure of HTML documents as objects."
      },
      {
        question: "Which protocol is used for secure web communication?",
        type: "multiple-choice",
        options: ["HTTP", "HTTPS", "FTP", "SMTP"],
        correctAnswer: "HTTPS",
        difficulty: "easy",
        category: "webDevelopment",
        points: 1,
        explanation: "HTTPS provides secure, encrypted communication."
      },

      // Networking Questions (10)
      {
        question: "What does IP stand for?",
        type: "multiple-choice",
        options: ["Internet Protocol", "Internal Process", "Information Package", "Internet Package"],
        correctAnswer: "Internet Protocol",
        difficulty: "easy",
        category: "networking",
        points: 1,
        explanation: "IP stands for Internet Protocol."
      },
      {
        question: "What is the purpose of DNS?",
        type: "multiple-choice",
        options: ["To encrypt data", "To translate domain names to IP addresses", "To compress files", "To scan for viruses"],
        correctAnswer: "To translate domain names to IP addresses",
        difficulty: "easy",
        category: "networking",
        points: 1,
        explanation: "DNS translates human-readable domain names to IP addresses."
      },
      {
        question: "Which port is typically used for HTTP?",
        type: "multiple-choice",
        options: ["21", "22", "80", "443"],
        correctAnswer: "80",
        difficulty: "easy",
        category: "networking",
        points: 1,
        explanation: "Port 80 is the default port for HTTP."
      },
      {
        question: "What does LAN stand for?",
        type: "multiple-choice",
        options: ["Large Area Network", "Local Area Network", "Long Access Network", "Limited Area Network"],
        correctAnswer: "Local Area Network",
        difficulty: "easy",
        category: "networking",
        points: 1,
        explanation: "LAN stands for Local Area Network."
      },
      {
        question: "What is a router?",
        type: "multiple-choice",
        options: ["A device that stores data", "A device that connects networks", "A programming tool", "A type of cable"],
        correctAnswer: "A device that connects networks",
        difficulty: "easy",
        category: "networking",
        points: 1,
        explanation: "Routers connect multiple networks and route data between them."
      },
      {
        question: "Which layer of the OSI model deals with routing?",
        type: "multiple-choice",
        options: ["Physical", "Data Link", "Network", "Transport"],
        correctAnswer: "Network",
        difficulty: "medium",
        category: "networking",
        points: 1,
        explanation: "The Network layer handles routing and forwarding."
      },
      {
        question: "What is an IP address?",
        type: "multiple-choice",
        options: ["A physical address", "A unique identifier for a device on a network", "A type of cable", "A security protocol"],
        correctAnswer: "A unique identifier for a device on a network",
        difficulty: "easy",
        category: "networking",
        points: 1,
        explanation: "IP addresses uniquely identify devices on networks."
      },
      {
        question: "Which protocol is used for sending email?",
        type: "multiple-choice",
        options: ["HTTP", "FTP", "SMTP", "DNS"],
        correctAnswer: "SMTP",
        difficulty: "easy",
        category: "networking",
        points: 1,
        explanation: "SMTP (Simple Mail Transfer Protocol) is used for sending email."
      },
      {
        question: "What does VPN stand for?",
        type: "multiple-choice",
        options: ["Virtual Private Network", "Very Private Network", "Verified Personal Network", "Virtual Public Network"],
        correctAnswer: "Virtual Private Network",
        difficulty: "easy",
        category: "networking",
        points: 1,
        explanation: "VPN stands for Virtual Private Network."
      },
      {
        question: "Which device operates at the physical layer?",
        type: "multiple-choice",
        options: ["Router", "Switch", "Hub", "Firewall"],
        correctAnswer: "Hub",
        difficulty: "medium",
        category: "networking",
        points: 1,
        explanation: "Hubs operate at the physical layer of the OSI model."
      },

      // Problem Solving Questions (10)
      {
        question: "What is debugging?",
        type: "multiple-choice",
        options: ["Writing new code", "Finding and fixing errors in code", "Testing software", "Deploying applications"],
        correctAnswer: "Finding and fixing errors in code",
        difficulty: "easy",
        category: "problemSolving",
        points: 1,
        explanation: "Debugging is the process of identifying and fixing bugs."
      },
      {
        question: "What is pseudocode?",
        type: "multiple-choice",
        options: ["Fake code", "A high-level description of an algorithm", "A programming language", "Encrypted code"],
        correctAnswer: "A high-level description of an algorithm",
        difficulty: "easy",
        category: "problemSolving",
        points: 1,
        explanation: "Pseudocode describes algorithms in plain language."
      },
      {
        question: "What is the first step in problem-solving?",
        type: "multiple-choice",
        options: ["Write code", "Test the solution", "Understand the problem", "Deploy the application"],
        correctAnswer: "Understand the problem",
        difficulty: "easy",
        category: "problemSolving",
        points: 1,
        explanation: "Understanding the problem is always the first step."
      },
      {
        question: "What is a flowchart used for?",
        type: "multiple-choice",
        options: ["To visualize data", "To represent algorithm steps visually", "To design websites", "To create databases"],
        correctAnswer: "To represent algorithm steps visually",
        difficulty: "easy",
        category: "problemSolving",
        points: 1,
        explanation: "Flowcharts visualize the steps in an algorithm or process."
      },
      {
        question: "What does 'divide and conquer' mean in problem-solving?",
        type: "multiple-choice",
        options: ["Breaking a problem into smaller parts", "Competing with other developers", "Using multiple programming languages", "Creating backups"],
        correctAnswer: "Breaking a problem into smaller parts",
        difficulty: "easy",
        category: "problemSolving",
        points: 1,
        explanation: "Divide and conquer breaks complex problems into manageable parts."
      },
      {
        question: "What is the time complexity of a linear search?",
        type: "multiple-choice",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        correctAnswer: "O(n)",
        difficulty: "medium",
        category: "problemSolving",
        points: 1,
        explanation: "Linear search has O(n) time complexity in the worst case."
      },
      {
        question: "What is refactoring?",
        type: "multiple-choice",
        options: ["Rewriting code from scratch", "Improving code structure without changing functionality", "Adding new features", "Removing bugs"],
        correctAnswer: "Improving code structure without changing functionality",
        difficulty: "medium",
        category: "problemSolving",
        points: 1,
        explanation: "Refactoring improves code quality while maintaining behavior."
      },
      {
        question: "Which sorting algorithm is generally the fastest?",
        type: "multiple-choice",
        options: ["Bubble Sort", "Quick Sort", "Selection Sort", "Insertion Sort"],
        correctAnswer: "Quick Sort",
        difficulty: "medium",
        category: "problemSolving",
        points: 1,
        explanation: "Quick Sort is generally one of the fastest sorting algorithms."
      },
      {
        question: "What is a edge case in testing?",
        type: "multiple-choice",
        options: ["A common scenario", "An extreme or unusual input", "An error in code", "A type of loop"],
        correctAnswer: "An extreme or unusual input",
        difficulty: "easy",
        category: "problemSolving",
        points: 1,
        explanation: "Edge cases test extreme or boundary conditions."
      },
      {
        question: "What does Big O notation describe?",
        type: "multiple-choice",
        options: ["Code readability", "Algorithm efficiency", "Memory usage only", "Number of bugs"],
        correctAnswer: "Algorithm efficiency",
        difficulty: "medium",
        category: "problemSolving",
        points: 1,
        explanation: "Big O notation describes algorithmic time or space complexity."
      }
    ];

    // Create the general assessment with all questions
    const assessment = new Assessment({
      title: 'IT Skills Assessment',
      description: 'Comprehensive assessment covering programming, databases, web development, networking, and problem-solving.',
      questions: allQuestions,
      timeLimit: 30,
      passingScore: 70,
      totalPoints: allQuestions.reduce((sum, q) => sum + q.points, 0),
      category: 'general',
      isActive: true
    });

    await assessment.save();
    console.log('✓ Created IT Skills Assessment with 50 questions\n');

    console.log('=== Assessment Creation Complete ===');
    console.log(`Total questions: ${allQuestions.length}`);
    console.log('Categories covered:');
    console.log('  - Programming: 10 questions');
    console.log('  - Database: 10 questions');
    console.log('  - Web Development: 10 questions');
    console.log('  - Networking: 10 questions');
    console.log('  - Problem Solving: 10 questions');
    console.log(`Time limit: 30 minutes`);
    console.log(`Passing score: 70%`);
    console.log('=====================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating assessments:', error);
    process.exit(1);
  }
}

createProductionAssessments();
