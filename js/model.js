/**
 * ElectrostaticsModel - Core physics simulation model
 * Implements physics of electrostatic interactions between a charged rod and a hanging ball
 */
class ElectrostaticsModel {
    constructor() {
        // Physical constants
        this.k = 9e9; // Coulomb's constant (N·m²/C²)
        this.gravity = 9.8; // Gravity acceleration (m/s²)
        this.ballMass = 0.01; // Ball mass (kg)
        
        // Charges
        this.rodCharge = 5.0; // Initial rod charge (positive)
        this.ballCharge = 0.0; // Initially neutral
        
        // Positions (in simulation coordinates)
        this.rodPos = { x: 100, y: 100 }; // Initial rod position more visible
        this.ballRestPos = { x: 400, y: 250 }; // Ball's position at rest
        this.ballPos = { x: 400, y: 250 }; // Current ball position
        this.stringLength = 150; // Length of hanging string
        this.rodSize = { width: 40, height: 120 }; // Rod dimensions - bigger for visibility
        this.ballRadius = 30; // Ball radius
        
        // Physics state
        this.isGrounded = false;
        this.chargingMode = "none"; // "none", "conduction", "induction"
        this.showCharges = true;
        this.showField = false;
        
        // Internal variables
        this.ballVelocity = { x: 0, y: 0 };
        this.ballAcceleration = { x: 0, y: 0 };
        this.isInContact = false;
        this.chargeTransferRate = 0.1; // Rate of charge transfer during conduction
        this.inducedCharge = 0; // Temporary variable for induction simulation
        
        // Other physics properties
        this.dampingFactor = 0.98; // Damping factor for ball movement
        this.deltaTime = 0.1; // Time step for physics simulation
        
        // Hanging point for the string
        this.stringAnchor = {
            x: this.ballRestPos.x,
            y: this.ballRestPos.y - this.stringLength
        };
        
        // Electric field properties
        this.fieldLines = [];
        
        // For visualizing electron flow during grounding
        this.groundingElectrons = [];
        this.lastGroundingTime = 0;
        this.electronSpeed = 3;
        this.electronSize = 3;
    }
    
    /**
     * Reset the simulation to its initial state
     */
    reset() {
        this.rodCharge = 5.0;
        this.ballCharge = 0.0;
        this.rodPos = { x: 0, y: 100 };
        this.ballPos = { ...this.ballRestPos };
        this.ballVelocity = { x: 0, y: 0 };
        this.isGrounded = false;
        this.chargingMode = "none";
        this.isInContact = false;
        this.inducedCharge = 0;
    }
    
    /**
     * Set the charging mode
     * @param {string} mode - "none", "conduction", or "induction"
     */
    setChargingMode(mode) {
        this.chargingMode = mode;
    }
    
    /**
     * Set the rod charge
     * @param {number} charge - New charge value
     */
    setRodCharge(charge) {
        this.rodCharge = charge;
    }
    
    /**
     * Toggle grounding of the ball
     * @param {boolean} isGrounded - Whether the ball is grounded
     */
    toggleGround(isGrounded) {
        this.isGrounded = isGrounded;
        
        // When grounded, neutralize the ball if in "none" mode
        if (isGrounded && this.chargingMode === "none") {
            this.ballCharge = 0;
        }
    }
    
    /**
     * Move the rod to a new position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    moveRod(x, y) {
        this.rodPos.x = x;
        this.rodPos.y = y;
    }
    
    /**
     * Calculate distance between two points
     * @param {Object} p1 - First point {x, y}
     * @param {Object} p2 - Second point {x, y}
     * @returns {number} Distance between points
     */
    distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    
    /**
     * Check if the rod and ball are in contact
     * @returns {boolean} True if in contact
     */
    checkContact() {
        const rodCenter = {
            x: this.rodPos.x + this.rodSize.width / 2,
            y: this.rodPos.y + this.rodSize.height / 2
        };
        
        return this.distance(rodCenter, this.ballPos) < (this.ballRadius + Math.max(this.rodSize.width, this.rodSize.height) / 2);
    }
    
