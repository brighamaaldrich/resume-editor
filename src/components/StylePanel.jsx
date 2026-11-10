import { SIZE_LABELS, defaultStyle, orderForSingleColumn } from '../state.js';
import { NumberStepper } from './controls.jsx';
import { FontPicker } from './Pickers.jsx';

function Row({ label, children }) {
	return (
		<div className="style-row">
			<span>{label}</span>
			<div>{children}</div>
		</div>
	);
}

function Segmented({ value, options, onChange }) {
	return (
		<span className="segmented">
			{options.map(([v, label]) => (
				<button key={v} className={v === value ? 'active' : ''} onClick={() => onChange(v)}>
					{label}
				</button>
			))}
		</span>
	);
}

export function StylePanel({ doc, update }) {
	const s = doc.style;
	const set = (fn, key) =>
		update((d) => {
			fn(d.style);
		}, key);

	return (
		<div className="style-panel">
			<div className="card">
				<div className="card-head">
					<strong>Font</strong>
				</div>
				<div className="card-body">
					<FontPicker value={s.font} onChange={(f) => set((st) => (st.font = f))} />
				</div>
			</div>

			<div className="card">
				<div className="card-head">
					<strong>Text sizes</strong>
				</div>
				<div className="card-body">
					{Object.entries(SIZE_LABELS).map(([k, label]) => (
						<Row key={k} label={label}>
							<NumberStepper value={s.sizes[k]} min={5} max={48} unit="pt" onChange={(v) => set((st) => (st.sizes[k] = v), `size.${k}`)} />
						</Row>
					))}
					<Row label="Line spacing">
						<NumberStepper value={s.lineHeight} step={0.05} min={0.9} max={2} unit="×" onChange={(v) => set((st) => (st.lineHeight = v), 'lh')} />
					</Row>
					<Row label="Space between blocks">
						<NumberStepper value={s.spacing} step={0.1} min={0.2} max={3} unit="×" onChange={(v) => set((st) => (st.spacing = v), 'spacing')} />
					</Row>
				</div>
			</div>

			<div className="card">
				<div className="card-head">
					<strong>Layout</strong>
				</div>
				<div className="card-body">
					<Row label="Columns">
						<Segmented
							value={s.layout}
							options={[['two', 'Two columns'], ['one', 'One column']]}
							onChange={(v) =>
								update((d) => {
									d.style.layout = v;
									if (v === 'one') orderForSingleColumn(d);
								})
							}
						/>
					</Row>
					{s.layout === 'two' && (
						<>
							<Row label={`Main ${s.mainWidth}% / Sidebar ${100 - s.mainWidth}%`}>
								<input
									type="range"
									min={40}
									max={85}
									value={s.mainWidth}
									onChange={(e) => set((st) => (st.mainWidth = Number(e.target.value)), 'mainWidth')}
								/>
							</Row>
							<Row label="Sidebar position">
								<Segmented value={s.sidebarSide} options={[['left', 'Left'], ['right', 'Right']]} onChange={(v) => set((st) => (st.sidebarSide = v))} />
							</Row>
						</>
					)}
					<Row label="Page size">
						<Segmented value={s.page} options={[['letter', 'US Letter'], ['a4', 'A4']]} onChange={(v) => set((st) => (st.page = v))} />
					</Row>
					<Row label="Side margins">
						<NumberStepper value={s.marginX} step={0.05} min={0.2} max={1.5} unit="in" onChange={(v) => set((st) => (st.marginX = v), 'mx')} />
					</Row>
					<Row label="Top and bottom margins">
						<NumberStepper value={s.marginY} step={0.05} min={0.2} max={1.5} unit="in" onChange={(v) => set((st) => (st.marginY = v), 'my')} />
					</Row>
					<Row label="Row label width">
						<NumberStepper value={s.labelWidth} step={0.05} min={0.2} max={1.5} unit="in" onChange={(v) => set((st) => (st.labelWidth = v), 'lw')} />
					</Row>
				</div>
			</div>

			<div className="card">
				<div className="card-head">
					<strong>Colors</strong>
				</div>
				<div className="card-body">
					{[
						['text', 'Text'],
						['accent', 'Headings, lines and dates'],
						['link', 'Links'],
					].map(([k, label]) => (
						<Row key={k} label={label}>
							<input type="color" value={s[k]} onChange={(e) => set((st) => (st[k] = e.target.value), `color.${k}`)} />
						</Row>
					))}
				</div>
			</div>

			<div className="card">
				<div className="card-head">
					<strong>Options</strong>
				</div>
				<div className="card-body">
					<label className="check">
						<input type="checkbox" checked={s.upperHeadings} onChange={(e) => set((st) => (st.upperHeadings = e.target.checked))} />
						Uppercase section headings and job title
					</label>
					<label className="check">
						<input type="checkbox" checked={s.headingLines} onChange={(e) => set((st) => (st.headingLines = e.target.checked))} />
						Lines beside section headings
					</label>
					<label className="check">
						<input type="checkbox" checked={s.highlight} onChange={(e) => set((st) => (st.highlight = e.target.checked))} />
						Highlight [placeholders] in the preview
					</label>
					<label className="check">
						<input
							type="checkbox"
							checked={s.highlightExport}
							disabled={!s.highlight}
							onChange={(e) => set((st) => (st.highlightExport = e.target.checked))}
						/>
						Keep the highlights in exported PDF and HTML
					</label>
				</div>
			</div>

			<button
				className="btn"
				onClick={() =>
					update((d) => {
						d.style = defaultStyle();
					})
				}
			>
				<i className="fa-solid fa-rotate-left" /> Reset style to template defaults
			</button>
		</div>
	);
}
