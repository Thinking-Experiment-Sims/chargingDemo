/**
 * Learning Panel JS - Manages the interactive learning components
 */

class LearningPanel {
    constructor() {
        // UI Elements
        this.learningPanel = document.getElementById('learning-panel');
        this.showPanelBtn = document.getElementById('show-learning-panel');
        this.activityTab = document.getElementById('tab-activity');
        this.quizTab = document.getElementById('tab-quiz');
        this.closeBtn = document.getElementById('tab-close');
        this.activityContent = document.getElementById('activity-content');
        this.quizContent = document.getElementById('quiz-content');
        
        // State
        this.currentScenario = 0;
        this.scenarios = [
            {
                title: "Scenario 1: Negatively Charged Rod (Conduction)",
                setup: {
                    chargingMode: "conduction",
                    rodCharge: -5,
                    ground: false
                },
                questions: [
                    { id: "s1-q1", label: "Electron Flow", correctAnswer: "Electrons flow from rod to ball" },
                    { id: "s1-q2", label: "Net Charge on Ball", correctAnswer: "Negative" },
                    { id: "s1-q3", label: "Force Between Rod and Ball", correctAnswer: "Repulsion" }
                ]
            },
            {
                title: "Scenario 2: Positively Charged Rod (Conduction)",
                setup: {
                    chargingMode: "conduction",
                    rodCharge: 5,
                    ground: false
                },
                questions: [
                    { id: "s2-q1", label: "Electron Flow", correctAnswer: "Electrons flow from ball to rod" },
                    { id: "s2-q2", label: "Net Charge on Ball", correctAnswer: "Positive" },
                    { id: "s2-q3", label: "Force Between Rod and Ball", correctAnswer: "Repulsion" }
                ]
            },
            {
                title: "Scenario 3: Negatively Charged Rod (Induction, No Grounding)",
                setup: {
                    chargingMode: "induction",
                    rodCharge: -5,
                    ground: false
                },
                questions: [
                    { id: "s3-q1", label: "Electron Redistribution", correctAnswer: "Electrons move to the far side of the ball" },
                    { id: "s3-q2", label: "Net Charge on Ball", correctAnswer: "Neutral (polarized)" },
                    { id: "s3-q3", label: "Force Between Rod and Ball", correctAnswer: "Attraction" }
                ]
            },
            {
                title: "Scenario 4: Negatively Charged Rod (Induction, With Grounding)",
                setup: {
                    chargingMode: "induction",
                    rodCharge: -5,
                    ground: true
                },
                questions: [
                    { id: "s4-q1", label: "Electron Redistribution", correctAnswer: "Electrons move to the far side of the ball" },
                    { id: "s4-q2", label: "Electron Flow to Ground", correctAnswer: "Electrons flow from the ball to ground" },
                    { id: "s4-q3", label: "Net Charge on Ball", correctAnswer: "Positive" },
                    { id: "s4-q4", label: "Force Between Rod and Ball", correctAnswer: "Attraction" }
                ]
            },
            {
                title: "Scenario 5: Positively Charged Rod (Induction, No Grounding)",
                setup: {
                    chargingMode: "induction",
                    rodCharge: 5,
                    ground: false
                },
                questions: [
                    { id: "s5-q1", label: "Electron Redistribution", correctAnswer: "Electrons move to the near side of the ball" },
                    { id: "s5-q2", label: "Net Charge on Ball", correctAnswer: "Neutral (polarized)" },
                    { id: "s5-q3", label: "Force Between Rod and Ball", correctAnswer: "Attraction" }
                ]
            },
            {
                title: "Scenario 6: Positively Charged Rod (Induction, With Grounding)",
                setup: {
                    chargingMode: "induction",
                    rodCharge: 5,
                    ground: true
                },
                questions: [
                    { id: "s6-q1", label: "Electron Redistribution", correctAnswer: "Electrons move to the near side of the ball" },
                    { id: "s6-q2", label: "Electron Flow from Ground", correctAnswer: "Electrons flow from ground into the ball" },
                    { id: "s6-q3", label: "Net Charge on Ball", correctAnswer: "Negative" },
                    { id: "s6-q4", label: "Force Between Rod and Ball", correctAnswer: "Attraction" }
                ]
            }
        ];
        
        // Quiz questions
        this.quizQuestions = [
            {
                type: "multiple-choice",
                question: "What happens when a negatively charged rod touches a neutral pith ball?",
                options: [
                    "Electrons flow from the ball to the rod, and the ball becomes positively charged.",
                    "Electrons flow from the rod to the ball, and the ball becomes negatively charged.",
                    "Protons flow from the rod to the ball, and the ball becomes positively charged.",
                    "The ball remains neutral because no charge transfer occurs."
                ],
                correctAnswerIndex: 1
            },
            {
                type: "multiple-choice",
                question: "In induction without grounding, what happens to the net charge of the pith ball?",
                options: [
                    "It becomes positively charged.",
                    "It becomes negatively charged.",
                    "It remains neutral but becomes polarized.",
                    "It becomes neutral and unpolarized."
                ],
                correctAnswerIndex: 2
            },
            {
                type: "multiple-choice",
                question: "During induction with grounding and a positively charged rod, what is the final charge on the pith ball?",
                options: [
                    "Neutral",
                    "Positive",
                    "Negative",
                    "Polarized"
                ],
                correctAnswerIndex: 2
            },
            {
                type: "multiple-choice",
                question: "Which of the following statements is true about electron movement?",
                options: [
                    "Electrons move from areas of low electron density to high electron density.",
                    "Electrons move from areas of high electron density to low electron density.",
                    "Protons move from areas of high proton density to low proton density.",
                    "Protons and electrons move equally during charging."
                ],
                correctAnswerIndex: 1
            },
            {
                type: "short-answer",
                question: "Explain the difference between charging by conduction and charging by induction. Use an example for each.",
                expectedKeywords: ["contact", "transfer", "polarization", "redistribution", "proximity", "grounding"]
            },
            {
                type: "short-answer",
                question: "Why does grounding during induction result in a permanent charge on the pith ball?",
                expectedKeywords: ["electrons", "flow", "ground", "earth", "permanent", "opposite"]
            }
        ];

        this.initEventListeners();
        this.loadActivityContent();
        this.loadQuizContent();
    }

