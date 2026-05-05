import { round } from './types.ts';
import { escapeCssComment, escapeCssString, type AuditReport } from '@dkcli/core';

export const FUTURE_EMBEDDING_MODELS = [
  '@cf/baai/bge-small-en-v1.5',
  '@cf/google/embeddinggemma-300m'
] as const;

export type FutureEmbeddingModel = (typeof FUTURE_EMBEDDING_MODELS)[number] | 'heuristic-hash';
export type FutureTopologyMode = 'heuristic' | 'ml' | 'auto';

export type FutureTopologyItem = {
  id: string;
  role: string;
  label: string;
  text: string;
  href?: string;
  locked?: boolean;
};

export type FutureTopologyCluster = {
  id: number;
  label: string;
  itemIds: string[];
  cohesion: number;
  averageQueryScore: number;
};

export type FutureSlotPlan = {
  slot: string;
  itemIds: string[];
  rationale: string;
};

export type FutureTopologyNode = FutureTopologyItem & {
  index: number;
  clusterId: number;
  x: number;
  y: number;
  centrality: number;
  queryScore: number;
  bridgeScore: number;
  anchorScore: number;
  slot: string;
  affinities: number[];
};

export type FutureTopologyReport = {
  mode: 'heuristic' | 'ml';
  model: FutureEmbeddingModel;
  query: string;
  dimensions: number;
  items: FutureTopologyNode[];
  matrix: number[][];
  clusters: FutureTopologyCluster[];
  recommendation: {
    anchorId: string;
    bridgeId: string;
    readingOrder: string[];
    slotPlan: FutureSlotPlan[];
    notes: string[];
  };
  metrics: {
    clusterSeparation: number;
    adjacencyConfidence: number;
    centralitySpread: number;
    queryAlignment: number;
  };
  evaluation: {
    verdict: 'promising' | 'exploratory' | 'weak';
    summary: string;
    reasons: string[];
    shouldDriveLayout: boolean;
  };
  warnings: string[];
};

type Point = { x: number; y: number };

const HASH_DIMENSIONS = 64;
const SLOT_NAMES = ['lead', 'body', 'support', 'utility'] as const;
const ROLE_WEIGHTS: Record<string, number> = {
  title: 0.12,
  hero: 0.12,
  eyebrow: 0.05,
  body: 0.06,
  cta: 0.08,
  support: 0.03,
  data: 0.04,
  meta: -0.03
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function hashToken(token: string, seed: number): number {
  let hash = seed;
  for (const char of token) {
    hash = (hash ^ char.charCodeAt(0)) * 16777619;
  }
  return Math.abs(hash);
}

function normalizeVector(values: number[]): number[] {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return values.map(() => 0);
  }
  return values.map((value) => value / magnitude);
}

function roleWeight(role: string): number {
  return ROLE_WEIGHTS[role] ?? 0;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

export function composeFutureTopologyText(item: FutureTopologyItem): string {
  return [item.role, item.label, item.text].filter(Boolean).join('. ');
}

export function createHeuristicEmbedding(text: string, dimensions: number = HASH_DIMENSIONS): number[] {
  const vector = Array<number>(dimensions).fill(0);
  const tokens = tokenize(text);
  const enriched = [...tokens];

  for (let index = 0; index < tokens.length - 1; index += 1) {
    enriched.push(`${tokens[index]}_${tokens[index + 1]}`);
  }

  for (const token of enriched) {
    const position = hashToken(token, 2166136261) % dimensions;
    const direction = hashToken(token, 1469598103) % 2 === 0 ? 1 : -1;
    vector[position] += direction * (token.includes('_') ? 1.2 : 1);
  }

  return normalizeVector(vector);
}

export function createHeuristicEmbeddings(texts: string[]): number[][] {
  return texts.map((text) => createHeuristicEmbedding(text));
}

export function cosineSimilarity(left: number[], right: number[]): number {
  const dimensions = Math.min(left.length, right.length);
  if (dimensions === 0) {
    return 0;
  }
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < dimensions; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }
  return round(dot / Math.sqrt(leftMagnitude * rightMagnitude), 4);
}

