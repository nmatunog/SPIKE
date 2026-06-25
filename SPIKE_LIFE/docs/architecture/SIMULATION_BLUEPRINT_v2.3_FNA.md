SPIKE LIFE™
Simulation Blueprint v2.3
Financial Needs Analysis (FNA) Engine & Recommendation Engine
Version: 2.3
Purpose:
Define the FNA system that evaluates a player's financial situation, identifies gaps, prioritizes needs, and generates recommendations.
This engine powers:
* Protection Planning
* Goal Planning
* Recommendation Engine
* Advisor Mode
* Reflection Reports
* Mentor Feedback
* AI Coach (Future)

1. Core Philosophy
SPIKE LIFE teaches participants to think like planners.
The engine should evaluate:
Current Situation
↓
Financial Gaps
↓
Planning Priorities
↓
Recommended Actions
↓
Expected Outcomes

The system does NOT recommend products.
The system recommends solutions.

2. FNA Framework
The SPIKE FNA Engine evaluates five dimensions.
1. Cash Flow
2. Protection
3. Debt
4. Goals
5. Retirement

Each dimension produces:
Score
Gap Analysis
Priority Ranking
Recommendation

3. Financial Health Dashboard
Player Profile
{
  "cashFlowScore": 0,
  "protectionScore": 0,
  "debtScore": 0,
  "goalScore": 0,
  "retirementScore": 0
}
Each score ranges:
0–100

4. Cash Flow Analysis
Purpose:
Determine financial sustainability.
Formula
Annual Income
* 
Annual Expenses
=
Net Cash Flow

Cash Flow Ratio
Surplus Income
÷
Total Income

Scoring
20%+ Surplus
100

15–19%
80

10–14%
60

5–9%
40

Below 5%
20

Negative
0

5. Emergency Fund Analysis
Target
6 Months Expenses

Formula
Emergency Fund
÷
6 Months Expenses

Status
100%
Fully Funded

75–99%
Near Target

50–74%
Moderate Gap

Below 50%
Severe Gap

6. Protection Analysis
Purpose
Determine family financial security.

7. Family Protection Need
Formula
Annual Income × 10

+

Outstanding Debt

+

Goal Funding Gap

Example
Income
₱600,000
Debt
₱2,000,000
Goals
₱4,000,000
Need
₱12,000,000

8. Family Protection Gap
Formula
Protection Need

-

Current Family Protection

Scoring
100% Funded
100

75–99%
80

50–74%
60

25–49%
40

Below 25%
20

9. Health Protection Need
Formula
Base Health Need
₱500,000
* 
Dependents × ₱250,000

Gap Calculation
Health Need
* 
Health Protection Value

10. Income Protection Need
Formula
2 × Annual Income

Purpose
Protect earning ability.

11. Education Goal Analysis
Formula
Number of Children

×

₱2,000,000

Progress
Current Funding

÷

Required Funding

12. Home Goal Analysis
Formula
Current Funding

÷

Home Goal Target

13. Retirement Analysis
Retirement Target
Annual Expenses

×

20

Example
Annual Expenses
₱500,000
Target
₱10,000,000

Retirement Readiness
Current Retirement Assets

÷

Retirement Target

14. Debt Analysis
Debt Ratio
Monthly Debt Payments

÷

Monthly Income

Scoring
Below 20%
100

20–30%
80

30–40%
60

40–50%
40

Above 50%
20

15. Goal Analysis
Goal Score
Based on:
Completed Goals
* 
Goal Funding Progress
* 
Target Age Achievement

Maximum
100

16. Priority Ranking Engine
The system ranks needs automatically.
Priority Levels
Critical
High
Medium
Low

Example
Protection Gap
90%
Priority
Critical

Retirement Gap
20%
Priority
Medium

17. Recommendation Engine
Recommendations must follow priority order.

Example
Player
Age 34
Married
2 Children
Mortgage
No Protection
Low Emergency Fund

Output
Priority 1
Strengthen Family Protection Plan

Priority 2
Build Emergency Fund

Priority 3
Reduce Debt

Priority 4
Increase Retirement Funding

18. Recommendation Rules
Rule 1
Critical gaps always appear first.

Rule 2
Protection precedes wealth building.

Rule 3
Emergency Fund precedes aggressive investing.

Rule 4
Debt stress reduces investment priority.

Rule 5
Family obligations increase protection priority.

19. FNA Snapshot Object
{
  "cashFlow": 72,
  "protection": 45,
  "debt": 65,
  "goals": 58,
  "retirement": 32,

  "topPriority": "Family Protection",

  "overallFnaScore": 54
}

20. Overall FNA Score
Weighted Formula
Cash Flow
20%
Protection
30%
Debt
15%
Goals
20%
Retirement
15%

Formula
FNA Score

=

(Cash Flow × .20)

+

(Protection × .30)

+

(Debt × .15)

+

(Goals × .20)

+

(Retirement × .15)

21. FNA Ratings
90–100
Financially Secure

80–89
Well Planned

70–79
Progressing Well

60–69
Needs Attention

50–59
At Risk

Below 50
Critical Gaps

22. Advisor Mode Integration
Future Feature
Generated Client
↓
Run FNA Engine
↓
Identify Gaps
↓
Player Recommendation
↓
System Comparison
↓
Advisor Score

23. Reflection Report Integration
End-of-Game Report
Includes
Highest Score
Lowest Score
Top Gap
Missed Goal
Recommended Next Step
Financial Personality
Advisor Readiness

24. Mentor Dashboard Integration
Mentors can view:
FNA Scores
Gap Trends
Decision Quality
Planning Progress
Advisor Readiness

25. MVP Output
At the end of every year:
Generate:
FNA Score
Top 3 Gaps
Top 3 Priorities
Recommended Actions
Progress Summary
This becomes the central planning engine of SPIKE LIFE.

End of Simulation Blueprint v2.3
