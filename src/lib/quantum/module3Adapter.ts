import module3Text from './module3.md?raw';
import type { Lesson } from './lessons';
import { MODULE3_CHAPTER_01 } from './module3Chapter01';

const chapterPattern =
  /^# Chapter (\d+):\s*(.+?)(?:\s+\{#.*?\})?\s*$/gm;

const chapterMatches = Array.from(module3Text.matchAll(chapterPattern));

function extractSections(text: string, title: string) {
  const headingPattern = /^##(?!#)\s*(.+?)\s*$/gm;
  const matches = Array.from(text.matchAll(headingPattern));

  if (matches.length === 0) {
    return [{ heading: title, body: text.trim() }];
  }

  const sections: { heading: string; body: string }[] = [];

  const introduction = text.slice(0, matches[0].index).trim();

  if (introduction) {
    sections.push({
      heading: 'Chapter introduction',
      body: introduction,
    });
  }

  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;

    sections.push({
      heading: match[1].trim(),
      body: text.slice(start, end).trim(),
    });
  });

  return sections;
}

export const MODULE3_LESSONS: Lesson[] = chapterMatches.map(
  (match, index) => {
    const chapterNumber = Number(match[1]);
    const title = match[2].trim();

    const chapterStart = match.index ?? 0;
    const start = chapterStart + match[0].length;
    const end = chapterMatches[index + 1]?.index ?? module3Text.length;

    const chapterBody = module3Text.slice(start, end).trim();

    // Preserve the module introduction and learning outcomes in Chapter 1.
    const chapterText =
      chapterNumber === 1
        ? `${module3Text.slice(0, chapterStart).trim()}\n\n${chapterBody}`
        : chapterBody;

    const content = extractSections(chapterText, title);

    const objectivesSection = content.find((section) =>
      /learning objectives/i.test(section.heading)
    );

    const objectives = objectivesSection
      ? objectivesSection.body
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => /^[-*+]\s+/.test(line))
          .map((line) => line.replace(/^[-*+]\s+/, ''))
      : [];

    return {
      id: `module-3-chapter-${String(chapterNumber).padStart(2, '0')}`,
      moduleId: 'module-3',
      title,
      description: `Study ${title} through detailed theory, formulas, examples, and exercises.`,
      duration: 90,
      difficulty: chapterNumber <= 2 ? 'Beginner' : 'Intermediate',
      objectives:
        objectives.length > 0
          ? objectives
          : ['Study the chapter theory and complete its review exercises.'],
      content,
      quiz: [],
    };
  }
);

MODULE3_LESSONS[0] = MODULE3_CHAPTER_01;

if (MODULE3_LESSONS.length !== 12) {
  throw new Error(
    `Module 3 should contain 12 chapters, but found ${MODULE3_LESSONS.length}.`
  );
}
