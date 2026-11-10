import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cleanHtml } from '../richtext.js';

// Focus a rich text box by id after the next render, caret at the end.
export function focusRichText(id) {
	setTimeout(() => {
		const el = document.querySelector(`[data-rt="${id}"]`);
		if (!el) return;
		el.focus();
		const range = document.createRange();
		range.selectNodeContents(el);
		range.collapse(false);
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	}, 0);
}

// A one-line rich text box (bold, italic, underline, links).
// Enter and Backspace-on-empty can be handled by the parent, e.g. for bullets.
export function RichText({ id, value, onChange, placeholder, onEnter, onEmptyBackspace }) {
	const ref = useRef(null);

	useLayoutEffect(() => {
		const el = ref.current;
		if (el && cleanHtml(el.innerHTML) !== (value ?? '')) el.innerHTML = value ?? '';
	}, [value]);

	return (
		<div
			ref={ref}
			className="rt"
			contentEditable
			suppressContentEditableWarning
			data-rt={id}
			data-placeholder={placeholder}
			onInput={() => onChange(cleanHtml(ref.current.innerHTML))}
			onKeyDown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					onEnter?.();
				} else if (e.key === 'Backspace' && onEmptyBackspace && ref.current.textContent === '') {
					e.preventDefault();
					onEmptyBackspace();
				}
			}}
			onPaste={(e) => {
				e.preventDefault();
				const text = e.clipboardData.getData('text/plain').replace(/\s*\n\s*/g, ' ');
				document.execCommand('insertText', false, text);
			}}
		/>
	);
}

// Formatting buttons that act on whatever rich text is selected.
export function FormatBar() {
	const keep = (e) => e.preventDefault(); // keep the text selection
	const run = (cmd, arg) => document.execCommand(cmd, false, arg);
	return (
		<div className="format-bar">
			<button className="icon-btn" title="Bold (Cmd/Ctrl+B)" onMouseDown={keep} onClick={() => run('bold')}>
				<i className="fa-solid fa-bold" />
			</button>
			<button className="icon-btn" title="Italic (Cmd/Ctrl+I)" onMouseDown={keep} onClick={() => run('italic')}>
				<i className="fa-solid fa-italic" />
			</button>
			<button className="icon-btn" title="Underline (Cmd/Ctrl+U)" onMouseDown={keep} onClick={() => run('underline')}>
				<i className="fa-solid fa-underline" />
			</button>
			<button
				className="icon-btn"
				title="Link selected text"
				onMouseDown={keep}
				onClick={() => {
					const url = window.prompt('Link URL (https://, mailto: or tel:)', 'https://');
					if (url) run('createLink', url.trim());
				}}
			>
				<i className="fa-solid fa-link" />
			</button>
			<button className="icon-btn" title="Remove link" onMouseDown={keep} onClick={() => run('unlink')}>
				<i className="fa-solid fa-link-slash" />
			</button>
			<button className="icon-btn" title="Clear formatting" onMouseDown={keep} onClick={() => run('removeFormat')}>
				<i className="fa-solid fa-text-slash" />
			</button>
			<span className="hint">Select text to format it. Enter adds a new bullet. Write [X] for numbers to fill in later.</span>
		</div>
	);
}

export function usePopover() {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);
	useEffect(() => {
		if (!open) return;
		const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
		const onKey = (e) => e.key === 'Escape' && setOpen(false);
		document.addEventListener('mousedown', onDown);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);
	return { open, setOpen, ref };
}

export function IconButton({ icon, title, onClick, disabled, danger }) {
	return (
		<button className={`icon-btn${danger ? ' danger' : ''}`} title={title} aria-label={title} onClick={onClick} disabled={disabled}>
			<i className={icon} />
		</button>
	);
}

// Up / down / duplicate / delete controls shared by sections, items and bullets.
export function MoveControls({ index, count, onMove, onDuplicate, onDelete, what }) {
	return (
		<span className="move-controls">
			<IconButton icon="fa-solid fa-arrow-up" title={`Move ${what} up`} disabled={index === 0} onClick={() => onMove(-1)} />
			<IconButton icon="fa-solid fa-arrow-down" title={`Move ${what} down`} disabled={index === count - 1} onClick={() => onMove(1)} />
			{onDuplicate && <IconButton icon="fa-regular fa-copy" title={`Duplicate ${what}`} onClick={onDuplicate} />}
			<IconButton icon="fa-solid fa-xmark" title={`Delete ${what}`} danger onClick={onDelete} />
		</span>
	);
}

export function NumberStepper({ value, onChange, step = 0.5, min = 0, max = 100, unit, decimals = 2 }) {
	const set = (v) => onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
	return (
		<span className="stepper">
			<button className="icon-btn" onClick={() => set(value - step)} aria-label="Decrease">
				<i className="fa-solid fa-minus" />
			</button>
			<input
				type="number"
				value={Number(value.toFixed(decimals))}
				step={step}
				min={min}
				max={max}
				onChange={(e) => e.target.value !== '' && set(Number(e.target.value))}
			/>
			<button className="icon-btn" onClick={() => set(value + step)} aria-label="Increase">
				<i className="fa-solid fa-plus" />
			</button>
			{unit && <span className="unit">{unit}</span>}
		</span>
	);
}