    /**
     * Handle charge transfer for conduction
     */
    handleConduction() {
        if (this.chargingMode !== "conduction" || !this.isInContact) return;
        
        // Visualize charge transfer as electrons moving
        if (!this.conductionElectrons) {
            this.conductionElectrons = [];
        }
        
        // Direction of electron flow depends on rod charge
        // If rod is positive, electrons flow FROM ball TO rod
        const electronFlowDirection = this.rodCharge > 0 ? -1 : 1;
        
        // Calculate how much charge to transfer
        // The transfer amount is proportional to the difference in charge density
        const chargeTransferAmount = 0.05 * Math.sign(this.rodCharge);
        
        // Add electrons visualization if charge is transferring
        if (Math.abs(this.rodCharge) > 0.1 && Date.now() - (this.lastConductionElectronTime || 0) > 100) {
            this.lastConductionElectronTime = Date.now();
            this.addConductionElectron(electronFlowDirection);
            
            // Update charges
            // For positive rod: electrons leave ball (ball becomes more positive)
            // For negative rod: electrons enter ball (ball becomes more negative)
            this.ballCharge += chargeTransferAmount;
            this.rodCharge -= chargeTransferAmount * 0.2; // Rod loses less charge due to its larger size
        }
        
        // Update conduction electrons
        this.updateConductionElectrons();
    }
    
    /**
     * Add a new electron for visualizing conduction
     * @param {number} direction - 1 for electron flowing from rod to ball, -1 for ball to rod
     */
    addConductionElectron(direction) {
        if (!this.conductionElectrons) {
            this.conductionElectrons = [];
        }
        
        const rodCenter = {
            x: this.rodPos.x + this.rodSize.width / 2,
            y: this.rodPos.y + this.rodSize.height / 2
        };
        
        let startPos, endPos;
        
        if (direction > 0) {
            // Electron flowing from rod to ball (when rod has excess negative charge)
            startPos = { ...rodCenter };
            endPos = { ...this.ballPos };
        } else {
            // Electron flowing from ball to rod (when rod has excess positive charge)
            startPos = { ...this.ballPos };
            endPos = { ...rodCenter };
        }
        
        this.conductionElectrons.push({
            pos: { ...startPos },
            target: { ...endPos },
            progress: 0,
            direction: direction
        });
    }
    
    /**
     * Update the positions of all conduction electrons
     */
    updateConductionElectrons() {
        if (!this.conductionElectrons) return;
        
        // Update rod center position for moving target
        const rodCenter = {
            x: this.rodPos.x + this.rodSize.width / 2,
            y: this.rodPos.y + this.rodSize.height / 2
        };
        
        // Update each electron's position based on progress
        for (let i = this.conductionElectrons.length - 1; i >= 0; i--) {
            const electron = this.conductionElectrons[i];
            electron.progress += 0.04; // Faster movement for conduction
            
            // Update target position if rod is moving
            if (electron.direction < 0) { // Ball to rod
                electron.target = { ...rodCenter };
            }
            
            // Linear interpolation between start and target
            electron.pos.x = (1 - electron.progress) * electron.pos.x + electron.progress * electron.target.x;
            electron.pos.y = (1 - electron.progress) * electron.pos.y + electron.progress * electron.target.y;
            
            // Remove electrons that have completed their journey
            if (electron.progress >= 1) {
                this.conductionElectrons.splice(i, 1);
            }
        }
        
        // Clear electrons when not in contact anymore
        if (!this.isInContact) {
            this.conductionElectrons = [];
        }
    }
    
