/**
 * UI Functionality for the Electrostatic Charging Simulation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality for the control panel
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show active content
            tabContents.forEach(content => {
                content.classList.add('hidden');
                if (content.id === `${tabId}-content`) {
                    content.classList.remove('hidden');
                }
            });
        });
    });
    
    // Explanation panel functionality
    const explanationButton = document.getElementById('explanation-button');
    const explanationPanel = document.getElementById('explanation-panel');
    const closeExplanation = document.getElementById('close-explanation');
    
    if (explanationButton && explanationPanel && closeExplanation) {
        explanationButton.addEventListener('click', () => {
            explanationPanel.style.display = 'block';
        });
        
        closeExplanation.addEventListener('click', () => {
            explanationPanel.style.display = 'none';
        });
    }
    
    // Help button functionality
    const helpButton = document.getElementById('help-button');
    if (helpButton) {
        helpButton.addEventListener('click', () => {
            alert('Drag the charged rod near the ball to observe electrostatic forces. Use the controls on the right to change settings.');
        });
    }
    
    // Advanced explanation modal functionality
    const advancedButton = document.getElementById('advanced-explanation-button');
    const advancedDialog = document.getElementById('advanced-explanation-dialog');
    const closeAdvanced = document.getElementById('close-advanced-explanation');
    
    if (advancedButton && advancedDialog && closeAdvanced) {
        advancedButton.addEventListener('click', () => {
            advancedDialog.style.display = 'block';
        });
        
        closeAdvanced.addEventListener('click', () => {
            advancedDialog.style.display = 'none';
        });
        
        // Close when clicking outside the modal
        window.addEventListener('click', (event) => {
            if (event.target === advancedDialog) {
                advancedDialog.style.display = 'none';
            }
        });
    }
    
    // Update the charge value display when the slider changes
    const chargeSlider = document.getElementById('charge-slider');
    const currentChargeDisplay = document.getElementById('current-charge');
    
    if (chargeSlider && currentChargeDisplay) {
        chargeSlider.addEventListener('input', () => {
            const value = chargeSlider.value;
            const sign = value > 0 ? '+' : '';
            currentChargeDisplay.textContent = `${sign}${value} μC`;
        });
    }
});

// Function to handle tab navigation in the advanced explanation
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName('tabcontent');
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
    }
    
    const tablinks = document.getElementsByClassName('tablinks');
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '');
    }
    
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.className += ' active';
}

// Function to update the physics information display
function updatePhysicsDisplay(rodCharge, ballCharge, force, distance) {
    const rodChargeElement = document.getElementById('rod-charge-value');
    const ballChargeElement = document.getElementById('ball-charge-value');
    const forceElement = document.getElementById('force-value');
    const distanceElement = document.getElementById('distance-value');
    
    if (rodChargeElement) rodChargeElement.textContent = rodCharge > 0 ? `+${rodCharge}` : rodCharge;
    if (ballChargeElement) ballChargeElement.textContent = ballCharge > 0 ? `+${ballCharge}` : ballCharge;
    if (forceElement) forceElement.textContent = force.toFixed(2);
    if (distanceElement) distanceElement.textContent = distance.toFixed(1);
}
