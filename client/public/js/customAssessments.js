/**
 * Custom Assessment Module
 * Handles company-created assessments for job applications
 */

// Create Assessment Modal (Company Side)
function openCreateAssessmentModal(jobId) {
    const modalHTML = `
        <div id="create-assessment-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style="overflow: hidden;">
            <div class="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full flex flex-col" style="max-height: 90vh; height: 90vh;">
                <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        <i class="fas fa-clipboard-list mr-2"></i>Create Custom Assessment
                    </h2>
                    <button onclick="document.getElementById('create-assessment-modal').remove()" 
                        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div class="p-6 flex-1" style="overflow-y: auto; overflow-x: hidden;">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Assessment Title *
                        </label>
                        <input type="text" id="assessment-title" 
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                   dark:bg-gray-700 dark:text-white focus:outline-none focus:border-[#56AE67]"
                            placeholder="e.g., Frontend Development Skills Test">
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea id="assessment-description" rows="2"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                   dark:bg-gray-700 dark:text-white focus:outline-none focus:border-[#56AE67]"
                            placeholder="Brief description of what this assessment covers"></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Duration (minutes)
                            </label>
                            <input type="number" id="assessment-duration" value="30" min="5" max="120"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                       dark:bg-gray-700 dark:text-white focus:outline-none focus:border-[#56AE67]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Passing Score (%)
                            </label>
                            <input type="number" id="assessment-passing-score" value="60" min="0" max="100"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                       dark:bg-gray-700 dark:text-white focus:outline-none focus:border-[#56AE67]">
                        </div>
                    </div>

                    <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Questions</h3>
                            <button onclick="addAssessmentQuestion()" 
                                class="px-4 py-2 text-white rounded-lg hover:bg-[#3d8b4f] transition font-medium"
                                style="background-color: #56AE67; color: white;"
                                onmouseover="this.style.backgroundColor='#3d8b4f'" 
                                onmouseout="this.style.backgroundColor='#56AE67'">
                                <i class="fas fa-plus mr-2"></i>Add Question
                            </button>
                        </div>
                        <div id="assessment-questions-container"></div>
                    </div>
                </div>

                <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
                    <div class="flex justify-end space-x-3">
                        <button onclick="document.getElementById('create-assessment-modal').remove()" 
                            class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                            Cancel
                        </button>
                        <button onclick="saveCustomAssessment('${jobId}')" 
                            class="px-6 py-2 text-white rounded-lg transition font-bold"
                            style="background-color: #56AE67;"
                            onmouseover="this.style.backgroundColor='#3d8b4f'" 
                            onmouseout="this.style.backgroundColor='#56AE67'">
                            <i class="fas fa-save mr-2"></i>Save Assessment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Reset question counter when opening modal
    questionCounter = 0;
    
    // Add first question by default
    addAssessmentQuestion();
}

let questionCounter = 0;

function addAssessmentQuestion() {
    questionCounter++;
    const container = document.getElementById('assessment-questions-container');
    
    const questionHTML = `
        <div class="question-item bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4" data-question-id="${questionCounter}">
            <div class="flex justify-between items-start mb-3">
                <h4 class="font-medium text-gray-900 dark:text-white">Question ${questionCounter}</h4>
                <button onclick="this.closest('.question-item').remove()" 
                    class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </div>

            <div class="mb-3">
                <input type="text" class="question-text w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       dark:bg-gray-600 dark:text-white focus:outline-none focus:border-[#56AE67]"
                    placeholder="Enter your question">
            </div>

            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Question Type</label>
                    <select class="question-type w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           dark:bg-gray-600 dark:text-white focus:outline-none" 
                           onchange="toggleQuestionOptions(this)">
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="short-answer">Short Answer</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Category</label>
                    <select class="question-category w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           dark:bg-gray-600 dark:text-white focus:outline-none">
                        <option value="technical">Technical</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="situational">Situational</option>
                        <option value="general">General</option>
                    </select>
                </div>
            </div>

            <div class="options-container">
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-2">Answer Options</label>
                <div class="space-y-2 mb-2">
                    <input type="text" class="option-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           dark:bg-gray-600 dark:text-white" placeholder="Option A">
                    <input type="text" class="option-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           dark:bg-gray-600 dark:text-white" placeholder="Option B">
                    <input type="text" class="option-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           dark:bg-gray-600 dark:text-white" placeholder="Option C">
                    <input type="text" class="option-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           dark:bg-gray-600 dark:text-white" placeholder="Option D">
                </div>
            </div>

            <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Correct Answer</label>
                <input type="text" class="correct-answer w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       dark:bg-gray-600 dark:text-white focus:outline-none focus:border-[#56AE67]"
                    placeholder="Enter the exact correct answer (e.g., Option A text or True/False)">
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', questionHTML);
}

