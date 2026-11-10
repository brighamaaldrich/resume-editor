import { forwardRef } from 'react';
import { PAGE_SIZES } from '../state.js';
import { fontStack } from '../fonts.js';
import { renderHtml } from '../richtext.js';

function Heading({ title }) {
	return (
		<h2>
			<span className="line" />
			{title}
			<span className="line" />
		</h2>
	);
}

function Entry({ it }) {
	const right = it.rightHref ? (
		<a className="link" href={it.rightHref} target="_blank" rel="noreferrer">
			{it.rightIcon && <i className={it.rightIcon} />}
			{it.right}
		</a>
	) : (
		it.right && <span className="date">{it.right}</span>
	);
	return (
		<div className="item entry">
			{(it.title || right) && (
				<h3>
					<span>{it.title}</span>
					{right}
				</h3>
			)}
			{it.rows.map((r) => (
				<div className="tab" key={r.id}>
					<p>{r.label}</p>
					<p dangerouslySetInnerHTML={renderHtml(r.html)} />
				</div>
			))}
			{it.bullets.length > 0 && (
				<ul>
					{it.bullets.map((b) => (
						<li key={b.id} dangerouslySetInnerHTML={renderHtml(b.html)} />
					))}
				</ul>
			)}
		</div>
	);
}

function Section({ sec }) {
	const cls = ['section', `sec-${sec.type}`, sec.type === 'list' && 'condensed', sec.type === 'contacts' && 'links'].filter(Boolean).join(' ');
	return (
		<div className={cls}>
			{sec.showTitle && sec.title && <Heading title={sec.title} />}
			{sec.items.map((it) => {
				switch (sec.type) {
					case 'entries':
						return <Entry key={it.id} it={it} />;
					case 'skills':
						return (
							<div className="item" key={it.id}>
								<h3>
									{it.icon && <i className={it.icon} />} {it.title}
								</h3>
								<p dangerouslySetInnerHTML={renderHtml(it.html)} />
							</div>
						);
					case 'list':
						return (
							<p key={it.id}>
								<span dangerouslySetInnerHTML={renderHtml(it.html)} />
								{it.right && <span className="date-2">{it.right}</span>}
							</p>
						);
					case 'contacts':
						return (
							<a key={it.id} href={it.href || undefined} target={it.href ? '_blank' : undefined} rel="noreferrer">
								{it.icon && <i className={it.icon} />}
								{it.text}
							</a>
						);
					case 'text':
						return <p key={it.id} className="para" dangerouslySetInnerHTML={renderHtml(it.html)} />;
					default:
						return null;
				}
			})}
		</div>
	);
}

export const ResumePage = forwardRef(function ResumePage({ doc, mainRef, sideRef }, pageRef) {
	const s = doc.style;
	const size = PAGE_SIZES[s.page] ?? PAGE_SIZES.letter;
	const vars = {
		'--page-w': `${size.w}in`,
		'--page-h': `${size.h}in`,
		'--font': fontStack(s.font),
		'--name-size': `${s.sizes.name}pt`,
		'--title-size': `${s.sizes.title}pt`,
		'--section-size': `${s.sizes.section}pt`,
		'--entry-size': `${s.sizes.entry}pt`,
		'--body-size': `${s.sizes.body}pt`,
		'--date-size': `${s.sizes.date}pt`,
		'--lh': s.lineHeight,
		'--sp': s.spacing,
		'--mx': `${s.marginX}in`,
		'--my': `${s.marginY}in`,
		'--label-w': `${s.labelWidth}in`,
		'--text': s.text,
		'--accent': s.accent,
		'--link': s.link,
	};
	const one = s.layout === 'one';
	const cls = [
		'page',
		one && 'one',
		s.highlight && 'hl',
		!s.highlightExport && 'no-print-hl',
		s.upperHeadings && 'caps',
		!s.headingLines && 'no-lines',
	]
		.filter(Boolean)
		.join(' ');
	const sections = (col) => doc.sections.filter((x) => x.column === col).map((x) => <Section key={x.id} sec={x} />);
	const titles = doc.titleLines.filter((l) => l.trim());
	const header = (
		<>
			{doc.name && <h1>{doc.name}</h1>}
			{titles.length > 0 && (
				<div className="job">
					{titles.map((l, i) => (
						<div key={i}>{l}</div>
					))}
				</div>
			)}
		</>
	);

	// One column: header on top, then every section in document order.
	if (one) {
		return (
			<div className={cls} style={vars} ref={pageRef}>
				<div className="main">
					<div className="col col-main" style={{ flex: '1 1 0' }}>
						<div className="col-inner" ref={mainRef}>
							<div className="one-header">{header}</div>
							{doc.sections.map((x) => (
								<Section key={x.id} sec={x} />
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	const side = (
		<div className="col col-side" key="side" style={{ flex: `${100 - s.mainWidth} 1 0` }}>
			<div className="col-inner" ref={sideRef}>
				{header}
				{sections('side')}
			</div>
		</div>
	);
	const main = (
		<div className="col col-main" key="main" style={{ flex: `${s.mainWidth} 1 0` }}>
			<div className="col-inner" ref={mainRef}>
				{sections('main')}
			</div>
		</div>
	);

	return (
		<div className={cls} style={vars} ref={pageRef}>
			<div className="main">{s.sidebarSide === 'left' ? [side, main] : [main, side]}</div>
		</div>
	);
});
