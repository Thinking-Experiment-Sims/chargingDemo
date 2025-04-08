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
        
        // Other physics properties - adjusted for smoother motion
        this.dampingFactor = 0.995; // Increased for less damping = smoother swinging
        this.deltaTime = 0.05; // Reduced for finer time steps
        
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
        // Reset all charges
        this.rodCharge = 5.0;
        this.ballCharge = 0.0;
        
        // Reset positions
        this.rodPos = { x: 100, y: 100 };
        this.ballPos = { ...this.ballRestPos };
        this.ballVelocity = { x: 0, y: 0 };
        
        // Reset states
        this.isGrounded = false;
        this.chargingMode = "none";
        this.isInContact = false;
        this.inducedCharge = 0;
        
        // Clear all electron visualizations
        this.groundingElectrons = [];
        this.lastGroundingTime = 0;
        
        if (this.conductionElectrons) {
            this.conductionElectrons = [];
        }
        
        if (this.inductionElectrons) {
            this.inductionElectrons = [];
        }
        
        // Reset any force calculations
        this.fieldLines = [];
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
        const oldCharge = this.rodCharge;
        this.rodCharge = charge;
        
        // Apply an immediate force if the ball is charged
        // This ensures the ball reacts to rod charge changes via the slider
        if (Math.abs(this.ballCharge) > 0.1) {
            const rodCenter = {
                x: this.rodPos.x + this.rodSize.width / 2,
                y: this.rodPos.y + this.rodSize.height / 2
            };
            
            const dx = this.ballPos.x - rodCenter.x;
            const dy = this.ballPos.y - rodCenter.y;
            const dist = this.distance(rodCenter, this.ballPos);
            
            if (dist > 0) {
                // Set direction based on charge signs (like charges repel, unlike attract)
                const sameSign = (charge * this.ballCharge > 0);
                const directionFactor = sameSign ? 1 : -1; // 1 for repulsion, -1 for attraction
                
                // Force magnitude is proportional to the rod charge
                const forceMagnitude = Math.min(4.0, Math.abs(charge) * 0.8);
                
                // Add an immediate velocity to show reaction to charge change
                this.ballVelocity.x += directionFactor * (dx / dist) * forceMagnitude;
                this.ballVelocity.y += directionFactor * (dy / dist) * forceMagnitude;
            }
        }
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
        // Treat the rod as a rectangle and the ball as a circle
        // Find the closest point on the rectangle to the circle center
        const closestX = Math.max(this.rodPos.x, Math.min(this.ballPos.x, this.rodPos.x + this.rodSize.width));
        const closestY = Math.max(this.rodPos.y, Math.min(this.ballPos.y, this.rodPos.y + this.rodSize.height));
        
        // Calculate distance between the closest point and the ball center
        const distX = this.ballPos.x - closestX;
        const distY = this.ballPos.y - closestY;
        const distSquared = distX * distX + distY * distY;
        
        // Check for collision (if distance is less than ball radius)
        if (distSquared < this.ballRadius * this.ballRadius) {
            // Calculate penetration depth
            const dist = Math.sqrt(distSquared);
            const overlap = this.ballRadius - dist;
            
            if (dist > 0) {
                // Calculate normal vector
                const nx = distX / dist;
                const ny = distY / dist;
                
                // Push ball out to prevent overlap
                this.ballPos.x += nx * overlap * 1.1;
                this.ballPos.y += ny * overlap * 1.1;
                
                // Add velocity to simulate collision
                this.ballVelocity.x += nx * 2.0;
                this.ballVelocity.y += ny * 2.0;
            } else {
                // Fallback if ball is exactly at closest point
                this.ballPos.x += this.ballRadius;
                this.ballPos.y += this.ballRadius;
            }
            
            return true;
        }
        
        return false;
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

        // Calculate how much charge to transfer - faster for demo purposes
        const chargeTransferAmount = 0.5 * Math.sign(this.rodCharge);

        // Add electrons visualization if charge is transferring
        if (Math.abs(this.rodCharge) > 0.1 && Date.now() - (this.lastConductionElectronTime || 0) > 50) {
            this.lastConductionElectronTime = Date.now();
            this.addConductionElectron(electronFlowDirection);

            // Update charges
            this.ballCharge += chargeTransferAmount;
            this.rodCharge -= chargeTransferAmount * 0.1; // Rod loses less charge due to its larger size

            // Stop transferring when ball has acquired significant same-sign charge
            if (this.rodCharge * this.ballCharge > 0 && Math.abs(this.ballCharge) > 1.0) {
                this.isInContact = false; // Stop further charge transfer

                // Apply a strong repulsive force
                const rodCenter = {
                    x: this.rodPos.x + this.rodSize.width / 2,
                    y: this.rodPos.y + this.rodSize.height / 2
                };

                const dx = this.ballPos.x - rodCenter.x;
                const dy = this.ballPos.y - rodCenter.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    // Add repulsive impulse
                    this.ballVelocity.x += (dx / dist) * 3.0; // Stronger repulsion
                    this.ballVelocity.y += (dy / dist) * 3.0;
                }
            }
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
        if (this.rodCharge === 0 && this.ballCharge === 0 && !this.isInContact) {
            return { x: 0, y: 0 };
        }
        
        const rodCenter = {
            x: this.rodPos.x + this.rodSize.width / 2,
            y: this.rodPos.y + this.rodSize.height / 2
        };
        
        const dist = this.distance(rodCenter, this.ballPos);
        const distSquared = Math.pow(dist, 2);
        
        // CASE 1: Contact or just after contact - apply immediate force
        if (this.isInContact || dist < this.ballRadius * 1.5 + this.rodSize.width / 2) {
            // Force direction depends on the charges
            const sameSign = (this.rodCharge * this.ballCharge > 0);
            let forceMagnitude;
            let dx, dy;
            
            if (sameSign && Math.abs(this.ballCharge) > 0.1) {
                // Strong repulsion for same sign charges
                forceMagnitude = 5.0;
                dx = this.ballPos.x - rodCenter.x;
                dy = this.ballPos.y - rodCenter.y;
            } else {
                // Attraction for opposite charges or neutral ball
                forceMagnitude = 2.0;
                dx = rodCenter.x - this.ballPos.x;
                dy = rodCenter.y - this.ballPos.y;
            }
            
            const normalizationFactor = dist === 0 ? 1 : dist;
            
            return {
                x: forceMagnitude * dx / normalizationFactor,
                y: forceMagnitude * dy / normalizationFactor
            };
        }
        
        // CASE 2: Polarization effect - ball should be attracted to rod
        if (!this.isInContact && Math.abs(this.ballCharge) < 0.1) {
            // Similar to induction - ball is attracted to rod through polarization
            const inductionStrength = Math.min(1.5, 150 / dist); // Stronger when closer
            const forceMagnitude = Math.abs(this.rodCharge) * inductionStrength * 0.5;
            
            // Direction is always toward rod (attractive) before contact due to polarization
            const dx = rodCenter.x - this.ballPos.x;
            const dy = rodCenter.y - this.ballPos.y;
            const normalizationFactor = dist === 0 ? 1 : dist;
            
            return {
                x: forceMagnitude * dx / normalizationFactor,
                y: forceMagnitude * dy / normalizationFactor
            };
        }
        
        // CASE 3: Ball has significant charge - apply Coulomb's law
        if (Math.abs(this.ballCharge) >= 0.1) {
            // Check if the ball and rod have the same charge sign
            const sameSign = (this.rodCharge * this.ballCharge > 0);
            // Set force magnitude based on charges and distance
            const forceMagnitude = Math.min(4.0, Math.abs(this.rodCharge * this.ballCharge) * 2.0 / dist);
            
            // Direction depends on charge signs
            let dx, dy;
            if (sameSign) {
                // Like charges repel - force away from rod
                dx = this.ballPos.x - rodCenter.x;
                dy = this.ballPos.y - rodCenter.y;
            } else {
                // Unlike charges attract - force toward rod
                dx = rodCenter.x - this.ballPos.x;
                dy = rodCenter.y - this.ballPos.y;
            }
            
            const normalizationFactor = dist === 0 ? 1 : dist;
            
            return {
                x: forceMagnitude * dx / normalizationFactor,
                y: forceMagnitude * dy / normalizationFactor
            };
        }
        
        // Default case - return minimal force
        return { x: 0, y: 0 };
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
                // Using a stronger charge transfer rate to ensure visible charge changes
                const inductionRate = 0.08;
                const targetCharge = -Math.sign(this.rodCharge) * Math.min(Math.abs(this.rodCharge) * 0.5, 3.0);
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
        
        // Always show polarization when rod is close enough, regardless of charging mode
        // This makes polarization more visible even in conduction mode before contact
        const rodCenter = {
            x: this.rodPos.x + this.rodSize.width / 2,
            y: this.rodPos.y + this.rodSize.height / 2
        };
        
        // Determine which side of the ball is closer to the rod
        const isRodLeftOfBall = rodCenter.x < this.ballPos.x;
        const dist = this.distance(rodCenter, this.ballPos);
        
        // Only show charge separation if the rod is close enough and not touching
        if (dist < 200 && !this.isInContact) {
            // Based on physics explanation:
            // - Negative rod: Repels electrons to far side (near side is positive, far side is negative)
            // - Positive rod: Attracts electrons to near side (near side is negative, far side is positive)
            
            // Higher numbers for better visibility, scaled by distance
            const inductionStrength = Math.min(2.0, 200 / dist);
            
            // Only apply polarization effect to neutral or nearly neutral balls
            // Once ball has significant charge, it overpowers the polarization effect
            if (Math.abs(this.ballCharge) < 0.5) {
                if (isRodLeftOfBall) {
                    // Rod is on the left side of the ball
                    if (this.rodCharge > 0) {
                        // Positive rod: Attracts electrons to near side (left)
                        distribution.leftSide = -Math.abs(this.rodCharge) * inductionStrength * 0.5; // Negative (electrons)
                        distribution.rightSide = Math.abs(this.rodCharge) * inductionStrength * 0.5; // Positive (electron deficient)
                    } else {
                        // Negative rod: Repels electrons to far side (right)
                        distribution.leftSide = Math.abs(this.rodCharge) * inductionStrength * 0.5; // Positive (electron deficient)
                        distribution.rightSide = -Math.abs(this.rodCharge) * inductionStrength * 0.5; // Negative (electrons)
                    }
                } else {
                    // Rod is on the right side of the ball
                    if (this.rodCharge > 0) {
                        // Positive rod: Attracts electrons to near side (right)
                        distribution.leftSide = Math.abs(this.rodCharge) * inductionStrength * 0.5; // Positive (electron deficient)
                        distribution.rightSide = -Math.abs(this.rodCharge) * inductionStrength * 0.5; // Negative (electrons)
                    } else {
                        // Negative rod: Repels electrons to far side (left)
                        distribution.leftSide = -Math.abs(this.rodCharge) * inductionStrength * 0.5; // Negative (electrons)
                        distribution.rightSide = Math.abs(this.rodCharge) * inductionStrength * 0.5; // Positive (electron deficient)
                    }
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
        
        // Apply repulsion if the ball and rod have the same charge
        if (this.rodCharge * this.ballCharge > 0) {
            const rodCenter = {
                x: this.rodPos.x + this.rodSize.width / 2,
                y: this.rodPos.y + this.rodSize.height / 2
            };

            const dx = this.ballPos.x - rodCenter.x;
            const dy = this.ballPos.y - rodCenter.y;
            const dist = this.distance(rodCenter, this.ballPos);

            if (dist > 0) {
                const repulsionForce = 10.0; // Stronger repulsion for clear visualization
                this.ballVelocity.x += (dx / dist) * repulsionForce;
                this.ballVelocity.y += (dy / dist) * repulsionForce;
            }
        }
        
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