    /**
     * Calculate the electrostatic force between rod and ball
     * @returns {Object} Force vector {x, y}
     */
    calculateElectrostaticForce() {
        // No force if both charges are zero
        if (this.rodCharge === 0 || (this.ballCharge === 0 && !this.isInContact && this.chargingMode !== "induction")) {
            return { x: 0, y: 0 };
        }
        
        const rodCenter = {
            x: this.rodPos.x + this.rodSize.width / 2,
            y: this.rodPos.y + this.rodSize.height / 2
        };
        
        const dist = this.distance(rodCenter, this.ballPos);
        const distSquared = Math.pow(dist, 2);
        
        // Determine effective charge for force calculation
        let effectiveBallCharge = this.ballCharge;
        
        // For induction, use induced charge for force calculation
        if (this.chargingMode === "induction" && !this.isInContact) {
            // In induction, there's always attraction regardless of the rod's charge
            // This is because opposite charges are induced on the near side of the ball
            this.inducedCharge = -this.rodCharge * 0.5 * (1 / (1 + dist/100));
            
            // If grounded, the ball can get an opposite charge through induction
            if (this.isGrounded) {
                effectiveBallCharge = -this.rodCharge * 0.3 * (1 / (1 + dist/100));
            } else {
                // For non-grounded induction, polarization creates attraction
                // The induced charge is always opposite to the rod charge
                effectiveBallCharge = this.inducedCharge;
            }
        } else if (this.chargingMode === "conduction") {
            // For conduction, use actual ball charge
            effectiveBallCharge = this.ballCharge;
            
            // If charges have same sign and are large enough, ensure proper repulsion
            if (this.rodCharge * this.ballCharge > 0 && Math.abs(this.ballCharge) > 0.1) {
                // Calculate repulsive force based on Coulomb's law
                // Use a lower value for conduction to prevent excessive movement
                const forceMagnitude = Math.min(
                    0.5, // Maximum force allowed for repulsion during conduction
                    this.k * Math.abs(this.rodCharge * this.ballCharge) / distSquared
                );
                
                // Direction away from rod (repulsion)
                const dx = this.ballPos.x - rodCenter.x;
                const dy = this.ballPos.y - rodCenter.y;
                const normalizationFactor = dist === 0 ? 0 : dist;
                
                return {
                    x: forceMagnitude * dx / normalizationFactor,
                    y: forceMagnitude * dy / normalizationFactor
                };
            }
        }
        
        // Force magnitude using Coulomb's law
        // Apply a force limit to prevent excessive movement
        const maxForceMagnitude = 1.0;
        const forceMagnitude = Math.min(
            maxForceMagnitude,
            this.k * Math.abs(this.rodCharge * effectiveBallCharge) / distSquared
        );
        
        // Direction of force
        // In induction (without grounding), always attract regardless of rod charge
        let direction;
        if (this.chargingMode === "induction" && !this.isGrounded && !this.isInContact) {
            direction = 1; // Always attract in induction mode (opposite charges facing each other)
        } else {
            // Normal Coulomb's law direction - like charges repel, unlike attract
            direction = (this.rodCharge * effectiveBallCharge > 0) ? -1 : 1;
        }
        
        // Calculate force components
        const dx = this.ballPos.x - rodCenter.x;
        const dy = this.ballPos.y - rodCenter.y;
        const normalizationFactor = dist === 0 ? 0 : dist;
        
        // Return force vector
        return {
            x: direction * forceMagnitude * dx / normalizationFactor,
            y: direction * forceMagnitude * dy / normalizationFactor
        };
    }
    
    /**
     * Handle charge effects for induction
     */
    handleInduction() {
        if (this.chargingMode !== "induction") return;
        
        const rodCenter = {
            x: this.rodPos.x + this.rodSize.width / 2,
            y: this.rodPos.y + this.rodSize.height / 2
        };
        
        const dist = this.distance(rodCenter, this.ballPos);
        
        // Initialize induction electrons array if needed
        if (!this.inductionElectrons) {
            this.inductionElectrons = [];
        }
        
        if (this.isInContact) {
            // If touching during induction, behave like conduction
            // This is handled in handleConduction method
        } else if (this.isGrounded) {
            // When grounded but not touching, ball acquires opposite charge to the rod
            const now = Date.now();
            
            if (now - (this.lastInductionElectronTime || 0) > 100) {
                this.lastInductionElectronTime = now;
                
                // Direction of electron flow depends on rod charge:
                // - Positive rod: electrons flow FROM ground TO ball
                // - Negative rod: electrons flow FROM ball TO ground
                const electronFlowDirection = this.rodCharge > 0 ? 1 : -1;
                
                // Add electron visualization
                this.addInductionElectron(electronFlowDirection);
                
                // Update ball charge (ball acquires charge opposite to rod)
                const inductionRate = 0.03;
                const targetCharge = -Math.sign(this.rodCharge) * Math.min(Math.abs(this.rodCharge) * 0.3, 3.0);
                this.ballCharge += (targetCharge - this.ballCharge) * inductionRate;
            }
            
            // Update induction electrons
            this.updateInductionElectrons();
        } else {
            // When not grounded, no net charge change, only polarization
            // This is handled in getChargeDistribution
        }
    }
    