    initEventListeners() {
        // Show/hide panel
        this.showPanelBtn.addEventListener('click', () => this.togglePanel(true));
        this.closeBtn.addEventListener('click', () => this.togglePanel(false));
        
        // Tab switching
        this.activityTab.addEventListener('click', () => this.switchTab('activity'));
        this.quizTab.addEventListener('click', () => this.switchTab('quiz'));
        
        // Close panel when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.learningPanel) {
                this.togglePanel(false);
            }
        });
    }

    togglePanel(show) {
        this.learningPanel.style.display = show ? 'flex' : 'none';
    }

    switchTab(tabName) {
        // Remove active class from all tabs and contents
        this.activityTab.classList.remove('active');
        this.quizTab.classList.remove('active');
        this.activityContent.classList.remove('active');
        this.quizContent.classList.remove('active');
        
        // Add active class to selected tab and content
        if (tabName === 'activity') {
            this.activityTab.classList.add('active');
            this.activityContent.classList.add('active');
        } else {
            this.quizTab.classList.add('active');
            this.quizContent.classList.add('active');
        }
    }

    loadActivityContent() {
        // Clear previous content
        this.activityContent.innerHTML = '';
        
        // Create navigation buttons
        const navButtons = document.createElement('div');
        navButtons.className = 'activity-navigation';
        
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous Scenario';
        prevBtn.disabled = this.currentScenario === 0;
        prevBtn.addEventListener('click', () => this.changeScenario(-1));
        
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next Scenario';
        nextBtn.disabled = this.currentScenario === this.scenarios.length - 1;
        nextBtn.addEventListener('click', () => this.changeScenario(1));
        
        navButtons.appendChild(prevBtn);
        navButtons.appendChild(nextBtn);
        
        // Add title and introduction
        const title = document.createElement('h2');
        title.textContent = "Exploring Electrostatic Charging";
        
        const introduction = document.createElement('p');
        introduction.textContent = "Use the simulation to explore each scenario and answer questions about what you observe.";
        
        // Create current scenario
        const currentScenario = this.createScenarioElement(this.scenarios[this.currentScenario]);
        
        // Append all elements to the content
        this.activityContent.appendChild(title);
        this.activityContent.appendChild(introduction);
        this.activityContent.appendChild(navButtons);
        this.activityContent.appendChild(currentScenario);
        
        // Setup simulation for this scenario
        this.setupSimulation(this.scenarios[this.currentScenario].setup);
    }

    createScenarioElement(scenario) {
        const scenarioElement = document.createElement('div');
        scenarioElement.className = 'activity-scenario';
        
        // Create scenario title
        const title = document.createElement('h3');
        title.textContent = scenario.title;
        scenarioElement.appendChild(title);
        
        // Create setup instructions
        const instructions = document.createElement('p');
        instructions.innerHTML = `
            <strong>Setup Instructions:</strong> 
            ${scenario.setup.chargingMode === "conduction" ? "Touch the charged rod to the ball." : "Bring the charged rod near the ball without touching it."} 
            ${scenario.setup.ground ? "Make sure grounding is enabled." : "Make sure grounding is disabled."}
        `;
        scenarioElement.appendChild(instructions);
        
        // Create prediction fields
        const predictionTitle = document.createElement('h4');
        predictionTitle.textContent = "Make Your Predictions";
        scenarioElement.appendChild(predictionTitle);
        
        scenario.questions.forEach(question => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'prediction-field';
            
            const label = document.createElement('label');
            label.setAttribute('for', question.id);
            label.textContent = question.label + ':';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = question.id;
            input.name = question.id;
            
            fieldDiv.appendChild(label);
            fieldDiv.appendChild(input);
            scenarioElement.appendChild(fieldDiv);
        });
        
        // Create observation section
        const observationTitle = document.createElement('h4');
        observationTitle.textContent = "Record Your Observations";
        scenarioElement.appendChild(observationTitle);
        
        const imagesDiv = document.createElement('div');
        imagesDiv.className = 'scenario-images';
        
        const beforeDiv = document.createElement('div');
        beforeDiv.className = 'scenario-image';
        beforeDiv.innerHTML = '<h5>Before</h5><div class="placeholder-image">Use the simulation and draw what you observe here</div>';
        
        const afterDiv = document.createElement('div');
        afterDiv.className = 'scenario-image';
        afterDiv.innerHTML = '<h5>After</h5><div class="placeholder-image">Use the simulation and draw what you observe here</div>';
        
        imagesDiv.appendChild(beforeDiv);
        imagesDiv.appendChild(afterDiv);
        scenarioElement.appendChild(imagesDiv);
        
        // Create conclusion field
        const conclusionDiv = document.createElement('div');
        conclusionDiv.className = 'conclusion-field';
        
        const conclusionLabel = document.createElement('label');
        conclusionLabel.setAttribute('for', 'conclusion-' + scenario.title.replace(/\s/g, '-').toLowerCase());
        conclusionLabel.textContent = 'Conclusion (Was your prediction correct? Explain why or why not):';
        
        const textarea = document.createElement('textarea');
        textarea.id = 'conclusion-' + scenario.title.replace(/\s/g, '-').toLowerCase();
        textarea.rows = 3;
        
        conclusionDiv.appendChild(conclusionLabel);
        conclusionDiv.appendChild(textarea);
        scenarioElement.appendChild(conclusionDiv);
        
        // Create check button
        const checkBtn = document.createElement('button');
        checkBtn.className = 'check-answers-btn';
        checkBtn.textContent = 'Check Your Understanding';
        checkBtn.addEventListener('click', () => this.checkScenarioAnswers(scenario));
        scenarioElement.appendChild(checkBtn);
        
        // Create feedback area
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'answers-feedback';
        feedbackDiv.id = 'feedback-' + scenario.title.replace(/\s/g, '-').toLowerCase();
        scenarioElement.appendChild(feedbackDiv);
        
        return scenarioElement;
    }

    changeScenario(direction) {
        this.currentScenario += direction;
        // Make sure we're within bounds
        if (this.currentScenario < 0) this.currentScenario = 0;
        if (this.currentScenario >= this.scenarios.length) this.currentScenario = this.scenarios.length - 1;
        
        // Reload the activity content
        this.loadActivityContent();
    }

    checkScenarioAnswers(scenario) {
        const feedbackDiv = document.getElementById('feedback-' + scenario.title.replace(/\s/g, '-').toLowerCase());
        let correct = 0;
        let feedback = '';
        
        // Check each question
        scenario.questions.forEach(question => {
            const input = document.getElementById(question.id);
            const userAnswer = input.value.trim().toLowerCase();
            const correctAnswer = question.correctAnswer.toLowerCase();
            
            // Simple check - if the answer contains the correct keywords
            if (userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer)) {
                correct++;
                input.style.borderColor = 'green';
            } else {
                input.style.borderColor = 'red';
            }
        });
        
        // Calculate score and provide feedback
        const score = Math.round((correct / scenario.questions.length) * 100);
        
        if (score === 100) {
            feedback = `<div class="feedback correct">
                <h4>Great job!</h4>
                <p>You have correctly understood the key concepts of this scenario.</p>
                <p>Score: ${score}%</p>
            </div>`;
        } else if (score >= 70) {
            feedback = `<div class="feedback partially-correct">
                <h4>Good work!</h4>
                <p>You have a good understanding of this scenario, but there are a few details to review.</p>
                <p>Score: ${score}%</p>
            </div>`;
        } else {
            feedback = `<div class="feedback incorrect">
                <h4>Keep practicing</h4>
                <p>Let's review the concepts for this scenario. Consider re-running the simulation.</p>
                <p>Score: ${score}%</p>
            </div>`;
        }
        
        feedbackDiv.innerHTML = feedback;
    }

    loadQuizContent() {
        // Clear previous content
        this.quizContent.innerHTML = '';
        
        // Add title
        const title = document.createElement('h2');
        title.textContent = "Electrostatic Charging Quiz";
        
        const introduction = document.createElement('p');
        introduction.textContent = "Answer the following questions based on what you've learned about electrostatic charging through conduction and induction.";
        
        this.quizContent.appendChild(title);
        this.quizContent.appendChild(introduction);
        
        // Create quiz form
        const quizForm = document.createElement('form');
        quizForm.id = 'quiz-form';
        
        this.quizQuestions.forEach((question, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'quiz-question';
            
            const questionTitle = document.createElement('h3');
            questionTitle.textContent = `Question ${index + 1}: ${question.question}`;
            questionElement.appendChild(questionTitle);
            
            if (question.type === "multiple-choice") {
                const optionsDiv = document.createElement('div');
                optionsDiv.className = 'quiz-options';
                
                question.options.forEach((option, optIndex) => {
                    const optionDiv = document.createElement('div');
                    optionDiv.className = 'quiz-option';
                    
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `q${index}`;
                    radio.value = optIndex;
                    radio.id = `q${index}-opt${optIndex}`;
                    
                    const label = document.createElement('label');
                    label.htmlFor = `q${index}-opt${optIndex}`;
                    label.textContent = option;
                    
                    optionDiv.appendChild(radio);
                    optionDiv.appendChild(label);
                    optionsDiv.appendChild(optionDiv);
                });
                
                questionElement.appendChild(optionsDiv);
            } else if (question.type === "short-answer") {
                const answerDiv = document.createElement('div');
                answerDiv.className = 'quiz-short-answer';
                
                const textarea = document.createElement('textarea');
                textarea.id = `q${index}-answer`;
                textarea.name = `q${index}`;
                textarea.rows = 4;
                
                answerDiv.appendChild(textarea);
                questionElement.appendChild(answerDiv);
            }
            
            quizForm.appendChild(questionElement);
        });
        
        // Add submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'button'; // Prevent form submission
        submitBtn.className = 'quiz-submit';
        submitBtn.textContent = 'Submit Quiz';
        submitBtn.addEventListener('click', () => this.gradeQuiz());
        quizForm.appendChild(submitBtn);
        
        // Add feedback div
        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'quiz-feedback';
        feedbackDiv.className = 'quiz-feedback';
        quizForm.appendChild(feedbackDiv);
        
        this.quizContent.appendChild(quizForm);
    }

    gradeQuiz() {
        const feedback = document.getElementById('quiz-feedback');
        let correct = 0;
        let total = this.quizQuestions.length;
        let feedbackText = '';
        
        this.quizQuestions.forEach((question, index) => {
            if (question.type === "multiple-choice") {
                const selected = document.querySelector(`input[name="q${index}"]:checked`);
                if (selected && parseInt(selected.value) === question.correctAnswerIndex) {
                    correct++;
                } else {
                    // Add specific feedback for incorrect answers
                    feedbackText += `<p>Question ${index + 1}: The correct answer is "${question.options[question.correctAnswerIndex]}".</p>`;
                }
            } else if (question.type === "short-answer") {
                const answer = document.getElementById(`q${index}-answer`).value.toLowerCase();
                
                // Check for keywords in the answer
                let foundKeywords = 0;
                question.expectedKeywords.forEach(keyword => {
                    if (answer.includes(keyword.toLowerCase())) {
                        foundKeywords++;
                    }
                });
                
                // If they got at least half the keywords, count as correct
                if (foundKeywords >= question.expectedKeywords.length / 2) {
                    correct++;
                } else {
                    feedbackText += `<p>Question ${index + 1}: Your answer should include concepts like: ${question.expectedKeywords.join(', ')}.</p>`;
                }
            }
        });
        
        const score = Math.round((correct / total) * 100);
        
        if (score >= 90) {
            feedback.className = 'quiz-feedback correct';
            feedback.innerHTML = `
                <h3>Excellent! Score: ${score}%</h3>
                <p>You have a strong understanding of electrostatic charging concepts.</p>
                ${feedbackText}
            `;
        } else if (score >= 70) {
            feedback.className = 'quiz-feedback correct';
            feedback.innerHTML = `
                <h3>Good job! Score: ${score}%</h3>
                <p>You understand most of the key concepts. Review the following:</p>
                ${feedbackText}
            `;
        } else {
            feedback.className = 'quiz-feedback incorrect';
            feedback.innerHTML = `
                <h3>Keep studying. Score: ${score}%</h3>
                <p>You need more practice with these concepts. Review the following:</p>
                ${feedbackText}
            `;
        }
        
        feedback.style.display = 'block';
    }

    setupSimulation(setup) {
        // This function will be implemented by connecting to the existing simulation
        // Get references to UI controls
        const conductionBtn = document.getElementById('conduction-mode');
        const inductionBtn = document.getElementById('induction-mode');
        const noneBtn = document.getElementById('none-mode');
        const rodChargeSlider = document.getElementById('rod-charge-slider');
        const groundToggle = document.getElementById('ground-toggle');
        
        // Set charging mode
        if (setup.chargingMode === 'conduction') {
            conductionBtn.click();
        } else if (setup.chargingMode === 'induction') {
            inductionBtn.click();
        } else {
            noneBtn.click();
        }
        
        // Set rod charge
        rodChargeSlider.value = setup.rodCharge;
        
        // Simulate slider change event to update the model
        const event = new Event('input');
        rodChargeSlider.dispatchEvent(event);
        
        // Set grounding
        if (setup.ground) {
            if (!groundToggle.checked) {
                groundToggle.click();
            }
        } else {
            if (groundToggle.checked) {
                groundToggle.click();
            }
        }

        // Update charge visualization
        const chargeDetails = document.getElementById('charge-details');
        chargeVisualization.style.display = 'block';
        if (setup.chargingMode === 'conduction') {
            chargeDetails.textContent = `Conduction mode: Rod charge = ${setup.rodCharge}, Grounding = ${setup.ground}`;
        } else if (setup.chargingMode === 'induction') {
            chargeDetails.textContent = `Induction mode: Rod charge = ${setup.rodCharge}, Grounding = ${setup.ground}`;
        } else {
            chargeDetails.textContent = 'No charging mode selected.';
        }
    }
}

// Add visual feedback for charge distribution
const chargeVisualization = document.createElement('div');
chargeVisualization.id = 'charge-visualization';
chargeVisualization.style.display = 'none';
chargeVisualization.innerHTML = `
    <div class="charge-info">
        <h4>Charge Distribution</h4>
        <p id="charge-details">No charge data available.</p>
    </div>
`;
this.learningPanel.appendChild(chargeVisualization);

// Initialize the learning panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const learningPanel = new LearningPanel();
});