import { useState } from 'react';
import { SECTION_TYPES, move, newSection, uid } from '../state.js';
import { IconButton, MoveControls, RichText, focusRichText } from './controls.jsx';
import { IconPicker } from './Pickers.jsx';

const COLUMN_NAMES = { main: 'Main column', side: 'Sidebar' };
const ITEM_NOUN = { entries: 'entry', skills: 'skill group', list: 'item', contacts: 'contact', text: 'paragraph' };
const TYPE_SHORT = { entries: 'Entries', skills: 'Skill groups', list: 'List', contacts: 'Contacts', text: 'Paragraph' };

function cloneItem(it) {
	const c = structuredClone(it);
	c.id = uid();
	c.rows?.forEach((r) => (r.id = uid()));
	c.bullets?.forEach((b) => (b.id = uid()));
	return c;
}

function cloneSection(sec) {
	const c = structuredClone(sec);
	c.id = uid();
	c.items = c.items.map(cloneItem);
	return c;
}

// Swap a section with the nearest section above or below it in the same
// column (or simply the next one, in the one column layout).
function moveSection(d, id, delta, oneColumn) {
	const i = d.sections.findIndex((s) => s.id === id);
	const col = d.sections[i].column;
	let j = i + delta;
	while (!oneColumn && j >= 0 && j < d.sections.length && d.sections[j].column !== col) j += delta;
	if (j < 0 || j >= d.sections.length) return;
	[d.sections[i], d.sections[j]] = [d.sections[j], d.sections[i]];
}

function Field({ label, value, onChange, placeholder, grow }) {
	return (
		<label className={`field${grow ? ' grow' : ''}`}>
			<span>{label}</span>
			<input value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
		</label>
	);
}

function EntryEditor({ it, upItem }) {
	const k = (f) => `${it.id}.${f}`;
	const addBullet = (at) => {
		const b = { id: uid(), html: '' };
		upItem((x) => x.bullets.splice(at, 0, b));
		focusRichText(b.id);
	};
	return (
		<>
			<div className="grid2">
				<Field grow label="Title" value={it.title} onChange={(v) => upItem((x) => (x.title = v), k('title'))} />
				<Field label="Date or right side text" value={it.right} onChange={(v) => upItem((x) => (x.right = v), k('right'))} />
			</div>
			<div className="grid2">
				<Field
					grow
					label="Link URL (optional, turns the right side into a link)"
					placeholder="https://"
					value={it.rightHref}
					onChange={(v) => upItem((x) => (x.rightHref = v), k('href'))}
				/>
				{it.rightHref && (
					<div className="field">
						<span>Link icon</span>
						<IconPicker value={it.rightIcon} onChange={(v) => upItem((x) => (x.rightIcon = v))} />
					</div>
				)}
			</div>

			{it.rows.length > 0 && <div className="sub-label">Rows (label and text, like courses under a degree)</div>}
			{it.rows.map((r, ri) => (
				<div className="line-edit" key={r.id}>
					<input
						className="row-label"
						value={r.label}
						placeholder="Label"
						onChange={(e) => upItem((x) => (x.rows[ri].label = e.target.value), k(`${r.id}.label`))}
					/>
					<RichText id={r.id} value={r.html} placeholder="Row text" onChange={(html) => upItem((x) => (x.rows[ri].html = html), k(r.id))} />
					<MoveControls
						what="row"
						index={ri}
						count={it.rows.length}
						onMove={(d) => upItem((x) => move(x.rows, ri, d))}
						onDelete={() => upItem((x) => x.rows.splice(ri, 1))}
					/>
				</div>
			))}

			{it.bullets.length > 0 && <div className="sub-label">Bullets</div>}
			{it.bullets.map((b, bi) => (
				<div className="line-edit" key={b.id}>
					<span className="dot">•</span>
					<RichText
						id={b.id}
						value={b.html}
						placeholder="Bullet text"
						onChange={(html) => upItem((x) => (x.bullets[bi].html = html), k(b.id))}
						onEnter={() => addBullet(bi + 1)}
						onEmptyBackspace={() => {
							const prev = it.bullets[bi - 1];
							upItem((x) => x.bullets.splice(bi, 1));
							if (prev) focusRichText(prev.id);
						}}
					/>
					<MoveControls
						what="bullet"
						index={bi}
						count={it.bullets.length}
						onMove={(d) => upItem((x) => move(x.bullets, bi, d))}
						onDelete={() => upItem((x) => x.bullets.splice(bi, 1))}
					/>
				</div>
			))}

			<div className="btn-row">
				<button className="add-btn" onClick={() => addBullet(it.bullets.length)}>
					<i className="fa-solid fa-plus" /> Bullet
				</button>
				<button
					className="add-btn"
					onClick={() => {
						const r = { id: uid(), label: '', html: '' };
						upItem((x) => x.rows.push(r));
						focusRichText(r.id);
					}}
				>
					<i className="fa-solid fa-plus" /> Row
				</button>
			</div>
		</>
	);
}

