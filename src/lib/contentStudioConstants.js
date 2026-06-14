/** Content Studio™ — Sprint 06A constants */

export const CONTENT_STATUS = {
  draft: { label: 'Draft', tone: 'bg-slate-100 text-slate-700' },
  review: { label: 'Review', tone: 'bg-amber-100 text-amber-800' },
  published: { label: 'Published', tone: 'bg-emerald-100 text-emerald-800' },
  archived: { label: 'Archived', tone: 'bg-gray-100 text-gray-600' },
};

export const CONTENT_BLOCK_TYPES = [
  { id: 'text', label: 'Text' },
  { id: 'presentation', label: 'Presentation' },
  { id: 'video', label: 'Video' },
  { id: 'worksheet', label: 'Worksheet' },
  { id: 'survey', label: 'Survey' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'discussion', label: 'Discussion' },
  { id: 'reflection', label: 'Reflection' },
  { id: 'rubric', label: 'Rubric' },
  { id: 'activity', label: 'Activity' },
  { id: 'faculty_guide', label: 'Program Coach Guide' },
  { id: 'mentor_guide', label: 'Mentor Guide' },
  { id: 'coaching_template', label: 'Coaching Template' },
  { id: 'observation_form', label: 'Observation Form' },
  { id: 'reflection_form', label: 'Reflection Form' },
  { id: 'file', label: 'File' },
];

export const WORKSHEET_TYPES = [
  { id: 'builder', label: 'Builder' },
  { id: 'reflection', label: 'Reflection' },
  { id: 'research', label: 'Research' },
  { id: 'planning', label: 'Planning' },
  { id: 'assessment', label: 'Assessment' },
];

export const ASSESSMENT_TYPES = [
  { id: 'quiz', label: 'Quiz' },
  { id: 'reflection', label: 'Reflection' },
  { id: 'presentation', label: 'Presentation' },
  { id: 'practical', label: 'Practical Exercise' },
];

export const ACTIVITY_FORMATS = [
  { id: 'individual', label: 'Individual' },
  { id: 'squad', label: 'Squad' },
  { id: 'cohort', label: 'Cohort' },
];

export const ASSET_TYPES = [
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: 'pdf', label: 'PDF' },
  { id: 'pptx', label: 'PPTX' },
  { id: 'template', label: 'Template' },
  { id: 'worksheet', label: 'Worksheet' },
  { id: 'logo', label: 'Logo' },
  { id: 'other', label: 'Other' },
];

/** Sidebar navigation for /admin/content-studio */
export const CONTENT_STUDIO_NAV = [
  { path: '/admin/content-studio', label: 'Curriculum', end: true },
  { path: '/admin/content-studio/playbooks', label: 'Playbooks' },
  { path: '/admin/content-studio/presentations', label: 'Presentations', blockType: 'presentation' },
  { path: '/admin/content-studio/worksheets', label: 'Worksheets', blockType: 'worksheet' },
  { path: '/admin/content-studio/activities', label: 'Activities', blockType: 'activity' },
  { path: '/admin/content-studio/assessments', label: 'Assessments', blockType: 'assessment' },
  { path: '/admin/content-studio/surveys', label: 'Surveys', blockType: 'survey' },
  { path: '/admin/content-studio/rubrics', label: 'Rubrics', blockType: 'rubric' },
  { path: '/admin/content-studio/mentor-guides', label: 'Mentor Guides', blockType: 'mentor_guide' },
  { path: '/admin/content-studio/coaching-templates', label: 'Coaching Templates', blockType: 'coaching_template' },
  { path: '/admin/content-studio/observation-forms', label: 'Observation Forms', blockType: 'observation_form' },
  { path: '/admin/content-studio/reflection-forms', label: 'Reflection Forms', blockType: 'reflection_form' },
  { path: '/admin/content-studio/faculty-guides', label: 'Program Coach Guides', blockType: 'faculty_guide' },
  { path: '/admin/content-studio/media', label: 'Media Library', section: 'media' },
  { path: '/admin/content-studio/day-builder', label: 'Day Builder', section: 'day-builder' },
];

/** Day template sections shown in Day Builder */
export const DAY_TEMPLATE_SECTIONS = [
  'Learning Objectives',
  'Key Concepts',
  'Presentations',
  'Activities',
  'Worksheets',
  'Discussion Questions',
  'Assessments',
  'Assignments',
  'Deliverables',
];
