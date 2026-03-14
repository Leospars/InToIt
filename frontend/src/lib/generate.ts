import type { Topic, Course, GraphNode, LMSTopic, LMSCourse, QuizQuestion } from '../types';

const OPENAI_API = 'https://api.openai.com/v1/chat/completions';

async function gpt(apiKey: string, prompt: string, maxTokens = 1500): Promise<string> {
  const res = await fetch(OPENAI_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const d = await res.json();
  return d.choices?.[0]?.message?.content ?? '';
}

function safeJson<T>(text: string, fallback: T): T {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as T;
  } catch {
    return fallback;
  }
}

// ── Generate full Topic from a topic name ──────────────

export async function generateTopic(args: {
  topicName: string;
  courseName: string;
  courseContext: string; // brief description of the course
  topicSummary?: string;
  apiKey: string;
  topicIndex: number;
  totalTopics: number;
}): Promise<Topic> {
  const difficultyEstimate = 0.2 + (args.topicIndex / Math.max(args.totalTopics - 1, 1)) * 0.6;
  const topicId = `gen_${slugify(args.courseName)}_${slugify(args.topicName)}_${args.topicIndex}`;

  const prompt = `You are generating educational content for an adaptive learning app.

Course: "${args.courseName}"
Course context: "${args.courseContext}"
Topic: "${args.topicName}"
${args.topicSummary ? `Topic summary from LMS: "${args.topicSummary}"` : ''}
Estimated difficulty (0=easy, 1=hard): ${difficultyEstimate.toFixed(2)}

Generate a complete JSON object with this EXACT structure. Return ONLY valid JSON, no markdown:

{
  "lesson": "A clear 200-300 word lesson using ## headers. Include the key concept, worked example, and key formula inline using LaTeX \\\\(...\\\\) for inline math and $$...$$ on its own line for display math. Use **bold** for key terms.",
  "lessonELI5": "A simplified 100-150 word version using analogies and simple language. Include emoji. Still include the key formula.",
  "formula": "The single most important formula or concept for this topic as a KaTeX string (e.g. 'F = ma' or 'E = mc^2' or just the concept name if no formula). Use LaTeX notation.",
  "youtubeQuery": "A specific YouTube search query to find a short explainer video for this topic (include course subject, e.g. 'machine learning gradient descent explained shorts')",
  "analogy": "One vivid sentence analogy to explain this concept to a beginner",
  "quiz": [
    {"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "...", "difficulty": "easy"},
    {"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 1, "explanation": "...", "difficulty": "normal"},
    {"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 2, "explanation": "...", "difficulty": "normal"}
  ],
  "quizHard": [
    {"question": "A harder application or analysis question", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "...", "difficulty": "hard"},
    {"question": "Another hard question requiring synthesis", "options": ["A", "B", "C", "D"], "correctIndex": 1, "explanation": "...", "difficulty": "hard"}
  ],
  "prerequisiteTopicNames": ["list", "of", "prerequisite", "topic", "names", "from", "this", "same", "course", "if", "obvious"],
  "estimatedMinutes": 4
}

Rules:
- Quiz questions must be multiple choice with exactly 4 options
- correctIndex is 0-3 (the index of the correct option in the options array)
- Make questions test genuine understanding, not just definitions
- Hard questions should require application or analysis
- prerequisiteTopicNames should only list topics that are genuinely required first (can be empty array)`;

  const raw = await gpt(args.apiKey, prompt, 1800);
  const parsed = safeJson<any>(raw, null);

  if (!parsed) {
    // Fallback minimal topic if JSON fails
    return makeFallbackTopic(topicId, args.topicName, args.courseName, difficultyEstimate, args.topicIndex);
  }

  // Build quiz with IDs
  const quiz: QuizQuestion[] = (parsed.quiz ?? []).map((q: any, i: number) => ({
    id: `${topicId}_q${i}`,
    question: q.question ?? `What is ${args.topicName}?`,
    options: q.options ?? ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    explanation: q.explanation ?? '',
    difficulty: q.difficulty ?? 'normal',
  }));

  const quizHard: QuizQuestion[] = (parsed.quizHard ?? []).map((q: any, i: number) => ({
    id: `${topicId}_qh${i}`,
    question: q.question ?? `Advanced: ${args.topicName}`,
    options: q.options ?? ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    explanation: q.explanation ?? '',
    difficulty: 'hard' as const,
  }));

  return {
    id: topicId,
    courseId: slugify(args.courseName),
    title: args.topicName,
    difficulty: difficultyEstimate,
    estimatedMinutes: parsed.estimatedMinutes ?? 4,
    lesson: parsed.lesson ?? `## ${args.topicName}\n\nNo content generated.`,
    lessonELI5: parsed.lessonELI5,
    formula: parsed.formula ?? args.topicName,
    quiz: quiz.length > 0 ? quiz : makeDefaultQuiz(topicId, args.topicName),
    quizHard: quizHard.length > 0 ? quizHard : undefined,
    youtubeQuery: parsed.youtubeQuery ?? `${args.topicName} ${args.courseName} explained`,
    lmsTopicId: String(args.topicIndex),
    generated: true,
    // stash prereq names for graph building
    _prerequisiteTopicNames: parsed.prerequisiteTopicNames ?? [],
  } as any;
}