export function buildSimilarityMatrix(vectors: number[][]): number[][] {
  return vectors.map((left, leftIndex) =>
    vectors.map((right, rightIndex) =>
      leftIndex === rightIndex ? 1 : cosineSimilarity(left, right)
    )
  );
}

function clusterAssignments(matrix: number[][]): number[] {
  if (matrix.length === 0) {
    return [];
  }

  const offDiagonal: number[] = [];
  for (let row = 0; row < matrix.length; row += 1) {
    const rowValues = matrix[row] ?? [];
    for (let column = row + 1; column < matrix.length; column += 1) {
      offDiagonal.push(rowValues[column] ?? 0);
    }
  }
  const threshold = Math.max(0.4, Math.min(0.78, average(offDiagonal) + 0.08));
  const assignments = Array<number>(matrix.length).fill(-1);
  let clusterId = 0;

  for (let index = 0; index < matrix.length; index += 1) {
    if (assignments[index] !== -1) {
      continue;
    }
    assignments[index] = clusterId;
    const queue = [index];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) {
        continue;
      }
      const currentRow = matrix[current] ?? [];
      for (let neighbor = 0; neighbor < matrix.length; neighbor += 1) {
        if (assignments[neighbor] !== -1) {
          continue;
        }
        if ((currentRow[neighbor] ?? 0) >= threshold) {
          assignments[neighbor] = clusterId;
          queue.push(neighbor);
        }
      }
    }

    clusterId += 1;
  }

  return assignments;
}

function createTopologyPoints(matrix: number[][], centrality: number[], queryScores: number[]): Point[] {
  const count = matrix.length;
  if (count === 0) {
    return [];
  }

  const points = Array.from({ length: count }, (_, index) => ({
    x: Math.cos((index / Math.max(count, 1)) * Math.PI * 2) * 0.35,
    y: Math.sin((index / Math.max(count, 1)) * Math.PI * 2) * 0.35
  }));

  for (let iteration = 0; iteration < 120; iteration += 1) {
    const delta = points.map(() => ({ x: 0, y: 0 }));

    for (let left = 0; left < count; left += 1) {
      for (let right = left + 1; right < count; right += 1) {
        const leftPoint = points[left];
        const rightPoint = points[right];
        const leftDelta = delta[left];
        const rightDelta = delta[right];
        const dx = rightPoint.x - leftPoint.x;
        const dy = rightPoint.y - leftPoint.y;
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 0.001);
        const similarity = matrix[left]?.[right] ?? 0;
        const attraction = (similarity - 0.32) * 0.012;
        const repulsion = 0.0028 / (distance * distance);
        const force = attraction - repulsion;
        const stepX = (dx / distance) * force;
        const stepY = (dy / distance) * force;

        leftDelta.x += stepX;
        leftDelta.y += stepY;
        rightDelta.x -= stepX;
        rightDelta.y -= stepY;
      }
    }

    for (let index = 0; index < count; index += 1) {
      const point = points[index];
      const pointDelta = delta[index];
      const centerBias = 0.018 + (centrality[index] ?? 0) * 0.012;
      const queryBiasX = ((queryScores[index] ?? 0) - 0.5) * 0.014;
      pointDelta.x += queryBiasX - point.x * centerBias;
      pointDelta.y += -point.y * centerBias;
      point.x += pointDelta.x;
      point.y += pointDelta.y;
    }
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return points.map((point) => ({
    x: round((point.x - minX) / Math.max(maxX - minX, 0.001), 3),
    y: round((point.y - minY) / Math.max(maxY - minY, 0.001), 3)
  }));
}

