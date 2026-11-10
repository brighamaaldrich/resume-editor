// Builds a compact, searchable list of the free Font Awesome icons.
// Run with `npm run icons` after upgrading @fortawesome/fontawesome-free.
import { readFileSync, writeFileSync } from 'node:fs';

const src = new URL('../node_modules/@fortawesome/fontawesome-free/metadata/icon-families.json', import.meta.url);
const all = JSON.parse(readFileSync(src, 'utf8'));
const out = [];
for (const [name, meta] of Object.entries(all)) {
	for (const { family, style } of meta.familyStylesByLicense?.free ?? []) {
		if (family !== 'classic') continue;
		const terms = [meta.label, ...(meta.search?.terms ?? [])].join(' ').toLowerCase();
		out.push({ c: `fa-${style} fa-${name}`, n: name, s: style, t: terms });
	}
}
writeFileSync(new URL('../src/data/icons.json', import.meta.url), JSON.stringify(out));
console.log(`Wrote ${out.length} icons`);
