import {
  cosineSimilarity,
  createHeuristicEmbedding,
  futureSimilarityBand,
  type FutureEmbeddingModel
} from './future.ts';
import {
  collectPreparedLineCandidates,
  layoutPreparedParagraph,
  layoutPreparedParagraphWithPenalty,
  prepareTypesetParagraph,
  type PrepareTypesetOptions,
  type TypesetLinePenaltyFn,
  type TypesetResult
} from './typeset.ts';

export type SemanticUnitKind = 'sentence' | 'clause';
export type SemanticTypesetVariantId = 'advanced' | 'syntax' | 'semantic';

export type SemanticParagraphUnit = {
  id: string;
  kind: SemanticUnitKind;
  text: string;
};

export type SemanticSentenceShift = {
  left: string;
  right: string;
  similarity: number;
  band: ReturnType<typeof futureSimilarityBand>;
};

export type SemanticTypesetVariant = {
  id: SemanticTypesetVariantId;
  label: string;
  result: TypesetResult;
  deltaBadness: number;
  notes: string[];
};

export type SemanticTypesetReport = {
  mode: 'heuristic' | 'ml';
  model: FutureEmbeddingModel;
  warnings: string[];
  units: {
    sentences: SemanticParagraphUnit[];
    clauses: SemanticParagraphUnit[];
  };
  shifts: SemanticSentenceShift[];
  variants: SemanticTypesetVariant[];
  recommendation: {
    winner: SemanticTypesetVariantId;
    summary: string;
  };
  metrics: {
    sentenceCount: number;
    clauseCount: number;
    averageSentenceSimilarity: number;
  };
};

export type SemanticTypesetOptions = PrepareTypesetOptions & {
  widthPx: number;
};

type EmbeddingResolver = (text: string) => number[];

const BRIDGE_WORDS = new Set([
  'and',
  'as',
  'because',
  'but',
  'for',
  'if',
  'into',
  'of',
  'on',
  'or',
  'so',
  'than',
  'that',
  'then',
  'to',
  'when',
  'while',
  'with',
  'yet'
]);

const WEAK_END_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with'
]);

function normalizeProse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function splitSentenceTexts(text: string): string[] {
  const normalized = normalizeProse(text);
  if (!normalized) {
    return [];
  }

  const matches = normalized.match(/[^.!?]+[.!?]*/g) ?? [normalized];
  return matches.map((part) => part.trim()).filter(Boolean);
}

function splitClauseTexts(text: string): string[] {
  const clauses: string[] = [];
  for (const sentence of splitSentenceTexts(text)) {
    const parts = sentence
      .split(/(?<=[,;:])\s+|\s+[–—-]\s+/g)
      .map((part) => part.trim())
      .filter(Boolean);
    clauses.push(...(parts.length > 0 ? parts : [sentence]));
  }
  return clauses;
}

function unitize(kind: SemanticUnitKind, texts: string[]): SemanticParagraphUnit[] {
  return texts.map((text, index) => ({
    id: `${kind}-${index + 1}`,
    kind,
    text
  }));
}

