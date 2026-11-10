import { useCallback, useRef, useState } from 'react';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const PAGE_SIZES = {
	letter: { w: 8.5, h: 11, css: 'letter' },
	a4: { w: 8.2677, h: 11.6929, css: 'A4' },
};

export const SIZE_LABELS = {
	name: 'Name',
	title: 'Job title',
	section: 'Section headings',
	entry: 'Entry titles',
	body: 'Body text',
	date: 'Dates and details',
};

export const defaultStyle = () => ({
	font: 'DengXian',
	sizes: { name: 22.5, title: 10.5, section: 10.5, entry: 10.5, body: 10.5, date: 10.5 },
	lineHeight: 1.19,
	spacing: 1,
	mainWidth: 68,
	sidebarSide: 'left',
	page: 'letter',
	marginX: 0.75,
	marginY: 0.6,
	labelWidth: 0.4,
	text: '#000000',
	accent: '#969696',
	link: '#515ee6',
	upperHeadings: true,
	headingLines: true,
	highlight: true,
	highlightExport: false,
	layout: 'two',
	singleColumnOrdered: false,
});

// The first time a resume switches to one column, put contact links first,
// then the main column, then the old sidebar sections. After that the user's
// own one-column order is kept. Two-column order is unaffected, since each
// column keeps its sections' relative order.
export function orderForSingleColumn(d) {
	if (d.style.singleColumnOrdered) return;
	const contacts = d.sections.filter((s) => s.type === 'contacts');
	const rest = d.sections.filter((s) => s.type !== 'contacts');
	d.sections = [...contacts, ...rest.filter((s) => s.column === 'main'), ...rest.filter((s) => s.column === 'side')];
	d.style.singleColumnOrdered = true;
}

const bullet = (html) => ({ id: uid(), html });
const row = (label, html) => ({ id: uid(), label, html });

export const SECTION_TYPES = {
	entries: {
		label: 'Entries (title, date, bullets)',
		addLabel: 'Add entry',
		defaultTitle: 'New Section',
		newItem: () => ({
			id: uid(),
			title: 'Job Title | Company Name',
			right: 'MM/YYYY - Present',
			rightHref: '',
			rightIcon: 'fa-solid fa-link',
			rows: [],
			bullets: [bullet('Accomplished [X] as measured by [Y] by doing [Z].'), bullet('Another result, with a number if you have one.')],
		}),
	},
	skills: {
		label: 'Skill groups (icon, heading, text)',
		addLabel: 'Add skill group',
		defaultTitle: 'Skills',
		newItem: () => ({ id: uid(), icon: 'fa-solid fa-star', title: 'Skill Group', html: 'Skills in this group, separated by commas' }),
	},
	list: {
		label: 'Simple list (text, detail on the right)',
		addLabel: 'Add list item',
		defaultTitle: 'List',
		newItem: () => ({ id: uid(), html: 'List item', right: 'Detail' }),
	},
	contacts: {
		label: 'Contact links (icon, text, link)',
		addLabel: 'Add contact',
		defaultTitle: 'Contact',
		newItem: () => ({ id: uid(), icon: 'fa-solid fa-link', text: 'yourlink.com', href: 'https://yourlink.com' }),
	},
	text: {
		label: 'Paragraph',
		addLabel: 'Add paragraph',
		defaultTitle: 'Summary',
		newItem: () => ({ id: uid(), html: 'Two or three sentences about who you are, what you do best and what you are looking for next.' }),
	},
};

export function newSection(type, column) {
	const t = SECTION_TYPES[type];
	return { id: uid(), column, type, title: t.defaultTitle, showTitle: type !== 'contacts', items: [t.newItem()] };
}

