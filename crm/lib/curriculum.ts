import fs from 'fs/promises';
import path from 'path';
import type { Student } from './types';

export type CurriculumTopic = {
  id: string;
  title: string;
  objective: string;
  practice: string;
};

export type CurriculumLevel = {
  id: string;
  name: string;
  description: string;
  topics: CurriculumTopic[];
};

export type StudentCurriculumPlacement = {
  student_id: string;
  level_id: string;
  completed_topic_id?: string;
  updated_at: string;
};

export const curriculumStandard = {
  id: 'chessgum-foundation-v1',
  name: 'ChessGum Foundation Standard',
  description: 'A practical chess curriculum for academy students, moving from board fluency to calculation, planning, and game review.',
  levels: [
    {
      id: 'beginner',
      name: 'Beginner',
      description: 'Board confidence, legal moves, tactics, and basic checkmate patterns.',
      topics: [
        {
          id: 'beginner-board-coordinates',
          title: 'Board Coordinates and Piece Setup',
          objective: 'Make the student fluent with files, ranks, squares, and starting position.',
          practice: 'Call out 10 squares, then ask the student to place every piece from memory.',
        },
        {
          id: 'beginner-legal-moves',
          title: 'Legal Moves and Captures',
          objective: 'Confirm every piece movement rule and remove illegal-move habits.',
          practice: 'Give 12 position prompts and ask for all legal moves of the highlighted piece.',
        },
        {
          id: 'beginner-check-rules',
          title: 'Check, Escape, and Checkmate',
          objective: 'Teach the three ways to escape check and how checkmate differs from check.',
          practice: 'Show five king-in-check positions and ask the student to find every escape.',
        },
        {
          id: 'beginner-one-move-tactics',
          title: 'One-Move Tactics',
          objective: 'Introduce captures, forks, pins, skewers, and hanging pieces.',
          practice: 'Solve 10 one-move puzzles, naming the tactic before playing the move.',
        },
        {
          id: 'beginner-basic-mates',
          title: 'Basic Mate Patterns',
          objective: 'Recognize ladder mate, back-rank mate, and queen plus king mate ideas.',
          practice: 'Play three mini positions where the student must finish the mate.',
        },
      ],
    },
    {
      id: 'intermediate',
      name: 'Intermediate',
      description: 'Calculation habits, opening principles, middlegame plans, and endgame basics.',
      topics: [
        {
          id: 'intermediate-opening-principles',
          title: 'Opening Principles',
          objective: 'Develop pieces, fight for the center, castle safely, and avoid early queen adventures.',
          practice: 'Review the first 10 moves of two student games and score each opening decision.',
        },
        {
          id: 'intermediate-calculation-tree',
          title: 'Calculation Tree',
          objective: 'Build a repeatable think-before-moving process: candidate moves, replies, consequences.',
          practice: 'Use three tactical positions and write a two-ply line before moving.',
        },
        {
          id: 'intermediate-king-safety',
          title: 'King Safety and Attacking Signals',
          objective: 'Identify open lines, weak back ranks, loose defenders, and unsafe kings.',
          practice: 'Mark attacking signals in five positions and choose the best attacking move.',
        },
        {
          id: 'intermediate-endgame-conversion',
          title: 'Pawn Endgames and Opposition',
          objective: 'Teach opposition, passed pawns, promotion races, and king activity.',
          practice: 'Play two king-and-pawn endgames from both sides.',
        },
        {
          id: 'intermediate-game-review',
          title: 'Game Review Method',
          objective: 'Review games by finding turning points, not only engine mistakes.',
          practice: 'Pick three moments from a student game: best move, risky move, learning moment.',
        },
      ],
    },
    {
      id: 'advanced',
      name: 'Advanced',
      description: 'Strategic planning, calculation depth, tournament preparation, and advanced review.',
      topics: [
        {
          id: 'advanced-positional-planning',
          title: 'Positional Planning',
          objective: 'Convert pawn structure, piece activity, and king safety into a concrete plan.',
          practice: 'For three positions, write one plan and two improving moves.',
        },
        {
          id: 'advanced-complex-calculation',
          title: 'Complex Calculation',
          objective: 'Calculate forcing lines with checks, captures, threats, and quiet moves.',
          practice: 'Solve four multi-move positions with a written candidate-move tree.',
        },
        {
          id: 'advanced-opening-repertoire',
          title: 'Opening Repertoire Review',
          objective: 'Connect opening choices to middlegame plans and common tactical themes.',
          practice: 'Review one repertoire line and explain the plan after move 10.',
        },
        {
          id: 'advanced-endgame-technique',
          title: 'Technical Endgames',
          objective: 'Improve rook endings, minor-piece endings, and conversion technique.',
          practice: 'Play one rook endgame and one bishop/knight endgame from a target position.',
        },
        {
          id: 'advanced-tournament-routine',
          title: 'Tournament Routine',
          objective: 'Build pre-game preparation, time management, and post-game review habits.',
          practice: 'Create a five-step routine for the student’s next tournament game.',
        },
      ],
    },
  ] satisfies CurriculumLevel[],
};

const placementPath = path.join(process.cwd(), 'lib', 'curriculum-placements.json');

export function allTopics() {
  return curriculumStandard.levels.flatMap((level) => level.topics.map((topic) => ({ ...topic, level })));
}

export function findLevel(levelId?: string | null) {
  return curriculumStandard.levels.find((level) => level.id === levelId) || curriculumStandard.levels[0];
}

export function topicLevel(topicId?: string) {
  return curriculumStandard.levels.find((level) => level.topics.some((topic) => topic.id === topicId));
}

export function nextTopicForPlacement(placement?: StudentCurriculumPlacement | null, student?: Student | null) {
  const fallbackLevel = findLevel(student?.level?.toLowerCase());
  const level = placement ? findLevel(placement.level_id) : fallbackLevel;
  if (!placement?.completed_topic_id) return { level, topic: level.topics[0], isComplete: false };

  const completedIndex = level.topics.findIndex((topic) => topic.id === placement.completed_topic_id);
  if (completedIndex < 0) return { level, topic: level.topics[0], isComplete: false };

  const nextTopic = level.topics[completedIndex + 1];
  return {
    level,
    topic: nextTopic || level.topics[level.topics.length - 1],
    isComplete: !nextTopic,
  };
}

export async function readPlacements() {
  try {
    const raw = await fs.readFile(placementPath, 'utf8');
    const parsed = JSON.parse(raw) as StudentCurriculumPlacement[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function savePlacement(studentId: string, levelId: string, completedTopicId?: string) {
  const level = findLevel(levelId);
  const topicBelongsToLevel = !completedTopicId || level.topics.some((topic) => topic.id === completedTopicId);
  const placements = await readPlacements();
  const nextPlacement: StudentCurriculumPlacement = {
    student_id: studentId,
    level_id: level.id,
    completed_topic_id: topicBelongsToLevel ? completedTopicId || undefined : undefined,
    updated_at: new Date().toISOString(),
  };

  const next = placements.filter((placement) => placement.student_id !== studentId);
  next.push(nextPlacement);
  await fs.writeFile(placementPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return nextPlacement;
}
