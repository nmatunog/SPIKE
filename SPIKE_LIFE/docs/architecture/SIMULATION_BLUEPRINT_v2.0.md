SPIKE LIFE™
Simulation Blueprint v2.0
Version: 2.0
Purpose: Define the simulation architecture, data model, game engine, scoring engine, event engine, and API contracts for SPIKE LIFE MVP.
This document serves as the primary specification for software development.

1. Simulation Architecture
Core Layers
Presentation Layer
(UI)

↓

Simulation Engine

↓

Financial Engine

↓

Event Engine

↓

Scoring Engine

↓

Persistence Layer
(Database)

2. Core Domain Objects
MVP Domain Model
Player

├─ Character Profile
├─ Financial Profile
├─ Protection Profile
├─ Goals
├─ Life Events
├─ Annual Decisions
└─ Life Score

3. Character Profile Schema
{
  "id": "uuid",
  "name": "John",
  "age": 22,
  "careerType": "employee",
  "riskProfile": "moderate",
  "maritalStatus": "single",
  "dependents": 0,
  "currentLifeStage": "launch"
}

4. Career Types
Supported Types
Employee
Professional
Freelancer
Entrepreneur
Advisor
Hybrid

Career Config
{
  "careerType": "employee",
  "baseIncome": 35000,
  "incomeGrowthRate": 0.05,
  "volatility": 0.05
}

5. Financial Profile Schema
{
  "cash": 100000,
  "investments": 0,
  "propertyValue": 0,
  "businessValue": 0,

  "creditCardDebt": 0,
  "personalLoan": 0,
  "housingLoan": 0,
  "businessLoan": 0,

  "monthlyIncome": 35000,
  "monthlyExpenses": 21000,
  "monthlyDebtPayments": 0
}

6. Protection Profile Schema
{
  "lifeCover": 0,
  "criticalIllnessCover": 0,
  "medicalCover": 0,
  "accidentCover": 0,
  "incomeProtectionCover": 0
}

7. Goal Schema
{
  "goalId": "home",
  "goalName": "Own a Home",
  "targetAmount": 3000000,
  "targetAge": 40,
  "currentFunding": 200000,
  "status": "active"
}

8. Life Event Schema
{
  "eventId": "promotion_001",
  "eventType": "career",
  "eventCategory": "positive",
  "title": "Promotion",
  "description": "You received a promotion.",
  "financialImpact": 0,
  "incomeMultiplier": 1.20,
  "expenseMultiplier": 1.00,
  "probability": 0.05
}

9. Decision Schema
{
  "year": 2028,
  "playerId": "uuid",
  "action": "buy_protection",
  "amount": 50000
}

10. Life Stages
Launch
Age 22–29

Build
Age 30–39

Grow
Age 40–49

Lead
Age 50–59

Legacy
Age 60–65

Stage Transition Rules
Automatic by age.

11. Annual Simulation Cycle
Step 1
Load Current State
↓
Step 2
Generate Event
↓
Step 3
Apply Event Effects
↓
Step 4
Player Makes Decisions
↓
Step 5
Recalculate Financial Position
↓
Step 6
Update Goals
↓
Step 7
Update Protection Gap
↓
Step 8
Update Life Score
↓
Step 9
Advance One Year

12. Financial Engine
Net Worth
Assets - Liabilities
Assets
Cash
Investments
Property
Business

Liabilities
Credit Card
Personal Loan
Housing Loan
Business Loan

Cash Flow
Income
-
Expenses
-
Debt Payments
-
Protection Cost
=
Free Cash Flow

13. Protection Engine
Life Need
(Annual Income × 10)
+
Debt
+
Goal Funding Gap

CI Need
Annual Income × 3

Income Protection Need
Annual Income × 2

Medical Need
500,000 Base

Protection Gap
Need
-
Current Cover

Protection Adequacy
Current Cover
÷
Required Cover

14. Goal Engine
Goal Progress
Current Funding
÷
Target Amount

Goal Completion
Goal Progress >= 100%

Goal Score
Maximum:
200 points

15. Event Library
MVP Event Count
100
Categories
Career
15

Health
20

Family
20

Business
15

Economic
10

Opportunity
20

16. Career Events
Examples
Promotion
Salary Increase
Job Loss
Overseas Opportunity
Leadership Role
Career Shift

17. Family Events
Examples
Marriage
Child Birth
Additional Child
Dependent Parent
Divorce
Widowhood

18. Health Events
Examples
Minor Illness
Hospitalization
Critical Illness
Disability
Accident

19. Economic Events
Examples
Inflation Spike
Market Crash
Recession
Property Boom
Interest Rate Increase

20. Opportunity Events
Examples
Investment Opportunity
Business Venture
Partnership
Franchise
Inheritance
Scholarship

21. Decision Actions
Available Actions
Save Cash
Invest
Buy Protection
Pay Debt
Buy Property
Start Business
Fund Goal
Upgrade Lifestyle
Reduce Lifestyle

22. Life Score Engine
Maximum
1000
Points
Net Worth
300

Protection
250

Goals
200

Cash Flow
150

Impact
100

Formula
LifeScore

=
NW
+
Protection
+
Goals
+
CashFlow
+
Impact

23. Achievement System
Emergency Fund Builder

Debt Free

Family Protector

Millionaire

Goal Achiever

Legacy Builder

24. Reflection Engine
End Simulation Output
{
  "lifeScore": 812,
  "rating": "Master Planner",
  "strongestArea": "Protection",
  "weakestArea": "Debt Management",
  "completedGoals": 4,
  "protectionGap": 0
}

25. Database Tables
players

character_profiles

financial_profiles

protection_profiles

goals

events

event_history

decisions

life_scores

achievements

simulation_runs

26. API Endpoints
POST
/api/simulation/start

GET
/api/player/{id}

POST
/api/event/generate

POST
/api/decision

POST
/api/year/advance

GET
/api/life-score

GET
/api/summary

27. MVP Seed Data
Character Templates
10

Goal Templates
20

Life Events
100

Achievements
25

Career Paths
6

Protection Products
5

28. Future Expansion Modules
Advisor Mode
Client Case Engine
Recommendation Engine

Agency Builder
Recruitment
Team Growth
Leadership

AI Coach
Reflection Feedback
Mentor Integration

Squad Competition
Leaderboard
Tournament Mode

End of Simulation Blueprint v2.0
