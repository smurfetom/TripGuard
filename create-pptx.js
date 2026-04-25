const PptxGenJS = require("pptxgenjs");

let pres = new PptxGenJS();

// Slide 1: Title
let slide1 = pres.addSlide();
slide1.addText("TripGuard", { x: 1, y: 2, w: 8, h: 1, fontSize: 44, bold: true, color: "1a365d" });
slide1.addText("Customer Presentation", { x: 1, y: 3.2, w: 8, h: 0.5, fontSize: 24, color: "4a5568" });

// Slide 2: Introduction
let slide2 = pres.addSlide();
slide2.addText("1. Introduction", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 28, bold: true, color: "1a365d" });
slide2.addText("TripGuard is a mobile tool designed for oil rig drillers to track and monitor drilling trip operations in real-time. It provides precise volume tracking, gain/loss calculations, and flexible trip management.", { x: 0.5, y: 1.5, w: 9, h: 1.5, fontSize: 18 });
slide2.addText("Target Users:", { x: 0.5, y: 3.2, w: 9, h: 0.4, fontSize: 16, bold: true });
slide2.addText("Drillers, Toolpushers, Drilling Engineers, Rig Managers", { x: 0.5, y: 3.6, w: 9, h: 0.4, fontSize: 16 });

// Slide 3: Problem Statement
let slide3 = pres.addSlide();
slide3.addText("2. Problem Statement", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 28, bold: true, color: "1a365d" });
slide3.addText("Drilling operations require precise tracking of:", { x: 0.5, y: 1.3, w: 9, h: 0.4, fontSize: 18, bold: true });
slide3.addText("• Trip tank volumes (TT)\n• Stand-by-stand displacement\n• Gain/loss calculations\n• Surface events", { x: 0.5, y: 1.8, w: 9, h: 1.5, fontSize: 16 });
slide3.addText("Current Challenges:", { x: 0.5, y: 3.5, w: 9, h: 0.4, fontSize: 18, bold: true });
slide3.addText("• Manual tracking is error-prone\n• No easy way to switch between RIH/POOH mid-trip\n• Surface events can disrupt data\n• Limited visibility for team members", { x: 0.5, y: 4, w: 9, h: 1.5, fontSize: 16 });

// Slide 4: Solution
let slide4 = pres.addSlide();
slide4.addText("3. Solution: TripGuard", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 28, bold: true, color: "1a365d" });
slide4.addText("Core Capabilities:", { x: 0.5, y: 1.3, w: 9, h: 0.4, fontSize: 18, bold: true });
slide4.addText("• Real-time volume tracking\n• Automatic displacement calculations\n• Gain/Loss monitoring with OK/Warning/Alarm alerts\n• Flexible trip management\n• Multi-screen visibility", { x: 0.5, y: 1.8, w: 9, h: 2, fontSize: 16 });

// Slide 5: Setup Screen
let slide5 = pres.addSlide();
slide5.addText("4. Key Features - Setup Screen", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 28, bold: true, color: "1a365d" });
slide5.addText("Configure trip parameters before starting:", { x: 0.5, y: 1.2, w: 9, h: 0.4, fontSize: 16 });
slide5.addText("• Mode Selection: RIH (Run In Hole) or POOH (Pull Out Of Hole)\n• Tubular Configuration: Preset sizes (5 7/8\", 12 1/4\", 6 5/8\", etc.) + custom options\n• Displacement Settings: Open End / Closed End modes\n• Section Builder: Define BHA, HWDP, DP sections with lengths\n• Templates: Pre-built or custom trip configurations", { x: 0.5, y: 1.7, w: 9, h: 2.5, fontSize: 14 });

// Slide 6: Driller Screen
let slide6 = pres.addSlide();
slide6.addText("4. Key Features - Driller Screen", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 28, bold: true, color: "1a365d" });
slide6.addText("The primary interface for the driller:", { x: 0.5, y: 1.2, w: 9, h: 0.4, fontSize: 16, bold: true });
slide6.addText("Key Metrics Displayed:", { x: 0.5, y: 1.7, w: 9, h: 0.4, fontSize: 14, bold: true });
slide6.addText("• Calculated Volume - Theoretical volume based on displacement\n• Accumulated Volume - Actual observed volume\n• Gain/Loss - Difference between calculated and actual\n• TT Volume - Trip Tank total volume", { x: 0.5, y: 2.1, w: 9, h: 1.2, fontSize: 14 });
slide6.addText("Status Indicators:", { x: 0.5, y: 3.5, w: 9, h: 0.4, fontSize: 14, bold: true });
slide6.addText("• Green = OK (within tolerance)\n• Yellow = Warning (approaching limit)\n• Red = Alarm (exceeded tolerance)", { x: 0.5, y: 3.9, w: 9, h: 1, fontSize: 14 });

