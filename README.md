# leanPDF

leanPDF is a browser-based, local-first tools app built with React and TypeScript. It combines a lightweight PDF workspace with a growing set of PDF and text utilities, all processed locally in the browser.

## What is implemented

- Installable PWA shell
- PDF tools hub with:
  - merge
  - split
  - rotate
  - PDF to image
- Text tools hub with:
  - word counter
  - case converter
  - lorem ipsum
  - remove spaces
  - line breaks
  - text sorter
  - text repeater
  - slug generator
  - keyword density
- Full PDF workspace with:
  - local PDF open flow and encrypted draft persistence in IndexedDB
  - multi-page viewer with thumbnails, zoom, rotation, and current-page tracking
  - full-text page search for text PDFs
  - form sidebar for common AcroForm field types
  - signature studio for typed, drawn, and uploaded image signatures
  - local export back to PDF
- Annotation tools:
  - highlight
  - underline
  - strikeout
  - note
  - shape
  - freehand ink

## Security

- **Draft storage (IndexedDB) is encrypted at rest.** Draft encryption uses AES-GCM-256 with a non-extractable `CryptoKey` stored in IndexedDB via structured clone — the raw key material is never exposed to JavaScript. This protects against accidental IndexedDB blob leakage, but any script running in the same origin (including injected or compromised scripts) could access the key from IndexedDB and decrypt drafts. A fresh random IV is used on every save.
- **Password-protected export** uses AES-256 applied by `@libpdf/core` at export time.
- **Passwords are never stored** — they are held in memory only for the duration of the session.
- **No server involved** — all encryption, decryption, and document processing happens locally in the browser.

## Commands

```bash
npm install
npm run dev
```

```bash
npm run lint
npm run test:run
npm run build
```

These same checks are used as the baseline health gate for the repo and CI.

## Notes

- The app is intentionally single-user and account-free.
- Document processing stays in the browser for this MVP.
- Chromium currently offers the best support for this build.
