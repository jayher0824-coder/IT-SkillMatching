const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Code Execution Service
 * Handles safe execution of student code and test case validation
 */

const SUPPORTED_LANGUAGES = {
    python: {
        ext: '.py',
        command: 'python3',
        timeout: 5000 // 5 seconds
    },
    javascript: {
        ext: '.js',
        command: 'node',
        timeout: 5000
    },
    java: {
        ext: '.java',
        command: 'java',
        timeout: 10000 // 10 seconds (compilation takes longer)
    },
    cpp: {
        ext: '.cpp',
        command: 'g++',
        timeout: 10000
    },
    csharp: {
        ext: '.cs',
        command: 'csc',
        timeout: 10000
    },
    php: {
        ext: '.php',
        command: 'php',
        timeout: 5000
    },
    ruby: {
        ext: '.rb',
        command: 'ruby',
        timeout: 5000
    },
    go: {
        ext: '.go',
        command: 'go',
        timeout: 10000
    },
    rust: {
        ext: '.rs',
        command: 'rustc',
        timeout: 15000
    },
    typescript: {
        ext: '.ts',
        command: 'ts-node',
        timeout: 5000
    }
};

/**
 * Execute student code with test cases
 * @param {string} code - Student's code
 * @param {string} language - Programming language
 * @param {Array} testCases - Array of test cases with input and expected output
 * @returns {Promise<Object>} Execution results
 */
async function executeCode(code, language, testCases = []) {
    if (!SUPPORTED_LANGUAGES[language]) {
        return {
            success: false,
            error: `Language '${language}' is not supported`,
            results: []
        };
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-exec-'));
    const langConfig = SUPPORTED_LANGUAGES[language];
    const fileName = `solution${langConfig.ext}`;
    const filePath = path.join(tempDir, fileName);

    try {
        // Write code to file
        fs.writeFileSync(filePath, code);

        // If no test cases, just try to run the code
        if (testCases.length === 0) {
            const output = await runCode(filePath, language, tempDir);
            return {
                success: !output.error,
                output: output.output || '',
                error: output.error || '',
                results: [],
                executionTime: output.executionTime || 0
            };
        }

        // Run each test case
        const results = [];
        let allPassed = true;

        for (const testCase of testCases) {
            const result = await runTestCase(filePath, language, testCase, tempDir);
            const passed = result.output.trim() === testCase.expectedOutput.trim();
            
            results.push({
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                actualOutput: result.output,
                error: result.error,
                passed: passed && !result.error,
                executionTime: result.executionTime
            });

            if (!passed || result.error) {
                allPassed = false;
            }
        }

        return {
            success: allPassed,
            results: results,
            allTestsPassed: allPassed,
            passedCount: results.filter(r => r.passed).length,
            totalTests: results.length
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            results: []
        };
    } finally {
        // Cleanup temp directory
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {
            console.error('Failed to cleanup temp directory:', e);
        }
    }
}

/**
 * Run code and capture output
 * @private
 */
async function runCode(filePath, language, tempDir) {
    return new Promise((resolve) => {
        const langConfig = SUPPORTED_LANGUAGES[language];
        const startTime = Date.now();

        const timeout = setTimeout(() => {
            proc.kill();
            resolve({
                error: 'Execution timeout - code took too long to run',
                executionTime: langConfig.timeout
            });
        }, langConfig.timeout);

        let output = '';
        let errorOutput = '';

        const proc = spawn(langConfig.command, [filePath], {
            cwd: tempDir,
            timeout: langConfig.timeout
        });

        proc.stdout.on('data', (data) => {
            output += data.toString();
        });

        proc.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        proc.on('close', (code) => {
            clearTimeout(timeout);
            const executionTime = Date.now() - startTime;

            resolve({
                output: output,
                error: code !== 0 ? errorOutput : '',
                exitCode: code,
                executionTime: executionTime
            });
        });

        proc.on('error', (err) => {
            clearTimeout(timeout);
            resolve({
                error: `Failed to execute: ${err.message}`,
                executionTime: Date.now() - startTime
            });
        });
    });
}

/**
 * Run a single test case
 * @private
 */
async function runTestCase(filePath, language, testCase, tempDir) {
    return new Promise((resolve) => {
        const langConfig = SUPPORTED_LANGUAGES[language];
        const startTime = Date.now();

        const timeout = setTimeout(() => {
            proc.kill();
            resolve({
                output: '',
                error: 'Test case execution timeout',
                executionTime: langConfig.timeout
            });
        }, langConfig.timeout);

        let output = '';
        let errorOutput = '';

        const proc = spawn(langConfig.command, [filePath], {
            cwd: tempDir,
            timeout: langConfig.timeout,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Send input to the process
        if (testCase.input) {
            proc.stdin.write(testCase.input);
            proc.stdin.write('\n');
        }
        proc.stdin.end();

        proc.stdout.on('data', (data) => {
            output += data.toString();
        });

        proc.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        proc.on('close', (code) => {
            clearTimeout(timeout);
            const executionTime = Date.now() - startTime;

            resolve({
                output: output.trim(),
                error: code !== 0 ? errorOutput : '',
                exitCode: code,
                executionTime: executionTime
            });
        });

        proc.on('error', (err) => {
            clearTimeout(timeout);
            resolve({
                output: '',
                error: `Execution error: ${err.message}`,
                executionTime: Date.now() - startTime
            });
        });
    });
}

/**
 * Get supported languages list
 */
function getSupportedLanguages() {
    return Object.keys(SUPPORTED_LANGUAGES);
}

/**
 * Validate code syntax (basic check)
 */
function validateCodeSyntax(code, language) {
    if (!code || code.trim().length === 0) {
        return {
            valid: false,
            error: 'Code cannot be empty'
        };
    }

    // Basic syntax checks by language
    const checks = {
        python: () => {
            if (code.includes('import') && !code.includes(':')) {
                return { valid: false, error: 'Syntax error: Missing colon' };
            }
            return { valid: true };
        },
        javascript: () => {
            // Check for unmatched braces
            const openBraces = (code.match(/{/g) || []).length;
            const closeBraces = (code.match(/}/g) || []).length;
            if (openBraces !== closeBraces) {
                return { valid: false, error: 'Syntax error: Unmatched braces' };
            }
            return { valid: true };
        },
        java: () => {
            if (!code.includes('class') && !code.includes('interface')) {
                return { valid: false, error: 'Syntax error: Must define a class or interface' };
            }
            return { valid: true };
        }
    };

    const checkFn = checks[language];
    return checkFn ? checkFn() : { valid: true };
}

module.exports = {
    executeCode,
    getSupportedLanguages,
    validateCodeSyntax,
    SUPPORTED_LANGUAGES
};
