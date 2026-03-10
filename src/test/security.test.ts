import { describe, expect, it } from 'vitest';
import { PDF } from '@libpdf/core';
import { authenticatePdfAccess, exportProtectedPdf, inspectDocumentProtection } from '../lib/pdf/security';

async function createProtectedPdf() {
  const pdf = PDF.create();
  pdf.addPage({ size: 'letter' });
  const plainBytes = await pdf.save();

  const protectedPdf = await PDF.load(plainBytes);
  protectedPdf.setProtection({
    algorithm: 'AES-256',
    userPassword: 'secret',
  });

  return protectedPdf.save();
}

describe('pdf security helpers', () => {
  it('detects when a document requires a password', async () => {
    const protectedBytes = await createProtectedPdf();
    const result = await inspectDocumentProtection(protectedBytes);

    expect(result).toEqual({
      kind: 'encrypted',
      requiresPassword: true,
      authenticated: false,
      algorithm: 'AES-256',
    });
  });

  it('distinguishes wrong passwords from valid authentication', async () => {
    const protectedBytes = await createProtectedPdf();

    await expect(authenticatePdfAccess({ bytes: protectedBytes })).resolves.toEqual({ kind: 'password-required' });
    await expect(authenticatePdfAccess({ bytes: protectedBytes, password: 'bad-pass' })).resolves.toEqual({
      kind: 'invalid-password',
    });

    await expect(authenticatePdfAccess({ bytes: protectedBytes, password: 'secret' })).resolves.toMatchObject({
      kind: 'loaded',
      protectionStatus: {
        kind: 'encrypted',
        authenticated: true,
      },
    });
  });

  it('adds password protection during protected export', async () => {
    const pdf = PDF.create();
    pdf.addPage({ size: 'letter' });
    const bytes = await pdf.save();

    const protectedBytes = await exportProtectedPdf({
      bytes,
      password: 'top-secret',
    });

    const status = await inspectDocumentProtection(protectedBytes);
    expect(status).toEqual({
      kind: 'encrypted',
      requiresPassword: true,
      authenticated: false,
      algorithm: 'AES-256',
    });
  });
});
