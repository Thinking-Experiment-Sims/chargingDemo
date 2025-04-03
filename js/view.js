/**
 * ElectrostaticsView - Handles rendering of the simulation
 * Responsible for drawing the rod, ball, and visualizing charge
 */
class ElectrostaticsView {
    constructor(model) {
        this.model = model;
        this.canvas = null;
        this.ctx = null;
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.isDraggingRod = false;
        this.rodImage = null;
        
        // Colors
        this.colors = {
            string: "#888888",
            ball: {
                positive: "rgba(231, 76, 60, 0.5)", // More transparent red
                negative: "rgba(52, 152, 219, 0.5)", // More transparent blue
                neutral: "rgba(236, 240, 241, 0.8)" // Slightly transparent white
            },
            rod: {
                positive: "rgba(231, 76, 60, 0.5)", // More transparent red
                negative: "rgba(52, 152, 219, 0.5)", // More transparent blue
                neutral: "rgba(149, 165, 166, 0.8)" // Slightly transparent gray
            },
            ground: "#27ae60",
            fieldLine: {
                positive: "rgba(231, 76, 60, 0.7)",
                negative: "rgba(52, 152, 219, 0.7)"
            },
            chargeIndicator: {
                positive: "#e74c3c", // Solid red for visibility
                negative: "#3498db" // Solid blue for visibility
            }
        };
        
        // Load rod image
        this.loadRodImage();
    }
    
    /**
     * Load the rod image for better visualization
     */
    loadRodImage() {
        this.rodImage = new Image();
        this.rodImage.src = 'img/rod.png'; // Will use a fallback if image not available
    }
    
    /**
     * Initialize the canvas
     * @param {string} canvasId - ID of the canvas element
     */
    initCanvas(canvasId) {
        const container = document.getElementById(canvasId);
        if (!container) return;
        
        // Create canvas element
        this.canvas = document.createElement('canvas');
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size to match container
        this.resizeCanvas();
        
        // Set up event listeners for interaction
        this.setupEventListeners();
        
        // Handle window resizing
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    /**
     * Resize canvas to match container size
     */
    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        this.canvasWidth = container.clientWidth;
        this.canvasHeight = container.clientHeight;
        
        // Set actual size in memory (scaled to account for extra pixel density)
        const scale = window.devicePixelRatio;
        this.canvas.width = this.canvasWidth * scale;
        this.canvas.height = this.canvasHeight * scale;
        
        // Normalize coordinate system to use CSS pixels
        this.ctx.scale(scale, scale);
        
        // Set the CSS size
        this.canvas.style.width = this.canvasWidth + 'px';
        this.canvas.style.height = this.canvasHeight + 'px';
        
        // Update model's anchor position based on canvas size
        this.model.stringAnchor = {
            x: this.canvasWidth / 2,
            y: 50
        };
        
        // Update ball rest position based on canvas size
        this.model.ballRestPos = {
            x: this.canvasWidth / 2,
            y: this.model.stringAnchor.y + this.model.stringLength
        };
        
        // Reset ball position if it's at rest
        if (Math.abs(this.model.ballVelocity.x) < 0.1 && Math.abs(this.model.ballVelocity.y) < 0.1) {
            this.model.ballPos = { ...this.model.ballRestPos };
        }
    }
    
