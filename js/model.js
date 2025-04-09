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
        
        // Physics simulation parameters
        this.fixedTimeStep = 1/60; // 60 Hz physics update
        this.maxSubSteps = 3; // Maximum physics substeps
        this.accumulator = 0; // For fixed timestep
        this.lastTime = performance.now();
        
        // Collision parameters
        this.restitution = 0.5; // Bounciness
        this.frictionCoef = 0.1; // Friction coefficient
        
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
        
        // Previous position for continuous collision detection
        this.prevBallPos = { x: 400, y: 250 };
        
        // Physics state
        this.isGrounded = false;
        this.chargingMode = "conduction"; // "conduction" or "induction"
        this.showCharges = true;
        this.showField = false;
        
        // Internal variables
        this.ballVelocity = { x: 0, y: 0 };
        this.ballAcceleration = { x: 0, y: 0 };
        this.isInContact = false;
        this.chargeTransferRate = 0.1; // Rate of charge transfer during conduction
        this.inducedCharge = 0; // Temporary variable for induction simulation
        
        // Other physics properties - adjusted for more controlled motion
        this.dampingFactor = 0.95; // Increased damping to reduce swinging
        this.deltaTime = 0.05; // Reduced for finer time steps
        this.stopThreshold = 0.1; // Threshold for stopping motion
        
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
        this.chargingMode = "conduction";
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
        
        // Update grounding state
        this.isGrounded = isGrounded;
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
     * @returns {Object} Collision data if in contact, or false if not
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
            const dist = Math.sqrt(distSquared);
            const overlap = this.ballRadius - dist;
            
            // Calculate normal vector (direction from closest point on rod to ball center)
            let normalX, normalY;
            
            if (dist > 0) {
                normalX = distX / dist;
                normalY = distY / dist;
            } else {
                // Fallback if ball is exactly at closest point (rare)
                normalX = 1;
                normalY = 0;
            }
            
            return {
                collision: true,
                distance: dist,
                overlap: overlap,
                normalX: normalX,
                normalY: normalY,
                contactX: closestX,
                contactY: closestY
            };
        }
        
        return {
            collision: false
        };
    }
    
    /**
     * Improved collision resolution to prevent overlap
     */
    resolveCollision() {
        const collision = this.checkCollision();
        
        if (collision.collision) {
            // Increase separation to prevent any possibility of overlap
            const separationBuffer = 1.0; // Increased buffer for more reliable separation
            
            // Move ball out of collision
            this.ballPos.x = collision.point.x + 
                            collision.normal.x * (this.ballRadius + separationBuffer);
            this.ballPos.y = collision.point.y + 
                            collision.normal.y * (this.ballRadius + separationBuffer);
            
            // Calculate velocity along normal
            const normalVelocity = 
                this.ballVelocity.x * collision.normal.x + 
                this.ballVelocity.y * collision.normal.y;
            
            // Only bounce if moving towards the rod
            if (normalVelocity < 0) {
                // Less energetic bounce to reduce continuous motion
                const restitution = 0.3;
                const bounceVelocity = -normalVelocity * restitution;
                
                // Apply reduced bounce impulse
                const deltaVelocity = bounceVelocity - normalVelocity;
                this.ballVelocity.x += deltaVelocity * collision.normal.x;
                this.ballVelocity.y += deltaVelocity * collision.normal.y;
                
                // Add upward impulse to help prevent sticking
                this.ballVelocity.y -= 1.0;
                
                // Reduced friction for smoother interaction
                const friction = 0.1;
                const tangent = { 
                    x: -collision.normal.y,
                    y: collision.normal.x 
                };
                
                const tangentVelocity = 
                    this.ballVelocity.x * tangent.x + 
                    this.ballVelocity.y * tangent.y;
                    
                this.ballVelocity.x -= tangentVelocity * tangent.x * friction;
                this.ballVelocity.y -= tangentVelocity * tangent.y * friction;
            }
            
            // Set contact flag for charge transfer
            this.isInContact = true;
            
            // Double-check that we're really separated after resolution
            const postCheck = this.checkCollision();
            if (postCheck.collision) {
                // If still colliding, push out more aggressively
                this.ballPos.x += postCheck.normal.x * (postCheck.depth + 2.0);
                this.ballPos.y += postCheck.normal.y * (postCheck.depth + 2.0);
            }
        } else {
            this.isInContact = false;
        }
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
                    // Add stronger repulsive impulse
                    const repulsionStrength = 8.0; // Increased from 3.0 to 8.0
                    this.ballVelocity.x += (dx / dist) * repulsionStrength;
                    this.ballVelocity.y += (dy / dist) * repulsionStrength;
                    
                    // Add an extra upward component to help overcome gravity
                    this.ballVelocity.y -= 2.0;
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
        
        // Vector from rod to ball
        const dx = this.ballPos.x - rodCenter.x;
        const dy = this.ballPos.y - rodCenter.y;
        const normalizationFactor = dist === 0 ? 1 : dist;
        
        // Check if the ball and rod have the same charge sign
        const sameSign = (this.rodCharge * this.ballCharge > 0);
        
        // CASE 1: Contact or just after contact - apply simplified smooth repulsion
        if (this.isInContact || dist < this.ballRadius * 1.5 + this.rodSize.width / 2) {
            // Force direction depends on the charges
            let forceMagnitude;
            
            if (sameSign && Math.abs(this.ballCharge) > 0.1) {
                // Simplified repulsion for same sign charges - smooth swing away
                forceMagnitude = 3.0; // Moderate force for smooth motion
                
                // Apply a clean, horizontal impulse away from the rod
                // This ensures a more natural-looking pendulum swing
                const angle = Math.atan2(dy, dx);
                const impulseStrength = 5.0;
                
                // Set velocity directly rather than accumulating forces
                // This creates a cleaner, more controlled swing motion
                this.ballVelocity.x = Math.cos(angle) * impulseStrength;
                this.ballVelocity.y = Math.sin(angle) * impulseStrength * 0.5; // Reduced vertical component
                
                // Set contact flag to false to prevent repeated impulses
                this.isInContact = false;
                
                return {
                    x: forceMagnitude * dx / normalizationFactor,
                    y: forceMagnitude * dy / normalizationFactor
                };
            } else {
                // Attraction for opposite charges or neutral ball
                forceMagnitude = 2.0;
                
                return {
                    x: -forceMagnitude * dx / normalizationFactor, // Direction toward rod
                    y: -forceMagnitude * dy / normalizationFactor  // Direction toward rod
                };
            }
        }
        
        // CASE 2: Polarization effect - ball should be attracted to rod
        if (!this.isInContact && Math.abs(this.ballCharge) < 0.1) {
            // Similar to induction - ball is attracted to rod through polarization
            const inductionStrength = Math.min(1.5, 150 / dist); // Stronger when closer
            const forceMagnitude = Math.abs(this.rodCharge) * inductionStrength * 0.5;
            
            // Direction is always toward rod (attractive) before contact due to polarization
            return {
                x: -forceMagnitude * dx / normalizationFactor, // Direction toward rod
                y: -forceMagnitude * dy / normalizationFactor  // Direction toward rod
            };
        }
        
        // CASE 3: Ball has significant charge - apply simpler force model for smooth motion
        if (Math.abs(this.ballCharge) >= 0.1) {
            // Simplified force model for visual clarity
            const forceMagnitude = sameSign ? 2.0 : 1.0;
            
            if (sameSign) {
                // Like charges REPEL - force away from rod
                return {
                    x: forceMagnitude * dx / normalizationFactor,  // Direction away from rod
                    y: forceMagnitude * dy / normalizationFactor   // Direction away from rod
                };
            } else {
                // Unlike charges attract - force toward rod
                return {
                    x: -forceMagnitude * dx / normalizationFactor, // Direction toward rod
                    y: -forceMagnitude * dy / normalizationFactor  // Direction toward rod
                };
            }
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
                
                // If the ball has acquired significant opposite charge, apply a repulsive force
                // This creates the repulsion effect after grounding with induction
                if (Math.abs(this.ballCharge) > 0.8 && this.rodCharge * this.ballCharge < 0) {
                    const dx = this.ballPos.x - rodCenter.x;
                    const dy = this.ballPos.y - rodCenter.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        // Apply a repulsive impulse to show physical repulsion effect
                        // For opposite charges, the repulsion happens after grounding as electrons redistribute
                        const repulsionStrength = 0.5 * Math.abs(this.ballCharge);
                        this.ballVelocity.x += (dx / distance) * repulsionStrength;
                        this.ballVelocity.y += (dy / distance) * repulsionStrength;
                    }
                }
            }
            
            // Update induction electrons
            this.updateInductionElectrons();
        } else {
            // When not grounded, no net charge change, only polarization
            // This is handled in getChargeDistribution
            
            // If the ball has acquired significant opposite charge from previous grounding,
            // maintain that charge and apply forces accordingly
            if (Math.abs(this.ballCharge) > 0.5) {
                // This ball now has a permanent charge and will behave according to normal electrostatics
                // The force calculations are already handled in calculateElectrostaticForce()
            }
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
        // First check for collision with rod and resolve it to ensure no overlap
        this.resolveCollision();
        
        // Calculate total force
        const force = this.calculateTotalForce();
        
        // Apply general stabilization regardless of mode when forces are minimal
        const forceMagnitude = Math.sqrt(force.x * force.x + force.y * force.y);
        if (forceMagnitude < 0.05 && Math.abs(this.ballVelocity.x) < 0.01 && Math.abs(this.ballVelocity.y) < 0.01) {
            this.ballVelocity = { x: 0, y: 0 };
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
        
        // Apply stronger damping to reduce continuous swinging
        this.ballVelocity.x *= this.dampingFactor;
        this.ballVelocity.y *= this.dampingFactor;
        
        // Stop motion if velocity is below threshold
        if (Math.abs(this.ballVelocity.x) < this.stopThreshold && 
            Math.abs(this.ballVelocity.y) < this.stopThreshold) {
            this.ballVelocity.x = 0;
            this.ballVelocity.y = 0;
        }
        
        // Apply additional damping in induction mode
        if (this.chargingMode === "induction") {
            this.ballVelocity.x *= 0.8; // Increased damping
            this.ballVelocity.y *= 0.8;
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
        
        // Limit maximum oscillation angle to 70 degrees from vertical
        // Calculate current angle in degrees (0 is vertical down)
        const currentAngle = Math.atan2(dx, -dy) * (180 / Math.PI);
        const maxAngle = 70;  // Maximum allowed angle in degrees from vertical
        
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
     * Main physics step with stronger collision handling
     */
    update() {
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // Cap at ~60fps
        this.lastTime = currentTime;
        
        // Physics simulation with substeps for stability
        const numSubsteps = 3;
        const subDt = deltaTime / numSubsteps;
        
        for (let i = 0; i < numSubsteps; i++) {
            // 1. Store previous position for collision detection
            this.prevBallPos = { ...this.ballPos };
            
            // 2. Apply forces and update velocity
            const force = this.calculateTotalForce();
            this.ballVelocity.x += (force.x / this.ballMass) * subDt;
            this.ballVelocity.y += (force.y / this.ballMass) * subDt;
            
            // 3. Update position with current velocity
            const proposedX = this.ballPos.x + this.ballVelocity.x * subDt;
            const proposedY = this.ballPos.y + this.ballVelocity.y * subDt;
            
            // 4. Check for collision at proposed position
            const testPos = { x: proposedX, y: proposedY };
            const collision = this.checkCollisionAtPosition(testPos);
            
            if (collision.collision) {
                // Don't move to colliding position, instead resolve collision from current position
                this.resolveCollision();
            } else {
                // No collision, accept the proposed position
                this.ballPos.x = proposedX;
                this.ballPos.y = proposedY;
            }
            
            // 5. Always enforce string constraint after position update
            this.enforceStringConstraint();
            
            // 6. Apply damping
            this.ballVelocity.x *= Math.pow(0.98, subDt);
            this.ballVelocity.y *= Math.pow(0.98, subDt);
        }
        
        // Update simulation effects
        this.handleConduction();
        this.handleInduction();
        this.handleGrounding();
        
        if (this.showField) {
            this.generateElectricField();
        }
    }
    
    /**
     * Physics update with fixed timestep
     * @param {number} dt - Fixed timestep duration
     */
    updatePhysics(dt) {
        // Sub-step the physics for stability
        const numSubSteps = 3;
        const subDt = dt / numSubSteps;
        
        for (let i = 0; i < numSubSteps; i++) {
            // 1. First check and resolve collisions
            this.resolveCollision();
            
            // 2. Calculate and apply forces
            const force = this.calculateTotalForce();
            
            // Update acceleration (F = ma -> a = F/m)
            this.ballAcceleration.x = force.x / this.ballMass;
            this.ballAcceleration.y = force.y / this.ballMass;
            
            // Update velocity using semi-implicit Euler
            this.ballVelocity.x += this.ballAcceleration.x * subDt;
            this.ballVelocity.y += this.ballAcceleration.y * subDt;
            
            // Apply damping
            this.ballVelocity.x *= Math.pow(this.dampingFactor, subDt);
            this.ballVelocity.y *= Math.pow(this.dampingFactor, subDt);
            
            // Store current position for continuous collision detection
            this.prevBallPos = { ...this.ballPos };
            
            // Update position
            this.ballPos.x += this.ballVelocity.x * subDt;
            this.ballPos.y += this.ballVelocity.y * subDt;
            
            // 3. Apply constraints in order
            this.enforceStringConstraint();
            
            // 4. Check for tunneling (continuous collision detection)
            this.handleContinuousCollision();
        }
    }
    
    /**
     * Continuous collision detection between updates
     */
    handleContinuousCollision() {
        // Get the movement vector of the ball
        const moveX = this.ballPos.x - this.prevBallPos.x;
        const moveY = this.ballPos.y - this.prevBallPos.y;
        const moveDist = Math.sqrt(moveX * moveX + moveY * moveY);
        
        if (moveDist > this.ballRadius) {
            // Ball moved more than its radius, check for tunneling
            const steps = Math.ceil(moveDist / this.ballRadius);
            const stepX = moveX / steps;
            const stepY = moveY / steps;
            
            let tempPos = { ...this.prevBallPos };
            for (let i = 0; i < steps; i++) {
                tempPos.x += stepX;
                tempPos.y += stepY;
                
                // Check collision at intermediate position
                const collision = this.checkCollisionAtPosition(tempPos);
                if (collision.collision) {
                    // Collision found, resolve it
                    this.ballPos = this.resolveCollisionAtPosition(tempPos, collision);
                    break;
                }
            }
        }
    }
    
    /**
     * Check collision at a specific position
     * @param {Object} pos - Position to check
     * @returns {Object} Collision data
     */
    checkCollisionAtPosition(pos) {
        const closestX = Math.max(this.rodPos.x, Math.min(pos.x, this.rodPos.x + this.rodSize.width));
        const closestY = Math.max(this.rodPos.y, Math.min(pos.y, this.rodPos.y + this.rodSize.height));
        
        const distX = pos.x - closestX;
        const distY = pos.y - closestY;
        const distSquared = distX * distX + distY * distY;
        
        if (distSquared < this.ballRadius * this.ballRadius) {
            const dist = Math.sqrt(distSquared);
            return {
                collision: true,
                normal: dist > 0 ? { x: distX / dist, y: distY / dist } : { x: 1, y: 0 },
                depth: this.ballRadius - dist,
                point: { x: closestX, y: closestY }
            };
        }
        
        return { collision: false };
    }
    
    /**
     * Resolve collision with improved response
     */
    enforceRodCollision() {
        const collision = this.checkCollisionAtPosition(this.ballPos);
        
        if (collision.collision) {
            // Set contact flag for charge transfer
            this.isInContact = true;
            
            // Separate the objects
            this.ballPos.x = collision.point.x + collision.normal.x * (this.ballRadius + 0.1); // Small buffer
            this.ballPos.y = collision.point.y + collision.normal.y * (this.ballRadius + 0.1);
            
            // Calculate relative velocity
            const velDotNormal = 
                this.ballVelocity.x * collision.normal.x + 
                this.ballVelocity.y * collision.normal.y;
            
            // Only bounce if moving towards the rod
            if (velDotNormal < 0) {
                // Calculate reflection vector
                const reflectionX = this.ballVelocity.x - 2 * velDotNormal * collision.normal.x;
                const reflectionY = this.ballVelocity.y - 2 * velDotNormal * collision.normal.y;
                
                // Apply restitution and update velocity
                this.ballVelocity.x = reflectionX * this.restitution;
                this.ballVelocity.y = reflectionY * this.restitution;
                
                // Apply friction to tangential velocity
                const tangentX = -collision.normal.y;
                const tangentY = collision.normal.x;
                const velDotTangent = 
                    this.ballVelocity.x * tangentX + 
                    this.ballVelocity.y * tangentY;
                    
                this.ballVelocity.x -= velDotTangent * tangentX * this.frictionCoef;
                this.ballVelocity.y -= velDotTangent * tangentY * this.frictionCoef;
            }
        } else {
            this.isInContact = false;
        }
    }
    
    /**
     * Update the simulation state for a new frame with improved physics
     */
    update() {
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;
        
        // Accumulate time for fixed timestep
        this.accumulator += deltaTime;
        
        // Perform physics updates with fixed timestep
        while (this.accumulator >= this.fixedTimeStep) {
            // Store previous position for continuous collision detection
            this.prevBallPos = { ...this.ballPos };
            
            // Update physics with fixed timestep
            this.updatePhysics(this.fixedTimeStep);
            
            // Handle continuous collision detection
            this.handleContinuousCollision();
            
            this.accumulator -= this.fixedTimeStep;
        }
        
        // Handle charging effects
        this.handleConduction();
        this.handleInduction();
        this.handleGrounding();
        
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

    /**
     * Check for collision using Separating Axis Theorem (SAT)
     * @returns {Object} Collision information
     */
    checkCollision() {
        // Convert rod to oriented bounding box
        const rodCorners = [
            { x: this.rodPos.x, y: this.rodPos.y },
            { x: this.rodPos.x + this.rodSize.width, y: this.rodPos.y },
            { x: this.rodPos.x + this.rodSize.width, y: this.rodPos.y + this.rodSize.height },
            { x: this.rodPos.x, y: this.rodPos.y + this.rodSize.height }
        ];

        // Find closest point on rod to ball center
        const closestPoint = this.findClosestPointOnRod(this.ballPos);
        
        // Calculate distance and direction from closest point to ball center
        const dx = this.ballPos.x - closestPoint.x;
        const dy = this.ballPos.y - closestPoint.y;
        const distanceSquared = dx * dx + dy * dy;
        
        // Check if ball overlaps with rod
        if (distanceSquared < this.ballRadius * this.ballRadius) {
            const distance = Math.sqrt(distanceSquared);
            const overlap = this.ballRadius - distance;
            
            // Calculate normal vector (direction to push ball out)
            const normalX = distance > 0 ? dx / distance : 1;
            const normalY = distance > 0 ? dy / distance : 0;
            
            return {
                collision: true,
                point: closestPoint,
                normal: { x: normalX, y: normalY },
                depth: overlap
            };
        }
        
        return { collision: false };
    }
    
    /**
     * Find the closest point on the rod to a given point
     * @param {Object} point - Point to check
     * @returns {Object} Closest point on rod
     */
    findClosestPointOnRod(point) {
        // Clamp point to rod boundaries
        return {
            x: Math.max(this.rodPos.x, Math.min(point.x, this.rodPos.x + this.rodSize.width)),
            y: Math.max(this.rodPos.y, Math.min(point.y, this.rodPos.y + this.rodSize.height))
        };
    }

    /**
     * Enforce string constraint with impulse-based correction
     */
    enforceStringConstraint() {
        const dx = this.ballPos.x - this.stringAnchor.x;
        const dy = this.ballPos.y - this.stringAnchor.y;
        const currentLength = Math.sqrt(dx * dx + dy * dy);
        
        if (currentLength > this.stringLength) {
            // Calculate the direction vector of the string
            const dirX = dx / currentLength;
            const dirY = dy / currentLength;
            
            // Calculate the constraint violation
            const violation = currentLength - this.stringLength;
            
            // Calculate relative velocity along the string direction
            const velAlongString = 
                this.ballVelocity.x * dirX + 
                this.ballVelocity.y * dirY;
            
            // Calculate impulse magnitude
            const impulseMagnitude = -velAlongString + violation / this.fixedTimeStep;
            
            // Apply impulse
            this.ballVelocity.x += impulseMagnitude * dirX;
            this.ballVelocity.y += impulseMagnitude * dirY;
            
            // Move ball back to string length
            this.ballPos.x = this.stringAnchor.x + dirX * this.stringLength;
            this.ballPos.y = this.stringAnchor.y + dirY * this.stringLength;
        }
        
        // Add 70 degree constraint to limit swing angle
        // Calculate current angle in degrees (0 is vertical down)
        const dx2 = this.ballPos.x - this.stringAnchor.x;
        const dy2 = this.ballPos.y - this.stringAnchor.y;
        const currentAngle = Math.atan2(dx2, dy2) * (180 / Math.PI);
        const maxAngle = 70;  // Maximum allowed angle in degrees from vertical
        
        // If angle exceeds max, adjust position to max angle
        if (Math.abs(currentAngle) > maxAngle) {
            // Determine sign of the angle (left or right)
            const angleSign = currentAngle > 0 ? 1 : -1;
            // Convert max angle to radians with correct sign
            const maxAngleRad = angleSign * maxAngle * (Math.PI / 180);
            
            // Set ball position at maximum allowed angle
            this.ballPos.x = this.stringAnchor.x + Math.sin(maxAngleRad) * this.stringLength;
            this.ballPos.y = this.stringAnchor.y + Math.cos(maxAngleRad) * this.stringLength;
            
            // Dampen horizontal velocity when hitting angle limit
            this.ballVelocity.x *= 0.6;
            
            // Recalculate velocity to be tangential to the arc at the maximum angle
            const tangentAngle = maxAngleRad + (Math.PI/2); // 90 degrees from the string
            const velocityMagnitude = Math.sqrt(
                this.ballVelocity.x * this.ballVelocity.x + 
                this.ballVelocity.y * this.ballVelocity.y
            );
            const tangentX = Math.cos(tangentAngle);
            const tangentY = Math.sin(tangentAngle);
            
            // Project current velocity onto tangent
            const dotProduct = 
                this.ballVelocity.x * tangentX + 
                this.ballVelocity.y * tangentY;
            
            // Update velocity to be along the tangent
            this.ballVelocity.x = dotProduct * tangentX * 0.8; // Apply additional damping
            this.ballVelocity.y = dotProduct * tangentY * 0.8;
        }
    }
}