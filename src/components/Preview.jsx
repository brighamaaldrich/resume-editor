import { useEffect, useRef, useState } from 'react';
import { PAGE_SIZES, countPlaceholders } from '../state.js';
import { ResumePage } from './ResumePage.jsx';

const SHRINKABLE = ['title', 'section', 'entry', 'body', 'date'];

export function Preview({ doc, update, onExport, onExportHtml }) {
	const scrollRef = useRef(null);
	const pageRef = useRef(null);
	const mainRef = useRef(null);
	const sideRef = useRef(null);
	const [scale, setScale] = useState(1);
	const [over, setOver] = useState({ main: 0, side: 0 });
	const size = PAGE_SIZES[doc.style.page] ?? PAGE_SIZES.letter;

	// Scale the page to fit the preview pane's width.
	useEffect(() => {
		const el = scrollRef.current;
		const fit = () => setScale(Math.min(1.4, Math.max(0.25, (el.clientWidth - 48) / (size.w * 96))));
		fit();
		const ro = new ResizeObserver(fit);
		ro.observe(el);
		return () => ro.disconnect();
	}, [size.w]);

	// Watch both columns and report how far (in inches) either runs past the page.
	useEffect(() => {
		const measure = () => {
			const o = (inner) => (inner ? Math.max(0, inner.offsetHeight - inner.parentElement.clientHeight) / 96 : 0);
			const next = { main: o(mainRef.current), side: o(sideRef.current) };
			setOver((prev) => (prev.main === next.main && prev.side === next.side ? prev : next));
		};
		measure();
		const ro = new ResizeObserver(measure);
		for (const r of [mainRef, sideRef]) {
			if (!r.current) continue; // no sidebar in the one column layout
			ro.observe(r.current);
			ro.observe(r.current.parentElement);
		}
		document.fonts.addEventListener('loadingdone', measure);
		return () => {
			ro.disconnect();
			document.fonts.removeEventListener('loadingdone', measure);
		};
	}, [doc.style.layout]); // columns are re-created when the layout changes

	const worst = Math.max(over.main, over.side);
	const fits = worst < 0.01;
	const placeholders = countPlaceholders(doc);

	// Find the largest text scale that fits, by trying sizes on the live page,
	// then save the smaller sizes (rounded down to 0.25pt).
	const shrinkToFit = () => {
		const page = pageRef.current;
		const fitsNow = () =>
			[mainRef, sideRef].every((r) => !r.current || r.current.offsetHeight <= r.current.parentElement.clientHeight);
		let lo = 0.5;
		let hi = 1;
		page.style.setProperty('--fit', lo);
		if (!fitsNow()) {
			page.style.removeProperty('--fit');
			window.alert('This will not fit on one page even at half the text size. Try cutting some content or reducing spacing.');
			return;
		}
		for (let i = 0; i < 12; i++) {
			const mid = (lo + hi) / 2;
			page.style.setProperty('--fit', mid);
			if (fitsNow()) lo = mid;
			else hi = mid;
		}
		page.style.removeProperty('--fit');
		update((d) => {
			for (const k of SHRINKABLE) d.style.sizes[k] = Math.floor(d.style.sizes[k] * lo * 4) / 4;
		});
	};

	return (
		<>
			<div className="preview-toolbar">
				{fits ? (
					<span className="status ok">
						<i className="fa-solid fa-circle-check" /> Fits on one page
					</span>
				) : (
					<>
						<span className="status bad">
							<i className="fa-solid fa-triangle-exclamation" /> {doc.style.layout === 'one' ? 'Content' : over.main >= over.side ? 'Main column' : 'Sidebar'} runs {worst.toFixed(2)} in past
							the page
						</span>
						<button className="btn small" onClick={shrinkToFit}>
							Shrink text to fit
						</button>
					</>
				)}
				{placeholders > 0 && (
					<span className="status warn" title="Text in [brackets] still needs to be filled in">
						<i className="fa-solid fa-highlighter" /> {placeholders} placeholder{placeholders === 1 ? '' : 's'} left
					</span>
				)}
				<span className="spacer" />
				<button className="btn" onClick={onExportHtml} title="Download the page as a single HTML file with its CSS">
					<i className="fa-solid fa-code" /> HTML
				</button>
				<button className="btn primary" onClick={onExport} title="Export PDF (Cmd/Ctrl+P)">
					<i className="fa-solid fa-file-pdf" /> Export PDF
				</button>
			</div>
			<div className="preview-scroll" ref={scrollRef}>
				<div className={`page-frame${fits ? '' : ' overflowing'}`} style={{ width: size.w * 96 * scale, height: size.h * 96 * scale }}>
					<div className="page-scaler" style={{ transform: `scale(${scale})` }}>
						<ResumePage ref={pageRef} doc={doc} mainRef={mainRef} sideRef={sideRef} />
					</div>
				</div>
			</div>
		</>
	);
}