    /**
     * Add a new electron for visualizing induction charging
     * @param {number} direction - 1 for electron flowing from ground to ball, -1 for ball to ground
     */
    addInductionElectron(direction) {
        if (!this.inductionElectrons) {
            this.inductionElectrons = [];
        }
        
        const groundY = this.ballPos.y + this.ballRadius + 30; // Position below the ball
        let startPos, endPos;
        
        if (direction > 0) {
            // Electron flowing from ground into ball (positive rod inducing negative charge)
            startPos = { x: this.ballPos.x, y: groundY + 30 };
            endPos = { x: this.ballPos.x, y: this.ballPos.y };
        } else {
            // Electron flowing from ball to ground (negative rod inducing positive charge)
            startPos = { x: this.ballPos.x, y: this.ballPos.y };
            endPos = { x: this.ballPos.x, y: groundY + 30 };
        }
        
        this.inductionElectrons.push({
            pos: { ...startPos },
            target: { ...endPos },
            progress: 0,
            direction: direction
        });
    }
    
    /**
     * Update the positions of all induction electrons
     */
    updateInductionElectrons() {
        if (!this.inductionElectrons) return;
        
        // Update each electron's position based on progress
        for (let i = this.inductionElectrons.length - 1; i >= 0; i--) {
            const electron = this.inductionElectrons[i];
            electron.progress += 0.03;
            
            // Update position based on progress (0 to 1)
            electron.pos.x = (1 - electron.progress) * electron.pos.x + electron.progress * electron.target.x;
            electron.pos.y = (1 - electron.progress) * electron.pos.y + electron.progress * electron.target.y;
            
            // Remove electrons that have completed their journey
            if (electron.progress >= 1) {
                this.inductionElectrons.splice(i, 1);
            }
        }
        
        // Clear electrons if no longer in induction mode or not grounded
        if (this.chargingMode !== "induction" || !this.isGrounded) {
            this.inductionElectrons = [];
        }
    }
    
    /**
     * Handle grounding effects
     */
    handleGrounding() {
        // If grounded, neutralize charge over time
        if (this.isGrounded) {
            const now = Date.now();
            
            // If the ball has a significant charge, show electrons flowing
            if (Math.abs(this.ballCharge) > 0.05) {
                if (now - this.lastGroundingTime > 50) { // Add electron more frequently for visible effect
                    this.lastGroundingTime = now;
                    
                    // Direction: electrons flow INTO ball if ball is positive, OUT OF ball if negative
                    const electronDirection = this.ballCharge > 0 ? 1 : -1;
                    this.addGroundingElectron(electronDirection);
                    
                    // Gradually neutralize ball charge (electrons flowing in decrease positive charge)
                    const neutralizationRate = 0.03; // Faster neutralization
                    this.ballCharge -= electronDirection * neutralizationRate;
                    
                    // If charge is very small, just make it zero
                    if (Math.abs(this.ballCharge) < 0.05) {
                        this.ballCharge = 0;
                    }
                }
            }
            // For induction with grounding
            else if (this.chargingMode === "induction" && Math.abs(this.rodCharge) > 0.5) {
                if (now - this.lastGroundingTime > 100) {
                    this.lastGroundingTime = now;
                    
                    // With a positive rod, electrons leave the ball (positive charge develops)
                    // With a negative rod, electrons enter the ball (negative charge develops)
                    const electronDirection = this.rodCharge > 0 ? -1 : 1;
                    this.addGroundingElectron(electronDirection);
                    
                    // Update ball charge based on rod proximity
                    const rodCenter = {
                        x: this.rodPos.x + this.rodSize.width / 2,
                        y: this.rodPos.y + this.rodSize.height / 2
                    };
                    const dist = this.distance(rodCenter, this.ballPos);
                    const proximityFactor = 300 / (dist + 100); // Stronger effect when closer
                    
                    // Gradually develop opposite charge relative to rod
                    const inductionRate = 0.02 * proximityFactor;
                    const targetCharge = -Math.sign(this.rodCharge) * Math.min(Math.abs(this.rodCharge) * 0.3, 3.0);
                    
                    this.ballCharge += (targetCharge - this.ballCharge) * inductionRate;
                }
            }
            
            // Update existing electrons
            this.updateGroundingElectrons();
        } else {
            // Clear electrons when not grounded
            this.groundingElectrons = [];
        }
    }
    
