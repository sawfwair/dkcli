export type DkCmsCliAccessTokenClaims = {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
  typ: 'dkcms-cli-access';
};

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function decodeDkCmsCliAccessToken(
  token: string
): DkCmsCliAccessTokenClaims | null {
  const [encodedPayload] = token.split('.');
  if (!encodedPayload) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(encodedPayload)) as DkCmsCliAccessTokenClaims;
  } catch {
    return null;
  }
}
