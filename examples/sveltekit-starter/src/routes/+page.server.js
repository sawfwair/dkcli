import { fail } from '@sveltejs/kit';
import { fitsReleaseCookie, parseTheme, readReleases, validateRelease } from '$lib/model.js';

/** @type {import('./$types').PageServerLoad} */
export function load({ cookies }) { return { releases: readReleases(cookies.get('desk-releases')) }; }

/** @param {import('@sveltejs/kit').Cookies} cookies @param {string} name @param {unknown} value @param {URL} url @returns {void} */
function save(cookies, name, value, url) {
  cookies.set(name, JSON.stringify(value), { path: '/', httpOnly: true, sameSite: 'lax', secure: url.protocol === 'https:', maxAge: 60 * 60 * 24 * 30 });
}

/** @type {import('./$types').Actions} */
export const actions = {
  create: async ({ request, cookies, url }) => {
    const { fields, errors } = validateRelease(await request.formData());
    if (Object.keys(errors).length) return fail(400, { kind: 'create', fields, errors, message: 'Correct the marked fields.' });
    const releases = readReleases(cookies.get('desk-releases'));
    if (releases.length >= 8) return fail(400, { kind: 'create', fields, errors: /** @type {Record<string,string>} */ ({}), message: 'The 8-release limit is reached. To restore the sample releases, reset releases. This replaces your release list.' });
    const id = `RL-${Math.max(104, ...releases.map((row) => Number(row.id.slice(3)))) + 1}`;
    releases.unshift({ id, title: fields.title, owner: fields.owner, environment: /** @type {'Staging'|'Production'} */ (fields.environment), status: 'In review' });
    if (!fitsReleaseCookie(releases)) return fail(400, { kind: 'create', fields, errors: /** @type {Record<string,string>} */ ({}), message: 'Browser storage is full. To restore the sample releases, reset releases. This replaces your release list.' });
    save(cookies, 'desk-releases', releases, url);
    return { kind: 'create', message: `Created ${fields.title}.` };
  },
  update: async ({ request, cookies, url }) => {
    const fields = await request.formData();
    const id = fields.get('id');
    const status = fields.get('status');
    const releases = readReleases(cookies.get('desk-releases'));
    const release = releases.find((row) => row.id === id);
    if (!release || (status !== 'Ready' && status !== 'Archived' && status !== 'In review')) return fail(400, { kind: 'update', message: 'Choose an existing release and a valid status.' });
    release.status = status;
    save(cookies, 'desk-releases', releases, url);
    return { kind: 'update', message: `Updated ${release.title} to ${status.toLowerCase()}.` };
  },
  theme: async ({ request, cookies, url }) => {
    const fields = await request.formData();
    let candidate;
    if (fields.get('themeJson')) {
      try { candidate = JSON.parse(String(fields.get('themeJson'))); } catch { return fail(400, { kind: 'theme', message: 'Paste valid theme JSON exported from the workbench.' }); }
    } else {
      candidate = { name: fields.get('name'), seed: { color: fields.get('color'), mode: fields.get('mode'), density: fields.get('density'), ratio: Number(fields.get('ratio')) } };
    }
    const config = parseTheme(candidate);
    if (!config) return fail(400, { kind: 'theme', message: 'Enter a theme name and a six-digit hex color. Select a mode and density. Enter a scale ratio from 1.05 to 2.' });
    save(cookies, 'desk-theme', config, url);
    return { kind: 'theme', message: `Applied ${config.name}.` };
  },
  reset: ({ cookies }) => {
    cookies.delete('desk-releases', { path: '/' });
    return { kind: 'reset', message: 'Sample releases restored.' };
  }
};
