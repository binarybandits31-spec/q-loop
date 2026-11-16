import { module2Chapters } from './module2';
import type { Lesson } from './lessons';

type RawChapter = {
  id?: unknown;
  moduleId?: unknown;
  chapterNumber?: unknown;
  title?: unknown;
  description?: unknown;
  difficulty?: unknown;
  duration?: unknown;
  objectives?: unknown;
  syllabus?: unknown;
  textbookContent?: unknown;
  sourceText?: unknown;
  content?: unknown;
};

const rawChapters = module2Chapters as unknown as readonly RawChapter[];

function getText(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function getDifficulty(
  value: unknown
): Lesson['difficulty'] {
  if (
    value === 'Beginner' ||
    value === 'Intermediate' ||
    value === 'Advanced'
  ) {
    return value;
  }

  return 'Intermediate';
}

export const MODULE2_LESSONS: Lesson[] = rawChapters.map(
  (chapter, index) => {
    const chapterNumber =
      typeof chapter.chapterNumber === 'number'
        ? chapter.chapterNumber
        : index + 1;

    const title =
      getText(chapter.title) ?? `Chapter ${chapterNumber}`;

    const body =
      getText(chapter.textbookContent) ??
      getText(chapter.sourceText) ??
      getText(chapter.content);

    if (!body) {
      throw new Error(
        `Module 2 Chapter ${chapterNumber} has no readable textbook content.`
      );
    }

    const objectives =
      getStringArray(chapter.objectives).length > 0
        ? getStringArray(chapter.objectives)
        : getStringArray(chapter.syllabus);

    return {
      id: `module-2-chapter-${String(chapterNumber).padStart(2, '0')}`,
      moduleId: 'module-2',
      title,
      description:
        getText(chapter.description) ??
        `Study ${title} through the complete textbook chapter and its review material.`,
      duration:
        typeof chapter.duration === 'number' ? chapter.duration : 45,
      difficulty: getDifficulty(chapter.difficulty),
      objectives:
        objectives.length > 0
          ? objectives
          : ['Study the complete chapter and review its assessment questions.'],
      content: [
        {
          heading: title,
          body,
        },
      ],
      quiz: [],
    };
  }
);
