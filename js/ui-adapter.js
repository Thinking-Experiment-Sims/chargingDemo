/**
 * UI Adapter - Connects the new UI elements with the existing simulation code
 */
document.addEventListener('DOMContentLoaded', () => {
    // Connect mode toggle buttons to original radio buttons
    const conductionButton = document.getElementById('conduction-button');
    const inductionButton = document.getElementById('induction-button');
    const originalRadios = document.querySelectorAll('input[name="charging-mode"]');
    
    if (conductionButton && inductionButton) {
        conductionButton.addEventListener('click', () => {
            // Find and trigger the original conduction radio button
            const conductionRadio = Array.from(originalRadios).find(radio => radio.value === 'conduction');
            if (conductionRadio) {
                conductionRadio.checked = true;
                conductionRadio.dispatchEvent(new Event('change'));
            }
            
            // Update UI state
            conductionButton.classList.add('active');
            inductionButton.classList.remove('active');
        });
        
        inductionButton.addEventListener('click', () => {
            // Find and trigger the original induction radio button
            const inductionRadio = Array.from(originalRadios).find(radio => radio.value === 'induction');
            if (inductionRadio) {
                inductionRadio.checked = true;
                inductionRadio.dispatchEvent(new Event('change'));
            }
            
            // Update UI state
            inductionButton.classList.add('active');
            conductionButton.classList.remove('active');
        });
    }
    
    // Create adapter for realtime measurements to update cards
    function adaptMeasurementsUpdate() {
        const originalRodChargeValue = document.getElementById('rod-charge-value');
        const originalBallChargeValue = document.getElementById('ball-charge-value');
        const originalForceValue = document.getElementById('force-value');
        const originalDistanceValue = document.getElementById('distance-value');
        
        // Create mutation observers for the original values
        if (originalRodChargeValue) {
            new MutationObserver(() => {
                updateMeasurementCard('rod-charge-value', originalRodChargeValue.textContent);
            }).observe(originalRodChargeValue, { childList: true, characterData: true, subtree: true });
        }
        
        if (originalBallChargeValue) {
            new MutationObserver(() => {
                updateMeasurementCard('ball-charge-value', originalBallChargeValue.textContent);
            }).observe(originalBallChargeValue, { childList: true, characterData: true, subtree: true });
        }
        
        if (originalForceValue) {
            new MutationObserver(() => {
                updateMeasurementCard('force-value', originalForceValue.textContent);
            }).observe(originalForceValue, { childList: true, characterData: true, subtree: true });
        }
        
        if (originalDistanceValue) {
            new MutationObserver(() => {
                updateMeasurementCard('distance-value', originalDistanceValue.textContent);
            }).observe(originalDistanceValue, { childList: true, characterData: true, subtree: true });
        }
    }
    
    function updateMeasurementCard(id, value) {
        const card = document.querySelector(`.measurement-card #${id}`);
        if (card) {
            card.textContent = value;
        }
    }
    
    // Initialize adapters
    adaptMeasurementsUpdate();
    
    // Display a welcome message using the feedback system
    if (window.simulationUI && window.simulationUI.showFeedback) {
        setTimeout(() => {
            window.simulationUI.showFeedback('Welcome to the improved Electrostatics Simulation!');
        }, 1000);
    }
});
