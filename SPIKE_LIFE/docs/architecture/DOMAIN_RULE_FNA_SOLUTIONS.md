SPIKE LIFE Domain Rule
FNA-Based Solution Architecture
Mandatory Rule
SPIKE LIFE must never present insurance, protection, or planning solutions as individual products.
The platform is an educational financial planning simulator, not a product marketplace.
All recommendations, decisions, simulations, scoring, dashboards, reports, client cases, advisor exercises, and user interfaces must be framed using Financial Needs Analysis (FNA) solution categories.

Replace Product Thinking With Solution Thinking
DO NOT USE
* Buy Life Insurance
* Buy Critical Illness Insurance
* Buy Medical Insurance
* Buy Accident Insurance
* Buy Income Protection Insurance
DO NOT expose these as primary user actions.

USE INSTEAD
Family Protection Plan
Purpose:
Protect dependents from income loss caused by death.
Underlying coverage may include:
* Life protection
* Survivor income replacement
* Debt protection
User-facing language:
"Strengthen Family Protection"

Income Protection Plan
Purpose:
Protect future earning ability.
Underlying coverage may include:
* Disability protection
* Income replacement
* Recovery support
User-facing language:
"Protect Your Income"

Health Protection Plan
Purpose:
Protect against medical and critical illness expenses.
Underlying coverage may include:
* Medical coverage
* Critical illness coverage
* Hospitalization support
User-facing language:
"Strengthen Health Protection"

Education Protection Plan
Purpose:
Protect children's future education funding.
Underlying coverage may include:
* Education funding protection
* Goal continuation funding
User-facing language:
"Secure Education Goals"

Retirement Security Plan
Purpose:
Protect retirement objectives and future income needs.
Underlying solutions may include:
* Long-term savings
* Retirement accumulation
* Retirement income planning
User-facing language:
"Strengthen Retirement Security"

UI Requirements
Every screen must use solution language.
Example:
BAD
Buy Life Insurance
Buy Critical Illness Insurance
Buy Medical Insurance

GOOD
Family Protection Plan
Health Protection Plan
Income Protection Plan
Education Protection Plan
Retirement Security Plan

Dashboard Requirements
Replace:
Coverage Purchased
With:
Protection Readiness

Replace:
Insurance Products
With:
Protection Solutions

Replace:
Policies Owned
With:
Active Protection Plans

Advisor Mode Requirements
When evaluating recommendations:
DO NOT score based on product selection.
Score based on:
* Protection Gap Reduction
* Goal Funding Improvement
* Cash Flow Sustainability
* Family Security Improvement
* Retirement Readiness
Example:
BAD
Client needs Product A.

GOOD
Client has a severe Family Protection Gap.
Recommended Solution:
Family Protection Plan.

Simulation Engine Requirements
The simulation engine may maintain underlying protection variables:
lifeCover
criticalIllnessCover
medicalCover
incomeProtectionCover
These are internal calculations only.
They must not be exposed as primary educational concepts.
The user-facing experience must always surface solution categories rather than insurance products.

Educational Principle
SPIKE LIFE teaches:
Needs → Planning → Solutions → Outcomes
NOT
Products → Purchase
The simulator must reinforce advisory thinking and Financial Needs Analysis rather than product selling.
This principle takes precedence over all future UI, content, gameplay, advisor mode, scoring engine, and simulation engine implementations.
