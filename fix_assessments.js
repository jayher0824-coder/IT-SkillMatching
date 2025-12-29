const fs = require('fs');

let content = fs.readFileSync('server/api/routes/assessments.js', 'utf8');

// Replace javascript section
const jsStart = content.indexOf('    javascript: [');
const jsEnd = content.indexOf('    java: [');

if (jsStart !== -1 && jsEnd !== -1) {
  const newJsSection = `    javascript: {
      easy: [
        { question: "What is the output of console.log(2 + 2)?", options: ["4", "22", "Error", "undefined"], correctAnswer: "4", difficulty: "easy" },
        { question: "Which keyword is used to declare a variable in JavaScript?", options: ["var", "let", "const", "variable"], correctAnswer: "var", difficulty: "easy" },
        { question: "What does the 'console.log()' function do?", options: ["Saves data", "Displays output", "Creates a file", "Runs code"], correctAnswer: "Displays output", difficulty: "easy" },
        { question: "How do you write a single-line comment in JavaScript?", options: ["#", "//", "<!--", "/*"], correctAnswer: "//", difficulty: "easy" },
        { question: "What is the correct file extension for JavaScript files?", options: [".javascript", ".js", ".jscript", ".j"], correctAnswer: ".js", difficulty: "easy" }
      ],
      medium: [
        { question: "What is the output of console.log(2 + '2')?", options: ["4", "22", "Error", "undefined"], correctAnswer: "22", difficulty: "medium" },
        { question: "Which keyword is used to declare a constant in JavaScript?", options: ["var", "let", "const", "constant"], correctAnswer: "const", difficulty: "medium" },
        { question: "What does the 'this' keyword refer to in JavaScript?", options: ["The current object", "The global object", "The parent object", "The window object"], correctAnswer: "The current object", difficulty: "medium" },
        { question: "What is the correct syntax for creating a function in JavaScript?", options: ["function myFunc() {}", "def myFunc() {}", "func myFunc() {}", "function myFunc []"], correctAnswer: "function myFunc() {}", difficulty: "medium" },
        { question: "What is the output of console.log(typeof 'hello')?", options: ["string", "String", "text", "undefined"], correctAnswer: "string", difficulty: "medium" }
      ],
      hard: [
        { question: "What does the 'async' keyword do in JavaScript?", options: ["Makes code run synchronously", "Makes a function return a promise", "Delays execution", "Runs code in parallel"], correctAnswer: "Makes a function return a promise", difficulty: "hard" },
        { question: "Which of the following is NOT a JavaScript data type?", options: ["string", "number", "boolean", "currency"], correctAnswer: "currency", difficulty: "hard" },
        { question: "What does the 'map()' function do in JavaScript?", options: ["Creates a new array by transforming each element", "Finds the first element", "Removes elements", "Sorts an array"], correctAnswer: "Creates a new array by transforming each element", difficulty: "hard" },
        { question: "What is the output of console.log(5 == '5')?", options: ["true", "false", "undefined", "Error"], correctAnswer: "true", difficulty: "hard" },
        { question: "What is the difference between '==' and '===' in JavaScript?", options: ["No difference", "== checks type, === doesn't", "=== checks type, == doesn't", "=== is newer"], correctAnswer: "=== checks type, == doesn't", difficulty: "hard" }
      ]
    },`;
  
  const newContent = content.substring(0, jsStart) + newJsSection + content.substring(jsEnd);
  fs.writeFileSync('server/api/routes/assessments.js', newContent);
  console.log('JavaScript section replaced successfully');
} else {
  console.log('Could not find javascript or java sections');
}

// Now replace java section
content = fs.readFileSync('server/api/routes/assessments.js', 'utf8');
const javaStart = content.indexOf('    java: [');
const javaEnd = content.indexOf('    html: [');