function pairAverage(matrix: number[][], pairs: Array<[number, number]>): number {
  if (pairs.length === 0) {
    return 0;
  }
  return round(
    pairs.reduce((sum, [left, right]) => sum + (matrix[left]?.[right] ?? 0), 0) / pairs.length,
    3
  );
}

function clusterLabel(index: number): string {
  return `cluster ${index + 1}`;
}

export function analyzeEmbeddingTopology(options: {
  items: FutureTopologyItem[];
  query: string;
  itemEmbeddings: number[][];
  queryEmbedding: number[];
  model: FutureEmbeddingModel;
  mode: 'heuristic' | 'ml';
  warnings?: string[];
}): FutureTopologyReport {
  if (options.items.length === 0 || options.itemEmbeddings.length === 0) {
    return {
      mode: options.mode,
      model: options.model,
      query: options.query,
      dimensions: 0,
      items: [],
      matrix: [],
      clusters: [],
      recommendation: {
        anchorId: '',
        bridgeId: '',
        readingOrder: [],
        slotPlan: [],
        notes: ['No items were provided for topology analysis.']
      },
      metrics: {
        clusterSeparation: 0,
        adjacencyConfidence: 0,
        centralitySpread: 0,
        queryAlignment: 0
      },
      evaluation: {
        verdict: 'weak',
        summary: 'No embedding topology could be computed from an empty item set.',
        reasons: ['no items'],
        shouldDriveLayout: false
      },
      warnings: options.warnings ?? []
    };
  }

  const matrix = buildSimilarityMatrix(options.itemEmbeddings);
  const centrality = matrix.map((row, rowIndex) =>
    round(
      average(row.filter((_, columnIndex) => columnIndex !== rowIndex).map((value) => Math.max(0, value))),
      3
    )
  );
  const queryScores = options.itemEmbeddings.map((vector) =>
    round(Math.max(0, cosineSimilarity(vector, options.queryEmbedding)), 3)
  );
  const assignments = clusterAssignments(matrix);
  const bridgeScores = options.items.map((_, itemIndex) => {
    const otherClusterScores = (matrix[itemIndex] ?? [])
      .map((score, otherIndex) => ({ score, otherIndex }))
      .filter(({ otherIndex }) => otherIndex !== itemIndex && assignments[otherIndex] !== assignments[itemIndex])
      .map(({ score }) => score);
    return round(Math.max(0, average(otherClusterScores)), 3);
  });
  const anchorScores = options.items.map((item, index) =>
    round((queryScores[index] ?? 0) * 0.62 + (centrality[index] ?? 0) * 0.28 + roleWeight(item.role), 3)
  );
  const points = createTopologyPoints(matrix, centrality, queryScores);

  const clusterCount = Math.max(...assignments, 0) + 1;
  const clusterIds = Array.from({ length: clusterCount }, (_, index) => index);
  const slotOrder = clusterIds
    .map((clusterId) => {
      const members = options.items
        .map((item, index) => ({ item, index }))
        .filter(({ index }) => assignments[index] === clusterId);
      return {
        clusterId,
        weight: Math.max(...members.map(({ index }) => anchorScores[index] ?? 0), 0)
      };
    })
    .sort((left, right) => right.weight - left.weight);
  const slotMap = new Map<number, string>(
    slotOrder.map((entry, index) => [
      entry.clusterId,
      SLOT_NAMES[Math.min(index, SLOT_NAMES.length - 1)]
    ])
  );

  const nodes: FutureTopologyNode[] = options.items.map((item, index) => {
    const point = points[index] ?? { x: 0.5, y: 0.5 };
    const clusterId = assignments[index] ?? 0;
    return {
      ...item,
      index,
      clusterId,
      x: point.x,
      y: point.y,
      centrality: centrality[index] ?? 0,
      queryScore: queryScores[index] ?? 0,
      bridgeScore: bridgeScores[index] ?? 0,
      anchorScore: anchorScores[index] ?? 0,
      slot: slotMap.get(clusterId) ?? 'support',
      affinities: (matrix[index] ?? []).map((value) => round(value, 3))
    };
  });

  const clusters: FutureTopologyCluster[] = clusterIds.map((clusterId) => {
    const members = nodes.filter((node) => node.clusterId === clusterId);
    const memberIndexes = members.map((node) => node.index);
    const withinPairs: Array<[number, number]> = [];
    for (let index = 0; index < memberIndexes.length; index += 1) {
      for (let next = index + 1; next < memberIndexes.length; next += 1) {
        withinPairs.push([memberIndexes[index], memberIndexes[next]]);
      }
    }

    return {
      id: clusterId,
      label: clusterLabel(clusterId),
      itemIds: members.map((node) => node.id),
      cohesion: memberIndexes.length > 1 ? pairAverage(matrix, withinPairs) : 1,
      averageQueryScore: round(average(members.map((node) => node.queryScore)), 3)
    };
  });

  const withinPairs: Array<[number, number]> = [];
  const betweenPairs: Array<[number, number]> = [];
  for (let left = 0; left < nodes.length; left += 1) {
    for (let right = left + 1; right < nodes.length; right += 1) {
      const leftNode = nodes[left];
      const rightNode = nodes[right];
      if (leftNode.clusterId === rightNode.clusterId) {
        withinPairs.push([left, right]);
      } else {
        betweenPairs.push([left, right]);
      }
    }
  }

  const clusterSeparation = round(pairAverage(matrix, withinPairs) - pairAverage(matrix, betweenPairs), 3);
  const adjacencyConfidence = round(
    average(
      nodes.map((node) =>
        Math.max(...node.affinities.filter((_, affinityIndex) => affinityIndex !== node.index), 0)
      )
    ),
    3
  );
  const centralitySpread = round(Math.max(...centrality, 0) - Math.min(...centrality, 0), 3);
  const queryAlignment = round(Math.max(...queryScores, 0), 3);

  const fallbackNode =
    nodes[0] ??
    ({
      id: '',
      role: 'meta',
      label: '',
      text: '',
      index: 0,
      clusterId: 0,
      x: 0.5,
      y: 0.5,
      centrality: 0,
      queryScore: 0,
      bridgeScore: 0,
      anchorScore: 0,
      slot: 'support',
      affinities: []
    } satisfies FutureTopologyNode);

  const anchor = [...nodes].sort((left, right) => right.anchorScore - left.anchorScore)[0] ?? fallbackNode;
  const bridge = [...nodes].sort((left, right) => right.bridgeScore - left.bridgeScore)[0] ?? fallbackNode;
  const readingOrder = [...nodes]
    .sort((left, right) => {
      const leftScore = left.anchorScore + left.centrality * 0.2;
      const rightScore = right.anchorScore + right.centrality * 0.2;
      return rightScore - leftScore;
    })
    .map((node) => node.id);
  const slotPlan: FutureSlotPlan[] = slotOrder.map((entry, index) => {
    const slot = SLOT_NAMES[Math.min(index, SLOT_NAMES.length - 1)] ?? 'support';
    const members = [...nodes]
      .filter((node) => node.clusterId === entry.clusterId)
      .sort((left, right) => right.anchorScore - left.anchorScore);
    return {
      slot,
      itemIds: members.map((node) => node.id),
      rationale:
        slot === 'lead'
          ? 'Highest-intent cluster. Let this set tone and hierarchy.'
          : slot === 'body'
            ? 'Semantically close support group. Keep adjacency but give it more width.'
            : 'Lower-priority or utility information. Preserve access without crowding the lead.'
    };
  });

  const notes = [
    `${anchor.id} reads as the semantic anchor: strongest blend of query relevance and centrality.`,
    `${bridge.id} behaves like the bridge: it has the highest cross-cluster affinity.`,
    clusterSeparation > 0.12
      ? 'Clusters are meaningfully separated. Use them as spacing or zoning priors.'
      : 'Clusters are soft. Use topology as adjacency hints, not hard partitions.'
  ];

  const verdict =
    clusterSeparation > 0.12 && adjacencyConfidence > 0.56
      ? 'promising'
      : clusterSeparation > 0.06 && adjacencyConfidence > 0.46
        ? 'exploratory'
        : 'weak';

  const reasons = [
    `cluster separation ${clusterSeparation}`,
    `adjacency confidence ${adjacencyConfidence}`,
    `query alignment ${queryAlignment}`
  ];

  return {
    mode: options.mode,
    model: options.model,
    query: options.query,
    dimensions: options.itemEmbeddings[0]?.length ?? 0,
    items: nodes,
    matrix: matrix.map((row) => row.map((value) => round(value, 3))),
    clusters,
    recommendation: {
      anchorId: anchor.id,
      bridgeId: bridge.id,
      readingOrder,
      slotPlan,
      notes
    },
    metrics: {
      clusterSeparation,
      adjacencyConfidence,
      centralitySpread,
      queryAlignment
    },
    evaluation: {
      verdict,
      summary:
        verdict === 'promising'
          ? 'Embedding geometry looks strong enough to drive soft layout constraints.'
          : verdict === 'exploratory'
            ? 'Embedding geometry is informative, but still needs stronger deterministic guardrails.'
            : 'Embedding geometry is too noisy to steer layout beyond curiosity-level hints.',
      reasons,
      shouldDriveLayout: verdict !== 'weak'
    },
    warnings: options.warnings ?? []
  };
}

