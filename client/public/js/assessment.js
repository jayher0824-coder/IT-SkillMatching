// Assessment State - store in window for persistence with protection
(function() {
    if (!window.assessmentState) {
        console.log('Initializing assessmentState for the first time');
        // Try to restore from sessionStorage first
        try {
            const saved = sessionStorage.getItem('assessmentState');
            if (saved) {
                const parsed = JSON.parse(saved);
                window.assessmentState = {
                    currentAssessment: parsed.currentAssessment,
                    currentQuestionIndex: parsed.currentQuestionIndex || 0,
                    userAnswers: parsed.userAnswers || [],
                    assessmentStartTime: parsed.assessmentStartTime ? new Date(parsed.assessmentStartTime) : null
                };
                console.log('Restored assessment state from sessionStorage:', {
                    hasAssessment: !!window.assessmentState.currentAssessment,
                    questionIndex: window.assessmentState.currentQuestionIndex,
                    answersCount: window.assessmentState.userAnswers.length
                });
                return;
            }
        } catch (e) {
            console.error('Failed to restore from sessionStorage:', e);
        }
        
        window.assessmentState = {
            currentAssessment: null,
            currentQuestionIndex: 0,
            userAnswers: [],
            assessmentStartTime: null
        };
        console.log('Created new empty assessmentState');
    } else {
        console.log('assessmentState already exists:', {
            hasAssessment: !!window.assessmentState.currentAssessment,
            questionIndex: window.assessmentState.currentQuestionIndex
        });
    }
})();

// Helper to save state to sessionStorage
function saveAssessmentState() {
    try {
        const stateToSave = {
            currentAssessment: window.assessmentState.currentAssessment,
            currentQuestionIndex: window.assessmentState.currentQuestionIndex,
            userAnswers: window.assessmentState.userAnswers,
            assessmentStartTime: window.assessmentState.assessmentStartTime ? window.assessmentState.assessmentStartTime.toISOString() : null
        };
        sessionStorage.setItem('assessmentState', JSON.stringify(stateToSave));
        console.log('Saved assessment state to sessionStorage');
    } catch (e) {
        console.error('Failed to save assessment state:', e);
    }
}

// Helper to ensure state exists
function ensureAssessmentState() {
    if (!window.assessmentState || !window.assessmentState.currentAssessment) {
        // Try to restore from sessionStorage
        try {
            const saved = sessionStorage.getItem('assessmentState');
            if (saved) {
                const parsed = JSON.parse(saved);
                window.assessmentState = {
                    currentAssessment: parsed.currentAssessment,
                    currentQuestionIndex: parsed.currentQuestionIndex,
                    userAnswers: parsed.userAnswers,
                    assessmentStartTime: parsed.assessmentStartTime ? new Date(parsed.assessmentStartTime) : null
                };
                console.log('Recovered state from sessionStorage');
                return true;
            }
        } catch (e) {
            console.error('Failed to recover state:', e);
        }
        return false;
    }
    return true;
}

// Async recovery: try sync restore first, otherwise fetch assessments from server
async function ensureAssessmentStateAsync() {
    // Quick sync check
    if (ensureAssessmentState()) return true;

    // Attempt to recover by fetching assessments from server
    try {
        console.log('ensureAssessmentStateAsync: attempting server recovery');
        if (!authToken) {
            console.warn('No auth token available, cannot recover from server');
            return false;
        }
        const response = await apiCall('/assessments');
        const assessments = response.data || [];
        if (!assessments || assessments.length === 0) {
            console.warn('No assessments returned from server');
            return false;
        }

        // Restore a reasonable default assessment state
        window.assessmentState = window.assessmentState || {};
        window.assessmentState.currentAssessment = assessments[0];
        // Use full question set if available
        window.assessmentState.currentAssessment.questions = window.assessmentState.currentAssessment.questions || [];
        window.assessmentState.currentQuestionIndex = 0;
        window.assessmentState.userAnswers = new Array(window.assessmentState.currentAssessment.questions.length).fill(null);
        window.assessmentState.assessmentStartTime = new Date();

        // Persist to sessionStorage
        saveAssessmentState();
        console.log('ensureAssessmentStateAsync: recovered state from server');
        return true;
    } catch (err) {
        console.error('ensureAssessmentStateAsync: failed to recover from server', err);
        return false;
    }
}

