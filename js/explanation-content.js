/**
 * Content for the electrostatics explanation modal
 * This file provides the tab functionality for the explanation panel
 */

// Initialize the explanation panel tabs when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.explanation-nav-btn');
    const tabSections = document.querySelectorAll('.explanation-section');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove 'active' class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add 'active' class to the clicked button
            this.classList.add('active');

            // Hide all sections
            tabSections.forEach(section => section.classList.remove('active'));
            // Show the target section
            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(`${targetId}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // Ensure only the first tab and its section are active on load
    const firstButton = document.querySelector('.explanation-nav-btn.active');
    if (firstButton) {
        const targetId = firstButton.getAttribute('data-target');
        const targetSection = document.getElementById(`${targetId}-section`);
        if (targetSection) {
            tabSections.forEach(section => section.classList.remove('active'));
            targetSection.classList.add('active');
        }
    }
});