function ItemEditor({ type, it, index, count, upSection }) {
	// Run fn on this item inside an undoable update. Braces keep the return value out.
	const upItem = (fn, key) =>
		upSection((s) => {
			fn(s.items.find((x) => x.id === it.id));
		}, key);
	const k = (f) => `${it.id}.${f}`;

	let body;
	switch (type) {
		case 'entries':
			body = <EntryEditor it={it} upItem={upItem} />;
			break;
		case 'skills':
			body = (
				<>
					<div className="grid2">
						<div className="field">
							<span>Icon</span>
							<IconPicker value={it.icon} onChange={(v) => upItem((x) => (x.icon = v))} />
						</div>
						<Field grow label="Heading" value={it.title} onChange={(v) => upItem((x) => (x.title = v), k('title'))} />
					</div>
					<RichText id={it.id} value={it.html} placeholder="Skills" onChange={(html) => upItem((x) => (x.html = html), k('html'))} />
				</>
			);
			break;
		case 'list':
			body = (
				<div className="grid2 align-end">
					<div className="field grow">
						<span>Text</span>
						<RichText id={it.id} value={it.html} placeholder="Text" onChange={(html) => upItem((x) => (x.html = html), k('html'))} />
					</div>
					<Field label="Right side (optional)" value={it.right} onChange={(v) => upItem((x) => (x.right = v), k('right'))} />
				</div>
			);
			break;
		case 'contacts':
			body = (
				<div className="grid2">
					<div className="field">
						<span>Icon</span>
						<IconPicker value={it.icon} onChange={(v) => upItem((x) => (x.icon = v))} />
					</div>
					<Field grow label="Text" value={it.text} onChange={(v) => upItem((x) => (x.text = v), k('text'))} />
					<Field
						grow
						label="Link (optional)"
						placeholder="https://, mailto:, tel:"
						value={it.href}
						onChange={(v) => upItem((x) => (x.href = v), k('href'))}
					/>
				</div>
			);
			break;
		case 'text':
			body = <RichText id={it.id} value={it.html} placeholder="Paragraph" onChange={(html) => upItem((x) => (x.html = html), k('html'))} />;
			break;
		default:
			body = null;
	}

	return (
		<div className={`item-card type-${type}`}>
			<div className="item-head">
				<span className="item-num">
					{ITEM_NOUN[type]} {index + 1}
				</span>
				<MoveControls
					what={ITEM_NOUN[type]}
					index={index}
					count={count}
					onMove={(d) => upSection((s) => move(s.items, index, d))}
					onDuplicate={() => upSection((s) => s.items.splice(index + 1, 0, cloneItem(it)))}
					onDelete={() => upSection((s) => s.items.splice(index, 1))}
				/>
			</div>
			{body}
		</div>
	);
}

