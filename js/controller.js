/**
 * ElectrostaticsController - Handles user interactions and connects model and view
 * Responsible for event handling and controlling the simulation flow
 */
class ElectrostaticsController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        // Animation frame control
        this.animationFrameId = null;
        this.lastTimestamp = 0;
        this.fpsInterval = 1000 / 60; // Target 60 fps
        
        // Bind event handlers
        this.initEventListeners();
    }
    
    /**
     * Initialize event listeners for UI controls
     */
    initEventListeners() {
        // Radio buttons for charging mode
        const radioButtons = document.querySelectorAll('input[name="charging-mode"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                this.onChargingModeChange(radio.value);
            });
        });
        
        // Charge slider
        const chargeSlider = document.getElementById('charge-slider');
        if (chargeSlider) {
            chargeSlider.addEventListener('input', () => {
                this.onRodChargeChange(chargeSlider.value);
            });
        }
        
        // Ground toggle button
        const groundToggle = document.getElementById('ground-toggle');
        if (groundToggle) {
            groundToggle.addEventListener('click', () => {
                this.onGroundToggle();
            });
        }
        
        // Show charges checkbox
        const showChargesCheckbox = document.getElementById('show-charges');
        if (showChargesCheckbox) {
            showChargesCheckbox.addEventListener('change', () => {
                this.onShowChargesToggle(showChargesCheckbox.checked);
            });
        }
        
        // Show electric field checkbox
        const showFieldCheckbox = document.getElementById('show-field');
        if (showFieldCheckbox) {
            showFieldCheckbox.addEventListener('change', () => {
                this.onShowFieldToggle(showFieldCheckbox.checked);
            });
        }
        
        // Reset button
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.onResetSimulation();
            });
        }
        
        // Explanation button
        const explanationButton = document.getElementById('explanation-button');
        const closeExplanationButton = document.getElementById('close-explanation');
        const explanationPanel = document.getElementById('explanation-panel');
        
        if (explanationButton) {
            explanationButton.addEventListener('click', () => {
                explanationPanel.style.display = 'block';
            });
        }
        
        if (closeExplanationButton) {
            closeExplanationButton.addEventListener('click', () => {
                explanationPanel.style.display = 'none';
            });
        }
    }
    
    /**
     * Handle charging mode change
     * @param {string} mode - "none", "conduction", or "induction"
     */
    onChargingModeChange(mode) {
        this.model.setChargingMode(mode);
    }
    
    /**
     * Handle rod charge slider change
     * @param {string} value - Slider value as string
     */
    onRodChargeChange(value) {
        const charge = parseFloat(value);
        const previousCharge = this.model.rodCharge;

        // Update the rod charge in the model
        this.model.setRodCharge(charge);

        // Recalculate forces to ensure the ball reacts dynamically
        const force = this.model.calculateElectrostaticForce();
        this.model.ballVelocity.x += force.x * this.model.deltaTime;
        this.model.ballVelocity.y += force.y * this.model.deltaTime;

        // Update the view to reflect the changes
        this.view.updateInfoPanel();
    }
    
    /**
     * Toggle grounding of the ball
     */
    onGroundToggle() {
        const newGroundState = !this.model.isGrounded;
        this.model.toggleGround(newGroundState);
        this.view.updateGroundButton(newGroundState);
    }
    
    /**
     * Toggle showing charge symbols
     * @param {boolean} show - Whether to show charges
     */
    onShowChargesToggle(show) {
        this.model.showCharges = show;
    }
    
    /**
     * Toggle showing electric field lines
     * @param {boolean} show - Whether to show field lines
     */
    onShowFieldToggle(show) {
        this.model.showField = show;
    }
    
    /**
     * Handle reset button click
     */
    onResetSimulation() {
        // Call the existing resetSimulation method
        this.resetSimulation();
    }

    /**
     * Reset the simulation to its initial state
     */
    resetSimulation() {
        this.model.reset();
        
        // Reset UI controls to match model state
        document.querySelector('input[name="charging-mode"][value="conduction"]').checked = true;
        document.getElementById('charge-slider').value = 5;
        document.getElementById('ground-toggle').classList.remove('grounded');
        document.getElementById('ground-toggle').textContent = 'Ground Ball';
        document.getElementById('show-charges').checked = true;
        document.getElementById('show-field').checked = false;
        
        // Reset display
        this.model.showCharges = true;
        this.model.showField = false;
        this.model.isGrounded = false;
        
        // Force UI update
        this.view.updateInfoPanel();
    }
    
    /**
     * Update the information panel with distance measurement
     */
    updateDistanceInfo() {
        const distanceValue = document.getElementById('distance-value');
        if (!distanceValue) return;
        
        const rodCenter = {
            x: this.model.rodPos.x + this.model.rodSize.width / 2,
            y: this.model.rodPos.y + this.model.rodSize.height / 2
        };
        
        const distance = this.model.distance(rodCenter, this.model.ballPos);
        // Convert to centimeters for display (assuming 100 pixels = 10 cm)
        const distanceInCm = (distance / 10).toFixed(1);
        distanceValue.textContent = distanceInCm;
    }
    
    /**
     * Animation loop for smooth rendering
     * @param {number} timestamp - Current timestamp
     */
    animate(timestamp) {
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        
        // Calculate elapsed time since last frame
        const elapsed = timestamp - this.lastTimestamp;
        
        // If enough time has passed for target fps
        if (elapsed > this.fpsInterval) {
            // Save last timestamp
            this.lastTimestamp = timestamp - (elapsed % this.fpsInterval);
            
            // Update physics model
            this.model.update();
            
            // Update view
            this.view.render();
            this.view.updateInfoPanel();
            
            // Update distance measurement
            this.updateDistanceInfo();
        }
    }
    
    /**
     * Start the simulation
     */
    start() {
        this.view.initCanvas('simulation-canvas');
        this.view.updateGroundButton(this.model.isGrounded);
        this.view.updateInfoPanel();
        this.animate(0);
    }
    
    /**
     * Stop the simulation
     */
    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}