SPIKE LIFE™
UX Blueprint 1.1
Information Architecture & Screen Specifications
Version: 1.1
Purpose:
Define every screen, layout, component, navigation rule, and interaction required for the MVP.
This document is intended to translate directly into React components and application routes.

1. Information Architecture
Landing

│

├── Character Creation
│
├── Initial FNA Assessment
│
└── Life Dashboard
        │
        ├── Life Event
        ├── Decisions
        ├── Goals
        ├── Protection Planning
        ├── Wealth
        ├── Journey
        ├── Annual Review
        └── Final Report
The Life Dashboard is the permanent home screen.
Every other screen returns here.

2. Route Structure
/

/

/create

/fna

/life

/goals

/protection

/wealth

/journey

/review

/report

/profile

/settings

3. Landing Page
Purpose
Introduce SPIKE LIFE.
Minimal scrolling.

Components
Hero
Short Value Proposition
Start Simulation
Continue Simulation
About SPIKE LIFE

CTA
Start Your Financial Life

4. Character Creation
Wizard
Step 1
Choose Archetype
↓
Step 2
Career Path
↓
Step 3
Risk Preference
↓
Step 4
Life Goals
↓
Step 5
Review
↓
Create Character

Components
Progress Indicator
Character Cards
Goal Selector
Summary Card

5. Initial FNA Assessment
Purpose
Establish baseline.

Displays
Cash Flow
Protection
Debt
Goals
Retirement

Outputs
Top 3 Priorities
Top 3 Gaps
Initial Life Score
Begin Simulation

6. Life Dashboard
Primary Screen
Never removed.

Layout
┌───────────────────────────────────────────────┐
│ Header                                        │
├───────────────────────────────────────────────┤
│ Life Summary Cards                            │
├───────────────────────────────────────────────┤
│ Current Priorities                            │
├───────────────────────────────────────────────┤
│ Goals Snapshot                                │
├───────────────────────────────────────────────┤
│ Recent Life Events                            │
├───────────────────────────────────────────────┤
│ Advance Year Button                           │
└───────────────────────────────────────────────┘

Header
Age
Life Stage
Career
Life Score
Settings

Life Summary Cards
Cash Flow
Protection
Goals
Retirement
Net Worth
Each card opens detail view.

7. Life Event Modal
Triggered after:
Advance Year

Contains
Illustration
Title
Narrative
Financial Impact
Emotional Impact
Continue Button

No navigation.
Player must acknowledge.

8. Decision Workspace
Appears after event.
Layout
Event

↓

Recommendations

↓

Available Actions

↓

Decision Summary

↓

Confirm

Each action card contains:
Title
Purpose
Immediate Cost
Long-Term Impact
Affected Scores

9. Goals Screen
Card Layout
One card per goal.
Card Components
Icon
Goal Name
Progress Bar
Funding Status
Target Age
Recommendation

Actions
Fund Goal
Adjust Priority
View Details

10. Protection Planning Screen
Purpose
Visualize readiness.

Layout
Five cards.
Family Protection
Health Protection
Income Protection
Education Protection
Retirement Security

Each card contains
Readiness Meter
Gap Indicator
Recommendation
Expected Improvement

Avoid insurance terminology.

11. Wealth Screen
Sections
Assets
Liabilities
Cash Flow
Net Worth
Allocation

Visuals
Cards
Charts
Progress Indicators
Minimal tables

12. Journey Screen
Timeline
Age 22

First Job

↓

Age 25

Promotion

↓

Age 27

Marriage

↓

Age 31

Bought Home

↓

Age 36

Started Business

Timeline Items
Event
Decision
Lesson
Outcome

13. Annual Review
Purpose
Learning checkpoint.

Cards
Life Score
FNA Score
Achievements
Top Risks
Recommendations
Reflection

Primary CTA
Continue Life

14. Final Report
Structure
Life Summary
↓
Financial Journey
↓
Life Score
↓
Achievements
↓
Financial Personality
↓
Advisor Readiness
↓
Reflection

Export
PDF
SPIKE Portfolio

15. Mobile Navigation
Bottom Navigation
🏠

Goals

Protection

Wealth

Journey
Profile and Settings
Accessible from Header.

16. Desktop Layout
Left Sidebar
Navigation

Main Content
Dashboard

Right Sidebar
Recommendations
Notifications
Simulation Status

17. Component Library
Core Components
Life Score Card
FNA Score Card
Metric Card
Goal Card
Protection Card
Asset Card
Decision Card
Event Card
Timeline Card
Achievement Badge
Recommendation Card
Reflection Card
Progress Meter

18. Component States
Every card supports
Loading
Empty
Healthy
Warning
Critical
Completed

19. Color Language
Never use color alone.
Status
Healthy
Green + Check

Needs Attention
Amber + Warning

Critical
Red + Alert

Completed
Blue + Trophy

20. Interaction Rules
Every interaction should require
Three clicks or fewer.

Animations
Fast
Subtle
Meaningful

No unnecessary transitions.

21. Responsive Rules
Desktop
Three-column dashboard.

Tablet
Two-column dashboard.

Mobile
Single-column cards.

The simulation logic remains identical.

22. Data Binding
Every visible metric is driven by the simulation engine.
Examples
Cash Flow Card
← Financial Engine

Protection Card
← FNA Engine

Recommendations
← Recommendation Engine

Timeline
← Event History

Life Score
← Scoring Engine

No UI component performs financial calculations.
The UI only renders engine outputs.

23. MVP Screen Checklist
Landing
Character Creation
Initial FNA
Life Dashboard
Life Event Modal
Decision Workspace
Goals
Protection Planning
Wealth
Journey Timeline
Annual Review
Final Report
Profile
Settings

24. UX Design Guardrails
One primary dashboard.
One major decision per interaction.
One learning objective per screen.
Numbers always paired with plain-language explanations.
Actions described as financial planning solutions, never product purchases.
Every screen should help the player answer:
* Where am I now?
* What changed?
* What matters most?
* What should I do next?
* Why does it matter?
If a screen does not answer at least one of these questions, redesign it.

End of UX Blueprint 1.1
