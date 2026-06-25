SPIKE LIFE™
UX Blueprint Amendment 1.1A
Unified Workspace & Five-Lens Navigation Architecture
Status: Approved Design Change
Supersedes:
* UX Blueprint 1.0 Navigation Structure
* UX Blueprint 1.1 Route & Navigation Model

Design Philosophy
SPIKE LIFE is not a collection of disconnected screens.
SPIKE LIFE is a single financial life workspace.
Players should never feel that they are "leaving" their financial life to navigate elsewhere.
Instead, they remain inside one continuous dashboard and simply change the perspective from which they are viewing their life.
This architecture reduces cognitive load, reinforces the educational objectives, and creates a more modern product experience.

Core Principle
One Workspace.
Five Lenses.
The Life Dashboard remains the permanent home throughout the simulation.
Everything else becomes a contextual lens over the same underlying simulation data.
                     SPIKE LIFE

                ┌──────────────────┐
                │   LIFE DASHBOARD │
                └──────────────────┘
                         │
──────────────────────────────────────────────────────
 Life │ Plan │ Protect │ Grow │ Journey
──────────────────────────────────────────────────────
The simulation never changes.
Only the player's perspective changes.

The Five Lenses
1. LIFE
Purpose
Answer:
"Where am I right now?"
Displays
* Current Age
* Current Life Stage
* Life Score
* Current Year
* Annual Financial Snapshot
* Top Priorities
* Current Life Event
* Advance Year
This is the operational center of SPIKE LIFE.

2. PLAN
Purpose
Answer:
"What am I trying to achieve?"
Displays
* Financial Goals
* FNA Summary
* Gap Analysis
* Priority Ranking
* Recommended Actions
* Goal Funding Progress
* Retirement Readiness
Educational Focus
Financial Planning
Goal Planning
Financial Needs Analysis

3. PROTECT
Purpose
Answer:
"What could go wrong, and how prepared am I?"
Displays
* Family Protection Readiness
* Health Protection Readiness
* Income Protection Readiness
* Education Protection Readiness
* Retirement Security Readiness
* Protection Gap Analysis
Educational Focus
Protection Planning
Risk Management
Financial Security
Important
Never expose insurance products.
Always display planning solutions.

4. GROW
Purpose
Answer:
"How am I building wealth?"
Displays
* Cash Flow
* Assets
* Liabilities
* Net Worth
* Investments
* Entrepreneurship
* Business Performance
* Debt Ratios
Educational Focus
Cash Flow Management
Wealth Building
Financial Entrepreneurship

5. JOURNEY
Purpose
Answer:
"What story am I creating?"
Displays
* Life Timeline
* Major Decisions
* Annual Reviews
* Achievements
* Reflection Journal
* Financial Personality
* Advisor Readiness
* Final SPIKE LIFE Report
Educational Focus
Reflection
Self-awareness
Advisory Thinking
Continuous Improvement

Navigation Rules
The dashboard never disappears.
Changing lenses does not navigate to a new application.
It changes the content displayed within the workspace.
Navigation should feel similar to switching tabs within a professional productivity application rather than moving between unrelated pages.

Persistent Dashboard Elements
Regardless of the active lens, the following remain visible:
Header
* Age
* Life Stage
* Life Score
* Current Year
Footer
* Advance Year
* Notifications
* Settings
These anchors reinforce continuity throughout the simulation.

Screen Hierarchy
SPIKE LIFE

└── Life Dashboard
      │
      ├── Life Lens
      ├── Plan Lens
      ├── Protect Lens
      ├── Grow Lens
      └── Journey Lens
The user always returns to the same workspace.
No deep navigation trees.
No disconnected modules.

Educational Mapping
Each lens directly supports the SPIKE curriculum.
Lens	Primary Learning Objective	SPIKE Alignment
Life	Cash Flow Awareness & Annual Decisions	Week 3 – Advise
Plan	Financial Needs Analysis & Goal Planning	Week 4 – Plan
Protect	Risk Discovery & Protection Planning	Week 3 – Advise
Grow	Wealth Building & Financial Entrepreneurship	Weeks 4–5
Journey	Reflection, Communication & Advisory Thinking	Week 5 – Present
UX Guardrail
Every new feature proposed for SPIKE LIFE must answer one question:
"Which of the Five Lenses does this belong to?"
If a feature cannot naturally belong to one of these lenses, it should not become a top-level navigation item.
This prevents feature creep and preserves a clean information architecture.

Future Expansion
Future capabilities should extend an existing lens rather than introducing additional navigation.
Examples
Advisor Mode
→ Plan Lens
Agency Builder
→ Grow Lens
Mentor Feedback
→ Journey Lens
AI Coach
→ Plan Lens
Squad Competition
→ Journey Lens
This ensures the product can scale without increasing interface complexity.

End of UX Blueprint Amendment 1.1A
