# Resume Editor

A small editor for one resume template, in a two column or one column layout.
Edit on the left, see the page on the right, and export a real text PDF or a
standalone HTML file.

Live at https://brighamaaldrich.github.io/resume-editor/

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Export a PDF

Click **Export PDF** (or Cmd/Ctrl+P), choose **Save as PDF**, and leave margins
on Default. The page sets its own size and zero margins. [Placeholder]
highlights are left out of the PDF unless you turn on **Keep the highlights in
exported PDF and HTML** under **Style and layout**.

**HTML** downloads the page as one self-contained `.html` file (markup plus the
template CSS, with fonts and icons from public CDNs). Open it in a browser to
view or print it, or edit it by hand.

## Saving

Everything saves automatically in this browser (localStorage). Use
**Export JSON** for a backup or to move a resume to another browser, and
**Import** to load one. A local `samples/` folder (not committed, since real
resumes hold personal details) can hold JSON files to import.

## Deploy

```bash
npm run deploy
```

This builds the site and publishes `dist/` to the `gh-pages` branch, which
GitHub Pages serves. It is a static site with no backend, so uploading `dist/`
to any static host works too. Each
visitor's resumes stay in their own browser.

## Where things live

- `src/state.js` data model, section types, storage, undo history
- `src/components/ResumePage.jsx` + `src/resume.css` the template itself
- `src/components/ContentEditor.jsx` content forms
- `src/components/StylePanel.jsx` fonts, sizes, layout, colors
- `src/components/Preview.jsx` scaled preview, one-page check, shrink to fit
- `src/fonts.js` font list (Google Fonts load on demand)
- `scripts/build-icons.mjs` rebuilds the icon search list (`npm run icons`)