if (javaStart !== -1 && javaEnd !== -1) {
  const newJavaSection = `    java: {
      easy: [
        { question: "What does Java stand for?", options: ["Just Another Virtual Application", "Java is a programming language", "Java Advanced Virtual Architecture", "None"], correctAnswer: "Java is a programming language", difficulty: "easy" },
        { question: "Which keyword is used to declare a class in Java?", options: ["class", "Class", "CLASS", "java.lang.Class"], correctAnswer: "class", difficulty: "easy" },
        { question: "What is the main method signature in Java?", options: ["public static main(String[] args)", "public void main()", "static void main(String[] args)", "public static void main(String[] args)"], correctAnswer: "public static void main(String[] args)", difficulty: "easy" },
        { question: "What is the file extension for Java files?", options: [".java", ".jar", ".jav", ".j"], correctAnswer: ".java", difficulty: "easy" },
        { question: "How do you create an object in Java?", options: ["new ClassName()", "ClassName()", "create ClassName()", "object ClassName()"], correctAnswer: "new ClassName()", difficulty: "easy" }
      ],
      medium: [
        { question: "What is the size of an int in Java?", options: ["4 bytes", "8 bytes", "2 bytes", "Depends on the system"], correctAnswer: "4 bytes", difficulty: "medium" },
        { question: "Which keyword is used to inherit a class in Java?", options: ["extends", "implements", "inherits", "super"], correctAnswer: "extends", difficulty: "medium" },
        { question: "What is a constructor in Java?", options: ["A method with same name as class", "A special method that initializes objects", "Both of the above", "A regular method"], correctAnswer: "Both of the above", difficulty: "medium" },
        { question: "What is the difference between '==' and 'equals()' in Java?", options: ["No difference", "== checks reference, equals() checks value", "equals() checks reference, == checks value", "== is for primitives, equals() for objects"], correctAnswer: "== checks reference, equals() checks value", difficulty: "medium" },
        { question: "What does 'this' keyword do in Java?", options: ["References current object", "References parent class", "References static members", "None of the above"], correctAnswer: "References current object", difficulty: "medium" }
      ],
      hard: [
        { question: "What is the difference between 'abstract' and 'interface' in Java?", options: ["No difference", "Abstract can have constructor, interface cannot", "Interface can have constructor, abstract cannot", "Abstract is for methods, interface is for variables"], correctAnswer: "Abstract can have constructor, interface cannot", difficulty: "hard" },
        { question: "What is a singleton pattern in Java?", options: ["A class with only one instance", "A class with static methods", "A final class", "A class with private constructor"], correctAnswer: "A class with only one instance", difficulty: "hard" },
        { question: "What is the purpose of 'volatile' keyword in Java?", options: ["Makes variables fast", "Ensures visibility of changes across threads", "Prevents variable modification", "Optimizes performance"], correctAnswer: "Ensures visibility of changes across threads", difficulty: "hard" },
        { question: "What is the difference between 'throw' and 'throws' in Java?", options: ["No difference", "throw declares exceptions, throws throws them", "throws declares exceptions, throw throws them", "throw is for methods, throws for classes"], correctAnswer: "throws declares exceptions, throw throws them", difficulty: "hard" },
        { question: "What is the purpose of 'finally' block in Java?", options: ["Executes after try-catch", "Handles exceptions", "Defines finally method", "Closes resources"], correctAnswer: "Executes after try-catch", difficulty: "hard" }
      ]
    },`;
  
  const newContent = content.substring(0, javaStart) + newJavaSection + content.substring(javaEnd);
  fs.writeFileSync('server/api/routes/assessments.js', newContent);
  console.log('Java section replaced successfully');
}

// Now replace HTML section
content = fs.readFileSync('server/api/routes/assessments.js', 'utf8');
const htmlStart = content.indexOf('    html: [');
const htmlEnd = content.indexOf('    css: [');

if (htmlStart !== -1 && htmlEnd !== -1) {
  const newHtmlSection = `    html: {
      easy: [
        { question: "What does HTML stand for?", options: ["HyperText Markup Language", "HyperText Markdown Language", "HighText Machine Language", "None of the above"], correctAnswer: "HyperText Markup Language", difficulty: "easy" },
        { question: "Which tag is used to define a paragraph in HTML?", options: ["<p>", "<paragraph>", "<para>", "<text>"], correctAnswer: "<p>", difficulty: "easy" },
        { question: "Which HTML tag is used to define an unordered list?", options: ["<ul>", "<ol>", "<li>", "<list>"], correctAnswer: "<ul>", difficulty: "easy" },
        { question: "What is the correct syntax for an HTML comment?", options: ["<!-- comment -->", "<! comment >", "// comment", "# comment"], correctAnswer: "<!-- comment -->", difficulty: "easy" },
        { question: "Which tag is used to define a heading in HTML?", options: ["<h1> to <h6>", "<heading>", "<head>", "<header>"], correctAnswer: "<h1> to <h6>", difficulty: "easy" }
      ],
      medium: [
        { question: "What is the purpose of the <meta> tag in HTML?", options: ["Provides metadata about the document", "Defines the document structure", "Styles the document", "Adds scripts to the document"], correctAnswer: "Provides metadata about the document", difficulty: "medium" },
        { question: "Which attribute is used to add a hyperlink in HTML?", options: ["href", "link", "src", "url"], correctAnswer: "href", difficulty: "medium" },
        { question: "What is the correct syntax for embedding an image in HTML?", options: ["<img src='image.jpg'>", "<image src='image.jpg'>", "<img href='image.jpg'>", "<picture src='image.jpg'>"], correctAnswer: "<img src='image.jpg'>", difficulty: "medium" },
        { question: "Which tag is used to create a form in HTML?", options: ["<form>", "<input>", "<button>", "<div>"], correctAnswer: "<form>", difficulty: "medium" },
        { question: "What does the 'alt' attribute do in the <img> tag?", options: ["Provides alternative text if image fails to load", "Adds a caption", "Changes image size", "Rotates the image"], correctAnswer: "Provides alternative text if image fails to load", difficulty: "medium" }
      ],
      hard: [
        { question: "What is the purpose of the 'DOCTYPE' declaration in HTML?", options: ["Declares the document type and version", "Defines a data type", "Creates a custom element", "Adds styling"], correctAnswer: "Declares the document type and version", difficulty: "hard" },
        { question: "What is semantic HTML?", options: ["HTML that describes meaning of content", "HTML that is semantically correct", "Old version of HTML", "HTML for search engines"], correctAnswer: "HTML that describes meaning of content", difficulty: "hard" },
        { question: "Which of the following is a semantic HTML element?", options: ["<section>", "<div>", "<span>", "<p>"], correctAnswer: "<section>", difficulty: "hard" },
        { question: "What is the purpose of the 'data-*' attribute in HTML?", options: ["Stores custom data on elements", "Provides default values", "Defines element behavior", "Adds styling"], correctAnswer: "Stores custom data on elements", difficulty: "hard" },
        { question: "What is the difference between <div> and <section> in HTML?", options: ["No difference", "<section> is semantic for grouped content", "<div> is semantic, <section> is not", "<section> is deprecated"], correctAnswer: "<section> is semantic for grouped content", difficulty: "hard" }
      ]
    },`;
  
  const newContent = content.substring(0, htmlStart) + newHtmlSection + content.substring(htmlEnd);
  fs.writeFileSync('server/api/routes/assessments.js', newContent);
  console.log('HTML section replaced successfully');
}