    /**
     * Add a new electron for visualizing grounding
     * @param {number} direction - 1 for electron flowing in, -1 for electron flowing out
     */
    addGroundingElectron(direction) {
        const groundY = this.ballPos.y + this.ballRadius + 30; // Position below the ball
        let startPos, endPos;
        
        if (direction > 0) {
            // Electron flowing from ground into ball (when ball has positive charge)
            startPos = { x: this.ballPos.x, y: groundY + 30 };
            endPos = { x: this.ballPos.x, y: this.ballPos.y };
        } else {
            // Electron flowing from ball to ground (when ball has negative charge)
            startPos = { x: this.ballPos.x, y: this.ballPos.y };
            endPos = { x: this.ballPos.x, y: groundY + 30 };
        }
        
        this.groundingElectrons.push({
            pos: { ...startPos },
            target: { ...endPos },
            progress: 0,
            direction: direction
        });
    }
    
    /**
     * Update the positions of all grounding electrons
     */
    updateGroundingElectrons() {
        // Update each electron's position based on progress
        for (let i = this.groundingElectrons.length - 1; i >= 0; i--) {
            const electron = this.groundingElectrons[i];
            electron.progress += 0.02;
            
            // Update position based on progress (0 to 1)
            electron.pos.x = electron.target.x * electron.progress + 
                             (1 - electron.progress) * (this.ballPos.x);
            electron.pos.y = electron.target.y * electron.progress + 
                             (1 - electron.progress) * (electron.direction > 0 ? 
                                                       (this.ballPos.y + this.ballRadius + 30) : 
                                                       this.ballPos.y);
            
            // Remove electrons that have completed their journey
            if (electron.progress >= 1) {
                this.groundingElectrons.splice(i, 1);
            }
        }
    }
    
    /**
     * Calculate total force on ball, including string constraint
     */
    calculateTotalForce() {
        // Electrostatic force
        const electrostaticForce = this.calculateElectrostaticForce();
        
        // Gravity (simplified to y component only)
        const gravityForce = {
            x: 0,
            y: this.ballMass * this.gravity * 0.1 // Scaled for simulation visibility
        };
        
        // String tension force (keeps ball at string length from anchor)
        const dx = this.ballPos.x - this.stringAnchor.x;
        const dy = this.ballPos.y - this.stringAnchor.y;
        const distToAnchor = Math.sqrt(dx * dx + dy * dy);
        let tensionForce = { x: 0, y: 0 };
        
        if (distToAnchor > 0) {
            const displacement = distToAnchor - this.stringLength;
            if (displacement > 0) {
                // String is stretched, apply restoring force
                const tensionMagnitude = displacement * 0.8; // Spring constant
                tensionForce = {
                    x: -tensionMagnitude * dx / distToAnchor,
                    y: -tensionMagnitude * dy / distToAnchor
                };
            }
        }
        
        // Sum all forces
        return {
            x: electrostaticForce.x + tensionForce.x,
            y: electrostaticForce.y + tensionForce.y + gravityForce.y
        };
    }
    
