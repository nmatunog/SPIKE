/**
 * Unified venture document types — SPIKE squad venture object.
 */

export type VentureInsight = {
  id: string;
  text: string;
  source?: string;
  createdAt?: string;
};

export type VentureEvidence = {
  id: string;
  type: 'image' | 'note';
  title: string;
  content: string;
  url?: string;
  createdAt?: string;
};

export type VentureSpeakerAssignment = {
  participantId: string;
  name: string;
  section: string;
  order?: number;
};

export type VenturePresentationDeck = {
  assetId?: string;
  url?: string;
  filename?: string;
  updatedAt?: string;
};

export type VentureIdentity = {
  squadName: string;
  ventureName: string;
  tagline: string;
  vision: string;
};

export type VentureResearch = {
  customerSegment: string;
  insights: VentureInsight[];
  evidence: VentureEvidence[];
  opportunityStatement: string;
  ventureOpportunity: string;
};

export type VentureFecRoadmap = {
  months12: string;
  months24: string;
  months36: string;
  successNarrative: string;
};

/** Engine field maps — keys align with canvas_entries / FEC v2. */
export type VentureFec = {
  uniqueVentureProposition: string;
  clientExperience: Record<string, string>;
  growthEngine: Record<string, string>;
  financialEngine: Record<string, string>;
  roadmap: VentureFecRoadmap;
};

export type VenturePitch = {
  story: string;
  speakerAssignments: VentureSpeakerAssignment[];
  presentationDeck: VenturePresentationDeck | null;
  readinessScore: number;
};

export type VentureStage = {
  currentWeek: number;
  currentDay: number;
  completedMilestones: string[];
  unlockedModules: string[];
};

export type VentureDocument = {
  schemaVersion: string;
  identity: VentureIdentity;
  research: VentureResearch;
  fec: VentureFec;
  pitch: VenturePitch;
  stage: VentureStage;
};

export type VentureRow = {
  id: string;
  squad_id: string | null;
  owner_user_id: string;
  schema_version: string;
  identity: VentureIdentity;
  research: VentureResearch;
  fec: VentureFec;
  pitch: VenturePitch;
  stage: VentureStage;
  compiled_snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