// ── Generate full Course from LMS course + topics ──────

export async function generateCourse(args: {
  lmsCourse: LMSCourse;
  lmsTopics: LMSTopic[];
  apiKey: string;
  onProgress: (current: number, total: number, topicName: string) => void;
}): Promise<{ course: Course; graphNodes: GraphNode[] }> {
  const { lmsCourse, lmsTopics, apiKey, onProgress } = args;

  // Get course context from the first few topic names
  const topicList = lmsTopics.slice(0, 8).map(t => t.name).join(', ');
  const courseContext = `A course covering: ${topicList}${lmsTopics.length > 8 ? '...' : ''}`;

  const courseId = slugify(lmsCourse.name);
  const color = pickColor(courseId);

  // Generate topics in sequence (to avoid rate limits)
  const generatedTopics: (Topic & { _prerequisiteTopicNames?: string[] })[] = [];
  for (let i = 0; i < lmsTopics.length; i++) {
    const lmsTopic = lmsTopics[i];
    onProgress(i + 1, lmsTopics.length, lmsTopic.name);
    try {
      const topic = await generateTopic({
        topicName: lmsTopic.name,
        courseName: lmsCourse.name,
        courseContext,
        topicSummary: lmsTopic.summary,
        apiKey,
        topicIndex: i,
        totalTopics: lmsTopics.length,
      });
      generatedTopics.push(topic as any);
    } catch (e) {
      console.warn(`Failed to generate topic "${lmsTopic.name}":`, e);
      generatedTopics.push(makeFallbackTopic(
        `gen_${courseId}_${i}`, lmsTopic.name, lmsCourse.name,
        0.2 + (i / Math.max(lmsTopics.length - 1, 1)) * 0.6, i
      ) as any);
    }
    // Small delay to avoid rate limiting
    if (i < lmsTopics.length - 1) await sleep(300);
  }

  // Build knowledge graph from prerequisite names
  const topicNameToId: Record<string, string> = {};
  generatedTopics.forEach(t => { topicNameToId[t.title.toLowerCase()] = t.id; });

  const graphNodes: GraphNode[] = generatedTopics.map((topic, i) => {
    const prereqNames: string[] = (topic as any)._prerequisiteTopicNames ?? [];
    const prerequisites = prereqNames
      .map(name => topicNameToId[name.toLowerCase()])
      .filter(Boolean)
      .filter(id => id !== topic.id);

    // Always add previous topic as implicit prereq if explicit ones are empty
    const finalPrereqs = prerequisites.length > 0
      ? prerequisites
      : i > 0 ? [generatedTopics[i - 1].id] : [];

    return {
      id: topic.id,
      label: topic.title.length > 20 ? topic.title.slice(0, 18) + '…' : topic.title,
      courseId,
      difficulty: topic.difficulty,
      prerequisites: finalPrereqs,
    };
  });

  // Strip internal _prerequisiteTopicNames from final topics
  const cleanTopics: Topic[] = generatedTopics.map(t => {
    const { _prerequisiteTopicNames, ...clean } = t as any;
    return clean as Topic;
  });

  const course: Course = {
    id: courseId,
    title: lmsCourse.name,
    emoji: pickEmoji(lmsCourse.name),
    tagline: `${lmsCourse.shortName} — ${lmsTopics.length} topics`,
    color,
    accent: lightenColor(color),
    topics: cleanTopics,
    lmsCourseId: lmsCourse.id,
    generatedAt: Date.now(),
  };

  return { course, graphNodes };
}

