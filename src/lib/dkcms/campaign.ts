import type { FutureTopologyItem } from '../dk/future.ts';

export type EmailCampaignSection = {
  id: string;
  kind: string;
  heading: string;
  body: string;
};

export type EmailCampaignPrimaryCta = {
  label: string;
  href: string;
  supportingText: string;
};

export type EmailCampaignContent = {
  subject: string;
  preheader: string;
  eyebrow: string;
  headline: string;
  dek: string;
  primaryCta: EmailCampaignPrimaryCta;
  sections: EmailCampaignSection[];
  footerNote: string;
};

export const DEFAULT_EMAIL_CAMPAIGN_CONTENT: EmailCampaignContent = {
  subject: 'DesignKit campaign',
  preheader: 'A concise campaign built from structured content.',
  eyebrow: 'DesignKit campaign',
  headline: 'A campaign worth opening',
  dek: 'Lead with a clear promise, support it with strong sections, and close with a simple action.',
  primaryCta: {
    label: 'Learn more',
    href: 'https://dkcli.com',
    supportingText: 'Open the campaign landing page.'
  },
  sections: [
    {
      id: 'section-1',
      kind: 'feature',
      heading: 'Why it matters',
      body: 'Turn structured campaign content into a hosted page and email-ready artifacts.'
    },
    {
      id: 'section-2',
      kind: 'proof',
      heading: 'What makes it useful',
      body: 'Keep authoring in one place, preview before publishing, and export the email HTML when it is ready.'
    }
  ],
  footerNote: 'You are receiving this because you asked for product and launch updates.'
};

export function cloneEmailCampaignContent(
  content: EmailCampaignContent = DEFAULT_EMAIL_CAMPAIGN_CONTENT
): EmailCampaignContent {
  return {
    subject: content.subject,
    preheader: content.preheader,
    eyebrow: content.eyebrow,
    headline: content.headline,
    dek: content.dek,
    primaryCta: {
      label: content.primaryCta.label,
      href: content.primaryCta.href,
      supportingText: content.primaryCta.supportingText
    },
    sections: content.sections.map((section) => ({ ...section })),
    footerNote: content.footerNote
  };
}

function normalizeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

export function isSafeEmailCampaignHref(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /\p{Cc}/u.test(trimmed)) {
    return false;
  }

  try {
    const url = new URL(trimmed, 'https://dkcli.local');
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:';
  } catch {
    return false;
  }
}

export function normalizeEmailCampaignHref(
  value: unknown,
  fallback = DEFAULT_EMAIL_CAMPAIGN_CONTENT.primaryCta.href
): string {
  const href = normalizeText(value, fallback);
  if (isSafeEmailCampaignHref(href)) {
    return href;
  }

  return isSafeEmailCampaignHref(fallback) ? fallback : '';
}

function normalizePrimaryCta(input: unknown): EmailCampaignPrimaryCta {
  const candidate = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};

  return {
    label: normalizeText(candidate.label, DEFAULT_EMAIL_CAMPAIGN_CONTENT.primaryCta.label),
    href: normalizeEmailCampaignHref(candidate.href, DEFAULT_EMAIL_CAMPAIGN_CONTENT.primaryCta.href),
    supportingText: normalizeText(
      candidate.supportingText,
      DEFAULT_EMAIL_CAMPAIGN_CONTENT.primaryCta.supportingText
    )
  };
}

function normalizeSections(input: unknown): EmailCampaignSection[] {
  if (!Array.isArray(input)) {
    return cloneEmailCampaignContent().sections;
  }

  const sections = input
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const candidate = entry as Record<string, unknown>;
      const id = normalizeText(candidate.id, `section-${index + 1}`);
      const heading = normalizeText(candidate.heading);
      const body = normalizeText(candidate.body);
      const kind = normalizeText(candidate.kind, 'body');

      if (!id || !heading || !body) {
        return null;
      }

      return {
        id,
        kind,
        heading,
        body
      } satisfies EmailCampaignSection;
    })
    .filter((section): section is EmailCampaignSection => section !== null);

  return sections.length > 0 ? sections : cloneEmailCampaignContent().sections;
}

