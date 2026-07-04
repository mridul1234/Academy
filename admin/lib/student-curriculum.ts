import type { SiteMetric } from './types';

export type CurriculumLevel = 'beginner' | 'intermediate' | 'advanced';

export type StudentCurriculumRecord = {
  completed_topics: string[];
  updated_at: string;
};

export type StudentCurriculumProgress = Record<string, StudentCurriculumRecord>;

export const STUDENT_CURRICULUM_KEY = 'student_curriculum_progress';

export const beginnerCurriculum = [
  'Movement of the Pieces',
  'Capturing Pieces',
  'Protecting Pieces',
  'Hanging Pieces',
  'Check & Defending Check',
  'Checkmate & Stalemate',
  'Practice & Analysis Session 1',
  'Castling & Pawn Promotion',
  'How to Win a Game of Chess',
  'Draws in Chess',
  "Scholar's Mate",
  'Two Rooks Checkmate',
  'Queen & King Checkmate',
  'Rook & King Checkmate',
  'Practice & Analysis Session 2',
  'Piece Values & Material Advantage',
  'Exchanging Pieces When Ahead in Material',
  'Chess Notation',
  'Practice & Analysis Session 3',
  'Three Phases of the Game',
  'Basic Opening Principles',
  'Additional Opening Principles',
  'Importance of Castling',
  'Practice & Analysis Session 4',
];

export const curriculumByLevel: Record<CurriculumLevel, string[]> = {
  beginner: beginnerCurriculum,
  intermediate: beginnerCurriculum,
  advanced: beginnerCurriculum,
};

export function normalizeCurriculumLevel(level?: string | null): CurriculumLevel {
  if (level === 'intermediate' || level === 'advanced') return level;
  return 'beginner';
}

export function parseStudentCurriculum(metrics: SiteMetric[]): StudentCurriculumProgress {
  const raw = metrics.find((metric) => metric.key === STUDENT_CURRICULUM_KEY)?.value;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as StudentCurriculumProgress : {};
  } catch {
    return {};
  }
}