// The resume every new document starts from: a full page of placeholder
// content in the same shape as the original template. Text in [brackets]
// is highlighted in the preview as something to replace.
export function starterResume() {
	const sec = (column, type, title, items, showTitle = true) => ({ id: uid(), column, type, title, showTitle, items });
	const contact = (icon, text, href = '') => ({ id: uid(), icon, text, href });
	const skill = (icon, title, html) => ({ id: uid(), icon, title, html });
	const li = (html, right = '') => ({ id: uid(), html, right });
	const entry = (title, right, { rows = [], bullets = [], href = '' } = {}) => ({
		id: uid(),
		title,
		right,
		rightHref: href,
		rightIcon: 'fa-solid fa-link',
		rows: rows.map(([label, html]) => row(label, html)),
		bullets: bullets.map(bullet),
	});

	return {
		version: 1,
		label: 'New resume',
		name: 'Your Name',
		titleLines: ['Job Title', 'Second Specialty'],
		style: { ...defaultStyle(), labelWidth: 0.55 },
		sections: [
			sec('side', 'contacts', 'Contact', [
				contact('fa-regular fa-envelope', 'yourname@email.com', 'mailto:yourname@email.com'),
				contact('fa-solid fa-phone', '+1 (555) 123-4567', 'tel:+15551234567'),
				contact('fa-solid fa-location-dot', 'City, Country'),
				contact('fa-brands fa-linkedin', 'linkedin.com/in/yourname', 'https://linkedin.com/in/yourname'),
				contact('fa-brands fa-github', 'github.com/yourname', 'https://github.com/yourname'),
				contact('fa-solid fa-earth-americas', 'yourwebsite.com', 'https://yourwebsite.com'),
			], false),
			sec('side', 'skills', 'Skills', [
				skill('fa-solid fa-star', 'Core Skills', 'Your strongest skills for this role, most relevant first'),
				skill('fa-solid fa-screwdriver-wrench', 'Tools', 'Software, platforms and tools you use with confidence'),
				skill('fa-solid fa-chart-column', 'Methods', 'Techniques, frameworks or processes you know well'),
				skill('fa-solid fa-pen-ruler', 'Creative', 'Design, writing or media tools, if relevant'),
			]),
			sec('side', 'list', 'Languages', [li('English', 'Native'), li('Spanish', 'Fluent'), li('French', 'Intermediate')]),
			sec('side', 'list', 'Awards', [
				li('Award or honor name', 'MM/YYYY'),
				li('Scholarship or recognition', 'MM/YYYY'),
				li('Competition or contest result', 'MM/YYYY'),
				li('Certification name', 'MM/YYYY'),
			]),
			sec('side', 'list', 'Interests', [li('Hobby or interest'), li('Sport or activity'), li('Conversation starter')]),
			sec('main', 'entries', 'Education', [
				entry('University Name | Degree, Major', 'MM/YYYY - MM/YYYY', {
					rows: [
						['Focus', 'Concentration, minor or thesis topic'],
						['Courses', 'Course name, course name, course name, course name, course name, course name'],
						['Honors', "Dean's List, GPA [X.XX], honor society or other distinction"],
					],
				}),
			]),
			sec('main', 'entries', 'Experience', [
				entry('Job Title | Company Name', 'MM/YYYY - Present', {
					bullets: [
						'Led a cross-team project that improved customer retention by [X]% by redesigning the onboarding process.',
						'Built a reporting tool used by [X] people across [X] teams to track weekly goals.',
						'Partnered with product and marketing to launch [X] new features, each delivered on schedule.',
					],
				}),
				entry('Job Title | Company Name', 'MM/YYYY - MM/YYYY', {
					bullets: [
						'Managed [X] client accounts and kept satisfaction scores above [X]% for [X] quarters in a row.',
						'Cut processing time by [X]% by automating a manual weekly workflow.',
						'Trained and mentored [X] new hires on internal tools and processes.',
					],
				}),
				entry('Job Title | Company Name', 'MM/YYYY - MM/YYYY', {
					bullets: ['Summarize an earlier or part-time role in one line, focusing on the skill most relevant to the job you want.'],
				}),
			]),
			sec('main', 'entries', 'Projects', [
				entry('Project Name', 'projectsite.com', {
					href: 'https://projectsite.com',
					bullets: [
						'Describe what the project is and who it is for in one sentence.',
						'Explain what you built or contributed and the tools you used to do it.',
						'Share a result such as [X] users, [X] downloads or an award it won.',
					],
				}),
				entry('Second Project Name', '', {
					bullets: [
						'Built a web app that helps [X] users plan and track a monthly budget.',
						'Designed the interface and wrote the code, then shared it on GitHub.',
					],
				}),
				entry('Third Project Name', '', {
					bullets: [
						'Created a video series that reached [X] views across [X] platforms.',
						'Planned, filmed and edited each episode and grew the audience through weekly posts.',
					],
				}),
			]),
			sec('main', 'entries', 'Leadership & Volunteering', [
				entry('Role | Organization Name', 'MM/YYYY - Present', {
					bullets: [
						'Organized [X] events for a community of [X] members, handling planning, promotion and logistics.',
						'Raised $[X] for a local cause by coordinating a team of [X] volunteers.',
						'Mentored [X] newer members through a semester-long program.',
					],
				}),
			]),
		],
	};
}

