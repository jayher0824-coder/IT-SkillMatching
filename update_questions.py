#!/usr/bin/env python3
"""
Script to update the quiz questions endpoint with proper difficulty filtering
"""

import json
import re

# Read the current file
with open('server/api/routes/assessments.js', 'r') as f:
    content = f.read()

# Find the skillToQuestions data structure
# Extract just the data part
questions_data = '''    python: {
      easy: [
        { question: "What is the output of print(2 + 2)?", options: ["4", "22", "Error", "undefined"], correctAnswer: "4", difficulty: "easy" },
        { question: "Which keyword is used to define a function in Python?", options: ["func", "def", "function", "define"], correctAnswer: "def", difficulty: "easy" },
        { question: "What is the correct file extension for Python files?", options: [".pyth", ".pt", ".py", ".pyt"], correctAnswer: ".py", difficulty: "easy" },
        { question: "How do you start a comment in Python?", options: ["//", "#", "<!--", "/*"], correctAnswer: "#", difficulty: "easy" },
        { question: "What does the 'print()' function do?", options: ["Saves data", "Displays output", "Creates a file", "Runs code"], correctAnswer: "Displays output", difficulty: "easy" }
      ],
      medium: [
        { question: "What is the output of print(2 ** 3)?", options: ["6", "8", "9", "5"], correctAnswer: "8", difficulty: "medium" },
        { question: "Which of the following is a valid variable name in Python?", options: ["2var", "var_2", "var-2", "var 2"], correctAnswer: "var_2", difficulty: "medium" },
        { question: "What does the 'len()' function do?", options: ["Returns the length of an object", "Returns the type of an object", "Returns the value of an object", "Returns the id of an object"], correctAnswer: "Returns the length of an object", difficulty: "medium" },
        { question: "Which of the following is used to handle exceptions in Python?", options: ["try-except", "do-catch", "try-catch", "handle-except"], correctAnswer: "try-except", difficulty: "medium" },
        { question: "What is the output of print('Hello' + 'World')?", options: ["Hello World", "HelloWorld", "Hello+World", "Error"], correctAnswer: "HelloWorld", difficulty: "medium" }
      ],
      hard: [
        { question: "What is the output of print(type(5))?", options: ["<class 'int'>", "<type 'int'>", "int", "integer"], correctAnswer: "<class 'int'>", difficulty: "hard" },
        { question: "Which of the following is not a Python data type?", options: ["list", "tuple", "array", "set"], correctAnswer: "array", difficulty: "hard" },
        { question: "What is a lambda function in Python?", options: ["A type of loop", "An anonymous function", "A error handler", "A class definition"], correctAnswer: "An anonymous function", difficulty: "hard" },
        { question: "Which of these is a mutable data type in Python?", options: ["tuple", "string", "list", "frozenset"], correctAnswer: "list", difficulty: "hard" },
        { question: "What does the 'pass' statement do in Python?", options: ["Skips execution", "Does nothing", "Ends loop", "Returns value"], correctAnswer: "Does nothing", difficulty: "hard" }
      ]
    },
    javascript: {
      easy: [
        { question: "Which keyword is used to declare a variable in JavaScript?", options: ["var", "let", "const", "All of the above"], correctAnswer: "All of the above", difficulty: "easy" },
        { question: "What is the output of console.log(5 + 5)?", options: ["10", "55", "Error", "undefined"], correctAnswer: "10", difficulty: "easy" },
        { question: "How do you write a comment in JavaScript?", options: ["//", "#", "<!--", "/*"], correctAnswer: "//", difficulty: "easy" },
        { question: "What does console.log() do?", options: ["Creates a file", "Prints to console", "Saves data", "Ends program"], correctAnswer: "Prints to console", difficulty: "easy" },
        { question: "What is the correct syntax to create a function?", options: ["function myFunc() {}", "func myFunc() {}", "def myFunc() {}", "fun myFunc() {}"], correctAnswer: "function myFunc() {}", difficulty: "easy" }
      ],
      medium: [
        { question: "Which of the following is a correct way to declare a variable in JavaScript?", options: ["var myVar;", "int myVar;", "let myVar;", "Both var myVar; and let myVar;"], correctAnswer: "Both var myVar; and let myVar;", difficulty: "medium" },
        { question: "What is the output of 'console.log(typeof null)'?", options: ["'object'", "'null'", "'undefined'", "'number'"], correctAnswer: "'object'", difficulty: "medium" },
        { question: "What is the result of '2' + 2 in JavaScript?", options: ["4", "'22'", "NaN", "Error"], correctAnswer: "'22'", difficulty: "medium" },
        { question: "Which of the following is not a JavaScript data type?", options: ["Number", "String", "Character", "Boolean"], correctAnswer: "Character", difficulty: "medium" },
        { question: "Which method adds a new element to the end of an array?", options: ["push()", "pop()", "shift()", "unshift()"], correctAnswer: "push()", difficulty: "medium" }
      ],
      hard: [
        { question: "What does '===' operator do in JavaScript?", options: ["Compares value only", "Compares value and type", "Assigns value", "Checks if variable exists"], correctAnswer: "Compares value and type", difficulty: "hard" },
        { question: "Which method is used to parse a string to an integer in JavaScript?", options: ["parseInt()", "parseInteger()", "int()", "toInteger()"], correctAnswer: "parseInt()", difficulty: "hard" },
        { question: "What is a closure in JavaScript?", options: ["A loop structure", "A function with access to outer scope", "A type of error", "A conditional statement"], correctAnswer: "A function with access to outer scope", difficulty: "hard" },
        { question: "Which object is the parent of all JavaScript objects?", options: ["Object", "Window", "Document", "Array"], correctAnswer: "Object", difficulty: "hard" },
        { question: "What does the 'this' keyword refer to in JavaScript?", options: ["Current object", "Previous object", "Next object", "Global object always"], correctAnswer: "Current object", difficulty: "hard" }
      ]
    },
    java: {
      easy: [
        { question: "What does JVM stand for?", options: ["Java Virtual Machine", "JavaScript Virtual Machine", "Java Virtual Method", "Java Visual Module"], correctAnswer: "Java Virtual Machine", difficulty: "easy" },
        { question: "Which keyword is used to create a class in Java?", options: ["class", "Class", "cls", "struct"], correctAnswer: "class", difficulty: "easy" },
        { question: "What is the entry point of a Java program?", options: ["main() method", "start() method", "begin() method", "init() method"], correctAnswer: "main() method", difficulty: "easy" },
        { question: "How do you comment in Java?", options: ["//", "#", "<!--", "--"], correctAnswer: "//", difficulty: "easy" },
        { question: "What is the default package in Java?", options: ["java.lang", "java.util", "java.io", "java.net"], correctAnswer: "java.lang", difficulty: "easy" }
      ],
      medium: [
        { question: "What is the size of an int in Java?", options: ["4 bytes", "8 bytes", "2 bytes", "Depends on the system"], correctAnswer: "4 bytes", difficulty: "medium" },
        { question: "Which keyword is used to inherit a class in Java?", options: ["extends", "implements", "inherits", "super"], correctAnswer: "extends", difficulty: "medium" },
        { question: "What is the difference between 'equals()' and '=='?", options: ["No difference", "equals() compares content, == compares reference", "== is for strings only", "equals() is deprecated"], correctAnswer: "equals() compares content, == compares reference", difficulty: "medium" },
        { question: "What are the four access modifiers in Java?", options: ["public, private, protected, package-private", "public, private, protected, static", "public, private, protected, final", "public, private, static, abstract"], correctAnswer: "public, private, protected, package-private", difficulty: "medium" },
        { question: "What is an interface in Java?", options: ["A class blueprint", "A contract for classes", "A data structure", "A loop structure"], correctAnswer: "A contract for classes", difficulty: "medium" }
      ],
      hard: [
        { question: "What is the difference between abstract class and interface?", options: ["No difference", "Abstract has methods, interface doesn't", "Abstract can have state, interface cannot", "Abstract is faster"], correctAnswer: "Abstract can have state, interface cannot", difficulty: "hard" },
        { question: "What is the purpose of 'super' keyword in Java?", options: ["To create objects", "To access parent class members", "To declare variables", "To end method"], correctAnswer: "To access parent class members", difficulty: "hard" },
        { question: "What is polymorphism in Java?", options: ["Creating multiple objects", "One interface multiple implementations", "Multiple variables", "Multiple return types"], correctAnswer: "One interface multiple implementations", difficulty: "hard" },
        { question: "What is the 'finally' block used for?", options: ["To catch errors", "Code that always executes", "To define methods", "To declare variables"], correctAnswer: "Code that always executes", difficulty: "hard" },
        { question: "What is serialization in Java?", options: ["Creating sequences", "Converting object to byte stream", "Creating threads", "Reading files"], correctAnswer: "Converting object to byte stream", difficulty: "hard" }
      ]
    },
    html: {
      easy: [
        { question: "What does HTML stand for?", options: ["HyperText Markup Language", "HyperText Markdown Language", "HighText Machine Language", "None of the above"], correctAnswer: "HyperText Markup Language", difficulty: "easy" },
        { question: "Which tag is used for the largest heading?", options: ["<h1>", "<h6>", "<heading>", "<title>"], correctAnswer: "<h1>", difficulty: "easy" },
        { question: "What is the correct syntax for a hyperlink?", options: ["<a>link</a>", "<a href='url'>link</a>", "<link>url</link>", "<url>link</url>"], correctAnswer: "<a href='url'>link</a>", difficulty: "easy" },
        { question: "Which HTML tag is used to define a paragraph?", options: ["<p>", "<para>", "<pg>", "<paragraph>"], correctAnswer: "<p>", difficulty: "easy" },
        { question: "What is the correct HTML element for inserting a line break?", options: ["<br>", "<break>", "<lb>", "<line>"], correctAnswer: "<br>", difficulty: "easy" }
      ],
      medium: [
        { question: "Which HTML tag is used to define an unordered list?", options: ["<ul>", "<ol>", "<li>", "<list>"], correctAnswer: "<ul>", difficulty: "medium" },
        { question: "What is the purpose of the <meta> tag?", options: ["Define metadata", "Create links", "Format text", "Create tables"], correctAnswer: "Define metadata", difficulty: "medium" },
        { question: "Which element is used to define an input field?", options: ["<input>", "<field>", "<form>", "<textarea>"], correctAnswer: "<input>", difficulty: "medium" },
        { question: "What is the correct way to insert an image?", options: ["<image src='url'>", "<img src='url'>", "<pic src='url'>", "<picture src='url'>"], correctAnswer: "<img src='url'>", difficulty: "medium" },
        { question: "Which tag defines the structure of an HTML document?", options: ["<html>", "<body>", "<head>", "<document>"], correctAnswer: "<html>", difficulty: "medium" }
      ],
      hard: [
        { question: "What is semantic HTML?", options: ["Styling HTML", "HTML with meaning", "Complex HTML", "Old HTML"], correctAnswer: "HTML with meaning", difficulty: "hard" },
        { question: "Which semantic tag is used for navigation?", options: ["<nav>", "<navigation>", "<menu>", "<link>"], correctAnswer: "<nav>", difficulty: "hard" },
        { question: "What does the 'async' attribute do in a script tag?", options: ["Loads script asynchronously", "Makes script synchronous", "Delays script loading", "Caches script"], correctAnswer: "Loads script asynchronously", difficulty: "hard" },
        { question: "What is the purpose of the 'defer' attribute?", options: ["Delays execution until HTML parsing completes", "Loads script immediately", "Removes script", "Caches script"], correctAnswer: "Delays execution until HTML parsing completes", difficulty: "hard" },
        { question: "Which element represents independent content?", options: ["<article>", "<section>", "<div>", "<span>"], correctAnswer: "<article>", difficulty: "hard" }
      ]
    },
    css: {
      easy: [
        { question: "What does CSS stand for?", options: ["Cascading Style Sheets", "Colorful Style Sheets", "Computer Style Sheets", "Creative Style Sheets"], correctAnswer: "Cascading Style Sheets", difficulty: "easy" },
        { question: "Which property is used to change text color?", options: ["text-color", "color", "font-color", "foreground"], correctAnswer: "color", difficulty: "easy" },
        { question: "Which property is used to change the background color?", options: ["background-color", "bg-color", "bgcolor", "background"], correctAnswer: "background-color", difficulty: "easy" },
        { question: "How do you select all elements in CSS?", options: ["*", "all", ":all", ".all"], correctAnswer: "*", difficulty: "easy" },
        { question: "What is the correct CSS syntax for styling?", options: ["selector { property: value }", "selector [ property: value ]", "selector ( property: value )", "selector < property: value >"], correctAnswer: "selector { property: value }", difficulty: "easy" }
      ],
      medium: [
        { question: "What is a CSS class selector?", options: [".className", "#className", "className", ":className"], correctAnswer: ".className", difficulty: "medium" },
        { question: "What is the default value of the position property?", options: ["static", "relative", "absolute", "fixed"], correctAnswer: "static", difficulty: "medium" },
        { question: "Which property is used to set the font size?", options: ["font-size", "text-size", "size", "font"], correctAnswer: "font-size", difficulty: "medium" },
        { question: "What does the 'z-index' property do?", options: ["Controls stacking order", "Sets zoom level", "Controls width", "Controls height"], correctAnswer: "Controls stacking order", difficulty: "medium" },
        { question: "Which property is used to add space inside an element?", options: ["padding", "margin", "spacing", "indent"], correctAnswer: "padding", difficulty: "medium" }
      ],
      hard: [
        { question: "What is CSS Grid?", options: ["A table structure", "2D layout system", "A type of border", "A color system"], correctAnswer: "2D layout system", difficulty: "hard" },
        { question: "What is a CSS pseudo-class?", options: ["A fake class", "Keyword for element in special state", "A type of selector", "A CSS animation"], correctAnswer: "Keyword for element in special state", difficulty: "hard" },
        { question: "What does 'box-sizing: border-box' do?", options: ["Includes padding and border in width/height", "Changes border color", "Creates a box", "Removes border"], correctAnswer: "Includes padding and border in width/height", difficulty: "hard" },
        { question: "What is CSS specificity?", options: ["CSS size", "How specific a selector is", "CSS syntax", "CSS format"], correctAnswer: "How specific a selector is", difficulty: "hard" },
        { question: "What does the 'transform' property do?", options: ["Modifies element appearance", "Changes colors", "Adjusts text", "Modifies element shape/position/size"], correctAnswer: "Modifies element shape/position/size", difficulty: "hard" }
      ]
    }'''

print("Update script ready. Will replace the skillToQuestions data structure.")
print("This data structure organizes questions by skill and difficulty level.")