export function normalizeEmailCampaignContent(input: unknown): EmailCampaignContent {
  const candidate = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};

  return {
    subject: normalizeText(candidate.subject, DEFAULT_EMAIL_CAMPAIGN_CONTENT.subject),
    preheader: normalizeText(candidate.preheader, DEFAULT_EMAIL_CAMPAIGN_CONTENT.preheader),
    eyebrow: normalizeText(candidate.eyebrow, DEFAULT_EMAIL_CAMPAIGN_CONTENT.eyebrow),
    headline: normalizeText(candidate.headline, DEFAULT_EMAIL_CAMPAIGN_CONTENT.headline),
    dek: normalizeText(candidate.dek, DEFAULT_EMAIL_CAMPAIGN_CONTENT.dek),
    primaryCta: normalizePrimaryCta(candidate.primaryCta),
    sections: normalizeSections(candidate.sections),
    footerNote: normalizeText(candidate.footerNote, DEFAULT_EMAIL_CAMPAIGN_CONTENT.footerNote)
  };
}

function roleForSectionKind(kind: string): string {
  switch (kind) {
    case 'proof':
    case 'metric':
    case 'faq':
      return 'data';
    case 'support':
    case 'testimonial':
      return 'support';
    case 'meta':
    case 'footer':
      return 'meta';
    case 'hero':
      return 'hero';
    default:
      return 'body';
  }
}

export function compileEmailCampaignItems(content: EmailCampaignContent): FutureTopologyItem[] {
  const normalized = normalizeEmailCampaignContent(content);
  const items: FutureTopologyItem[] = [];

  if (normalized.eyebrow) {
    items.push({
      id: 'eyebrow',
      role: 'meta',
      label: normalized.eyebrow,
      text: normalized.preheader || normalized.subject
    });
  }

  items.push({
    id: 'headline',
    role: 'title',
    label: normalized.headline,
    text: normalized.dek
  });

  if (normalized.preheader) {
    items.push({
      id: 'preheader',
      role: 'support',
      label: 'Preheader',
      text: normalized.preheader
    });
  }

  for (const section of normalized.sections) {
    items.push({
      id: section.id,
      role: roleForSectionKind(section.kind),
      label: section.heading,
      text: section.body
    });
  }

  if (normalized.primaryCta.label || normalized.primaryCta.supportingText) {
    items.push({
      id: 'primary-cta',
      role: 'cta',
      label: normalized.primaryCta.label,
      text: normalized.primaryCta.supportingText,
      href: normalized.primaryCta.href
    });
  }

  if (normalized.footerNote) {
    items.push({
      id: 'footer-note',
      role: 'meta',
      label: 'Footer note',
      text: normalized.footerNote
    });
  }

  return items;
}

export function deriveEmailCampaignContentFromItems(input: {
  title: string;
  summary: string | null;
  items: FutureTopologyItem[];
}): EmailCampaignContent {
  const headline =
    input.items.find((item) => item.role === 'title' || item.role === 'hero')?.label || input.title;
  const dek =
    input.items.find((item) => item.role === 'title' || item.role === 'hero')?.text ||
    input.summary ||
    DEFAULT_EMAIL_CAMPAIGN_CONTENT.dek;
  const cta = input.items.find((item) => item.role === 'cta');
  const sections = input.items
    .filter((item) => !['title', 'hero', 'cta', 'meta'].includes(item.role))
    .map((item, index) => ({
      id: item.id || `section-${index + 1}`,
      kind: item.role,
      heading: item.label,
      body: item.text
    }));

  return normalizeEmailCampaignContent({
    subject: input.title,
    preheader: input.summary ?? dek,
    eyebrow: DEFAULT_EMAIL_CAMPAIGN_CONTENT.eyebrow,
    headline,
    dek,
    primaryCta: {
      label: cta?.label ?? DEFAULT_EMAIL_CAMPAIGN_CONTENT.primaryCta.label,
      href: cta?.href ?? DEFAULT_EMAIL_CAMPAIGN_CONTENT.primaryCta.href,
      supportingText: cta?.text ?? DEFAULT_EMAIL_CAMPAIGN_CONTENT.primaryCta.supportingText
    },
    sections,
    footerNote: DEFAULT_EMAIL_CAMPAIGN_CONTENT.footerNote
  });
}