function firstWord(text: string): string {
  const match = text.toLowerCase().match(/[a-z0-9'-]+/);
  return match?.[0] ?? '';
}

function lastWord(text: string): string {
  const matches = text.toLowerCase().match(/[a-z0-9'-]+/g);
  return matches?.at(-1) ?? '';
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function averageAdjacentSimilarity(texts: string[], resolveEmbedding: EmbeddingResolver): number {
  if (texts.length <= 1) {
    return 1;
  }

  const embeddings = texts.map((text) => resolveEmbedding(text));
  const similarities = embeddings.slice(1).map((embedding, index) =>
    cosineSimilarity(embeddings[index] ?? [], embedding)
  );
  return average(similarities);
}

function internalSentenceCount(text: string): number {
  return splitSentenceTexts(text).length;
}

function internalClauseCount(text: string): number {
  return splitClauseTexts(text).length;
}

function createSemanticPenalty(
  mode: 'syntax' | 'semantic',
  resolveEmbedding: EmbeddingResolver
): TypesetLinePenaltyFn {
  const cache = new Map<string, number>();

  return ({ visibleText, isLastLine }) => {
    const normalized = normalizeProse(visibleText);
    if (!normalized) {
      return 0;
    }

    const cacheKey = `${mode}:${normalized}:${isLastLine ? 'last' : 'mid'}`;
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const wordCount = normalized.split(/\s+/).length;
    const sentenceCount = internalSentenceCount(normalized);
    const clauseCount = internalClauseCount(normalized);
    const endsSentence = /[.!?]["')\]]*$/.test(normalized);
    const endsClause = /[,;:]["')\]]*$/.test(normalized);
    const startsBridge = BRIDGE_WORDS.has(firstWord(normalized));
    const endsWeak = WEAK_END_WORDS.has(lastWord(normalized));

    let penalty = 0;

    if (sentenceCount > 1) {
      penalty += 620;
    }
    if (clauseCount > 1) {
      penalty += 120;
    }
    if (startsBridge) {
      penalty += 240;
    }
    if (endsWeak) {
      penalty += 220;
    }
    if (wordCount <= 2) {
      penalty += 110;
    }
    if (!isLastLine && endsSentence) {
      penalty -= 160;
    } else if (!isLastLine && endsClause) {
      penalty -= 70;
    }

    if (mode === 'semantic') {
      const clauseCohesion = averageAdjacentSimilarity(splitClauseTexts(normalized), resolveEmbedding);
      penalty += Math.max(0, 0.76 - clauseCohesion) * 520;

      if (sentenceCount > 1) {
        const sentenceCohesion = averageAdjacentSimilarity(splitSentenceTexts(normalized), resolveEmbedding);
        penalty += Math.max(0, 0.7 - sentenceCohesion) * 760;
      }
    }

    const rounded = Math.round(penalty);
    cache.set(cacheKey, rounded);
    return rounded;
  };
}

function winnerSummary(winner: SemanticTypesetVariantId): string {
  if (winner === 'semantic') {
    return 'Syntax and local semantic cohesion improve line breaks without reordering the paragraph.';
  }
  if (winner === 'syntax') {
    return 'Punctuation and clause boundaries are doing most of the useful work here.';
  }
  return 'Pure width-aware typesetting already fits this paragraph well, so semantics add little.';
}

function buildSemanticTypesetReport(
  options: SemanticTypesetOptions,
  resolveEmbedding: EmbeddingResolver,
  meta: {
    mode: 'heuristic' | 'ml';
    model: FutureEmbeddingModel;
    warnings: string[];
  }
): SemanticTypesetReport {
  const prepared = prepareTypesetParagraph({
    ...options,
    engine: 'advanced'
  });
  const baseline = layoutPreparedParagraph(prepared, options.widthPx);
  const syntax = layoutPreparedParagraphWithPenalty(prepared, options.widthPx, {
    linePenalty: createSemanticPenalty('syntax', resolveEmbedding)
  });
  const semantic = layoutPreparedParagraphWithPenalty(prepared, options.widthPx, {
    linePenalty: createSemanticPenalty('semantic', resolveEmbedding)
  });

  const sentenceTexts = splitSentenceTexts(options.text);
  const clauseTexts = splitClauseTexts(options.text);
  const shifts = sentenceTexts.slice(1).map((right, index) => {
    const left = sentenceTexts[index] ?? '';
    const similarity = cosineSimilarity(resolveEmbedding(left), resolveEmbedding(right));
    return {
      left,
      right,
      similarity,
      band: futureSimilarityBand(similarity)
    } satisfies SemanticSentenceShift;
  });

  const variants: SemanticTypesetVariant[] = [
    {
      id: 'advanced',
      label: 'Advanced typeset',
      result: baseline,
      deltaBadness: 0,
      notes: ['Optimizes rag, measure, and hyphenation only.']
    },
    {
      id: 'syntax',
      label: 'Syntax-aware',
      result: syntax,
      deltaBadness: syntax.badness - baseline.badness,
      notes: ['Rewards ending lines on punctuation and penalizes bridge-word lead-ins.']
    },
    {
      id: 'semantic',
      label: 'Syntax + semantic',
      result: semantic,
      deltaBadness: semantic.badness - baseline.badness,
      notes: ['Adds local clause cohesion so topic shifts prefer a fresh line.']
    }
  ];

  const winner =
    [...variants].sort((left, right) => left.result.badness - right.result.badness)[0]?.id ?? 'advanced';

  return {
    mode: meta.mode,
    model: meta.model,
    warnings: meta.warnings,
    units: {
      sentences: unitize('sentence', sentenceTexts),
      clauses: unitize('clause', clauseTexts)
    },
    shifts,
    variants,
    recommendation: {
      winner,
      summary: winnerSummary(winner)
    },
    metrics: {
      sentenceCount: sentenceTexts.length,
      clauseCount: clauseTexts.length,
      averageSentenceSimilarity: sentenceTexts.length > 1 ? average(shifts.map((shift) => shift.similarity)) : 1
    }
  };
}

export function collectSemanticTypesetTexts(options: SemanticTypesetOptions): string[] {
  const prepared = prepareTypesetParagraph({
    ...options,
    engine: 'advanced'
  });
  const candidates = collectPreparedLineCandidates(prepared, options.widthPx);
  const texts = new Set<string>();

  for (const sentence of splitSentenceTexts(options.text)) {
    texts.add(sentence);
  }
  for (const clause of splitClauseTexts(options.text)) {
    texts.add(clause);
  }

  for (const candidate of candidates) {
    const visibleText = normalizeProse(candidate.visibleText);
    if (!visibleText) {
      continue;
    }
    texts.add(visibleText);
    for (const sentence of splitSentenceTexts(visibleText)) {
      texts.add(sentence);
    }
    for (const clause of splitClauseTexts(visibleText)) {
      texts.add(clause);
    }
  }

  return [...texts];
}

export function analyzeSemanticTypesetParagraph(options: SemanticTypesetOptions): SemanticTypesetReport {
  return buildSemanticTypesetReport(options, createHeuristicEmbedding, {
    mode: 'heuristic',
    model: 'heuristic-hash',
    warnings: ['Workers AI not used. Sentence and clause cohesion are derived from hashed token embeddings.']
  });
}

export function analyzeSemanticTypesetParagraphWithEmbeddings(
  options: SemanticTypesetOptions,
  embeddingsByText: Map<string, number[]>,
  model: FutureEmbeddingModel,
  warnings: string[] = []
): SemanticTypesetReport {
  const resolveEmbedding = (text: string): number[] => embeddingsByText.get(text) ?? createHeuristicEmbedding(text);
  return buildSemanticTypesetReport(options, resolveEmbedding, {
    mode: 'ml',
    model,
    warnings
  });
}