export function analyzeEmbeddingTopologyHeuristic(
  items: FutureTopologyItem[],
  query: string
): FutureTopologyReport {
  const texts = items.map(composeFutureTopologyText);
  const itemEmbeddings = createHeuristicEmbeddings(texts);
  const queryEmbedding = createHeuristicEmbedding(query);

  return analyzeEmbeddingTopology({
    items,
    query,
    itemEmbeddings,
    queryEmbedding,
    model: 'heuristic-hash',
    mode: 'heuristic',
    warnings: ['Workers AI not used. This report uses hashed token embeddings as a deterministic baseline.']
  });
}

export function futureSimilarityBand(value: number): 'tight' | 'related' | 'weak' {
  if (value >= 0.72) return 'tight';
  if (value >= 0.48) return 'related';
  return 'weak';
}

export type FutureRefinement =
  | { kind: 'demote'; itemId: string; fromRole: string; toRole: string }
  | { kind: 'promote'; itemId: string; fromRole: string; toRole: string }
  | { kind: 'merge-hint'; itemIds: string[]; reason: string };

export type FutureDiagnosis = {
  stable: boolean;
  notes: string[];
  refinements: FutureRefinement[];
};

const ROLE_TOKENS: Record<string, { fontSize: string; fontWeight: number; color: string; bg?: string }> = {
  title:   { fontSize: '2rem',    fontWeight: 700, color: '#1a1a2e' },
  hero:    { fontSize: '1.75rem', fontWeight: 700, color: '#1a1a2e' },
  body:    { fontSize: '1rem',    fontWeight: 400, color: '#2d2d3a' },
  cta:     { fontSize: '1rem',    fontWeight: 600, color: '#ffffff', bg: '#3a5ccc' },
  data:    { fontSize: '0.875rem',fontWeight: 500, color: '#4a4a5a' },
  support: { fontSize: '0.875rem',fontWeight: 400, color: '#6a6a7a' },
  meta:    { fontSize: '0.75rem', fontWeight: 400, color: '#8a8a9a' },
  eyebrow: { fontSize: '0.75rem', fontWeight: 600, color: '#5a5a6a' },
};