    /**
     * Update the ball's position and velocity based on physics
     */
    updateBallPhysics() {
        // Calculate total force
        const force = this.calculateTotalForce();
        
        // If in "none" mode with minimal force, stabilize the ball to prevent oscillation
        if (this.chargingMode === "none") {
            const forceMagnitude = Math.sqrt(force.x * force.x + force.y * force.y);
            if (forceMagnitude < 0.05) {
                // Apply extra damping to quickly bring ball to rest
                this.ballVelocity.x *= 0.7;
                this.ballVelocity.y *= 0.7;
                
                // If velocity is very low, just stop the ball completely
                if (Math.abs(this.ballVelocity.x) < 0.01 && Math.abs(this.ballVelocity.y) < 0.01) {
                    this.ballVelocity = { x: 0, y: 0 };
                    
                    // Gradually move ball back to rest position
                    const restDx = this.ballRestPos.x - this.ballPos.x;
                    const restDy = this.ballRestPos.y - this.ballPos.y;
                    const restDist = Math.sqrt(restDx * restDx + restDy * restDy);
                    
                    if (restDist > 1) {
                        this.ballPos.x += restDx * 0.05;
                        this.ballPos.y += restDy * 0.05;
                    } else {
                        // Snap to rest position
                        this.ballPos = { ...this.ballRestPos };
                    }
                    
                    // Skip the rest of the physics update
                    return;
                }
            }
        }
        
        // Limit the maximum force in induction mode to prevent excessive movement
        if (this.chargingMode === "induction") {
            const maxForce = 1.0; // Maximum allowed force magnitude during induction
            const forceMagnitude = Math.sqrt(force.x * force.x + force.y * force.y);
            
            if (forceMagnitude > maxForce) {
                const scaleFactor = maxForce / forceMagnitude;
                force.x *= scaleFactor;
                force.y *= scaleFactor;
            }
        }
        
        // F = ma, so a = F/m
        this.ballAcceleration = {
            x: force.x / this.ballMass,
            y: force.y / this.ballMass
        };
        
        // Update velocity: v = v0 + a*t
        this.ballVelocity.x += this.ballAcceleration.x * this.deltaTime;
        this.ballVelocity.y += this.ballAcceleration.y * this.deltaTime;
        
        // Apply damping
        this.ballVelocity.x *= this.dampingFactor;
        this.ballVelocity.y *= this.dampingFactor;
        
        // Apply additional damping in induction mode
        if (this.chargingMode === "induction") {
            this.ballVelocity.x *= 0.9;
            this.ballVelocity.y *= 0.9;
        }
        
        // Update position: p = p0 + v*t
        this.ballPos.x += this.ballVelocity.x * this.deltaTime;
        this.ballPos.y += this.ballVelocity.y * this.deltaTime;
        
        // Enforce string constraint
        const dx = this.ballPos.x - this.stringAnchor.x;
        const dy = this.ballPos.y - this.stringAnchor.y;
        const distToAnchor = Math.sqrt(dx * dx + dy * dy);
        
        if (distToAnchor > this.stringLength) {
            const angle = Math.atan2(dy, dx);
            this.ballPos.x = this.stringAnchor.x + this.stringLength * Math.cos(angle);
            this.ballPos.y = this.stringAnchor.y + this.stringLength * Math.sin(angle);
            
            // Adjust velocity to be tangential to the swing arc
            const normalX = dx / distToAnchor;
            const normalY = dy / distToAnchor;
            const dotProduct = this.ballVelocity.x * normalX + this.ballVelocity.y * normalY;
            
            this.ballVelocity.x -= dotProduct * normalX;
            this.ballVelocity.y -= dotProduct * normalY;
        }
        
        // Limit maximum oscillation angle to -40 degrees with horizontal
        // Calculate current angle in degrees (0 is straight down)
        const currentAngle = Math.atan2(dx, -dy) * (180 / Math.PI);
        const maxAngle = 40;  // Maximum allowed angle in degrees
        
        // If angle exceeds max, adjust position to max angle
        if (Math.abs(currentAngle) > maxAngle) {
            // Determine sign of the angle (left or right)
            const angleSign = currentAngle > 0 ? 1 : -1;
            // Convert max angle to radians with correct sign
            const maxAngleRad = angleSign * maxAngle * (Math.PI / 180);
            
            // Set ball position at maximum allowed angle
            this.ballPos.x = this.stringAnchor.x + Math.sin(maxAngleRad) * this.stringLength;
            this.ballPos.y = this.stringAnchor.y + Math.cos(maxAngleRad) * this.stringLength;
            
            // Reduce horizontal velocity to prevent bouncing at the limits
            this.ballVelocity.x *= 0.7;
        }
        
        // Prevent ball from going too high by applying a soft ceiling limit
        const maxYDisplacement = -this.stringLength * 0.8; // Maximum upward displacement (80% of string)
        if (dy < maxYDisplacement) {
            this.ballPos.y = this.stringAnchor.y + maxYDisplacement;
            this.ballVelocity.y = Math.max(0, this.ballVelocity.y); // Stop upward velocity
        }
        
        // Add a centering force to keep the ball within view horizontally
        const centerX = window.innerWidth / 2;
        const horizontalDisplacement = this.ballPos.x - centerX;
        
        if (Math.abs(horizontalDisplacement) > 200) {
            // Apply a gentle centering force proportional to displacement
            const centeringForce = -horizontalDisplacement * 0.0005;
            this.ballVelocity.x += centeringForce;
        }
    }
    
