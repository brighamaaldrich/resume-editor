// Rich text is stored as a small, safe subset of HTML: bold, italic,
// underline and links. Everything else is unwrapped to plain text.

const TAGS = { B: 'b', STRONG: 'b', I: 'i', EM: 'i', U: 'u', A: 'a' };
const SAFE_HREF = /^(https?:|mailto:|tel:)/i;

const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => escapeText(s).replace(/"/g, '&quot;');

function serialize(node) {
	let out = '';
	for (const child of node.childNodes) {
		if (child.nodeType === Node.TEXT_NODE) {
			out += escapeText(child.textContent.replace(/ /g, ' '));
		} else if (child.nodeType === Node.ELEMENT_NODE) {
			const tag = TAGS[child.tagName];
			const inner = serialize(child);
			if (child.tagName === 'BR' || child.tagName === 'DIV' || child.tagName === 'P') {
				out += (out && !out.endsWith(' ') ? ' ' : '') + inner;
			} else if (tag === 'a') {
				const href = (child.getAttribute('href') || '').trim();
				out += SAFE_HREF.test(href) ? `<a href="${escapeAttr(href)}">${inner}</a>` : inner;
			} else if (tag) {
				out += inner ? `<${tag}>${inner}</${tag}>` : '';
			} else {
				out += inner;
			}
		}
	}
	return out;
}

export function cleanHtml(html) {
	if (!html) return '';
	const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
	return serialize(doc.body.firstChild).replace(/\s+$/, (m) => (m.includes(' ') ? ' ' : ''));
}

// Wrap [placeholders] in a highlight span, skipping anything inside tags.
export function highlightPlaceholders(html) {
	return html
		.split(/(<[^>]+>)/)
		.map((part) => (part.startsWith('<') ? part : part.replace(/\[[^\[\]]{1,40}\]/g, '<span class="fill">$&</span>')))
		.join('');
}

export const renderHtml = (html) => ({ __html: highlightPlaceholders(cleanHtml(html)) });
