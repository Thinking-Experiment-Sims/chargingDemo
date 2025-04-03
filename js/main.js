/**
 * Main entry point for the electrostatics simulation
 * Creates instances of model, view, and controller, and starts the simulation
 */
document.addEventListener('DOMContentLoaded', () => {
    // Create the model
    const electrostaticsModel = new ElectrostaticsModel();
    
    // Create the view with a reference to the model
    const electrostaticsView = new ElectrostaticsView(electrostaticsModel);
    
    // Create the controller with references to both model and view
    const electrostaticsController = new ElectrostaticsController(
        electrostaticsModel,
        electrostaticsView
    );
    
    // Start the simulation
    electrostaticsController.start();
    
    // Add description and instructions text under the simulation
    addInstructionsText();
});

/**
 * Add educational text and instructions about electrostatic charging
 */
function addInstructionsText() {
    // Find or create a container for the instructions
    let instructionsContainer = document.querySelector('.instructions-container');
    
    if (!instructionsContainer) {
        instructionsContainer = document.createElement('div');
        instructionsContainer.className = 'instructions-container';
        document.querySelector('.container').appendChild(instructionsContainer);
    }
    
    // Add instruction content
    instructionsContainer.innerHTML = `
        <div class="instructions-section">
            <h2>Understanding Electrostatic Charging</h2>
            
            <h3>Conduction vs. Induction: Key Differences</h3>
            <ul>
                <li><strong>Conduction</strong> requires direct contact between objects and transfers charge.</li>
                <li><strong>Induction</strong> works without contact by redistributing charge.</li>
                <li>In conduction, both objects end up with the same type of charge.</li>
                <li>In induction with grounding, the ball acquires the opposite charge of the rod.</li>
            </ul>
            
            <h3>How to Use This Simulation</h3>
            <ol>
                <li>Select a charging mode (Conduction or Induction)</li>
                <li>Adjust the rod charge using the slider</li>
                <li>Drag the rod near the hanging ball</li>
                <li>Toggle grounding to see its effect on charge transfer</li>
                <li>Observe how the ball moves in response to electrostatic forces</li>
            </ol>
            
            <h3>Physical Principles</h3>
            <p>
                This simulation demonstrates <strong>Coulomb's Law</strong>: F = k|q₁q₂|/r².
                Like charges repel, and opposite charges attract.
                Watch how the ball's movement changes based on its charge relative to the rod.
            </p>
            
            <h3>Experiment Ideas</h3>
            <ul>
                <li>Try to charge the ball positively using only induction (it's not possible!)</li>
                <li>Compare the final charge on the ball after conduction vs. induction</li>
                <li>Observe how grounding affects the charge transfer process</li>
            </ul>
        </div>
    `;
}