// Fonts offered in the picker. Google fonts load on demand, system fonts
// need nothing, and DengXian (the original template font) loads in index.html.
const google = (cat, names) => names.map((name) => ({ name, cat, source: 'google' }));

export const FONTS = [
	{ name: 'DengXian', cat: 'Template', source: 'local' },
	...google('Sans serif', [
		'Inter', 'Roboto', 'Open Sans', 'Lato', 'Source Sans 3', 'Noto Sans', 'Nunito Sans', 'Work Sans',
		'IBM Plex Sans', 'Fira Sans', 'PT Sans', 'Raleway', 'Montserrat', 'Poppins', 'Karla', 'Manrope',
		'DM Sans', 'Figtree', 'Outfit', 'Mulish', 'Barlow', 'Rubik', 'Libre Franklin', 'Public Sans', 'Lexend',
	]),
	...google('Serif', [
		'Merriweather', 'Lora', 'Source Serif 4', 'EB Garamond', 'Libre Baskerville', 'Crimson Pro', 'PT Serif',
		'Playfair Display', 'Noto Serif', 'IBM Plex Serif', 'Spectral', 'Cormorant Garamond', 'Roboto Slab',
	]),
	...google('Monospace', ['Roboto Mono', 'IBM Plex Mono', 'JetBrains Mono']),
	...['Helvetica', 'Arial', 'Avenir Next', 'Georgia', 'Times New Roman', 'Garamond'].map((name) => ({
		name,
		cat: 'System',
		source: 'system',
	})),
];

const SERIF = new Set(FONTS.filter((f) => f.cat === 'Serif').map((f) => f.name).concat(['Georgia', 'Times New Roman', 'Garamond']));

export function fontStack(name) {
	const fallback = SERIF.has(name) ? 'serif' : FONTS.find((f) => f.name === name)?.cat === 'Monospace' ? 'monospace' : 'sans-serif';
	return `"${name}", ${fallback}`;
}

const familyParam = (name) => encodeURIComponent(name).replace(/%20/g, '+');
const loaded = new Map(); // font name -> its <link> element

// Load a Google font with regular, bold and italics. Some families lack an
// italic or bold cut, so fall back to whatever the family has.
export function ensureFont(name) {
	const known = FONTS.find((f) => f.name === name);
	if (!name || loaded.has(name) || (known && known.source !== 'google')) return;
	const link = document.createElement('link');
	loaded.set(name, link);
	link.rel = 'stylesheet';
	link.href = `https://fonts.googleapis.com/css2?family=${familyParam(name)}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
	link.onerror = () => {
		link.onerror = () => {
			link.onerror = null;
			link.href = `https://fonts.googleapis.com/css2?family=${familyParam(name)}&display=swap`;
		};
		link.href = `https://fonts.googleapis.com/css2?family=${familyParam(name)}:wght@400;700&display=swap`;
	};
	document.head.appendChild(link);
}

// One small request that loads just the letters needed to show each
// Google font's name in its own typeface inside the picker.
let previewsLoaded = false;
export function loadFontPreviews() {
	if (previewsLoaded) return;
	previewsLoaded = true;
	const names = FONTS.filter((f) => f.source === 'google').map((f) => f.name);
	const text = [...new Set(names.join(''))].join('');
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = `https://fonts.googleapis.com/css2?${names.map((n) => `family=${familyParam(n)}`).join('&')}&text=${encodeURIComponent(text)}&display=swap`;
	// Put this first in <head> so a full font loaded by ensureFont (appended
	// later in document order) always wins over this partial subset.
	document.head.prepend(link);
}

// Stylesheet URL for a font, for use in exported HTML (null for system fonts).
export function fontHref(name) {
	if (name === 'DengXian') return 'https://fonts.cdnfonts.com/css/dengxian';
	const known = FONTS.find((f) => f.name === name);
	if (known?.source === 'system') return null;
	return loaded.get(name)?.href ?? `https://fonts.googleapis.com/css2?family=${familyParam(name)}&display=swap`;
}