// Note: currentPage is declared in app.js

// Start assessment
async function startAssessment(category = null) {
    // Close any open modals before starting assessment
    const openModals = document.querySelectorAll('.fixed.inset-0.bg-black.bg-opacity-50');
    openModals.forEach(modal => modal.remove());
    
    // Remove any escape key handlers
    if (window.studentAssessmentModalEscapeHandler) {
        document.removeEventListener('keydown', window.studentAssessmentModalEscapeHandler);
        window.studentAssessmentModalEscapeHandler = null;
    }
    
    // Ensure the user is authenticated before attempting to fetch protected assessment data
    if (!authToken) {
        // Prompt login modal for student role as default
        showToast('Please log in to start the assessment.', 'warning');
        showLoginModal('student');
        return;
    }
    try {
        // Get available assessments
        console.log('Fetching assessments from API...', category ? `for category: ${category}` : 'all categories');
        
        // Build API URL with category parameter if specified
        const apiUrl = category ? `/assessments?category=${category}` : '/assessments';
        const response = await apiCall(apiUrl);
        
        console.log('Full API response:', JSON.stringify(response, null, 2));
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));
        
        // The API returns { success: true, data: [...], count: 1 }
        // response.data should be the array of assessments
        let assessments = [];
        
        if (response && typeof response === 'object') {
            if (Array.isArray(response.data)) {
                assessments = response.data;
            } else if (Array.isArray(response)) {
                // In case the response itself is the array
                assessments = response;
            } else {
                console.error('Unexpected response structure:', response);
            }
        }
        
        console.log('Assessments extracted:', assessments);
        console.log('Assessments count:', assessments.length);
        console.log('Is array:', Array.isArray(assessments));

        if (!Array.isArray(assessments) || assessments.length === 0) {
            console.error('No assessments available. Full response:', response);
            showToast('No assessments available for this category.', 'error');
            return;
        }

        // The API now returns the properly filtered assessment
        // So we can just use the first (and only) assessment in the response
        const chosenAssessment = assessments[0];
        console.log('startAssessment: loaded assessment:', chosenAssessment?.category, chosenAssessment?.title);
        window.assessmentState.currentAssessment = chosenAssessment;

        // Helper: shuffle array in-place
        function shuffle(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        // The API already filtered by category, so we just shuffle and limit to 10 questions
        let selected = [...window.assessmentState.currentAssessment.questions];
        shuffle(selected);
        selected = selected.slice(0, 10); // Limit to 10 questions for the assessment

        window.assessmentState.currentAssessment.questions = selected;

        window.assessmentState.currentQuestionIndex = 0;
        // Initialize userAnswers array with correct length
        window.assessmentState.userAnswers = new Array(selected.length).fill(null);
        window.assessmentState.assessmentStartTime = new Date();
        
        // Save to sessionStorage as backup
        saveAssessmentState();
        
        // Verify state was saved
        console.log('Assessment loaded. State check:', {
            windowStateExists: !!window.assessmentState,
            hasCurrentAssessment: !!window.assessmentState?.currentAssessment,
            questionCount: window.assessmentState?.currentAssessment?.questions?.length,
            sessionStorageSize: sessionStorage.getItem('assessmentState')?.length
        });
        
        showToast(`Loaded ${selected.length} questions`, 'success');

        // Initialize UI
        document.getElementById('student-dashboard').classList.add('hidden');
        document.getElementById('assessment-page').classList.remove('hidden');
        document.getElementById('assessment-info').classList.add('hidden');
        document.getElementById('assessment-questions').classList.remove('hidden');

        // Protect against copying/selecting
        enableAssessmentAntiCheat();

        // Set up questions
        document.getElementById('total-questions').textContent = window.assessmentState.currentAssessment.questions.length;

        // Show first question
        await showQuestion(0);

        currentPage = 'assessment-page';

    } catch (error) {
        console.error('Error starting assessment:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response,
            authToken: !!authToken
        });
        
        if (error.message && error.message.includes('401')) {
            showToast('Session expired. Please log in again.', 'error');
            setTimeout(() => {
                logout();
            }, 2000);
        } else {
            showToast('Failed to start assessment. Please try again.', 'error');
        }
    }
}



