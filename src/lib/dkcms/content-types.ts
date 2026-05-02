import {
  DEFAULT_EMAIL_CAMPAIGN_CONTENT,
  cloneEmailCampaignContent,
  compileEmailCampaignItems,
  deriveEmailCampaignContentFromItems,
  isSafeEmailCampaignHref,
  normalizeEmailCampaignContent,
  type EmailCampaignContent
} from './campaign.ts';

import type { FutureTopologyItem } from '../dk/future.ts';

export const EMAIL_CAMPAIGN_CONTENT_TYPE = 'email-campaign';
export const NEXT_DKCMS_CONTENT_TYPE = 'landing-page';

export type DkCmsContentType = typeof EMAIL_CAMPAIGN_CONTENT_TYPE;
export type DkCmsContentPayload = EmailCampaignContent;

export type DkCmsContentValidationResult<TContent> =
  | { ok: true; content: TContent }
  | { ok: false; errors: string[] };

export type DkCmsContentTypeMetadata = {
  type: DkCmsContentType;
  label: string;
  description: string;
  version: number;
  defaultContent: DkCmsContentPayload;
  schema: Record<string, unknown>;
};

export type DkCmsContentTypeAdapter<TContent extends DkCmsContentPayload = DkCmsContentPayload> = {
  type: DkCmsContentType;
  label: string;
  description: string;
  version: number;
  defaultContent: TContent;
  schema: Record<string, unknown>;
  validate(input: unknown): DkCmsContentValidationResult<TContent>;
  normalize(input: unknown): TContent;
  toItems(content: TContent): FutureTopologyItem[];
  deriveFromItems(input: {
    title: string;
    summary: string | null;
    items: FutureTopologyItem[];
  }): TContent;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOptionalString(record: Record<string, unknown>, key: string): boolean {
  return record[key] === undefined || typeof record[key] === 'string';
}

function validateEmailCampaignContent(input: unknown): DkCmsContentValidationResult<EmailCampaignContent> {
  if (!isRecord(input)) {
    return { ok: false, errors: ['content must be an object.'] };
  }

  const errors: string[] = [];
  for (const key of ['subject', 'preheader', 'eyebrow', 'headline', 'dek', 'footerNote']) {
    if (!hasOptionalString(input, key)) {
      errors.push(`${key} must be a string when provided.`);
    }
  }

  if (input.primaryCta !== undefined && !isRecord(input.primaryCta)) {
    errors.push('primaryCta must be an object when provided.');
  }

  if (isRecord(input.primaryCta)) {
    for (const key of ['label', 'href', 'supportingText']) {
      if (!hasOptionalString(input.primaryCta, key)) {
        errors.push(`primaryCta.${key} must be a string when provided.`);
      }
    }

    if (
      typeof input.primaryCta.href === 'string' &&
      input.primaryCta.href.trim() &&
      !isSafeEmailCampaignHref(input.primaryCta.href)
    ) {
      errors.push('primaryCta.href must use http, https, mailto, or a relative path.');
    }
  }

  if (input.sections !== undefined && !Array.isArray(input.sections)) {
    errors.push('sections must be an array when provided.');
  }

  if (Array.isArray(input.sections)) {
    input.sections.forEach((section, index) => {
      if (!isRecord(section)) {
        errors.push(`sections[${index}] must be an object.`);
        return;
      }
      for (const key of ['id', 'kind', 'heading', 'body']) {
        if (!hasOptionalString(section, key)) {
          errors.push(`sections[${index}].${key} must be a string when provided.`);
        }
      }
    });
  }

  return errors.length > 0
    ? { ok: false, errors }
    : { ok: true, content: normalizeEmailCampaignContent(input) };
}

const emailCampaignSchema = {
  type: 'object',
  required: ['subject', 'headline', 'dek'],
  properties: {
    subject: { type: 'string' },
    preheader: { type: 'string' },
    eyebrow: { type: 'string' },
    headline: { type: 'string' },
    dek: { type: 'string' },
    primaryCta: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        href: { type: 'string', format: 'uri-reference' },
        supportingText: { type: 'string' }
      }
    },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          kind: { type: 'string' },
          heading: { type: 'string' },
          body: { type: 'string' }
        }
      }
    },
    footerNote: { type: 'string' }
  }
};

export const emailCampaignContentTypeAdapter: DkCmsContentTypeAdapter = {
  type: EMAIL_CAMPAIGN_CONTENT_TYPE,
  label: 'Email campaign',
  description: 'A typed campaign payload that renders to a hosted page and exportable email artifact.',
  version: 1,
  defaultContent: cloneEmailCampaignContent(DEFAULT_EMAIL_CAMPAIGN_CONTENT),
  schema: emailCampaignSchema,
  validate: validateEmailCampaignContent,
  normalize: normalizeEmailCampaignContent,
  toItems: compileEmailCampaignItems,
  deriveFromItems: deriveEmailCampaignContentFromItems
};

export const DKCMS_CONTENT_TYPE_ADAPTERS = [
  emailCampaignContentTypeAdapter
] as const satisfies readonly DkCmsContentTypeAdapter[];

const adaptersByType = new Map<string, DkCmsContentTypeAdapter>(
  DKCMS_CONTENT_TYPE_ADAPTERS.map((adapter) => [adapter.type, adapter])
);

export function isSupportedDkCmsContentType(value: unknown): value is DkCmsContentType {
  return typeof value === 'string' && adaptersByType.has(value);
}

export function getDkCmsContentTypeAdapter(type: string): DkCmsContentTypeAdapter | null {
  return adaptersByType.get(type) ?? null;
}

export function listDkCmsContentTypeMetadata(): DkCmsContentTypeMetadata[] {
  return DKCMS_CONTENT_TYPE_ADAPTERS.map((adapter) => ({
    type: adapter.type,
    label: adapter.label,
    description: adapter.description,
    version: adapter.version,
    defaultContent: adapter.defaultContent,
    schema: adapter.schema
  }));
}

export function validateDkCmsContent(
  contentType: string,
  input: unknown
): DkCmsContentValidationResult<DkCmsContentPayload> {
  const adapter = getDkCmsContentTypeAdapter(contentType);
  if (!adapter) {
    return { ok: false, errors: [`Unsupported content type "${contentType}".`] };
  }
  return adapter.validate(input);
}

export function normalizeDkCmsContent(
  contentType: DkCmsContentType,
  input: unknown
): DkCmsContentPayload {
  return getDkCmsContentTypeAdapter(contentType)?.normalize(input) ?? emailCampaignContentTypeAdapter.defaultContent;
}

export function compileDkCmsContentItems(
  contentType: DkCmsContentType,
  content: DkCmsContentPayload
): FutureTopologyItem[] {
  return getDkCmsContentTypeAdapter(contentType)?.toItems(content) ?? [];
}

export function deriveDkCmsContentFromItems(input: {
  contentType?: string | null;
  title: string;
  summary: string | null;
  items: FutureTopologyItem[];
}): DkCmsContentPayload {
  const adapter = input.contentType ? getDkCmsContentTypeAdapter(input.contentType) : null;
  return (adapter ?? emailCampaignContentTypeAdapter).deriveFromItems(input);
}
