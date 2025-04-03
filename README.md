# Interactive Electrostatics Simulation: Conduction vs Induction

A web-based interactive demonstration that teaches electrostatic charging principles through a hanging ball model. This simulation visually illustrates the differences between charging by conduction and induction, allowing students to explore these concepts through direct manipulation.

![Electrostatics Simulation Screenshot](img/screenshot.png)

## Overview

This HTML5 application simulates the physics of electrostatic charging through both conduction and induction methods. Students can interact with a charged rod and observe how it affects a hanging ball under different conditions. The simulation accurately models Coulomb's Law and helps visualize key differences between these fundamental charging mechanisms.

## Features

- **Real-time Physics Simulation**: Accurate modeling of electrostatic forces using Coulomb's Law
- **Interactive Elements**: Draggable charged rod, hanging ball on a string with realistic motion
- **Multiple Charging Modes**: Switch between conduction and induction charging methods
- **Grounding Capability**: Toggle grounding to observe its effect on charge transfer
- **Updated Interactions**: Correctly models all six scenarios of conduction and induction, including grounding effects
- **Visual Indicators**: Color-coding and +/- symbols to indicate charge polarity and magnitude
- **Optional Electric Field Visualization**: View electric field lines around charged objects
- **Educational Content**: Built-in instructions and explanations of key concepts

## Educational Value

This simulation helps students understand the following key principles:

1. **Charging by Conduction**:
   - Direct contact transfers charge between the rod and the ball.
   - The ball acquires the same type of charge as the rod.
   - Like charges repel after contact.

2. **Charging by Induction**:
   - Without grounding, the ball becomes polarized but remains neutral overall.
   - With grounding, the ball acquires a net charge opposite to that of the rod.
   - Polarized neutral objects are attracted to charged rods.

3. **Electron Mobility**:
   - Only electrons move during charging; protons remain fixed.

## Technical Implementation

The application is built using modern web technologies and follows the Model-View-Controller (MVC) architecture:

- **HTML5/CSS3**: For structure and styling
- **JavaScript (ES6+)**: For physics calculations and interactivity
- **Canvas API**: For rendering the simulation
- **No external dependencies**: Works in any modern browser without additional libraries

### Files Structure

- `index.html` - Main HTML document with UI controls
- `css/styles.css` - Styling for the simulation interface
- `js/model.js` - Core physics calculations and simulation state
- `js/view.js` - Canvas rendering and visualization
- `js/controller.js` - User interaction handling and event management
- `js/main.js` - Application initialization and setup
- `img/rod.png` - Image asset for the charging rod

## Usage Instructions

### For Students

1. Select a charging mode (Conduction or Induction)
2. Adjust the rod charge using the slider (positive or negative)
3. Drag the rod near or touching the hanging ball
4. Toggle grounding to observe its effect on charge transfer
5. Watch how the ball moves in response to the electrostatic forces
6. Read the physics information panel to see quantitative data

### For Instructors

1. **Embedding in LMS**: This simulation can be embedded in Canvas or other learning management systems
2. **Classroom Demonstrations**: Use as an interactive demonstration during lectures
3. **Student Assignments**: Create guided inquiry activities for students to explore concepts
4. **Assessment**: Ask students to predict outcomes under different conditions

## Embedding in Canvas LMS

1. Download all files and upload to your Canvas course files
2. Create a new page in Canvas
3. Click the "HTML Editor" button
4. Insert the following code (adjust file paths as needed):

```html
<iframe 
  src="/courses/YOUR_COURSE_ID/files/Electrostatic%20Charges/index.html" 
  width="100%" 
  height="700px" 
  style="border: none;">
</iframe>
```

## Experiment Ideas

1. Try to charge the ball positively using only induction (it's not possible!)
2. Compare the final charge on the ball after conduction vs. induction
3. Observe how grounding affects the charge transfer process
4. Measure the relationship between distance and force (verify inverse-square relationship)
5. Compare attraction vs. repulsion forces with equivalent charge magnitudes

## Browser Compatibility

- Chrome 60+
- Firefox 60+
- Safari 11+
- Edge 79+

## License

This project is available for educational use under the MIT License.

## Credits

Created for physics education to provide an interactive demonstration of electrostatic charging mechanisms.

---

For questions or support, please contact the developer.