// ── Helpers ────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

const COLORS = ['#a855f7', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];
function pickColor(id: string): string {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
}
function lightenColor(hex: string): string {
  // Simple: return a lighter variant
  const map: Record<string, string> = { '#a855f7': '#d946ef', '#0ea5e9': '#38bdf8', '#10b981': '#34d399', '#f59e0b': '#fbbf24', '#ef4444': '#f87171', '#ec4899': '#f472b6', '#6366f1': '#818cf8', '#14b8a6': '#2dd4bf' };
  return map[hex] ?? hex;
}

const EMOJI_MAP: [RegExp, string][] = [
  [/machine.?learn|ml\b|ai\b|neural|deep.?learn/i, '🤖'],
  [/calcul|deriv|integr|limit/i, '∫'],
  [/algebra|equation|variable|polynomial/i, '𝑥'],
  [/statistic|probab|distribut|regression/i, 'σ'],
  [/physics|mechanics|quantum|thermody/i, '⚛️'],
  [/chemistry|molecular|organic|reaction/i, '⚗️'],
  [/biology|cell|genetics|evolution/i, '🧬'],
  [/history|histor|civilization/i, '📜'],
  [/economics|finance|market|supply/i, '📈'],
  [/programm|software|comput|algorit|data.?struct/i, '💻'],
  [/network|security|cyber/i, '🔐'],
  [/database|sql|nosql/i, '🗄️'],
  [/design|ui|ux|interface/i, '🎨'],
  [/law|legal|jurisd/i, '⚖️'],
  [/medicine|clinical|anatomy|physiology/i, '🩺'],
  [/business|management|strategy|market/i, '💼'],
  [/psychology|cognitive|behavior/i, '🧠'],
  [/language|linguistic|grammar/i, '📖'],
  [/geography|climate|environment/i, '🌍'],
  [/music|theory|harmony/i, '🎵'],
];

function pickEmoji(courseName: string): string {
  for (const [re, emoji] of EMOJI_MAP) if (re.test(courseName)) return emoji;
  return '📚';
}

function makeDefaultQuiz(topicId: string, topicName: string): QuizQuestion[] {
  return [
    { id: `${topicId}_q0`, question: `What is the primary purpose of ${topicName}?`, options: ['To organise information', 'To solve specific problems in this domain', 'To provide a theoretical framework', 'All of the above'], correctIndex: 3, explanation: `${topicName} serves multiple purposes in its domain.`, difficulty: 'easy' },
    { id: `${topicId}_q1`, question: `${topicName} is best described as:`, options: ['A method', 'A concept', 'A tool', 'A framework'], correctIndex: 1, explanation: `Understanding the classification of ${topicName} helps contextualise its use.`, difficulty: 'normal' },
    { id: `${topicId}_q2`, question: `When would you apply ${topicName}?`, options: ['Always', 'Never in practice', 'When the specific conditions are met', 'Only in advanced scenarios'], correctIndex: 2, explanation: `${topicName} applies in specific contexts that match its requirements.`, difficulty: 'normal' },
  ];
}

function makeFallbackTopic(id: string, name: string, courseName: string, difficulty: number, index: number): Topic {
  return {
    id,
    courseId: slugify(courseName),
    title: name,
    difficulty,
    estimatedMinutes: 4,
    lesson: `## ${name}\n\nThis topic is part of **${courseName}**.\n\nContent for this topic could not be auto-generated. Please review your course materials and try again with a valid OpenAI API key.`,
    formula: name,
    quiz: makeDefaultQuiz(id, name),
    youtubeQuery: `${name} ${courseName} explained tutorial`,
    lmsTopicId: String(index),
    generated: true,
  };
}