// Fill in anything missing so older or hand-edited files still load.
export function normalize(doc) {
	const d = structuredClone(doc ?? {});
	const base = defaultStyle();
	d.version = 1;
	d.label = d.label || d.name || 'Imported resume';
	d.name = d.name ?? '';
	d.titleLines = Array.isArray(d.titleLines) ? d.titleLines : [];
	d.style = { ...base, ...(d.style ?? {}), sizes: { ...base.sizes, ...(d.style?.sizes ?? {}) } };
	d.sections = (Array.isArray(d.sections) ? d.sections : [])
		.filter((s) => SECTION_TYPES[s?.type])
		.map((s) => ({
			id: s.id || uid(),
			column: s.column === 'side' ? 'side' : 'main',
			type: s.type,
			title: s.title ?? '',
			showTitle: s.showTitle !== false,
			items: (s.items ?? []).map((it) => {
				const item = { ...SECTION_TYPES[s.type].newItem(), ...it, id: it.id || uid() };
				if (s.type === 'entries') {
					item.rows = (it.rows ?? []).map((r) => ({ id: r.id || uid(), label: r.label ?? '', html: r.html ?? '' }));
					item.bullets = (it.bullets ?? []).map((b) => (typeof b === 'string' ? bullet(b) : { id: b.id || uid(), html: b.html ?? '' }));
				}
				return item;
			}),
		}));
	return d;
}

// Give every section, item, row and bullet a fresh id (used when duplicating).
export function reId(doc) {
	const d = structuredClone(doc);
	for (const s of d.sections) {
		s.id = uid();
		for (const it of s.items) {
			it.id = uid();
			it.rows?.forEach((r) => (r.id = uid()));
			it.bullets?.forEach((b) => (b.id = uid()));
		}
	}
	return d;
}

const KEY = 'resume-editor:v1';

export function loadLibrary() {
	try {
		const lib = JSON.parse(localStorage.getItem(KEY));
		if (lib?.docs?.[lib.currentId]) {
			for (const id of Object.keys(lib.docs)) lib.docs[id] = normalize(lib.docs[id]);
			return lib;
		}
	} catch {
		/* fall through to a fresh library */
	}
	const id = uid();
	return { currentId: id, docs: { [id]: starterResume() } };
}

export function saveLibrary(lib) {
	try {
		localStorage.setItem(KEY, JSON.stringify(lib));
		return true;
	} catch {
		return false;
	}
}

// Undo/redo history. Edits that share a `key` within a second are merged,
// so typing a word is one undo step rather than one per letter.
export function useHistory(initial) {
	const [h, setH] = useState({ past: [], present: initial, future: [] });
	const last = useRef({ key: null, t: 0 });

	const update = useCallback((fn, key = null) => {
		const now = Date.now();
		const merge = key !== null && key === last.current.key && now - last.current.t < 1000;
		last.current = { key, t: now };
		setH((s) => {
			const draft = structuredClone(s.present);
			const result = fn(draft);
			const next = result === undefined ? draft : result;
			return { past: merge ? s.past : [...s.past, s.present].slice(-200), present: next, future: [] };
		});
	}, []);

	const undo = useCallback(() => {
		last.current = { key: null, t: 0 };
		setH((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s));
	}, []);

	const redo = useCallback(() => {
		last.current = { key: null, t: 0 };
		setH((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s));
	}, []);

	const reset = useCallback((doc) => {
		last.current = { key: null, t: 0 };
		setH({ past: [], present: doc, future: [] });
	}, []);

	return { doc: h.present, update, undo, redo, reset, canUndo: h.past.length > 0, canRedo: h.future.length > 0 };
}

// Array helpers used by the editor.
export function move(arr, index, delta) {
	const j = index + delta;
	if (j < 0 || j >= arr.length) return;
	[arr[index], arr[j]] = [arr[j], arr[index]];
}

export function countPlaceholders(doc) {
	return (JSON.stringify(doc.sections).match(/\[[^\[\]"]{1,40}\]/g) ?? []).length;
}
