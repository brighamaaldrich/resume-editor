import { useEffect, useMemo, useState } from 'react';
import { usePopover } from './controls.jsx';
import { FONTS, ensureFont, fontStack, loadFontPreviews } from '../fonts.js';

let iconsPromise;
const loadIcons = () => (iconsPromise ??= import('../data/icons.json').then((m) => m.default));

export function IconPicker({ value, onChange }) {
	const { open, setOpen, ref } = usePopover();
	const [icons, setIcons] = useState(null);
	const [q, setQ] = useState('');

	useEffect(() => {
		if (open && !icons) loadIcons().then(setIcons);
		if (open) setQ('');
	}, [open, icons]);

	const results = useMemo(() => {
		if (!icons) return [];
		const t = q.trim().toLowerCase();
		if (!t) return icons.slice(0, 300);
		const byName = icons.filter((i) => i.n.includes(t));
		const byTerm = icons.filter((i) => !i.n.includes(t) && i.t.includes(t));
		return [...byName.sort((a, b) => a.n.indexOf(t) - b.n.indexOf(t)), ...byTerm].slice(0, 300);
	}, [icons, q]);

	const pick = (c) => {
		onChange(c);
		setOpen(false);
	};

	return (
		<div className="picker" ref={ref}>
			<button className="picker-btn icon-choice" title={value ? `Icon: ${value}` : 'Choose an icon'} onClick={() => setOpen((o) => !o)}>
				{value ? <i className={value} /> : <span className="muted">none</span>}
				<i className="fa-solid fa-caret-down caret" />
			</button>
			{open && (
				<div className="popover icon-popover">
					<input
						autoFocus
						className="search"
						value={q}
						placeholder="Search icons, e.g. phone, chart, github"
						onChange={(e) => setQ(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && results[0] && pick(results[0].c)}
					/>
					<div className="icon-grid">
						<button className="icon-cell" title="No icon" onClick={() => pick('')}>
							<span className="muted">none</span>
						</button>
						{!icons && <span className="muted">Loading icons…</span>}
						{results.map((i) => (
							<button key={i.c} className={`icon-cell${i.c === value ? ' selected' : ''}`} title={`${i.n} (${i.s})`} onClick={() => pick(i.c)}>
								<i className={i.c} />
								<span>{i.n}</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export function FontPicker({ value, onChange }) {
	const { open, setOpen, ref } = usePopover();
	const [q, setQ] = useState('');

	useEffect(() => {
		if (open) {
			setQ('');
			loadFontPreviews();
		}
	}, [open]);

	const t = q.trim().toLowerCase();
	const results = FONTS.filter((f) => f.name.toLowerCase().includes(t));
	const custom = q.trim() && !FONTS.some((f) => f.name.toLowerCase() === t) ? q.trim().replace(/\b\w/g, (c) => c.toUpperCase()) : null;

	const pick = (name) => {
		ensureFont(name);
		onChange(name);
		setOpen(false);
	};

	let lastCat = null;
	return (
		<div className="picker" ref={ref}>
			<button className="picker-btn font-choice" onClick={() => setOpen((o) => !o)}>
				<span style={{ fontFamily: fontStack(value) }}>{value}</span>
				<i className="fa-solid fa-caret-down caret" />
			</button>
			{open && (
				<div className="popover font-popover">
					<input
						autoFocus
						className="search"
						value={q}
						placeholder="Search fonts"
						onChange={(e) => setQ(e.target.value)}
						onKeyDown={(e) => {
							if (e.key !== 'Enter') return;
							if (results[0]) pick(results[0].name);
							else if (custom) pick(custom);
						}}
					/>
					<div className="font-list">
						{results.map((f) => {
							const header = f.cat !== lastCat ? <div className="font-cat">{(lastCat = f.cat)}</div> : null;
							return (
								<div key={f.name}>
									{header}
									<button className={`font-option${f.name === value ? ' selected' : ''}`} style={{ fontFamily: fontStack(f.name) }} onClick={() => pick(f.name)}>
										{f.name}
									</button>
								</div>
							);
						})}
						{custom && (
							<button className="font-option custom" onClick={() => pick(custom)}>
								Load “{custom}” from Google Fonts
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
