
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

type LessonSection = {
  heading: string;
  body: string;
};

const rawChapters = module2Chapters as unknown as readonly RawChapter[];

function getText(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function getDifficulty(value: unknown): Lesson['difficulty'] {
  if (
    value === 'Beginner' ||
    value === 'Intermediate' ||
    value === 'Advanced'
  ) {
    return value;
  }

  return 'Intermediate';
}

// Preserve chapters that already contain separate content sections.
function getExistingSections(value: unknown): LessonSection[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): LessonSection | null => {
      if (!item || typeof item !== 'object') return null;

      const section = item as Record<string, unknown>;
      const heading = getText(section.heading);
      const body = getText(section.body);

      if (!heading || body === undefined) return null;

      return { heading, body };
    })
    .filter((section): section is LessonSection => section !== null);
}

// Split a complete Markdown chapter at its level-two headings.
function splitTextbookIntoSections(
  body: string,
  chapterTitle: string
): LessonSection[] {
  const headingPattern = /^##(?!#)\s*(.+?)\s*$/gm;
  const matches = Array.from(body.matchAll(headingPattern));

  if (matches.length === 0) {
    return [{ heading: chapterTitle, body }];
  }

  const sections: LessonSection[] = [];

  const firstHeadingIndex = matches[0].index ?? 0;
  const introduction = body.slice(0, firstHeadingIndex).trim();

  if (introduction) {
    sections.push({
      heading: 'Chapter introduction',
      body: introduction,
    });
  }

  matches.forEach((match, index) => {
    const heading = match[1].trim();
    const start = (match.index ?? 0) + match[0].length;
    const nextHeading = matches[index + 1];
    const end = nextHeading?.index ?? body.length;
    const sectionBody = body.slice(start, end).trim();

    sections.push({
      heading,
      body: sectionBody,
    });
  });

  return sections;
}

export const MODULE2_LESSONS: Lesson[] = rawChapters.map(
  (chapter, index) => {
    const chapterNumber =
      typeof chapter.chapterNumber === 'number'
        ? chapter.chapterNumber
        : index + 1;

    const title =
      getText(chapter.title) ?? `Chapter ${chapterNumber}`;

    // Use existing structured sections when available.
    const existingSections = getExistingSections(chapter.content);

    // Otherwise, use the complete textbook text.
    const body =
      getText(chapter.textbookContent) ??
      getText(chapter.sourceText) ??
      getText(chapter.content);

    if (existingSections.length === 0 && !body) {
      throw new Error(
        `Module 2 Chapter ${chapterNumber} has no readable textbook content.`
      );
    }

    const content =
      existingSections.length > 0
        ? existingSections
        : splitTextbookIntoSections(body!, title);

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
      content,
      quiz: [],
    };
  }
);