    /**
     * Generate electric field lines for visualization
     */
    generateElectricField() {
        this.fieldLines = [];
        
        if (this.rodCharge === 0 && this.ballCharge === 0) return;
        
        // Simple implementation - just show field direction based on charges
        // A more sophisticated implementation would calculate actual field vectors
        const rodCenter = {
            x: this.rodPos.x + this.rodSize.width / 2,
            y: this.rodPos.y + this.rodSize.height / 2
        };
        
        // Generate lines from rod
        if (this.rodCharge !== 0) {
            const lineCount = Math.min(Math.abs(this.rodCharge) * 2, 20);
            const angleStep = (2 * Math.PI) / lineCount;
            
            for (let i = 0; i < lineCount; i++) {
                const angle = i * angleStep;
                const direction = this.rodCharge > 0 ? 1 : -1;
                
                this.fieldLines.push({
                    start: { ...rodCenter },
                    end: {
                        x: rodCenter.x + direction * 50 * Math.cos(angle),
                        y: rodCenter.y + direction * 50 * Math.sin(angle)
                    },
                    source: 'rod'
                });
            }
        }
        
        // Generate lines from ball if charged
        if (this.ballCharge !== 0) {
            const lineCount = Math.min(Math.abs(this.ballCharge) * 3, 12);
            const angleStep = (2 * Math.PI) / lineCount;
            
            for (let i = 0; i < lineCount; i++) {
                const angle = i * angleStep;
                const direction = this.ballCharge > 0 ? 1 : -1;
                
                this.fieldLines.push({
                    start: { ...this.ballPos },
                    end: {
                        x: this.ballPos.x + direction * 40 * Math.cos(angle),
                        y: this.ballPos.y + direction * 40 * Math.sin(angle)
                    },
                    source: 'ball'
                });
            }
        }
    }
    
    /**
     * Calculate charge distribution inside the ball (for visualization)
     * Separates the ball into left and right sides when in induction mode
     * @returns {Object} Charge distribution object with left and right side charges
     */
    getChargeDistribution() {
        // Create distribution object
        const distribution = {
            leftSide: this.ballCharge / 2,  // Left half of ball
            rightSide: this.ballCharge / 2, // Right half of ball
            isDistributed: false            // Whether charge is unevenly distributed
        };
        
        // Only show charge distribution in induction mode and when not in contact
        // This prevents flickering during conduction
        if (this.chargingMode === "induction" && !this.isInContact) {
            const rodCenter = {
                x: this.rodPos.x + this.rodSize.width / 2,
                y: this.rodPos.y + this.rodSize.height / 2
            };
            
            // Determine which side of the ball is closer to the rod
            const isRodLeftOfBall = rodCenter.x < this.ballPos.x;
            const dist = this.distance(rodCenter, this.ballPos);
            
            // Only show charge separation if the rod is close enough
            if (dist < 200) {
                const inductionStrength = Math.min(1.0, 150 / dist); // Stronger when closer
                const separationAmount = this.rodCharge * inductionStrength * 0.5;
                
                if (isRodLeftOfBall) {
                    // Rod is on the left side of the ball
                    distribution.leftSide = -separationAmount;  // Opposite charge of rod
                    distribution.rightSide = separationAmount;  // Same charge as rod
                } else {
                    // Rod is on the right side of the ball
                    distribution.leftSide = separationAmount;   // Same charge as rod
                    distribution.rightSide = -separationAmount; // Opposite charge of rod
                }
                
                distribution.isDistributed = true;
            }
        }
        
        return distribution;
    }
    
    /**
     * Update the simulation state for a new frame
     */
    update() {
        this.isInContact = this.checkContact();
        
        // Handle charging based on mode
        this.handleConduction();
        this.handleInduction();
        this.handleGrounding();
        
        // Update ball physics
        this.updateBallPhysics();
        
        // Generate electric field if needed
        if (this.showField) {
            this.generateElectricField();
        }
    }
    
    /**
     * Get the magnitude of the current electrostatic force
     * @returns {number} Force magnitude
     */
    getForce() {
        const force = this.calculateElectrostaticForce();
        return Math.sqrt(force.x * force.x + force.y * force.y);
    }
}