// Anti-copy/selection protections within assessment page
let antiCheatHandlers = [];
function enableAssessmentAntiCheat() {
    const container = document.getElementById('assessment-page');
    if (!container) return;

    // Prevent right-click context menu
    const onContext = (e) => { if (e.target.closest('#assessment-page')) e.preventDefault(); };
    // Prevent copy/cut/select
    const onCopy = (e) => { if (e.target.closest('#assessment-page')) e.preventDefault(); };
    const onCut = (e) => { if (e.target.closest('#assessment-page')) e.preventDefault(); };
    const onSelectStart = (e) => { if (e.target.closest('#assessment-page')) e.preventDefault(); };
    // Block Ctrl/Cmd+C and Ctrl/Cmd+X and text selection shortcuts
    const onKeyDown = (e) => {
        const inside = e.target && e.target.closest && e.target.closest('#assessment-page');
        if (!inside) return;
        const isMac = navigator.platform.toUpperCase().includes('MAC');
        const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
        if (ctrlOrCmd && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'a' || e.key === 'A')) {
            e.preventDefault();
        }
    };

    document.addEventListener('contextmenu', onContext, true);
    document.addEventListener('copy', onCopy, true);
    document.addEventListener('cut', onCut, true);
    document.addEventListener('selectstart', onSelectStart, true);
    document.addEventListener('keydown', onKeyDown, true);

    antiCheatHandlers = [
        ['contextmenu', onContext],
        ['copy', onCopy],
        ['cut', onCut],
        ['selectstart', onSelectStart],
        ['keydown', onKeyDown],
    ];
}

function disableAssessmentAntiCheat() {
    antiCheatHandlers.forEach(([evt, handler]) => {
        document.removeEventListener(evt, handler, true);
    });
    antiCheatHandlers = [];
}



