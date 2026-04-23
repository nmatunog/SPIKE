import React from 'react';
import {
  BookOpen,
  Users,
  Briefcase,
  FileText,
  CheckCircle,
  Rocket,
  Target,
} from 'lucide-react';
import { ModuleFlowDeck } from './components/ModuleFlowDeck.jsx';

export const orientationSlides = [
  {
    title: 'Welcome to S.P.I.K.E.',
    subtitle: 'A 20-Minute Executive Orientation',
    icon: <Rocket size={48} className="mb-4 text-[#8B0000]" />,
    content: (
      <div className="space-y-6 text-center">
        <p className="text-xl leading-relaxed text-gray-600">
          This is not a traditional internship. We are running a{' '}
          <strong>Startup Business Incubator</strong> designed to transform students into
          independent Financial Entrepreneurs.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-red-100 bg-red-50 p-6">
            <h4 className="mb-2 font-bold text-[#8B0000]">The Interns</h4>
            <p className="text-sm text-gray-700">
              The trainees, who are building their 3-Year business blueprints.
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
            <h4 className="mb-2 font-bold text-blue-800">The Advisory Board</h4>
            <p className="text-sm text-gray-700">
              Mentors and Unit Managers who coach and evaluate field execution.
            </p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-6">
            <h4 className="mb-2 font-bold text-green-800">Venture Partners</h4>
            <p className="text-sm text-gray-700">
              Agency Directors who invest resources and approve promotions.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Methodologies & Dynamics',
    subtitle: 'How we train future Financial Entrepreneurs.',
    icon: <Users size={40} className="mb-4 text-[#8B0000]" />,
    content: (
      <div className="space-y-6 text-left">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#8B0000]">
            <Users size={18} /> Program Group Dynamics
          </h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B0000] text-xs font-bold text-white">
                1
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">Research Squads (3-4 Interns)</p>
                <p className="mt-1 text-sm text-gray-700">
                  Market surveys, demographic profiling, collaborative problem solving.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B0000] text-xs font-bold text-white">
                2
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">Advisory Dyads (Pairs)</p>
                <p className="mt-1 text-sm text-gray-700">
                  Roleplaying, mock client meetings, peer-to-peer pitch refinement.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B0000] text-xs font-bold text-white">
                3
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">Agency Teams (4-5 Interns)</p>
                <p className="mt-1 text-sm text-gray-700">
                  Business planning and franchise simulation (Educate-Expand-Empower).
                </p>
              </div>
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
            <BookOpen size={18} /> Learning Methodologies
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-800">Blended Classroom & LMS</p>
              <p className="mt-1 text-xs text-gray-500">
                Foundational knowledge and technical product mastery.
              </p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-800">Role Shadowing</p>
              <p className="mt-1 text-xs text-gray-500">
                Observing top advisors and partnering for complex cases.
              </p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-800">Relentless Field Execution</p>
              <p className="mt-1 text-xs text-gray-500">
                Daily tracking of prospecting, approaching, and closing.
              </p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-800">Shark Tank Board Pitches</p>
              <p className="mt-1 text-xs text-gray-500">
                High-stakes milestone presentations to Venture Partners.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Segment 1: Proof of Concept',
    subtitle: 'Laying the foundation and building the blueprint.',
    icon: <BookOpen size={40} className="mb-4 text-[#8B0000]" />,
    content: (
      <div className="space-y-6 text-left">
        <p className="text-lg text-gray-700">
          Interns learn the industry landscape, get licensed, and create their ultimate business
          plan.
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Module Flow
            </h4>
            <span className="rounded-full border bg-white px-2 py-1 text-xs font-medium text-gray-500 shadow-sm">
              Click cards to expand
            </span>
          </div>
          <ModuleFlowDeck
            items={[
              {
                title: 'Module 1: Industry Immersion',
                desc: 'Learn the industry landscape, agency orientation, and conduct observational market research.',
              },
              {
                title: 'Module 2: Financial Planning Fundamentals',
                desc: 'Master cash flow, risk management, and practice the Financial Needs Analysis (FNA) process.',
              },
              {
                title: 'Module 3: Business Process Orientation',
                desc: 'Understand backend operations: underwriting, AIA digital portals, and claims processing.',
              },
              {
                title: 'Module 4: Regulatory Compliance & Licensing',
                desc: 'Study the Insurance Code, professional ethics, and undergo intensive exam preparation.',
              },
              {
                title: 'Module 5: Product Solutions',
                desc: "Translate FNA gaps into solutions using AIA's suite of life, health, and VUL products.",
              },
              {
                title: 'Module 6: Insurance Entrepreneurship',
                desc: 'Draft a 3-Year Business Blueprint covering personal sales, recruitment, and agency building.',
              },
              {
                title: 'Module 7: Leadership Development',
                desc: 'Set KPIs, practice situational leadership, and prepare for graduation to Segment 2.',
              },
            ]}
          />
        </div>
        <div className="rounded-r-lg border-l-4 border-[#8B0000] bg-red-50 p-4">
          <h4 className="mb-1 flex items-center gap-2 font-bold text-[#8B0000]">
            <Target size={18} /> Real World Activities
          </h4>
          <p className="text-sm text-gray-700">
            Instead of just taking tests, interns conduct real{' '}
            <strong>Needs Analysis Surveys</strong> on their peers (e.g., Gen Z freelancers). They use
            this actual data to build their 3-Year Educate-Expand-Empower business plan, which they
            must pitch to the Venture Partners to graduate to Segment 2.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
            <FileText size={18} className="text-[#8B0000]" />
            Expected Outputs & Deliverables
          </h4>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              'Market Landscape Research Report',
              'Needs Analysis Market Survey Report',
              'IC Licensure Certification',
              '3-Year Business Plan & Pitch Validation',
            ].map((label) => (
              <li
                key={label}
                className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-sm text-gray-700"
              >
                <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-600" />
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: 'Segment 2: Market Validation',
    subtitle: 'Testing the prototype in the real market.',
    icon: <Briefcase size={40} className="mb-4 text-blue-600" />,
    content: (
      <div className="space-y-6 text-left">
        <p className="text-lg text-gray-700">
          Theoretical knowledge transitions into active sales using the AIA LMS methodologies.
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Module Flow (AIA LMS)
            </h4>
            <span className="rounded-full border bg-white px-2 py-1 text-xs font-medium text-gray-500 shadow-sm">
              Click cards to expand
            </span>
          </div>
          <ModuleFlowDeck
            items={[
              {
                title: 'Module 8: Prospecting & Approaching',
                desc: 'Identify natural markets, qualify leads, and develop modern communication scripts (LMS Modules 1 & 2).',
              },
              {
                title: 'Module 9: Face-to-Face Meetings',
                desc: 'Build rapport, set meeting agendas, and present financial concepts to uncover true motivations (LMS Modules 3 & 4).',
              },
              {
                title: 'Module 10: Presenting Solutions',
                desc: 'Structure presentations around client gaps and master specific AIA product proposals (LMS Modules 5 & 6).',
              },
              {
                title: 'Module 11: Objections & Closing',
                desc: "Master the 'Feel, Felt, Found' method, execute closing techniques, and secure the first 3 paid policies (LMS Modules 7, 8 & 9).",
              },
            ]}
          />
        </div>
        <div className="rounded-r-lg border-l-4 border-blue-600 bg-blue-50 p-4">
          <h4 className="mb-1 flex items-center gap-2 font-bold text-blue-800">
            <Target size={18} /> Real World Activities
          </h4>
          <p className="text-sm text-gray-700">
            An intern uses social media to approach prospects they identified in Segment 1. The
            Advisory Board monitors their conversion metrics (e.g., how many chat approaches turned
            into actual Zoom meetings). To complete this segment, they must secure their first 3 paid
            policies.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
            <FileText size={18} className="text-blue-600" />
            Expected Outputs & Deliverables
          </h4>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              '100-Prospect Lead Pipeline (CRM)',
              '10 Client Meeting & FNA Pitch Logs',
              'Market Validation: First 3 Paid Policies',
              'Sales Funnel Conversion Report',
            ].map((label) => (
              <li
                key={label}
                className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-sm text-gray-700"
              >
                <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-600" />
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: 'Segment 3: Partnership Track',
    subtitle: 'Scaling the business and building the team.',
    icon: <Users size={40} className="mb-4 text-green-600" />,
    content: (
      <div className="space-y-6 text-left">
        <p className="text-lg text-gray-700">
          Interns focus on relentless execution, optimizing their sales funnel, and beginning their
          recruitment drive.
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">Module Flow</h4>
            <span className="rounded-full border bg-white px-2 py-1 text-xs font-medium text-gray-500 shadow-sm">
              Click cards to expand
            </span>
          </div>
          <ModuleFlowDeck
            items={[
              {
                title: 'Module 12: Relentless Execution',
                desc: 'Strictly track daily activities: 20 calls, 3 appointments, and 1 closing attempt daily. Partner with Unit Managers for complex cases.',
              },
              {
                title: 'Module 13: Agency Scaling & Graduation',
                desc: 'Analyze sales data to optimize funnel conversions. Identify potential recruits to begin franchise expansion. Present Year 2 production forecasts to the Venture Partners to graduate.',
              },
            ]}
          />
        </div>
        <div className="rounded-r-lg border-l-4 border-green-600 bg-green-50 p-4">
          <h4 className="mb-1 flex items-center gap-2 font-bold text-green-800">
            <Target size={18} /> Real World Activities
          </h4>
          <p className="text-sm text-gray-700">
            The intern analyzes their first 500 hours of sales data to find inefficiencies. They then
            identify a satisfied client and pitch them to join the agency. In their final presentation
            to the Venture Partners, they sign a Partnership Agreement to enter the Next Gen Advisor
            program.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
            <FileText size={18} className="text-green-600" />
            Expected Outputs & Deliverables
          </h4>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              'NADS Daily Activity Master Logs',
              '500-Hour Sales Optimization Review',
              'Initial Team: 2 Recruits Profiled',
              'Final Partnership Board Pitch Validation',
            ].map((label) => (
              <li
                key={label}
                className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-sm text-gray-700"
              >
                <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-600" />
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
];
