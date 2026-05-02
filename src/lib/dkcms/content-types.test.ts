import { describe, expect, it } from 'vitest';

import {
  EMAIL_CAMPAIGN_CONTENT_TYPE,
  getDkCmsContentTypeAdapter,
  isSupportedDkCmsContentType,
  listDkCmsContentTypeMetadata,
  validateDkCmsContent
} from './content-types.ts';

describe('DkCms content type registry', () => {
  it('exposes email-campaign as the first supported type', () => {
    expect(isSupportedDkCmsContentType(EMAIL_CAMPAIGN_CONTENT_TYPE)).toBe(true);
    expect(isSupportedDkCmsContentType('landing-page')).toBe(false);
    expect(listDkCmsContentTypeMetadata()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: EMAIL_CAMPAIGN_CONTENT_TYPE,
          label: 'Email campaign',
          version: 1
        })
      ])
    );
  });

  it('validates email campaign content through the adapter', () => {
    const adapter = getDkCmsContentTypeAdapter(EMAIL_CAMPAIGN_CONTENT_TYPE);
    expect(adapter).toBeTruthy();

    const result = validateDkCmsContent(EMAIL_CAMPAIGN_CONTENT_TYPE, {
      subject: 'Launch',
      headline: 'A sharper launch',
      dek: 'One page and one email artifact.',
      sections: []
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content.subject).toBe('Launch');
      expect(adapter?.toItems(result.content).length).toBeGreaterThan(0);
    }
  });

  it('rejects invalid or unsupported content payloads', () => {
    expect(validateDkCmsContent(EMAIL_CAMPAIGN_CONTENT_TYPE, 'bad')).toEqual({
      ok: false,
      errors: ['content must be an object.']
    });

    expect(validateDkCmsContent('landing-page', {})).toEqual({
      ok: false,
      errors: ['Unsupported content type "landing-page".']
    });
  });

  it('rejects unsafe campaign CTA hrefs', () => {
    expect(
      validateDkCmsContent(EMAIL_CAMPAIGN_CONTENT_TYPE, {
        subject: 'Launch',
        headline: 'A sharper launch',
        dek: 'One page and one email artifact.',
        primaryCta: {
          label: 'Open',
          href: "javascript:fetch('/v1/sites')",
          supportingText: 'See the page.'
        }
      })
    ).toEqual({
      ok: false,
      errors: ['primaryCta.href must use http, https, mailto, or a relative path.']
    });
  });
});