async function showQuestion(index) {
    // Ensure state exists, try to recover if missing
    if (!(await ensureAssessmentStateAsync())) {
        alert('ERROR: Assessment state is missing and could not be recovered!\nPlease restart the assessment.');
        return;
    }
    
    if (index < 0 || index >= window.assessmentState.currentAssessment.questions.length) {
        showToast(`Error: Invalid index ${index}`, 'error');
        return;
    }
    
    window.assessmentState.currentQuestionIndex = index;
    
    // Save state after updating
    saveAssessmentState();
    
    const question = window.assessmentState.currentAssessment.questions[index];
    
    // Update progress
    const currentQuestionEl = document.getElementById('current-question');
    const categoryEl = document.getElementById('question-category');
    const progressBar = document.getElementById('progress-bar');
    
    if (!currentQuestionEl || !categoryEl || !progressBar) {
        alert('Error: Cannot find progress display elements');
        return;
    }
    
    currentQuestionEl.textContent = index + 1;
    categoryEl.textContent = capitalizeFirst(question.category);
    const progress = ((index + 1) / window.assessmentState.currentAssessment.questions.length) * 100;
    progressBar.style.width = progress + '%';
    
    // Render question
    const questionContainer = document.getElementById('question-container');
    
    if (question.type === 'multiple-choice') {
        // Ensure options array exists and has valid data
        const options = question.options || [];
        const validOptions = options.filter(opt => opt && opt.trim() !== '');
        
        if (validOptions.length === 0) {
            console.error('Question has no valid options:', question);
            showToast('Error: Question data is incomplete. Skipping to next question.', 'error');
            // Auto-advance to next question
            if (index < window.assessmentState.currentAssessment.questions.length - 1) {
                setTimeout(() => showQuestion(index + 1), 1000);
            }
            return;
        }
        
        // Check if question text is valid
        if (!question.question || question.question.trim() === '') {
            console.error('Question has no text:', question);
            showToast('Error: Question text is missing. Skipping to next question.', 'error');
            if (index < window.assessmentState.currentAssessment.questions.length - 1) {
                setTimeout(() => showQuestion(index + 1), 1000);
            }
            return;
        }
        
        questionContainer.innerHTML = `
            <div class="mb-6">
                <h4 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">${question.question || 'Question text missing'}</h4>
                <div class="space-y-3">
                    ${options.map((option, optionIndex) => `
                        <div class="flex items-center group">
                            <input type="radio" id="option-${optionIndex}" name="answer" value="${option}" 
                                   class="mr-3 w-5 h-5 text-[#56AE67] focus:ring-[#56AE67]" 
                                   ${window.assessmentState.userAnswers[index] && window.assessmentState.userAnswers[index].answer === option ? 'checked' : ''}>
                            <label for="option-${optionIndex}" class="text-gray-700 dark:text-gray-300 cursor-pointer flex-1 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-[#56AE67] dark:hover:border-[#56AE67] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group-hover:shadow-md">
                                ${option}
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (question.type === 'true-false') {
        questionContainer.innerHTML = `
            <div class="mb-6">
                <h4 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">${question.question || 'Question text missing'}</h4>
                <div class="space-y-3">
                    <div class="flex items-center group">
                        <input type="radio" id="option-true" name="answer" value="True" 
                               class="mr-3 w-5 h-5 text-[#56AE67] focus:ring-[#56AE67]" 
                               ${window.assessmentState.userAnswers[index] && window.assessmentState.userAnswers[index].answer === 'True' ? 'checked' : ''}>
                        <label for="option-true" class="text-gray-700 dark:text-gray-300 cursor-pointer flex-1 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group-hover:shadow-md">
                            ✓ True
                        </label>
                    </div>
                    <div class="flex items-center group">
                        <input type="radio" id="option-false" name="answer" value="False" 
                               class="mr-3 w-5 h-5 text-[#56AE67] focus:ring-[#56AE67]" 
                               ${window.assessmentState.userAnswers[index] && window.assessmentState.userAnswers[index].answer === 'False' ? 'checked' : ''}>
                        <label for="option-false" class="text-gray-700 dark:text-gray-300 cursor-pointer flex-1 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group-hover:shadow-md">
                            ✗ False
                        </label>
                    </div>
                </div>
            </div>
        `;
    } else if (question.type === 'short-answer') {
        questionContainer.innerHTML = `
            <div class="mb-6">
                <h4 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">${question.question || 'Question text missing'}</h4>
                <textarea name="answer" placeholder="Enter your answer here..." 
                          class="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#56AE67] dark:focus:border-[#56AE67] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all shadow-sm"
                          rows="5">${window.assessmentState.userAnswers[index] ? window.assessmentState.userAnswers[index].answer : ''}</textarea>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <i class="fas fa-info-circle mr-1"></i>Be concise and specific in your answer
                </p>
            </div>
        `;
    }
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    if (!prevBtn || !nextBtn || !submitBtn) {
        alert('Error: Navigation buttons not found in DOM');
        return;
    }
    
    prevBtn.disabled = index === 0;
    
    if (index === window.assessmentState.currentAssessment.questions.length - 1) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

async function saveCurrentAnswer() {
    if (!(await ensureAssessmentStateAsync())) return;

    const answerInput = document.querySelector('input[name="answer"]:checked') || 
                       document.querySelector('textarea[name="answer"]');

    if (answerInput) {
        const q = window.assessmentState.currentAssessment?.questions?.[window.assessmentState.currentQuestionIndex];
        window.assessmentState.userAnswers[window.assessmentState.currentQuestionIndex] = {
            questionIndex: window.assessmentState.currentQuestionIndex,
            questionId: q?._id,
            answer: (answerInput.value || '').trim()
        };
        saveAssessmentState(); // Save to sessionStorage
    }
}

async function nextQuestion() {
    console.log('=== nextQuestion called ===');
    console.log('Before ensureState - window.assessmentState:', !!window.assessmentState);
    console.log('Before ensureState - currentAssessment:', !!window.assessmentState?.currentAssessment);
    
    // Ensure state exists, try to recover if missing
    if (!(await ensureAssessmentStateAsync())) {
        console.error('FAILED TO ENSURE STATE');
        alert('CRITICAL ERROR: Assessment state is missing and could not be recovered!\n\nPlease restart the assessment.');
        return;
    }
    
    console.log('After ensureState - State OK');
    console.log('Questions available:', window.assessmentState.currentAssessment.questions.length);
    
    // Show visual feedback
    const currentIndex = window.assessmentState.currentQuestionIndex;
    const totalQuestions = window.assessmentState.currentAssessment.questions.length;
    
    showToast(`Q${currentIndex + 1}/${totalQuestions} - Moving next`, 'info');
    
    await saveCurrentAnswer();
    
    if (window.assessmentState.currentQuestionIndex < window.assessmentState.currentAssessment.questions.length - 1) {
        const nextIndex = window.assessmentState.currentQuestionIndex + 1;
        console.log('Moving to question', nextIndex + 1);
        await showQuestion(nextIndex);
        showToast(`Now on Q${nextIndex + 1}`, 'success');
    } else {
        showToast('This is the last question', 'warning');
    }
}

async function previousQuestion() {
    // Show visual feedback
    showToast('Moving to previous question...', 'info');
    
    await saveCurrentAnswer();
    if (window.assessmentState.currentQuestionIndex > 0) {
        await showQuestion(window.assessmentState.currentQuestionIndex - 1);
    } else {
        showToast('This is the first question', 'warning');
    }
}

// Expose functions globally to ensure they're accessible from HTML onclick handlers
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.submitAssessment = submitAssessment;

async function submitAssessment() {
    // Ensure state and save current answer
    if (!(await ensureAssessmentStateAsync())) {
        alert('Error: Assessment state missing. Cannot submit.');
        return;
    }
    await saveCurrentAnswer();
    
    // Check if all questions are answered
    const unansweredQuestions = [];
    for (let i = 0; i < window.assessmentState.currentAssessment.questions.length; i++) {
        if (!window.assessmentState.userAnswers[i] || !window.assessmentState.userAnswers[i].answer) {
            unansweredQuestions.push(i + 1);
        }
    }
    
    if (unansweredQuestions.length > 0) {
        const proceed = confirm(`You have ${unansweredQuestions.length} unanswered questions. Do you want to submit anyway?`);
        if (!proceed) {
            return;
        }
    }
    
    try {
        showToast('Submitting assessment...', 'info');
        
        // Filter out null answers and ensure all answers have proper structure
        const validAnswers = window.assessmentState.userAnswers.map((answer, index) => {
            if (!answer) {
                // Create a default empty answer for unanswered questions
                const question = window.assessmentState.currentAssessment?.questions?.[index];
                return {
                    questionIndex: index,
                    questionId: question?._id || null,
                    answer: null
                };
            }
            return answer;
        });
        
        // Log submission data for debugging
        console.log('Submitting assessment:', {
            assessmentId: window.assessmentState.currentAssessment._id,
            answersCount: validAnswers.length,
            validAnswersCount: validAnswers.filter(a => a && a.answer).length,
            answers: validAnswers,
            startedAt: window.assessmentState.assessmentStartTime
        });
        
        const response = await apiCall(`/assessments/${window.assessmentState.currentAssessment._id}/submit`, {
            method: 'POST',
            body: JSON.stringify({
                answers: validAnswers,
                startedAt: window.assessmentState.assessmentStartTime.toISOString()
            })
        });
        
        console.log('Assessment submission response:', response);
        showAssessmentResults(response.data);

        // Attempt to refresh assessment history and profile so the new result shows up
        try {
            if (typeof loadAssessmentHistory === 'function') {
                console.log('Refreshing assessment history after submission');
                loadAssessmentHistory();
            }
            if (typeof loadStudentProfile === 'function') {
                console.log('Refreshing student profile after submission');
                loadStudentProfile();
            }
        } catch (e) {
            console.warn('Failed to refresh history/profile after submission', e);
        }
        
    } catch (error) {
        console.error('Error submitting assessment:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response
        });
        showToast('Server error: ' + (error.message || 'Failed to submit assessment. Please try again.'), 'error');
    }
}

function showAssessmentResults(results) {
    // Disable anti-cheat protections after finishing
    disableAssessmentAntiCheat();

    // Hide timer
    const timerEl = document.getElementById('assessment-timer');
    if (timerEl) timerEl.classList.add('hidden');

    // Hide questions, show results
    const questionsEl = document.getElementById('assessment-questions');
    const resultsEl = document.getElementById('assessment-results');
    if (questionsEl) questionsEl.classList.add('hidden');
    if (resultsEl) resultsEl.classList.remove('hidden');

    // Check for language-specific configuration
    const language = window.assessmentState.currentAssessment?.category?.toLowerCase();
    // languageConfig may not be defined in all deployments; guard against ReferenceError
    const langConfig = (typeof languageConfig !== 'undefined' && language) ? (languageConfig[language] || null) : null;

    // Apply language-specific styling if available
    const resultsDiv = document.getElementById('assessment-results');
    if (resultsDiv && langConfig) {
        resultsDiv.classList.add(`result-${language}`);
    }

    // Update results display with language-specific elements
    const iconHtml = langConfig ? `<i class="${langConfig.icon}"></i>` : '<i class="fas fa-trophy"></i>';
    const scoreColor = 'text-white';
    const message = langConfig ? langConfig.message : 'Assessment Complete!';

    if (resultsDiv) {
        const h2 = resultsDiv.querySelector('h2');
        if (h2) {
            h2.innerHTML = `
                <div class="text-7xl ${langConfig ? `text-${langConfig.color}-500` : 'text-[#56AE67]'} mb-4 animate-bounce">
                    ${iconHtml}
                </div>
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">${message}</h2>
            `;
        }
    }

    const overallScoreEl = document.getElementById('overall-score');
    if (overallScoreEl) {
        overallScoreEl.className = `text-7xl font-black text-white mb-2 drop-shadow-2xl`;
        overallScoreEl.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)';
        overallScoreEl.textContent = (results.percentage || 0) + '%';
    }

    // Update category scores - show only the assessed category
    const categoryScoresContainer = document.getElementById('category-scores');
    const categoryScores = results.categoryScores || {};
    const assessedCategory = window.assessmentState?.currentAssessment?.category || language || 'unknown';

    if (categoryScoresContainer) {
        // Filter to show only the category that was actually assessed
        const filteredScores = Object.entries(categoryScores).filter(([category, score]) => {
            // Show only if score > 0 (was actually assessed)
            return score > 0;
        });

        if (filteredScores.length > 0) {
            categoryScoresContainer.innerHTML = filteredScores.map(([category, score]) => {
                const barColor = score >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' : score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-red-500 to-red-600';
                const icon = score >= 80 ? '🏆' : score >= 60 ? '⭐' : '📚';

                return `
                    <div class="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-lg font-bold text-gray-800 dark:text-gray-200">${icon} ${capitalizeFirst(category)}</span>
                            <span class="text-2xl font-bold ${score >= 80 ? 'text-green-600 dark:text-green-400' : score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">${score}%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div class="${barColor} h-4 rounded-full transition-all duration-1000 shadow-lg"
                                 style="width: ${score}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            // If no scores, hide the section
            const categorySection = categoryScoresContainer.closest('.mb-8');
            if (categorySection) categorySection.classList.add('hidden');
        }
    }

    // Show retake button if score is 0%
    if ((results.percentage || 0) === 0) {
        const retakeContainer = document.getElementById('retake-container') || document.createElement('div');
        retakeContainer.id = 'retake-container';
        retakeContainer.className = 'mt-6 text-center';
        retakeContainer.innerHTML = `
            <button onclick="startAssessment();" class="bg-[#56AE67] text-white px-5 py-3 rounded-lg hover:bg-[#3d8b4f]">
                Retry Assessment
            </button>`;
        if (resultsDiv) resultsDiv.appendChild(retakeContainer);
    }

    // Update verified skills
    const verifiedSkillsContainer = document.getElementById('verified-skills');
    const verifiedSkills = Object.entries(categoryScores)
        .filter(([category, score]) => score >= 60)
        .map(([category, score]) => {
            const level = score >= 80 ? 'Expert' : score >= 70 ? 'Advanced' : 'Intermediate';
            return { category, level, score };
        });

    if (verifiedSkillsContainer) {
        verifiedSkillsContainer.innerHTML = verifiedSkills.map(skill => `
        <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div class="flex items-center">
                <i class="fas fa-check-circle text-green-500 mr-2"></i>
                <span class="font-medium">${capitalizeFirst(skill.category)}</span>
            </div>
            <span class="text-sm px-2 py-1 bg-green-100 text-green-800 rounded">
                ${skill.level}
            </span>
        </div>
    `).join('');
    }

    // Show congratulations or encouragement
    const passed = results.passed;
    if (passed) {
        showToast(langConfig ? langConfig.message : 'Congratulations! You passed the assessment.', 'success');
    } else {
        showToast('Assessment complete. Keep learning to improve your skills!', 'info');
    }
    
    // Remove view detailed answers button - not needed in results page
}

function showDetailedAnswers(results) {
    // Create modal to show detailed answers
    const modal = document.createElement('div');
    modal.id = 'detailed-answers-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    // Handle both fresh results and historical results from server
    const questions = results.assessment?.questions || window.assessmentState?.currentAssessment?.questions || [];
    const userSubmittedAnswers = results.answers || window.assessmentState?.userAnswers || [];
    
    if (questions.length === 0) {
        console.error('No questions available to display');
        showToast('Unable to load detailed answers', 'error');
        return;
    }
    
    let detailedHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#56AE67] to-[#3d8b4f]">
                <h2 class="text-2xl font-bold text-white">
                    <i class="fas fa-clipboard-check mr-2"></i>Detailed Answer Review
                </h2>
                <button onclick="document.getElementById('detailed-answers-modal').remove()" 
                    class="text-white hover:text-gray-200 transition">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1" style="max-height: calc(90vh - 200px);">
                <div class="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p class="text-sm text-blue-800 dark:text-blue-200">
                        <i class="fas fa-info-circle mr-2"></i>
                        Review your answers to identify areas for improvement. Green indicates correct answers, red indicates incorrect answers.
                    </p>
                </div>
                
                <div class="space-y-6">
    `;
    
    questions.forEach((question, index) => {
        const userAnswer = userSubmittedAnswers[index];
        // Get correct answer from question object or from the enriched answer data
        const correctAnswer = question.correctAnswer || userAnswer?.correctAnswer;
        const userSelectedAnswer = userAnswer?.answer || userAnswer?.selectedAnswer || userAnswer?.userAnswer || null;
        const isCorrect = userAnswer?.isCorrect || (userSelectedAnswer === correctAnswer);
        
        detailedHTML += `
            <div class="border-2 ${isCorrect ? 'border-green-400 dark:border-green-600' : 'border-red-400 dark:border-red-600'} 
                rounded-lg p-5 ${isCorrect ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'} shadow-md">
                
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                            Question ${index + 1}
                        </h3>
                        <span class="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            ${question.category || 'General'}
                        </span>
                    </div>
                    <span class="${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} 
                        px-4 py-2 rounded-full text-sm font-bold shadow-md">
                        ${isCorrect ? '<i class="fas fa-check mr-1"></i>Correct' : '<i class="fas fa-times mr-1"></i>Incorrect'}
                    </span>
                </div>
                
                <p class="text-gray-800 dark:text-gray-200 mb-4 font-medium text-base leading-relaxed">${question.question || userAnswer?.question || 'Question text unavailable'}</p>
                
                <div class="space-y-2">
        `;
        
        // Show all options if available
        if (question.options && question.options.length > 0) {
            question.options.forEach(option => {
                const isUserAnswer = option === userSelectedAnswer;
                const isCorrectOption = option === correctAnswer;
                
                let optionClass = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
                let icon = '';
                let badge = '';
                
                if (isCorrectOption) {
                    optionClass = 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 font-semibold border-2 border-green-500';
                    icon = '<i class="fas fa-check-circle text-green-600 dark:text-green-400 mr-2"></i>';
                    badge = '<span class="ml-auto text-xs font-bold text-green-700 dark:text-green-300">✓ CORRECT ANSWER</span>';
                } else if (isUserAnswer && !isCorrect) {
                    optionClass = 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 font-semibold border-2 border-red-500';
                    icon = '<i class="fas fa-times-circle text-red-600 dark:text-red-400 mr-2"></i>';
                    badge = '<span class="ml-auto text-xs font-bold text-red-700 dark:text-red-300">✗ YOUR ANSWER</span>';
                }
                
                detailedHTML += `
                    <div class="${optionClass} px-4 py-3 rounded-lg flex items-center transition-all">
                        ${icon}
                        <span class="flex-1">${option}</span>
                        ${badge}
                    </div>
                `;
            });
        }
        
        // Show "No answer provided" if user didn't answer
        if (!userSelectedAnswer) {
            detailedHTML += `
                <div class="bg-gray-200 dark:bg-gray-700 px-4 py-3 rounded-lg flex items-center border-2 border-gray-400 dark:border-gray-600">
                    <i class="fas fa-question-circle text-gray-500 dark:text-gray-400 mr-2"></i>
                    <span class="flex-1 text-gray-600 dark:text-gray-400 font-medium">No answer provided</span>
                </div>
            `;
        }
        
        // If no options available but we have answers, show them separately
        if (!question.options || question.options.length === 0) {
            if (userSelectedAnswer) {
                detailedHTML += `
                    <div class="bg-blue-100 dark:bg-blue-900/30 px-4 py-3 rounded-lg border border-blue-300">
                        <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">YOUR ANSWER:</p>
                        <p class="text-gray-900 dark:text-white">${userSelectedAnswer}</p>
                    </div>
                `;
            }
            if (correctAnswer && correctAnswer !== 'N/A') {
                detailedHTML += `
                    <div class="bg-green-100 dark:bg-green-900/30 px-4 py-3 rounded-lg border-2 border-green-500">
                        <p class="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">✓ CORRECT ANSWER:</p>
                        <p class="text-green-900 dark:text-green-100 font-semibold">${correctAnswer}</p>
                    </div>
                `;
            }
        }
        
        detailedHTML += `
                </div>
                
                <div class="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600">
                    <div class="flex justify-between items-center text-sm">
                        <span class="${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'} font-semibold">
                            <i class="fas fa-star mr-1"></i>Points: ${isCorrect ? (question.points || 1) : 0} / ${question.points || 1}
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
    
    detailedHTML += `
                </div>
            </div>
            
            <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div class="flex justify-between items-center">
                    <div class="text-base text-gray-800 dark:text-gray-200 font-semibold">
                        <i class="fas fa-chart-bar mr-2 text-[#56AE67]"></i>
                        <strong>Overall Score:</strong> ${results.score || 0} / ${questions.reduce((sum, q) => sum + (q.points || 1), 0)} points
                        <span class="ml-3 text-lg font-bold text-[#56AE67] dark:text-[#6bc481]">(${results.percentage}%)</span>
                    </div>
                    <button onclick="document.getElementById('detailed-answers-modal').remove()" 
                        style="background-color: #56AE67; color: white;"
                        class="px-6 py-2 rounded-lg hover:bg-[#3d8b4f] transition font-semibold shadow-md"
                        onmouseover="this.style.backgroundColor='#3d8b4f'" 
                        onmouseout="this.style.backgroundColor='#56AE67'">
                        <i class="fas fa-times mr-2"></i>Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.innerHTML = detailedHTML;
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Close on ESC key
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

function continueToPlatform() {
    // Reset assessment state
    window.assessmentState.currentAssessment = null;
    window.assessmentState.currentQuestionIndex = 0;
    window.assessmentState.userAnswers = [];
    window.assessmentState.assessmentStartTime = null;
    
    // Clear sessionStorage
    sessionStorage.removeItem('assessmentState');
    
    const timerEl2 = document.getElementById('assessment-timer');
    if (timerEl2) timerEl2.classList.add('hidden');
    
    // Show dashboard
    showDashboard();
    showToast('Welcome to the IT OJT Platform!', 'success');

    currentPage = null;
}

// Keyboard navigation for assessment
document.addEventListener('keydown', function(event) {
    if (currentPage === 'assessment-page' && !document.getElementById('assessment-questions').classList.contains('hidden')) {
        switch(event.key) {
            case 'ArrowLeft':
                if (window.assessmentState.currentQuestionIndex > 0) {
                    previousQuestion();
                }
                break;
            case 'ArrowRight':
                if (window.assessmentState.currentQuestionIndex < window.assessmentState.currentAssessment.questions.length - 1) {
                    nextQuestion();
                } else if (window.assessmentState.currentQuestionIndex === window.assessmentState.currentAssessment.questions.length - 1) {
                    submitAssessment();
                }
                break;
            case '1':
            case '2':
            case '3':
            case '4':
                // Quick select for multiple choice
                const optionIndex = parseInt(event.key) - 1;
                const optionInput = document.getElementById(`option-${optionIndex}`);
                if (optionInput) {
                    optionInput.checked = true;
                }
                break;
        }
    }
});

// Prevent page refresh during assessment
window.addEventListener('beforeunload', function(event) {
    if (currentPage === 'assessment-page' && window.assessmentState.currentAssessment) {
        event.preventDefault();
        event.returnValue = 'You have an assessment in progress. Are you sure you want to leave?';
        return event.returnValue;
    }
});

// Expose functions globally to ensure they're accessible from HTML onclick handlers
window.startAssessment = startAssessment;
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.submitAssessment = submitAssessment;
window.continueToPlatform = continueToPlatform;

// Show visual confirmation that functions are loaded
setTimeout(() => {
    if (typeof window.nextQuestion === 'function') {
        console.log('✓ Assessment navigation functions loaded successfully');
    }
}, 100);