// Now replace CSS section
content = fs.readFileSync('server/api/routes/assessments.js', 'utf8');
const cssStart = content.indexOf('    css: [');
const cssEnd = content.indexOf('  };');

if (cssStart !== -1 && cssEnd !== -1) {
  const newCssSection = `    css: {
      easy: [
        { question: "What does CSS stand for?", options: ["Cascading Style Sheets", "Colorful Style Sheets", "Computer Style Sheets", "Creative Style Sheets"], correctAnswer: "Cascading Style Sheets", difficulty: "easy" },
        { question: "Which property is used to change the background color in CSS?", options: ["background-color", "color", "bgcolor", "background"], correctAnswer: "background-color", difficulty: "easy" },
        { question: "How do you change the text color in CSS?", options: ["color", "text-color", "font-color", "txt-color"], correctAnswer: "color", difficulty: "easy" },
        { question: "Which property is used to change the font size in CSS?", options: ["font-size", "text-size", "size", "font-height"], correctAnswer: "font-size", difficulty: "easy" },
        { question: "How do you center text in CSS?", options: ["text-align: center", "align: center", "center-text", "text-center"], correctAnswer: "text-align: center", difficulty: "easy" }
      ],
      medium: [
        { question: "What is the difference between padding and margin in CSS?", options: ["Padding is inside, margin is outside", "Margin is inside, padding is outside", "They are the same", "Padding is for width, margin is for height"], correctAnswer: "Padding is inside, margin is outside", difficulty: "medium" },
        { question: "What is the CSS box model?", options: ["Content, padding, border, margin", "Width, height, color, font", "Display, position, float, clear", "Flex, grid, table, inline"], correctAnswer: "Content, padding, border, margin", difficulty: "medium" },
        { question: "Which CSS property controls the stacking order of elements?", options: ["z-index", "order", "stack", "layer"], correctAnswer: "z-index", difficulty: "medium" },
        { question: "What is a CSS pseudo-class?", options: ["Keyword used to define state of element", "A fake class", "A class inside another class", "A deprecated feature"], correctAnswer: "Keyword used to define state of element", difficulty: "medium" },
        { question: "Which property is used to control element display?", options: ["display", "visibility", "show", "element"], correctAnswer: "display", difficulty: "medium" }
      ],
      hard: [
        { question: "What is CSS specificity?", options: ["Determines which CSS rule applies", "How specific an element is", "A CSS attribute", "A type of selector"], correctAnswer: "Determines which CSS rule applies", difficulty: "hard" },
        { question: "What is the difference between 'position: relative' and 'position: absolute'?", options: ["Relative is relative to normal flow, absolute is relative to positioned parent", "Absolute is relative to normal flow, relative is relative to parent", "They are the same", "Absolute is deprecated"], correctAnswer: "Relative is relative to normal flow, absolute is relative to positioned parent", difficulty: "hard" },
        { question: "What is CSS Flexbox used for?", options: ["Creating flexible layouts", "Creating responsive designs", "Creating animations", "Creating grids"], correctAnswer: "Creating flexible layouts", difficulty: "hard" },
        { question: "What is the purpose of 'overflow' property in CSS?", options: ["Controls what happens when content overflows", "Adds overflow effect", "Removes overflow", "Changes overflow color"], correctAnswer: "Controls what happens when content overflows", difficulty: "hard" },
        { question: "What is a CSS media query?", options: ["Applies styles based on device characteristics", "Queries the CSS rules", "A type of selector", "A CSS function"], correctAnswer: "Applies styles based on device characteristics", difficulty: "hard" }
      ]
    }`;
  
  const newContent = content.substring(0, cssStart) + newCssSection + content.substring(cssEnd);
  fs.writeFileSync('server/api/routes/assessments.js', newContent);
  console.log('CSS section replaced successfully');
  console.log('All sections replaced successfully!');
}