// Slide 7: Surface Reset
let slide7 = pres.addSlide();
slide7.addText("4. Key Features - Surface Reset", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 28, bold: true, color: "1a365d" });
slide7.addText("Handle unexpected surface events without losing trip data:", { x: 0.5, y: 1.2, w: 9, h: 0.4, fontSize: 16 });
slide7.addText("Two Reset Types:", { x: 0.5, y: 1.7, w: 9, h: 0.4, fontSize: 14, bold: true });
slide7.addText("• Surface Event: Unintended fluid transfers, pit changes\n• Empty/Fill TT: Intentionally emptying or filling trip tank", { x: 0.5, y: 2.1, w: 9, h: 0.8, fontSize: 14 });
slide7.addText("How It Works:", { x: 0.5, y: 3, w: 9, h: 0.4, fontSize: 14, bold: true });
slide7.addText("1. Enter current stand number\n2. Enter new TT baseline volume\n3. Choose reset type\n4. Add optional comment", { x: 0.5, y: 3.4, w: 9, h: 1, fontSize: 14 });

// Slide 8: RIH/POOH Switching
let slide8 = pres.addSlide();
slide8.addText("4. Key Features - RIH/POOH Mode Switching", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 28, bold: true, color: "1a365d" });
slide8.addText("Switch between trip directions mid-operation:", { x: 0.5, y: 1.2, w: 9, h: 0.4, fontSize: 16 });
slide8.addText("Workflow:", { x: 0.5, y: 1.7, w: 9, h: 0.4, fontSize: 14, bold: true });
slide8.addText("1. Tap the mode badge (top-left)\n2. Confirm the switch\n3. Enter current stand number\n4. Choose: Reset volumes OR Keep current volumes", { x: 0.5, y: 2.1, w: 9, h: 1, fontSize: 14 });
slide8.addText("Features:", { x: 0.5, y: 3.2, w: 9, h: 0.4, fontSize: 14, bold: true });
slide8.addText("• Fail-safe - Confirmation dialogs prevent accidental switches\n• Gain/Loss always resets - Critical metric starts fresh\n• Flexible volume handling - Driller chooses reset behavior\n• Plot clears - Clean visualization for new direction", { x: 0.5, y: 3.6, w: 9, h: 1.2, fontSize: 14 });

// Slide 9: Mirror Screen
let slide9 = pres.addSlide();
slide9.addText("4. Key Features - Mirror Screen", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 28, bold: true, color: "1a365d" });
slide9.addText("Large-display secondary view for the rig floor:", { x: 0.5, y: 1.2, w: 9, h: 0.4, fontSize: 16 });
slide9.addText("Features:", { x: 0.5, y: 1.7, w: 9, h: 0.4, fontSize: 14, bold: true });
slide9.addText("• LIVE indicator - Shows real-time connection\n• Oversized values - Visible from across the room\n• Progress bar - Visual stand tracking\n• Trend graph - Volume visualization\n• Event log - Recent activity", { x: 0.5, y: 2.1, w: 9, h: 1.5, fontSize: 14 });
slide9.addText("Use Cases:", { x: 0.5, y: 3.8, w: 9, h: 0.4, fontSize: 14, bold: true });
slide9.addText("• Doghouse tablet display\n• Rig floor TV/monitor\n• Team visibility for supervisors", { x: 0.5, y: 4.2, w: 9, h: 1, fontSize: 14 });

// Slide 10: Technical Features
let slide10 = pres.addSlide();
slide10.addText("5. Technical Features", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 28, bold: true, color: "1a365d" });
slide10.addText("• Data Export - CSV export for records\n• Per-License Storage - Data persists across sessions\n• Dark/Light Theme - Optimized for all lighting conditions\n• Templates - Save and reuse trip configurations", { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 18 });

// Slide 11: Why TripGuard Wins
let slide11 = pres.addSlide();
slide11.addText("6. Why TripGuard Wins", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 28, bold: true, color: "1a365d" });
slide11.addText("Feature | Benefit", { x: 0.5, y: 1.3, w: 9, h: 0.4, fontSize: 14, bold: true });
slide11.addText("Mid-trip mode switch | Flexibility when plans change\nSurface reset | Don't lose data on unexpected events\nMirror screen | Team visibility\nFractional tubulars | Industry-standard sizing\nReal-time alerts | Proactive problem detection", { x: 0.5, y: 1.8, w: 9, h: 2.5, fontSize: 14 });

// Slide 12: Call to Action
let slide12 = pres.addSlide();
slide12.addText("7. Call to Action", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 28, bold: true, color: "1a365d" });
slide12.addText("TripGuard gives drillers the tools they need to track trips accurately, handle unexpected events, and keep the entire team informed.", { x: 0.5, y: 2, w: 9, h: 1, fontSize: 20, color: "1a365d" });
slide12.addText("Contact us for pricing and demo.", { x: 0.5, y: 3.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "1a365d" });
slide12.addText("TripGuard - The tool that lets drillers drill.", { x: 0.5, y: 5, w: 9, h: 0.5, fontSize: 18, italic: true });

// Save the presentation
pres.writeFile({ fileName: "/Users/tommen/Documents/TripGuard_Presentation.pptx" })
    .then(() => console.log("PowerPoint created successfully!"))
    .catch(err => console.error("Error:", err));