const ZONE_TOKENS: Record<string, { padding: number; gap: number }> = {
  lead:    { padding: 32, gap: 24 },
  body:    { padding: 24, gap: 16 },
  support: { padding: 16, gap: 12 },
  utility: { padding: 12, gap: 8 },
};

export function generateLayoutCss(report: FutureTopologyReport): string {
  const { slotPlan } = report.recommendation;
  const zones = slotPlan.length;
  const lines: string[] = [
    `/* dk future — generated layout */`,
    `/* verdict: ${report.evaluation.verdict} | separation: ${report.metrics.clusterSeparation} | clusters: ${report.clusters.length} */`,
    '',
  ];

  const cols = zones <= 2 ? '1fr' : '1.2fr 0.8fr';
  const rows =
    zones <= 1
      ? 'auto'
      : zones <= 3
        ? 'auto 1fr'
        : 'auto 1fr auto';

  lines.push(
    `.dk-layout {`,
    `  display: grid;`,
    `  grid-template-columns: ${cols};`,
    `  grid-template-rows: ${rows};`,
    `  gap: var(--dk-gap, 1px);`,
    `}`,
    ''
  );

  for (let i = 0; i < slotPlan.length; i += 1) {
    const slot = slotPlan[i];
    const isFirst = i === 0;
    const isLast = i === slotPlan.length - 1 && zones >= 4;
    const span = isFirst || isLast ? '1 / -1' : `${(i % 2) + 1}`;

    const zt = ZONE_TOKENS[slot.slot] ?? ZONE_TOKENS.body;
    lines.push(
      `.dk-zone-${slot.slot} {`,
      `  grid-column: ${span};`,
      `  padding: ${zt.padding}px;`,
      `  gap: ${zt.gap}px;`,
      `  /* ${slot.itemIds.length} items: ${escapeCssComment(slot.itemIds.join(', '))} */`,
      `  /* ${escapeCssComment(slot.rationale)} */`,
      `}`,
      ''
    );
  }

  lines.push('/* Item assignments */');
  for (const node of report.items) {
    const rt = ROLE_TOKENS[node.role] ?? ROLE_TOKENS.body;
    const flags: string[] = [`${node.slot} zone`, `role: ${node.role}`];
    if (node.id === report.recommendation.anchorId) flags.push('anchor');
    if (node.id === report.recommendation.bridgeId) flags.push('bridge');
    const props = [
      `font-size: ${rt.fontSize}`,
      `font-weight: ${rt.fontWeight}`,
      `color: ${rt.color}`,
    ];
    if (rt.bg) props.push(`background-color: ${rt.bg}`);
    lines.push(
      `[data-dk-item="${escapeCssString(node.id)}"] {`,
      `  ${props.join('; ')};`,
      `  /* ${escapeCssComment(flags.join(', '))} */`,
      `}`
    );
  }

  return lines.join('\n');
}

