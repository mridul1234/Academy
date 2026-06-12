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
  description: 'A practical chess curriculum for academy students, moving through structured 45-minute sessions from piece movement to opening principles.',
  levels: [
    {
      id: 'beginner',
      name: 'Beginner',
      description: '24 structured sessions covering piece movement, check, checkmate, winning methods, notation, and opening principles.',
      topics: [
        {
          id: 'beginner-movement-of-the-pieces',
          title: 'Movement of the Pieces',
          objective: 'Teach how every chess piece moves and build confidence with legal movement.',
          practice: 'Practice legal moves for each piece from different board positions.',
        },
        {
          id: 'beginner-capturing-pieces',
          title: 'Capturing Pieces',
          objective: 'Show how captures work and when a capture is legal.',
          practice: 'Use simple positions where the student identifies all possible captures.',
        },
        {
          id: 'beginner-protecting-pieces',
          title: 'Protecting Pieces',
          objective: 'Teach students to notice defended and undefended pieces.',
          practice: 'Ask the student to mark which pieces are protected in sample positions.',
        },
        {
          id: 'beginner-hanging-pieces',
          title: 'Hanging Pieces',
          objective: 'Help students spot pieces that can be captured for free.',
          practice: 'Find hanging pieces in short board exercises before choosing a move.',
        },
        {
          id: 'beginner-check-and-defending-check',
          title: 'Check & Defending Check',
          objective: 'Teach check and the main ways to defend against check.',
          practice: 'Solve check positions by moving, blocking, or capturing the checking piece.',
        },
        {
          id: 'beginner-checkmate-and-stalemate',
          title: 'Checkmate & Stalemate',
          objective: 'Explain the difference between checkmate and stalemate.',
          practice: 'Classify positions as check, checkmate, stalemate, or safe.',
        },
        {
          id: 'beginner-practice-analysis-session-1',
          title: 'Practice & Analysis Session 1',
          objective: 'Review the first six beginner concepts through guided play.',
          practice: 'Play a short game and analyze missed captures, checks, and hanging pieces.',
        },
        {
          id: 'beginner-castling-and-pawn-promotion',
          title: 'Castling & Pawn Promotion',
          objective: 'Teach castling rules and pawn promotion.',
          practice: 'Practice legal and illegal castling examples plus pawn promotion races.',
        },
        {
          id: 'beginner-how-to-win-a-game-of-chess',
          title: 'How to Win a Game of Chess',
          objective: 'Explain the main winning goal: checkmate, material advantage, and conversion.',
          practice: 'Walk through a simple winning plan from material advantage to checkmate.',
        },
        {
          id: 'beginner-draws-in-chess',
          title: 'Draws in Chess',
          objective: 'Introduce common draw rules and drawn game situations.',
          practice: 'Identify stalemate, insufficient material, and repetition-style examples.',
        },
        {
          id: 'beginner-scholars-mate',
          title: "Scholar's Mate",
          objective: "Teach Scholar's Mate and how to defend against it.",
          practice: "Play both sides of Scholar's Mate and practice the correct defense.",
        },
        {
          id: 'beginner-two-rooks-checkmate',
          title: 'Two Rooks Checkmate',
          objective: 'Teach the ladder mate pattern with two rooks.',
          practice: 'Finish two-rook checkmate from multiple starting positions.',
        },
        {
          id: 'beginner-queen-and-king-checkmate',
          title: 'Queen & King Checkmate',
          objective: 'Teach how king and queen coordinate to checkmate.',
          practice: 'Practice boxing the king and delivering mate safely.',
        },
        {
          id: 'beginner-rook-and-king-checkmate',
          title: 'Rook & King Checkmate',
          objective: 'Teach the rook and king checkmate technique.',
          practice: 'Use king opposition and rook checks to complete mate.',
        },
        {
          id: 'beginner-practice-analysis-session-2',
          title: 'Practice & Analysis Session 2',
          objective: 'Review special moves, draws, and basic checkmates.',
          practice: 'Play training positions and analyze the winning or drawing method.',
        },
        {
          id: 'beginner-piece-values-and-material-advantage',
          title: 'Piece Values & Material Advantage',
          objective: 'Teach piece values and how material advantage affects decisions.',
          practice: 'Count material in positions and decide who is ahead.',
        },
        {
          id: 'beginner-exchanging-pieces-when-ahead-in-material',
          title: 'Exchanging Pieces When Ahead in Material',
          objective: 'Teach why trades often help when ahead in material.',
          practice: 'Choose whether to exchange pieces in sample positions.',
        },
        {
          id: 'beginner-chess-notation',
          title: 'Chess Notation',
          objective: 'Introduce reading and writing basic chess notation.',
          practice: 'Record a short sequence of moves and replay it on the board.',
        },
        {
          id: 'beginner-practice-analysis-session-3',
          title: 'Practice & Analysis Session 3',
          objective: 'Review material, exchanges, and notation through game analysis.',
          practice: 'Analyze a short game and record the key moves in notation.',
        },
        {
          id: 'beginner-three-phases-of-the-game',
          title: 'Three Phases of the Game',
          objective: 'Explain opening, middlegame, and endgame goals.',
          practice: 'Classify positions by phase and name the main goal in each.',
        },
        {
          id: 'beginner-basic-opening-principles',
          title: 'Basic Opening Principles',
          objective: 'Teach center control, development, king safety, and avoiding early queen moves.',
          practice: 'Review opening positions and pick principle-based moves.',
        },
        {
          id: 'beginner-additional-opening-principles',
          title: 'Additional Opening Principles',
          objective: 'Add practical opening habits like not moving the same piece repeatedly without reason.',
          practice: 'Compare good and weak opening move choices.',
        },
        {
          id: 'beginner-importance-of-castling',
          title: 'Importance of Castling',
          objective: 'Show why castling early improves king safety and rook activity.',
          practice: 'Analyze games where castling was delayed versus completed on time.',
        },
        {
          id: 'beginner-practice-analysis-session-4',
          title: 'Practice & Analysis Session 4',
          objective: 'Review the full beginner curriculum through practice and analysis.',
          practice: 'Play a guided game and connect mistakes to the 24 beginner topics.',
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
