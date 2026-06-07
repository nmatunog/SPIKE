/** SPIKE Sprint 02 — instructional architecture domain model. */

export interface Program {
  id: string
  title: string
  description: string
}

export interface Segment {
  id: string
  title: string
  description: string
  hours: number
  milestoneObjective: string
  capstoneTitle: string
  capstoneDescription: string
  certificationAwarded: string
  exitRequirements: string[]
}

export interface Week {
  id: string
  segmentId: string
  weekNumber: number
  title: string
  theme: string
  milestoneObjective: string
  businessPlanChapter: string
  portfolioSection: string
}

export interface Day {
  id: string
  segmentId: string
  weekId: string
  dayNumber: number
  title: string
  theme: string
  durationHours: number
  learningObjectives: string[]
  expectedOutputs: string[]
  portfolioDeliverables: string[]
  businessPlanIntegration: string
  presentations: string[]
  activities: string[]
  worksheets: string[]
  assessments: string[]
}

/** Session layer — splits a day into facilitatable blocks. */
export interface Session {
  id: string
  dayId: string
  sessionNumber: number
  title: string
  durationMinutes: number
  presentationIds: string[]
  activityIds: string[]
  worksheetIds: string[]
  assessmentIds: string[]
  reflectionIds: string[]
  surveyIds: string[]
}

export interface Reflection {
  id: string
  dayId: string
  title: string
  prompts: string[]
}

export interface FacilitatorGuide {
  dayId: string
  title: string
  durationHours: number
  prepChecklist: string[]
  sessionFlow: Array<{ time: string; activity: string; notes: string }>
  debriefQuestions: string[]
  commonPitfalls: string[]
  coachingTips: string[]
}

export type PlaybookItemType =
  | 'worksheet'
  | 'activity'
  | 'reflection'
  | 'assessment'
  | 'survey'
  | 'presentation'

export interface DayCompletionSummary {
  dayId: string
  totalItems: number
  completedItems: number
  percent: number
  items: Array<{ id: string; type: PlaybookItemType; title: string; completed: boolean }>
}

export type CompetencyCategory = 'personal' | 'technical' | 'business' | 'leadership'

export interface Competency {
  id: string
  title: string
  category: CompetencyCategory
  description: string
}

export interface Milestone {
  id: string
  segmentId: string
  title: string
  targetHour: number
  description: string
}

export interface WeekIntegration {
  weekId: string
  businessPlanChapter: string
  portfolioSection: string
  competencyTargets: string[]
  milestoneReview: string
}

export interface BusinessPlanChapter {
  id: string
  title: string
  description: string
  weekOwner: number
}

export interface BusinessPlanArtifact {
  id: string
  participantId: string
  chapterId: string
  title: string
  content: string
  sourceType: string
  sourceId: string
}

export interface PortfolioSection {
  id: string
  title: string
  description: string
}

export type PortfolioArtifactStatus = 'draft' | 'submitted' | 'approved'

export interface PortfolioArtifact {
  id: string
  participantId: string
  sectionId: string
  title: string
  content: string
  sourceType: string
  sourceId: string
  status: PortfolioArtifactStatus
}

export interface PortfolioReview {
  id: string
  participantId: string
  reviewerId: string
  notes: string
  score: number
}

export interface CareerTrack {
  id: string
  title: string
  framework: string[]
  description: string
}

export interface TrackRequirement {
  id: string
  trackId: string
  title: string
  description: string
}

export interface DayContribution {
  dayId: string
  contributesToPortfolio: string[]
  contributesToBusinessPlan: string[]
  contributesToCompetencies: string[]
}

export type SurveyQuestionType =
  | 'short_text'
  | 'long_text'
  | 'rating'
  | 'checkbox'
  | 'single_choice'
  | 'multiple_choice'
  | 'ranking'

export interface SurveyQuestion {
  id: string
  surveyId: string
  prompt: string
  type: SurveyQuestionType
  required: boolean
  sortOrder: number
  /** Options for single_choice, multiple_choice, ranking */
  options?: string[]
}

export interface SurveyResponseAnswer {
  questionId: string
  value: string | number | boolean | string[] | Record<string, number>
}

export interface SurveyResponse {
  id: string
  participantId: string
  surveyId: string
  dayId: string
  answers: SurveyResponseAnswer[]
  submittedAt: string
}

export type SurveyStatus = 'draft' | 'active' | 'closed'

export interface Survey {
  id: string
  dayId: string
  title: string
  description: string
  status: SurveyStatus
}

export type ResearchProjectStatus = 'planned' | 'active' | 'completed'

export interface ResearchProject {
  id: string
  squadId: string
  title: string
  hypothesis: string
  status: ResearchProjectStatus
}

export interface ResearchSquad {
  id: string
  cohortId: string
  name: string
  memberIds: string[]
}

export interface VentureBoard {
  id: string
  segmentId: string
  title: string
  targetHour: number
}

export interface VentureBoardCriterion {
  id: string
  boardId: string
  title: string
  weight: number
}

export interface Slide {
  id: string
  presentationId: string
  sortOrder: number
  title: string
  body: string
  speakerNotes: string
  discussionQuestions: string[]
}

export interface Presentation {
  id: string
  dayId: string
  title: string
  slideIds: string[]
}

export interface Activity {
  id: string
  dayId: string
  title: string
  durationMinutes: number
  materials: string[]
  instructions: string[]
  outputs: string[]
  debriefQuestions: string[]
}

export type WorksheetQuestionType = 'short_text' | 'long_text' | 'rating' | 'checkbox' | 'file_upload'

export interface WorksheetQuestion {
  id: string
  worksheetId: string
  prompt: string
  type: WorksheetQuestionType
  required: boolean
  sortOrder: number
}

export interface Worksheet {
  id: string
  dayId: string
  title: string
  questionIds: string[]
}

export interface Rubric {
  id: string
  assessmentId: string
  title: string
  criteria: string[]
}

export interface Assessment {
  id: string
  dayId: string
  title: string
  description: string
  rubricId: string | null
}