    /**
     * Set up mouse/touch event listeners for interaction
     */
    setupEventListeners() {
        if (!this.canvas) return;
        
        // Mouse events for dragging rod
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if click is on the rod
            if (this.isPointInRod(x, y)) {
                this.isDraggingRod = true;
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDraggingRod) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Update rod position
            this.model.moveRod(x - this.model.rodSize.width / 2, y - this.model.rodSize.height / 2);
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDraggingRod = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDraggingRod = false;
        });
        
        // Touch events for mobile support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            if (this.isPointInRod(x, y)) {
                this.isDraggingRod = true;
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isDraggingRod) return;
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Update rod position
            this.model.moveRod(x - this.model.rodSize.width / 2, y - this.model.rodSize.height / 2);
        });
        
        this.canvas.addEventListener('touchend', () => {
            this.isDraggingRod = false;
        });
        
        this.canvas.addEventListener('touchcancel', () => {
            this.isDraggingRod = false;
        });
    }
    
    /**
     * Check if a point is inside the rod
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if point is in rod
     */
    isPointInRod(x, y) {
        return (
            x >= this.model.rodPos.x &&
            x <= this.model.rodPos.x + this.model.rodSize.width &&
            y >= this.model.rodPos.y &&
            y <= this.model.rodPos.y + this.model.rodSize.height
        );
    }
    
    /**
     * Get color based on charge
     * @param {number} charge - Charge value
     * @param {Object} colorSet - Set of colors for different charges
     * @returns {string} Color string
     */
    getChargeColor(charge, colorSet) {
        // Use a lower threshold to show color changes earlier
        // and make the colors more saturated for visibility
        if (charge > 0.02) {
            // Increase red opacity based on charge strength
            const opacity = Math.min(0.7, 0.4 + Math.abs(charge) * 0.1);
            return `rgba(231, 76, 60, ${opacity})`;
        }
        if (charge < -0.02) {
            // Increase blue opacity based on charge strength
            const opacity = Math.min(0.7, 0.4 + Math.abs(charge) * 0.1);
            return `rgba(52, 152, 219, ${opacity})`;
        }
        return colorSet.neutral;
    }
    
    /**
     * Draw string connecting ball to anchor
     */
    drawString() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.model.stringAnchor.x, this.model.stringAnchor.y);
        this.ctx.lineTo(this.model.ballPos.x, this.model.ballPos.y);
        this.ctx.strokeStyle = this.colors.string;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    /**
     * Draw the rod with charge indicators
     */
    drawRod() {
        const rodColor = this.getChargeColor(this.model.rodCharge, this.colors.rod);
        
        // Always draw a basic rod shape regardless of image loading
        // This ensures the rod is always visible
        this.ctx.fillStyle = rodColor;
        this.ctx.fillRect(
            this.model.rodPos.x,
            this.model.rodPos.y,
            this.model.rodSize.width,
            this.model.rodSize.height
        );
        
        // Add a border to the rod
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.model.rodPos.x,
            this.model.rodPos.y,
            this.model.rodSize.width,
            this.model.rodSize.height
        );
        
        // Draw charge indicators if enabled
        if (this.model.showCharges) {
            this.drawChargeIndicators(
                this.model.rodPos.x + this.model.rodSize.width / 2,
                this.model.rodPos.y + this.model.rodSize.height / 2,
                this.model.rodCharge
            );
        }
    }
    
    /**
     * Draw the ball with charge visualization
     */
    drawBall() {
        // Get charge distribution information
        const distribution = this.model.getChargeDistribution();
        
        // Clear any previous drawing of the ball to prevent duplication
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';
        
        if (distribution.isDistributed) {
            // Draw ball with separated charges for induction
            // Left half
            this.ctx.beginPath();
            this.ctx.arc(
                this.model.ballPos.x,
                this.model.ballPos.y,
                this.model.ballRadius,
                Math.PI / 2,
                3 * Math.PI / 2
            );
            this.ctx.lineTo(this.model.ballPos.x, this.model.ballPos.y);
            this.ctx.closePath();
            const leftColor = this.getChargeColor(distribution.leftSide, this.colors.ball);
            this.ctx.fillStyle = leftColor;
            this.ctx.fill();
            
            // Right half
            this.ctx.beginPath();
            this.ctx.arc(
                this.model.ballPos.x,
                this.model.ballPos.y,
                this.model.ballRadius,
                -Math.PI / 2,
                Math.PI / 2
            );
            this.ctx.lineTo(this.model.ballPos.x, this.model.ballPos.y);
            this.ctx.closePath();
            const rightColor = this.getChargeColor(distribution.rightSide, this.colors.ball);
            this.ctx.fillStyle = rightColor;
            this.ctx.fill();
        } else {
            // Draw uniformly charged ball
            const ballColor = this.getChargeColor(this.model.ballCharge, this.colors.ball);
            
            this.ctx.beginPath();
            this.ctx.arc(
                this.model.ballPos.x,
                this.model.ballPos.y,
                this.model.ballRadius,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = ballColor;
            this.ctx.fill();
        }
        
        // Draw ball outline
        this.ctx.beginPath();
        this.ctx.arc(
            this.model.ballPos.x,
            this.model.ballPos.y,
            this.model.ballRadius,
            0,
            Math.PI * 2
        );
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Draw charge indicators if enabled
        if (this.model.showCharges) {
            if (distribution.isDistributed) {
                // Draw separate charge indicators for each side
                if (Math.abs(distribution.leftSide) > 0.05) {
                    this.drawChargeIndicators(
                        this.model.ballPos.x - this.model.ballRadius * 0.5,
                        this.model.ballPos.y,
                        distribution.leftSide,
                        0.7  // Scale down the number of indicators
                    );
                }
                
                if (Math.abs(distribution.rightSide) > 0.05) {
                    this.drawChargeIndicators(
                        this.model.ballPos.x + this.model.ballRadius * 0.5,
                        this.model.ballPos.y,
                        distribution.rightSide,
                        0.7  // Scale down the number of indicators
                    );
                }
            } else {
                // Draw normal charge indicators
                this.drawChargeIndicators(
                    this.model.ballPos.x,
                    this.model.ballPos.y,
                    this.model.ballCharge
                );
            }
        }
        
        // Draw ground symbol if grounded
        if (this.model.isGrounded) {
            this.drawGroundSymbol();
        }
        
        // Draw grounding electrons to visualize electron flow
        this.drawGroundingElectrons();
    }
    
    /**
     * Draw ground symbol next to the ball
     */
    drawGroundSymbol() {
        const groundX = this.model.ballPos.x;
        const groundY = this.model.ballPos.y + this.model.ballRadius + 10;
        
        this.ctx.beginPath();
        this.ctx.moveTo(groundX - 15, groundY);
        this.ctx.lineTo(groundX + 15, groundY);
        
        // Draw the three decreasing ground lines
        for (let i = 0; i < 3; i++) {
            const offset = 5 * (i + 1);
            const width = 15 - 5 * i;
            
            this.ctx.moveTo(groundX - width, groundY + offset);
            this.ctx.lineTo(groundX + width, groundY + offset);
        }
        
        this.ctx.strokeStyle = this.colors.ground;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    /**
     * Draw + or - charge indicators
     * @param {number} x - Center X coordinate
     * @param {number} y - Center Y coordinate
     * @param {number} charge - Charge value
     * @param {number} scale - Optional scale factor for number of indicators (default: 1)
     */
    drawChargeIndicators(x, y, charge, scale = 1) {
        if (Math.abs(charge) < 0.05) return; // Don't show if nearly neutral
        
        const numIndicators = Math.min(Math.ceil(Math.abs(charge) * scale), 10);
        const radius = charge > 0 ? 30 : 40; // Radius for laying out indicators
        const isPositive = charge > 0;
        const color = isPositive ? this.colors.chargeIndicator.positive : this.colors.chargeIndicator.negative;
        
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < numIndicators; i++) {
            const angle = (i / numIndicators) * Math.PI * 2;
            const indicatorX = x + radius * Math.cos(angle);
            const indicatorY = y + radius * Math.sin(angle);
            
            if (isPositive) {
                // Draw + symbol
                this.ctx.beginPath();
                this.ctx.moveTo(indicatorX - 5, indicatorY);
                this.ctx.lineTo(indicatorX + 5, indicatorY);
                this.ctx.moveTo(indicatorX, indicatorY - 5);
                this.ctx.lineTo(indicatorX, indicatorY + 5);
                this.ctx.stroke();
            } else {
                // Draw - symbol
                this.ctx.beginPath();
                this.ctx.moveTo(indicatorX - 5, indicatorY);
                this.ctx.lineTo(indicatorX + 5, indicatorY);
                this.ctx.stroke();
            }
        }
    }
    
    /**
     * Draw electric field lines if enabled
     */
    drawElectricField() {
        if (!this.model.showField || this.model.fieldLines.length === 0) return;
        
        this.ctx.lineWidth = 1.5;
        
        for (const line of this.model.fieldLines) {
            const source = line.source === 'rod' ? this.model.rodCharge : this.model.ballCharge;
            const color = source > 0 ? this.colors.fieldLine.positive : this.colors.fieldLine.negative;
            
            this.ctx.beginPath();
            this.ctx.moveTo(line.start.x, line.start.y);
            this.ctx.lineTo(line.end.x, line.end.y);
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
            
            // Draw arrow at the end
            const angle = Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x);
            const arrowLength = 10;
            const arrowAngle = Math.PI / 6; // 30 degrees
            
            this.ctx.beginPath();
            this.ctx.moveTo(line.end.x, line.end.y);
            this.ctx.lineTo(
                line.end.x - arrowLength * Math.cos(angle - arrowAngle),
                line.end.y - arrowLength * Math.sin(angle - arrowAngle)
            );
            this.ctx.moveTo(line.end.x, line.end.y);
            this.ctx.lineTo(
                line.end.x - arrowLength * Math.cos(angle + arrowAngle),
                line.end.y - arrowLength * Math.sin(angle + arrowAngle)
            );
            this.ctx.stroke();
        }
    }
    
    /**
     * Draw instructional hint on how to use the simulation
     */
    drawHint() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Drag the rod to interact with the ball', this.canvasWidth / 2, 20);
    }
    
    /**
     * Clear the canvas
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
    
    /**
     * Render the simulation
     */
    render() {
        if (!this.ctx) return;
        
        this.clearCanvas();
        
        // Draw in correct order for layering
        if (this.model.showField) {
            this.drawElectricField();
        }
        
        this.drawString();
        this.drawRod();
        this.drawBall();
        
        // Draw electrons on top so they're clearly visible
        if (this.model.conductionElectrons && this.model.conductionElectrons.length > 0) {
            this.drawConductionElectrons();
        }
        
        if (this.model.inductionElectrons && this.model.inductionElectrons.length > 0) {
            this.drawInductionElectrons();
        }
        
        this.drawHint();
    }
    
    /**
     * Update the information panel with current physics values
     */
    updateInfoPanel() {
        const rodChargeValue = document.getElementById('rod-charge-value');
        const ballChargeValue = document.getElementById('ball-charge-value');
        const forceValue = document.getElementById('force-value');
        
        if (rodChargeValue) {
            const sign = this.model.rodCharge > 0 ? '+' : '';
            rodChargeValue.textContent = `${sign}${this.model.rodCharge.toFixed(1)}`;
            rodChargeValue.className = this.getChargeClass(this.model.rodCharge);
        }
        
        if (ballChargeValue) {
            const sign = this.model.ballCharge > 0 ? '+' : '';
            ballChargeValue.textContent = `${sign}${this.model.ballCharge.toFixed(2)}`;
            ballChargeValue.className = this.getChargeClass(this.model.ballCharge);
        }
        
        if (forceValue) {
            const force = this.model.getForce();
            forceValue.textContent = force.toExponential(2);
        }
    }
    
    /**
     * Get CSS class based on charge value
     * @param {number} charge - Charge value
     * @returns {string} CSS class name
     */
    getChargeClass(charge) {
        if (charge > 0.05) return 'positive-charge';
        if (charge < -0.05) return 'negative-charge';
        return 'neutral-charge';
    }
    
    /**
     * Update the state of the ground button
     * @param {boolean} isGrounded - Whether the ball is grounded
     */
    updateGroundButton(isGrounded) {
        const button = document.getElementById('ground-toggle');
        if (!button) return;
        
        if (isGrounded) {
            button.classList.add('grounded');
            button.textContent = 'Unground Ball';
        } else {
            button.classList.remove('grounded');
            button.textContent = 'Ground Ball';
        }
    }
    
    /**
     * Draw the grounding electrons to visualize electron flow
     */
    drawGroundingElectrons() {
        if (!this.model.isGrounded || this.model.groundingElectrons.length === 0) return;
        
        // Draw electron symbols
        this.ctx.fillStyle = '#3498db'; // Blue for electrons
        
        for (const electron of this.model.groundingElectrons) {
            // Draw electron as a small blue circle with a minus sign
            this.ctx.beginPath();
            this.ctx.arc(
                electron.pos.x,
                electron.pos.y,
                4, // Electron size
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Draw minus sign inside electron
            this.ctx.beginPath();
            this.ctx.moveTo(electron.pos.x - 2, electron.pos.y);
            this.ctx.lineTo(electron.pos.x + 2, electron.pos.y);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        // Draw a ground wire to make the connection clearer
        this.ctx.beginPath();
        this.ctx.moveTo(this.model.ballPos.x, this.model.ballPos.y + this.model.ballRadius + 10);
        this.ctx.lineTo(this.model.ballPos.x, this.model.ballPos.y + this.model.ballRadius + 40);
        this.ctx.strokeStyle = '#7f8c8d';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    /**
     * Draw the conduction electrons to visualize electron flow during conduction
     */
    drawConductionElectrons() {
        if (!this.model.conductionElectrons || this.model.conductionElectrons.length === 0) return;
        
        // Draw electron symbols
        this.ctx.fillStyle = '#3498db'; // Blue for electrons
        
        for (const electron of this.model.conductionElectrons) {
            // Draw electron as a small blue circle with a minus sign
            this.ctx.beginPath();
            this.ctx.arc(
                electron.pos.x,
                electron.pos.y,
                4, // Electron size
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Draw minus sign inside electron
            this.ctx.beginPath();
            this.ctx.moveTo(electron.pos.x - 2, electron.pos.y);
            this.ctx.lineTo(electron.pos.x + 2, electron.pos.y);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }

    /**
     * Draw the induction electrons to visualize electron flow during induction with grounding
     */
    drawInductionElectrons() {
        if (!this.model.inductionElectrons || this.model.inductionElectrons.length === 0) return;
        
        // Draw electron symbols
        this.ctx.fillStyle = '#3498db'; // Blue for electrons
        
        for (const electron of this.model.inductionElectrons) {
            // Draw electron as a small blue circle with a minus sign
            this.ctx.beginPath();
            this.ctx.arc(
                electron.pos.x,
                electron.pos.y,
                4, // Electron size
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Draw minus sign inside electron
            this.ctx.beginPath();
            this.ctx.moveTo(electron.pos.x - 2, electron.pos.y);
            this.ctx.lineTo(electron.pos.x + 2, electron.pos.y);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }
}