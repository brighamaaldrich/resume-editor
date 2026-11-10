import { useCallback, useEffect, useRef, useState } from 'react';
import { PAGE_SIZES, loadLibrary, normalize, reId, saveLibrary, starterResume, uid, useHistory } from './state.js';
import { ensureFont, fontHref } from './fonts.js';
import resumeCss from './resume.css?raw';
import { ContentEditor } from './components/ContentEditor.jsx';
import { StylePanel } from './components/StylePanel.jsx';
import { Preview } from './components/Preview.jsx';
import { FormatBar } from './components/controls.jsx';

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function download(text, filename, type) {
	const a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([text], { type }));
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// A standalone HTML file of the current page: the rendered markup plus the
// template CSS, with fonts and icons loaded from public CDNs.
function buildHtml(doc, pageEl) {
	const page = pageEl.cloneNode(true);
	page.style.removeProperty('--fit');
	if (!doc.style.highlightExport) page.classList.remove('hl');
	const size = (PAGE_SIZES[doc.style.page] ?? PAGE_SIZES.letter).css;
	const font = fontHref(doc.style.font);
	const title = escapeHtml(`${doc.name || 'Resume'} Resume`);
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
${font ? `<link rel="stylesheet" href="${escapeHtml(font)}" />\n` : ''}<style>
@page { size: ${size}; margin: 0; }
html { background: rgb(85, 85, 92); }
body { margin: 0; padding: 0.4in 0; display: flex; justify-content: center; }
.page { box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35); flex-shrink: 0; }
@media print {
	html { background: none; }
	body { padding: 0; display: block; }
	.page { box-shadow: none; overflow: hidden; }
	.page, .page * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

${resumeCss}
</style>
</head>
<body>
${page.outerHTML}
</body>
</html>
`;
}

const slug = (s) => (s || 'resume').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_') || 'resume';

function Btn({ icon, children, ...props }) {
	return (
		<button className="btn" {...props}>
			<i className={icon} />
			{children && <span className="btn-text">{children}</span>}
		</button>
	);
}

export default function App() {
	const [library, setLibrary] = useState(loadLibrary);
	const { doc, update, undo, redo, reset, canUndo, canRedo } = useHistory(library.docs[library.currentId]);
	const [tab, setTab] = useState('content');
	const [saved, setSaved] = useState(true);
	const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
	const fileRef = useRef(null);

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('resume-editor:theme', theme);
		} catch {
			/* theme just won't be remembered */
		}
	}, [theme]);

	// Keep the library in step with the resume being edited, and save it.
	useEffect(() => {
		setLibrary((l) => (l.docs[l.currentId] === doc ? l : { ...l, docs: { ...l.docs, [l.currentId]: doc } }));
	}, [doc]);
	useEffect(() => setSaved(saveLibrary(library)), [library]);
	useEffect(() => ensureFont(doc.style.font), [doc.style.font]);

	const switchTo = (id, docs = library.docs) => {
		setLibrary({ currentId: id, docs });
		reset(docs[id]);
	};
	const addDoc = (d) => {
		const id = uid();
		switchTo(id, { ...library.docs, [id]: d });
	};

	const deleteDoc = () => {
		if (!window.confirm(`Delete “${doc.label}”? This cannot be undone. Export it as JSON first if you might want it back.`)) return;
		const { [library.currentId]: _gone, ...rest } = library.docs;
		if (!Object.keys(rest).length) {
			const id = uid();
			rest[id] = starterResume();
		}
		switchTo(Object.keys(rest)[0], rest);
	};

	const exportJson = () => download(JSON.stringify(doc, null, 2), `${slug(doc.label)}.json`, 'application/json');

	const exportHtml = () => {
		const page = document.querySelector('.preview-pane .page');
		if (page) download(buildHtml(doc, page), `${slug(doc.name || doc.label)}_Resume.html`, 'text/html');
	};

	const importJson = async (file) => {
		try {
			const data = JSON.parse(await file.text());
			if (!Array.isArray(data.sections)) throw new Error('missing sections');
			addDoc(normalize(data));
		} catch {
			window.alert('That file could not be read as a resume. It should be a .json file exported from this editor.');
		}
	};

	const exportPdf = useCallback(async () => {
		await document.fonts.ready;
		const prev = document.title;
		document.title = `${doc.name || 'Resume'} Resume`; // Chrome uses this as the file name
		window.print();
		document.title = prev;
	}, [doc.name]);

	useEffect(() => {
		const onKey = (e) => {
			if (!(e.metaKey || e.ctrlKey)) return;
			const k = e.key.toLowerCase();
			if (k === 'z' && !e.shiftKey) {
				e.preventDefault();
				undo();
			} else if ((k === 'z' && e.shiftKey) || k === 'y') {
				e.preventDefault();
				redo();
			} else if (k === 'p') {
				e.preventDefault();
				exportPdf();
			}
		};
		window.addEventListener('keydown', onKey, true);
		return () => window.removeEventListener('keydown', onKey, true);
	}, [undo, redo, exportPdf]);

	return (
		<div className="app">
			<style>{`@page { size: ${(PAGE_SIZES[doc.style.page] ?? PAGE_SIZES.letter).css}; margin: 0; }`}</style>
			<header className="topbar">
				<div className="brand">
					<i className="fa-solid fa-file-lines" /> Resume Editor
				</div>
				<select value={library.currentId} onChange={(e) => switchTo(e.target.value)} title="Switch resume" aria-label="Switch resume">
					{Object.entries(library.docs).map(([id, d]) => (
						<option key={id} value={id}>
							{d.label}
						</option>
					))}
				</select>
				<input
					className="label-input"
					value={doc.label}
					onChange={(e) => update((d) => void (d.label = e.target.value), 'label')}
					title="Rename this resume (only shown in the editor)"
					aria-label="Resume name"
				/>
				<Btn icon="fa-solid fa-plus" title="New resume from the template" onClick={() => addDoc(starterResume())}>
					New
				</Btn>
				<Btn
					icon="fa-regular fa-copy"
					title="Duplicate this resume"
					onClick={() => addDoc({ ...reId(doc), label: `${doc.label} (copy)` })}
				>
					Duplicate
				</Btn>
				<Btn icon="fa-regular fa-trash-can" title="Delete this resume" onClick={deleteDoc} />
				<span className="divider" />
				<Btn icon="fa-solid fa-file-import" title="Import a resume .json file" onClick={() => fileRef.current.click()}>
					Import
				</Btn>
				<Btn icon="fa-solid fa-file-export" title="Download this resume as .json (a backup you can import later)" onClick={exportJson}>
					Export JSON
				</Btn>
				<input
					ref={fileRef}
					type="file"
					accept=".json,application/json"
					hidden
					onChange={(e) => {
						if (e.target.files[0]) importJson(e.target.files[0]);
						e.target.value = '';
					}}
				/>
				<span className="divider" />
				<Btn icon="fa-solid fa-rotate-left" title="Undo (Cmd/Ctrl+Z)" onClick={undo} disabled={!canUndo} />
				<Btn icon="fa-solid fa-rotate-right" title="Redo (Cmd/Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo} />
				<span className="spacer" />
				<span className={`save-state${saved ? '' : ' bad'}`}>
					{saved ? 'Saved in this browser' : 'Could not save. Export JSON to keep your work.'}
				</span>
				<Btn
					icon={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}
					title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
					aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
					onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
				/>
			</header>

			<div className="workspace">
				<aside className="editor-pane">
					<div className="tabs" role="tablist">
						<button role="tab" aria-selected={tab === 'content'} className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>
							Content
						</button>
						<button role="tab" aria-selected={tab === 'style'} className={tab === 'style' ? 'active' : ''} onClick={() => setTab('style')}>
							Style and layout
						</button>
					</div>
					{tab === 'content' && <FormatBar />}
					<div className="editor-scroll">
						{tab === 'content' ? <ContentEditor doc={doc} update={update} /> : <StylePanel doc={doc} update={update} />}
					</div>
				</aside>
				<main className="preview-pane">
					<Preview doc={doc} update={update} onExport={exportPdf} onExportHtml={exportHtml} />
				</main>
			</div>
		</div>
	);
}