function SectionCard({ sec, index, count, update, oneColumn }) {
	const [open, setOpen] = useState(true);
	const t = SECTION_TYPES[sec.type];
	const upSection = (fn, key) =>
		update((d) => {
			fn(d.sections.find((s) => s.id === sec.id));
		}, key);
	const other = sec.column === 'main' ? 'side' : 'main';

	return (
		<div className="card section-card">
			<div className="card-head">
				<IconButton icon={`fa-solid fa-chevron-${open ? 'down' : 'right'}`} title={open ? 'Collapse' : 'Expand'} onClick={() => setOpen((o) => !o)} />
				<input
					className="section-title"
					value={sec.title}
					placeholder="Section heading"
					onChange={(e) => upSection((s) => (s.title = e.target.value), `${sec.id}.title`)}
				/>
				<span className="type-badge">{TYPE_SHORT[sec.type]}</span>
				{!oneColumn && (
					<IconButton icon="fa-solid fa-right-left" title={`Move to ${COLUMN_NAMES[other]}`} onClick={() => upSection((s) => (s.column = other))} />
				)}
				<MoveControls
					what="section"
					index={index}
					count={count}
					onMove={(delta) => update((d) => moveSection(d, sec.id, delta, oneColumn))}
					onDuplicate={() =>
						update((d) => {
							d.sections.splice(d.sections.findIndex((s) => s.id === sec.id) + 1, 0, cloneSection(sec));
						})
					}
					onDelete={() =>
						update((d) => {
							d.sections = d.sections.filter((s) => s.id !== sec.id);
						})
					}
				/>
			</div>
			{open && (
				<div className="card-body">
					<label className="check">
						<input type="checkbox" checked={sec.showTitle} onChange={(e) => upSection((s) => (s.showTitle = e.target.checked))} />
						Show heading on the page
					</label>
					{sec.items.map((it, i) => (
						<ItemEditor key={it.id} type={sec.type} it={it} index={i} count={sec.items.length} upSection={upSection} />
					))}
					<button className="add-btn" onClick={() => upSection((s) => s.items.push(t.newItem()))}>
						<i className="fa-solid fa-plus" /> {t.addLabel}
					</button>
				</div>
			)}
		</div>
	);
}

function AddSection({ column, update, label }) {
	const [type, setType] = useState('entries');
	return (
		<div className="add-section">
			<select value={type} onChange={(e) => setType(e.target.value)} aria-label="Section type">
				{Object.entries(SECTION_TYPES).map(([key, t]) => (
					<option key={key} value={key}>
						{t.label}
					</option>
				))}
			</select>
			<button
				className="btn"
				onClick={() =>
					update((d) => {
						d.sections.push(newSection(type, column));
					})
				}
			>
				<i className="fa-solid fa-plus" /> {label ?? `Add section to ${COLUMN_NAMES[column].toLowerCase()}`}
			</button>
		</div>
	);
}

export function ContentEditor({ doc, update }) {
	const oneColumn = doc.style.layout === 'one';
	// In the one column layout every section is in a single list, in page order.
	const groups = oneColumn
		? [{ key: 'all', title: 'Sections', column: 'main', secs: doc.sections }]
		: (doc.style.sidebarSide === 'left' ? ['side', 'main'] : ['main', 'side']).map((col) => ({
				key: col,
				title: COLUMN_NAMES[col],
				column: col,
				secs: doc.sections.filter((s) => s.column === col),
			}));
	return (
		<div className="content-editor">
			<div className="card">
				<div className="card-head">
					<strong>Header</strong>
					<span className="muted small">{oneColumn ? 'Top of the page' : 'Top of the sidebar'}</span>
				</div>
				<div className="card-body">
					<Field label="Name" value={doc.name} onChange={(v) => update((d) => void (d.name = v), 'name')} />
					<label className="field">
						<span>Job title (one line each)</span>
						<textarea
							rows={2}
							value={doc.titleLines.join('\n')}
							onChange={(e) => update((d) => void (d.titleLines = e.target.value.split('\n')), 'titleLines')}
						/>
					</label>
				</div>
			</div>

			{groups.map(({ key, title, column, secs }) => (
				<div className="column-group" key={key}>
					<h3 className="column-title">{title}</h3>
					{secs.map((sec, i) => (
						<SectionCard key={sec.id} sec={sec} index={i} count={secs.length} update={update} oneColumn={oneColumn} />
					))}
					{secs.length === 0 && <p className="muted small">No sections here yet.</p>}
					<AddSection column={column} update={update} label={oneColumn ? 'Add section' : undefined} />
				</div>
			))}
		</div>
	);
}
