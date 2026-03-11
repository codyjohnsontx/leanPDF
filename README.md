# leanPDF

leanPDF is a web-first, local-first PDF tool built with React, TypeScript, `pdf.js`, and `pdf-lib`.

## What is implemented

- Installable PWA shell
- Local PDF open flow with draft persistence in IndexedDB
- Multi-page viewer with thumbnails, zoom, rotation, and current-page tracking
- Full-text page search for text PDFs
- Annotation tools:
  - highlight
  - underline
  - strikeout
  - note
  - shape
  - freehand ink
- Form sidebar for common AcroForm field types
- Signature studio:
  - typed signatures
  - drawn signatures
  - uploaded image signatures
- Export back to PDF using local writeback

## Security

- **Draft storage (IndexedDB) is encrypted at rest.** PDF bytes are encrypted with AES-GCM-256 using the Web Crypto API before being written to IndexedDB. The key is generated once per browser profile and stored as a JWK in `localStorage`. A fresh random IV is used on every save.
- **Password-protected export** uses AES-256 applied by `@libpdf/core` at export time.
- **Passwords are never stored** — they are held in memory only for the duration of the session.
- **No server involved** — all encryption, decryption, and document processing happens locally in the browser.

## Commands

```bash
npm install
npm run dev
```

```bash
npm run build
npm run test:run
```

## Notes

- The app is intentionally single-user and account-free.
- Document processing stays in the browser for this MVP.
- Chromium currently offers the best support for this build.