function toggleQuestionOptions(select) {
    const questionItem = select.closest('.question-item');
    const optionsContainer = questionItem.querySelector('.options-container');
    
    if (select.value === 'short-answer') {
        optionsContainer.style.display = 'none';
    } else if (select.value === 'true-false') {
        optionsContainer.innerHTML = `
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-2">Answer Options</label>
            <div class="space-y-2 mb-2">
                <input type="text" class="option-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       dark:bg-gray-600 dark:text-white" value="True" readonly>
                <input type="text" class="option-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       dark:bg-gray-600 dark:text-white" value="False" readonly>
            </div>
        `;
    } else {
        optionsContainer.innerHTML = `
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-2">Answer Options</label>
            <div class="space-y-2 mb-2">
                <input type="text" class="option-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       dark:bg-gray-600 dark:text-white" placeholder="Option A">
                <input type="text" class="option-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       dark:bg-gray-600 dark:text-white" placeholder="Option B">
                <input type="text" class="option-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       dark:bg-gray-600 dark:text-white" placeholder="Option C">
                <input type="text" class="option-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       dark:bg-gray-600 dark:text-white" placeholder="Option D">
            </div>
        `;
    }
}

async function saveCustomAssessment(jobId) {
    const title = document.getElementById('assessment-title').value.trim();
    const description = document.getElementById('assessment-description').value.trim();
    const duration = parseInt(document.getElementById('assessment-duration').value);
    const passingScore = parseInt(document.getElementById('assessment-passing-score').value);

    if (!title) {
        showToast('Please enter an assessment title', 'error');
        return;
    }

    // Collect questions
    const questionItems = document.querySelectorAll('.question-item');
    if (questionItems.length === 0) {
        showToast('Please add at least one question', 'error');
        return;
    }

    const questions = [];
    let hasError = false;

    questionItems.forEach((item, index) => {
        const questionText = item.querySelector('.question-text').value.trim();
        const questionType = item.querySelector('.question-type').value;
        const category = item.querySelector('.question-category').value;
        const correctAnswer = item.querySelector('.correct-answer').value.trim();

        if (!questionText) {
            showToast(`Question ${index + 1} is missing question text`, 'error');
            hasError = true;
            return;
        }

        if (!correctAnswer) {
            showToast(`Question ${index + 1} is missing correct answer`, 'error');
            hasError = true;
            return;
        }

        const options = [];
        if (questionType !== 'short-answer') {
            const optionInputs = item.querySelectorAll('.option-input');
            optionInputs.forEach(input => {
                const value = input.value.trim();
                if (value) options.push(value);
            });

            if (options.length === 0) {
                showToast(`Question ${index + 1} needs at least one option`, 'error');
                hasError = true;
                return;
            }
        }

        questions.push({
            questionText,
            questionType,
            category,
            options,
            correctAnswer,
            points: 1
        });
    });

    if (hasError) return;

    try {
        showToast('Creating assessment...', 'info');
        
        console.log('Saving assessment for job:', jobId);
        console.log('Assessment data:', { jobId, title, description, duration, passingScore, questions });

        const response = await apiCall('/custom-assessments', {
            method: 'POST',
            body: JSON.stringify({
                jobId,
                title,
                description,
                duration,
                passingScore,
                questions
            })
        });

        console.log('Response:', response);

        if (response.success) {
            showToast('Assessment created successfully!', 'success');
            document.getElementById('create-assessment-modal').remove();
            // Refresh job details to show assessment is linked
            if (typeof loadCompanyDashboard === 'function') {
                loadCompanyDashboard();
            }
        } else {
            throw new Error(response.message || 'Failed to create assessment');
        }
    } catch (error) {
        console.error('Error creating assessment:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            response: error.response
        });
        showToast('Error: ' + error.message, 'error');
    }
}

