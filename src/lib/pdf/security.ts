import { PDF } from '@libpdf/core';
import type { DocumentProtectionStatus } from './types';

export type LoadProtectedPdfResult =
  | { kind: 'loaded'; bytes: Uint8Array; protectionStatus: DocumentProtectionStatus }
  | { kind: 'password-required' }
  | { kind: 'invalid-password' };

function toProtectionStatus(pdf: PDF): DocumentProtectionStatus {
  if (!pdf.isEncrypted) {
    return { kind: 'unencrypted' };
  }

  const security = pdf.getSecurity();
  return {
    kind: 'encrypted',
    requiresPassword: Boolean(security.hasUserPassword),
    authenticated: pdf.isAuthenticated,
    algorithm: security.algorithm,
  };
}

export async function inspectDocumentProtection(bytes: Uint8Array): Promise<DocumentProtectionStatus> {
  const pdf = await PDF.load(bytes);
  return toProtectionStatus(pdf);
}

export async function unlockPdfForEditing(options: {
  bytes: Uint8Array;
  password?: string;
}): Promise<LoadProtectedPdfResult> {
  const pdf = await PDF.load(options.bytes, options.password ? { credentials: options.password } : undefined);
  const protectionStatus = toProtectionStatus(pdf);

  if (protectionStatus.kind === 'unencrypted') {
    return {
      kind: 'loaded',
      bytes: options.bytes,
      protectionStatus,
    };
  }

  if (!options.password) {
    return { kind: 'password-required' };
  }

  if (!protectionStatus.authenticated) {
    return { kind: 'invalid-password' };
  }

  pdf.removeProtection();

  return {
    kind: 'loaded',
    bytes: await pdf.save(),
    protectionStatus,
  };
}

export async function authenticatePdfAccess(options: {
  bytes: Uint8Array;
  password?: string;
}): Promise<LoadProtectedPdfResult> {
  const pdf = await PDF.load(options.bytes, options.password ? { credentials: options.password } : undefined);
  const protectionStatus = toProtectionStatus(pdf);

  if (protectionStatus.kind === 'unencrypted') {
    return {
      kind: 'loaded',
      bytes: options.bytes,
      protectionStatus,
    };
  }

  if (!options.password) {
    return { kind: 'password-required' };
  }

  if (!protectionStatus.authenticated) {
    return { kind: 'invalid-password' };
  }

  return {
    kind: 'loaded',
    bytes: options.bytes,
    protectionStatus,
  };
}

export async function exportProtectedPdf(options: {
  bytes: Uint8Array;
  password: string;
}): Promise<Uint8Array> {
  const pdf = await PDF.load(options.bytes);
  pdf.setProtection({
    algorithm: 'AES-256',
    userPassword: options.password,
  });

  return pdf.save();
}