const DEMOTION_ORDER: Record<string, string> = {
  title: 'body',
  hero: 'body',
  body: 'support',
  cta: 'support',
  data: 'support',
  support: 'meta',
};

const PROMOTION_ORDER: Partial<Record<string, string>> = {
  meta: 'support',
  support: 'body',
  data: 'body',
  body: 'title',
};

export function diagnoseFutureTopology(report: FutureTopologyReport, auditReport?: AuditReport): FutureDiagnosis {
  const notes: string[] = [];
  const refinements: FutureRefinement[] = [];
  const { metrics, evaluation, recommendation } = report;

  if (evaluation.verdict === 'weak') {
    notes.push('Topology is too noisy to drive layout. Content items may lack semantic coherence.');
  }

  if (metrics.clusterSeparation < 0.08) {
    notes.push(`Cluster separation is low (${metrics.clusterSeparation}). Items are too semantically similar to form distinct zones.`);
  }

  if (metrics.adjacencyConfidence < 0.5) {
    notes.push(`Adjacency confidence is weak (${metrics.adjacencyConfidence}). No strong neighbor relationships detected.`);
  }

  // Overcrowded lead zone — demote lowest-anchor items
  const leadSlot = recommendation.slotPlan.find(s => s.slot === 'lead');
  if (leadSlot && leadSlot.itemIds.length > 3) {
    const leadNodes = report.items
      .filter(n => leadSlot.itemIds.includes(n.id))
      .sort((a, b) => a.anchorScore - b.anchorScore);

    const demoteCount = leadSlot.itemIds.length - 3;
    for (let i = 0; i < demoteCount; i += 1) {
      const node = leadNodes[i];
      const toRole = DEMOTION_ORDER[node.role] ?? 'support';
      refinements.push({ kind: 'demote', itemId: node.id, fromRole: node.role, toRole });
      notes.push(`Demoting "${node.id}" from ${node.role} to ${toRole} — low anchor score (${round(node.anchorScore, 2)}) in an overcrowded lead zone.`);
    }
  }

  // Fragmented topology — merge singleton zones
  const singleItemSlots = recommendation.slotPlan.filter(s => s.itemIds.length === 1);
  if (singleItemSlots.length >= 3) {
    const singletonIds = singleItemSlots.map(s => s.itemIds[0]);
    refinements.push({
      kind: 'merge-hint',
      itemIds: singletonIds,
      reason: 'Too many isolated zones. Consider making these items more semantically related.'
    });
    notes.push(`${singleItemSlots.length} zones have only 1 item each. Topology is fragmenting content.`);
  }

  // Weak anchor in lead — promote the highest-centrality non-lead item
  if (evaluation.verdict !== 'weak' && leadSlot) {
    const leadAnchor = report.items.find(n => n.id === recommendation.anchorId);
    if (leadAnchor && leadAnchor.anchorScore < 0.3) {
      const outsideCandidates = report.items
        .filter(n => !leadSlot.itemIds.includes(n.id))
        .sort((a, b) => b.centrality - a.centrality);
      const bestOutside = outsideCandidates[0] as typeof outsideCandidates[number] | undefined;
      const promotedRole = bestOutside != null ? PROMOTION_ORDER[bestOutside.role] : undefined;
      if (bestOutside != null && promotedRole != null) {
        refinements.push({
          kind: 'promote',
          itemId: bestOutside.id,
          fromRole: bestOutside.role,
          toRole: promotedRole
        });
        notes.push(`Promoting "${bestOutside.id}" from ${bestOutside.role} to ${promotedRole} — high centrality but outside the lead zone.`);
      }
    }
  }

  if (metrics.queryAlignment < 0.4) {
    notes.push(`Query alignment is low (${metrics.queryAlignment}). The semantic query may not match the content well.`);
  }

  // Audit-driven quality checks
  if (auditReport) {
    if (auditReport.overall < 60) {
      notes.push(`Audit score is low (${auditReport.overall}/100). Design quality needs improvement.`);
    }
    for (const cat of auditReport.categories) {
      if (cat.score < 0.5) {
        notes.push(`Audit: ${cat.label} is weak (${round(cat.score, 2)}). ${cat.summary}`);
      }
    }
  }

  const auditPass = !auditReport || auditReport.overall >= 60;
  const stable = evaluation.verdict !== 'weak' && refinements.length === 0 && notes.length <= 1 && auditPass;

  return { stable, notes, refinements };
}

export function refineFutureItems(
  items: FutureTopologyItem[],
  refinements: FutureRefinement[]
): FutureTopologyItem[] {
  const roleUpdates = new Map<string, string>();
  for (const r of refinements) {
    if (r.kind === 'demote' || r.kind === 'promote') {
      roleUpdates.set(r.itemId, r.toRole);
    }
  }

  if (roleUpdates.size === 0) return items;

  return items.map(item => {
    const newRole = roleUpdates.get(item.id);
    return newRole ? { ...item, role: newRole } : item;
  });
}