// Take Custom Assessment (Student Side)
async function takeCustomAssessment(jobId, onComplete) {
    try {
        showToast('Loading assessment...', 'info');
        
        const assessment = await apiCall(`/custom-assessments/job/${jobId}`);
        
        if (!assessment || !assessment._id) {
            showToast('No custom assessment required for this job', 'info');
            if (onComplete) onComplete(null);
            return;
        }

        showCustomAssessmentModal(assessment, jobId, onComplete);
    } catch (error) {
        console.error('Error loading custom assessment:', error);
        showToast('Error loading assessment: ' + error.message, 'error');
        if (onComplete) onComplete(null);
    }
}

function showCustomAssessmentModal(assessment, jobId, onComplete) {
    const startTime = Date.now();
    let currentQuestion = 0;
    const userAnswers = new Array(assessment.questions.length).fill(null);

    const modalHTML = `
        <div id="custom-assessment-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${assessment.title}</h2>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${assessment.description || ''}</p>
                    </div>
                    <div class="text-right">
                        <div id="custom-assessment-timer" class="text-2xl font-bold text-[#56AE67]">
                            ${assessment.duration}:00
                        </div>
                        <div class="text-xs text-gray-500">Time Remaining</div>
                    </div>
                </div>

                <div class="p-6 overflow-y-auto flex-1" id="custom-assessment-content">
                    <!-- Questions will be loaded here -->
                </div>

                <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            Question <span id="custom-current-q">1</span> of ${assessment.questions.length}
                        </div>
                        <div class="flex space-x-3">
                            <button id="custom-prev-btn" onclick="navigateCustomQuestion(-1)" 
                                style="background-color: #4B5563; color: white;"
                                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                                onmouseover="this.style.backgroundColor='#374151'" 
                                onmouseout="this.style.backgroundColor='#4B5563'" disabled>
                                <i class="fas fa-arrow-left mr-2"></i>Previous
                            </button>
                            <button id="custom-next-btn" onclick="navigateCustomQuestion(1)" 
                                style="background-color: #56AE67; color: white; border: 2px solid #2d6b3c;"
                                class="px-4 py-2 bg-[#56AE67] text-white rounded-lg hover:bg-[#3d8b4f] transition font-bold border-2"
                                onmouseover="this.style.backgroundColor='#3d8b4f'" 
                                onmouseout="this.style.backgroundColor='#56AE67'">
                                Next<i class="fas fa-arrow-right ml-2"></i>
                            </button>
                            <button id="custom-submit-btn" style="display:none; background-color: #16a34a; color: white;" 
                                onclick="submitCustomAssessment()" 
                                class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold"
                                onmouseover="this.style.backgroundColor='#15803d'" 
                                onmouseout="this.style.backgroundColor='#16a34a'">
                                <i class="fas fa-check mr-2"></i>Submit Assessment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Store assessment data globally for navigation
    window.customAssessmentData = {
        assessment,
        jobId,
        currentQuestion,
        userAnswers,
        startTime,
        onComplete
    };

    // Start timer
    startCustomAssessmentTimer(assessment.duration);

    // Load first question
    loadCustomQuestion(0);
}

function loadCustomQuestion(index) {
    const { assessment, userAnswers } = window.customAssessmentData;
    const question = assessment.questions[index];
    const content = document.getElementById('custom-assessment-content');

    let optionsHTML = '';
    
    if (question.questionType === 'multiple-choice' || question.questionType === 'true-false') {
        optionsHTML = question.options.map((option, i) => `
            <label class="flex items-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer
                   hover:border-[#56AE67] transition ${userAnswers[index] === option ? 'border-[#56AE67] bg-green-50 dark:bg-green-900/20' : ''}">
                <input type="radio" name="custom-q-${index}" value="${option}" 
                    ${userAnswers[index] === option ? 'checked' : ''}
                    onchange="saveCustomAnswer(${index}, this.value)"
                    class="mr-3">
                <span class="text-gray-900 dark:text-white">${option}</span>
            </label>
        `).join('');
    } else if (question.questionType === 'short-answer') {
        optionsHTML = `
            <textarea id="custom-answer-${index}" rows="4"
                class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                       dark:bg-gray-700 dark:text-white focus:outline-none focus:border-[#56AE67]"
                placeholder="Enter your answer here..."
                onchange="saveCustomAnswer(${index}, this.value)">${userAnswers[index] || ''}</textarea>
        `;
    }

    content.innerHTML = `
        <div class="mb-6">
            <div class="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm mb-3">
                ${question.category}
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                ${index + 1}. ${question.questionText}
            </h3>
            <div class="space-y-3">
                ${optionsHTML}
            </div>
        </div>
    `;

    // Update navigation
    window.customAssessmentData.currentQuestion = index;
    document.getElementById('custom-current-q').textContent = index + 1;
    document.getElementById('custom-prev-btn').disabled = index === 0;
    
    const nextBtn = document.getElementById('custom-next-btn');
    const submitBtn = document.getElementById('custom-submit-btn');
    
    if (index === assessment.questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

function saveCustomAnswer(questionIndex, answer) {
    window.customAssessmentData.userAnswers[questionIndex] = answer;
}

function navigateCustomQuestion(direction) {
    const { currentQuestion, assessment } = window.customAssessmentData;
    const newIndex = currentQuestion + direction;
    
    if (newIndex >= 0 && newIndex < assessment.questions.length) {
        loadCustomQuestion(newIndex);
    }
}

function startCustomAssessmentTimer(minutes) {
    let timeLeft = minutes * 60;
    const timerElement = document.getElementById('custom-assessment-timer');
    
    const timerInterval = setInterval(() => {
        timeLeft--;
        
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerElement.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showToast('Time is up! Submitting assessment...', 'warning');
            submitCustomAssessment();
        }
    }, 1000);
    
    window.customAssessmentTimer = timerInterval;
}

async function submitCustomAssessment() {
    const { assessment, jobId, userAnswers, startTime, onComplete } = window.customAssessmentData;
    
    // Check for unanswered questions
    const unanswered = userAnswers.filter(a => !a).length;
    if (unanswered > 0) {
        const proceed = confirm(`You have ${unanswered} unanswered questions. Submit anyway?`);
        if (!proceed) return;
    }

    try {
        showToast('Submitting assessment...', 'info');
        
        // Stop timer
        if (window.customAssessmentTimer) {
            clearInterval(window.customAssessmentTimer);
        }

        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        
        const answers = assessment.questions.map((q, i) => ({
            questionId: q._id,
            answer: userAnswers[i] || ''
        }));

        const response = await apiCall('/custom-assessments/submit', {
            method: 'POST',
            body: JSON.stringify({
                assessmentId: assessment._id,
                jobId,
                answers,
                timeSpent
            })
        });

        if (response.success) {
            // Close the assessment modal
            const modal = document.getElementById('custom-assessment-modal');
            if (modal) {
                modal.remove();
            }
            
            const result = response.result;
            
            // Show success message
            showToast(`Assessment Complete! Score: ${result.percentage}% ${result.passed ? '(Passed)' : '(Failed)'}`, 
                     result.passed ? 'success' : 'warning');
            
            // Call the callback function if provided
            if (onComplete && typeof onComplete === 'function') {
                // Small delay to ensure modal is fully removed before callback
                setTimeout(() => {
                    onComplete({
                        success: true,
                        submissionId: response.submissionId,
                        result: result
                    });
                }, 100);
            }
            
            // Clean up
            delete window.customAssessmentData;
        } else {
            throw new Error(response.message || 'Failed to submit assessment');
        }
    } catch (error) {
        console.error('Error submitting custom assessment:', error);
        showToast('Error: ' + error.message, 'error');
        
        // Call callback with failure
        if (onComplete && typeof onComplete === 'function') {
            onComplete({
                success: false,
                error: error.message
            });
        }
    }
}
