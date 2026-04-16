/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type JLPTLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';

export type ExerciseType = 'vocabulary' | 'grammar' | 'reading' | 'listening';

export interface Word {
  id: string;
  kanji: string;
  reading: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
}

export interface GrammarPoint {
  id: string;
  title: string;
  explanation: string;
  example: string;
  exampleMeaning: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  audioUrl?: string; // For listening exercises
}

export interface DailyContent {
  date: string;
  level: JLPTLevel;
  words: Word[];
  grammar: GrammarPoint[];
  exercises: Exercise[];
}

export interface UserSettings {
  jlptLevel: JLPTLevel;
  reminderTime: string; // HH:mm
  preferredExerciseTypes: ExerciseType[];
}

export interface FavoriteItem {
  id: string;
  type: 'word' | 'grammar' | 'exercise';
  content: Word | GrammarPoint | Exercise;
  savedAt: number;
}
