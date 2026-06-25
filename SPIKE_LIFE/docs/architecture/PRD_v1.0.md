Product Requirements Document (PRD) v1.0
Version: 1.0
Project Owner: SPIKE
Product Type: Educational Financial Life Simulation
Platform: Web Application (Desktop + Mobile Responsive)
Target Release: MVP v1

1. Product Vision
SPIKE LIFE™ is a financial life simulation platform that allows learners to experience the consequences of financial decisions across an entire lifetime.
Players build careers, manage cash flow, face life events, protect their families, achieve goals, start businesses, and eventually leave a legacy.
Unlike traditional financial literacy games that focus primarily on investing, SPIKE LIFE focuses on holistic financial planning.
The platform teaches:
* Financial literacy
* Cash flow management
* Protection planning
* Financial Needs Analysis (FNA)
* Advisory thinking
* Financial entrepreneurship
* Client communication
The ultimate goal is to help learners think like both a client and a financial advisor.

2. Strategic Objectives
SPIKE LIFE supports the SPIKE curriculum:
Week 3 – ADVISE
Week 4 – PLAN
Week 5 – PRESENT
It also serves as a bridge into:
* Financial advisory careers
* Entrepreneurship
* Financial planning
* Agency leadership

3. Success Metrics
MVP Success Metrics
* 80% of users complete simulation
* Average session duration >15 minutes
* Users improve FNA understanding
* Users identify protection gaps correctly
* Users can explain basic recommendations
Learning Metrics
* Cash Flow Score
* Protection Score
* Goal Achievement Score
* Advisor Score

4. User Personas
Persona A
Student Explorer
Age: 18–22
Characteristics:
* Little financial knowledge
* Curious about money
* Exploring career options
Learning Goal: Understand financial fundamentals

Persona B
Young Professional
Age: 22–35
Characteristics:
* Working
* Managing income
* Beginning financial decisions
Learning Goal: Understand protection and planning

Persona C
Future Financial Advisor
Age: 20–35
Characteristics:
* Interested in advisory profession
Learning Goal: Develop advisory skills

Persona D
SPIKE Participant
Characteristics:
* Participating in SPIKE curriculum
Learning Goal: Apply workshop concepts through simulation

5. Core Product Concept
Each player lives a simulated financial life.
The simulation progresses through life stages.
Every stage introduces:
* Opportunities
* Risks
* Tradeoffs
* Financial decisions
The player's choices affect future outcomes.

6. Life Stages
Stage 1
LAUNCH
Age 20–30
Focus:
* Education
* Career
* First income

Stage 2
BUILD
Age 30–40
Focus:
* Family
* Housing
* Protection

Stage 3
GROW
Age 40–50
Focus:
* Assets
* Investments
* Business growth

Stage 4
LEAD
Age 50–60
Focus:
* Wealth management
* Leadership
* Expansion

Stage 5
LEGACY
Age 60+
Focus:
* Retirement
* Estate planning
* Wealth transfer

7. MVP Gameplay Loop
Step 1
Review Current Financial Status
Player sees:
* Age
* Income
* Expenses
* Assets
* Debt
* Protection Gap
* Life Score

Step 2
Receive Life Event
Examples:
Promotion
Marriage
Child Birth
Business Opportunity
Critical Illness
Job Loss
Accident
Inheritance
Economic Recession

Step 3
Choose Actions
Player may:
Save
Invest
Buy Protection
Start Business
Pay Debt
Upgrade Lifestyle
Acquire Property

Step 4
Simulation Updates
System recalculates:
Cash Flow
Net Worth
Protection Gap
Goal Progress
Life Score

Step 5
Annual Review
Player receives summary
Simulation advances to next year

8. Financial Engine
Cash Flow Formula
Income
Minus Expenses
Minus Debt Payments
Minus Protection Premiums
Equals
Free Cash Flow

Net Worth Formula
Assets
Minus Liabilities
Equals Net Worth

9. Protection Engine
Unique SPIKE Feature
Every player has:
Protection Need
Actual Protection
Protection Gap
Formula:
Protection Need
=
10x Annual Income
* 
Outstanding Debt
* 
Future Goals
Protection Gap
=
Protection Need
Minus Actual Protection
Negative events become more severe when gaps exist.

10. Goals Engine
Player selects life goals.
Examples:
Home Ownership
Education Fund
Business Ownership
Travel
Retirement
Financial Independence
Each goal has:
Target Amount
Target Age
Completion Status

11. Life Event Engine
Events are categorized.
Positive Events
Career
Business
Investment
Family
Windfalls

Negative Events
Health
Accident
Economic
Natural Disaster
Employment
Family Emergencies

12. Life Score System
The primary performance indicator.
Life Score
=
Net Worth Score
* 
Protection Score
* 
Goal Achievement Score
* 
Impact Score

Components
Net Worth Score
Measures financial strength

Protection Score
Measures preparedness

Goal Achievement Score
Measures life planning success

Impact Score
Measures people helped
Future advisor mode uses this heavily

13. Advisor Mode (Phase 2)
The system generates clients.
Example:
Age 35
Married
2 Children
Income ₱60,000
Mortgage ₱2M
Protection Gap ₱5M
Player acts as advisor.
Must recommend:
Protection
Savings
Investment
Debt Solutions
System evaluates recommendations.

14. Assessment Framework
Track:
Cash Flow Literacy
Protection Literacy
FNA Accuracy
Recommendation Quality
Presentation Quality
Advisor Confidence
Results integrate with SPIKE LMS.

15. MVP Screens
Screen 1
Landing Page
Start Simulation
Learn More
Leaderboard

Screen 2
Character Creation
Background
Goals
Risk Profile

Screen 3
Life Dashboard
Financial Overview

Screen 4
Life Event Modal
Decision Point

Screen 5
Action Selection
Choose Strategy

Screen 6
Annual Review
Progress Report

Screen 7
Final Results
Life Score
Achievements
Reflection

16. Gamification
Achievements
Examples:
Emergency Fund Builder
Debt Destroyer
Family Protector
Goal Crusher
Advisor Rising Star
Legacy Builder

17. SPIKE LMS Integration
Capture:
Simulation Completion
Life Score
Protection Score
Advisor Score
Reflection Answers
These become portfolio evidence inside SPIKE.

18. Technical Architecture
Frontend
Astro
React
Tailwind

Backend
Hono
Cloudflare Workers

Database
Neon PostgreSQL

Authentication
Magic Link
Google Login

AI Services
OpenAI
Functions:
Client Generation
Event Generation
Advisor Scoring
Reflection Feedback

19. MVP Scope
Included
Single Player Mode
Life Simulation
Protection Engine
Goals Engine
Life Score
Basic Dashboard
Annual Review
SPIKE LMS Integration

Excluded
Multiplayer
Advisor Mode
Agency Builder
Live Competitions
Mobile App
AI Coach
These belong to future releases.

20. Future Roadmap
Version 2
Advisor Mode
Client Cases
Recommendation Engine

Version 3
Squad Competitions
Leaderboards
Mentor Dashboard

Version 4
Agency Builder
Recruitment
Team Growth
Leadership

Version 5
Full SPIKE Universe
Career Simulation
Advisor Simulation
Entrepreneur Simulation
Legacy Simulation
Integrated Learning Ecosystem

End of PRD v1.0
