import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import { PDF as ProtectedPdf } from '@libpdf/core';
import { AnnotationMode, GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type {
  AnnotationRecord,
  DocumentProtectionStatus,
  FormFieldSchema,
  InkPayload,
  LinePayload,
  NotePayload,
  RectPayload,
  ShapePayload,
  SignaturePlacementPayload,
  StoredSignatureAsset,
} from './types';
import type { SearchIndexEntry } from '../utils/search';
import { unlockPdfForEditing } from './security';

GlobalWorkerOptions.workerSrc = workerSrc;

function hexToRgbTriplet(hex: string) {
  const normalized = hex.replace('#', '');
  const matched =
    normalized.length === 3
      ? normalized.split('').map((part) => `${part}${part}`)
      : normalized.match(/.{1,2}/g) ?? [];
  const chunks = [matched[0] ?? 'ff', matched[1] ?? 'ff', matched[2] ?? 'ff'];
  const [red, green, blue] = chunks.map((chunk) => Number.parseInt(chunk, 16) / 255);
  return rgb(red, green, blue);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Invalid image data: missing base64 separator.');
  }
  const base64 = dataUrl.slice(commaIndex + 1);
  if (!base64) {
    throw new Error('Invalid image data: empty base64 segment.');
  }
  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new Error('Invalid image data: base64 decode failed.');
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function rectToPdfSpace(payload: RectPayload, width: number, height: number) {
  const x = payload.x * width;
  const rectHeight = payload.height * height;
  const y = height - payload.y * height - rectHeight;
  return {
    x,
    y,
    width: payload.width * width,
    height: rectHeight,
  };
}

function lineToPdfSpace(payload: LinePayload, width: number, height: number) {
  return {
    start: {
      x: payload.x1 * width,
      y: height - payload.y1 * height,
    },
    end: {
      x: payload.x2 * width,
      y: height - payload.y2 * height,
    },
  };
}

async function applyFormValues(pdfDoc: PDFDocument, formValues: Record<string, string | string[] | boolean>) {
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  for (const field of fields) {
    const value = formValues[field.getName()];
    if (value === undefined) {
      continue;
    }

    if (field instanceof PDFTextField) {
      field.setText(typeof value === 'string' ? value : String(value));
      continue;
    }

    if (field instanceof PDFCheckBox) {
      if (value) {
        field.check();
      } else {
        field.uncheck();
      }
      continue;
    }

    if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
      const normalized = Array.isArray(value) ? value : [String(value)];
      field.select(normalized, false);
      continue;
    }

    if (field instanceof PDFRadioGroup && typeof value === 'string') {
      field.select(value);
    }
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  form.updateFieldAppearances(font);
}

async function drawAnnotation(
  pdfDoc: PDFDocument,
  annotation: AnnotationRecord,
  signatureMap: Map<string, StoredSignatureAsset>,
) {
  if (annotation.pageIndex < 0 || annotation.pageIndex >= pdfDoc.getPageCount()) {
    return;
  }
  const page = pdfDoc.getPage(annotation.pageIndex);
  const { width, height } = page.getSize();

  if (annotation.kind === 'highlight') {
    const payload = annotation.payload as RectPayload;
    const rect = rectToPdfSpace(payload, width, height);
    page.drawRectangle({
      ...rect,
      color: hexToRgbTriplet(payload.color),
      opacity: payload.opacity ?? 0.24,
      borderWidth: 0,
    });
    return;
  }

  if (annotation.kind === 'shape') {
    const payload = annotation.payload as ShapePayload;
    const rect = rectToPdfSpace(payload, width, height);
    page.drawRectangle({
      ...rect,
      borderColor: hexToRgbTriplet(payload.color),
      borderWidth: payload.strokeWidth,
      color: payload.fill ? hexToRgbTriplet(payload.fill) : undefined,
      opacity: payload.fill ? 0.15 : 1,
    });
    return;
  }

  if (annotation.kind === 'underline' || annotation.kind === 'strikeout') {
    const payload = annotation.payload as LinePayload;
    const { start, end } = lineToPdfSpace(payload, width, height);
    page.drawLine({
      start,
      end,
      thickness: payload.thickness,
      color: hexToRgbTriplet(payload.color),
      opacity: 0.95,
    });
    return;
  }

  if (annotation.kind === 'note') {
    const payload = annotation.payload as NotePayload;
    const x = payload.x * width;
    const y = height - payload.y * height;
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawRectangle({
      x,
      y: y - 30,
      width: 24,
      height: 24,
      color: hexToRgbTriplet(payload.color),
      opacity: 0.92,
    });
    page.drawText((payload.comment || 'Note').slice(0, 90), {
      x: x + 34,
      y: y - 12,
      size: 11,
      font,
      color: rgb(0.12, 0.16, 0.22),
      maxWidth: Math.max(100, width - x - 48),
      lineHeight: 13,
    });
    return;
  }

  if (annotation.kind === 'ink') {
    const payload = annotation.payload as InkPayload;
    for (const stroke of payload.strokes) {
      for (let index = 1; index < stroke.length; index += 1) {
        const start = stroke[index - 1];
        const end = stroke[index];
        page.drawLine({
          start: { x: start.x * width, y: height - start.y * height },
          end: { x: end.x * width, y: height - end.y * height },
          thickness: payload.thickness,
          color: hexToRgbTriplet(payload.color),
          opacity: 0.96,
        });
      }
    }
    return;
  }

  if (annotation.kind === 'signature') {
    const payload = annotation.payload as SignaturePlacementPayload;
    const asset = signatureMap.get(payload.assetId);
    if (!asset) {
      return;
    }

    const rect = rectToPdfSpace(
      {
        x: payload.x,
        y: payload.y,
        width: payload.width,
        height: payload.height,
        color: payload.color ?? '#111827',
      },
      width,
      height,
    );

    if (asset.kind === 'typed') {
      const font = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
      page.drawText(asset.text, {
        x: rect.x,
        y: rect.y + rect.height * 0.15,
        size: Math.max(18, rect.height * 0.72),
        font,
        color: hexToRgbTriplet(asset.color ?? '#14213d'),
        maxWidth: rect.width,
      });
      return;
    }

    const bytes = dataUrlToBytes(asset.dataUrl);
    if (asset.kind === 'image') {
      const supported = asset.mimeType === 'image/jpeg' || asset.mimeType === 'image/jpg' || asset.mimeType === 'image/png';
      if (!supported) {
        throw new Error(`Unsupported signature image format: ${asset.mimeType}`);
      }
    }
    const image =
      asset.kind === 'image' && (asset.mimeType === 'image/jpeg' || asset.mimeType === 'image/jpg')
        ? await pdfDoc.embedJpg(bytes)
        : await pdfDoc.embedPng(bytes);

    page.drawImage(image, rect);
  }
}

export async function loadPdfDocument(bytes: Uint8Array, password?: string): Promise<PDFDocumentProxy> {
  const loadingTask = getDocument({ data: bytes.slice(), password });
  return loadingTask.promise;
}

export async function buildPdfSearchIndex(pdfDocument: PDFDocumentProxy): Promise<SearchIndexEntry[]> {
  const pages = Array.from({ length: pdfDocument.numPages }, (_, index) => index + 1);
  return Promise.all(
    pages.map(async (pageNumber) => {
      const page = await pdfDocument.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        pageNumber,
        text,
      };
    }),
  );
}

export async function extractFormSchema(bytes: Uint8Array, password?: string): Promise<FormFieldSchema[]> {
  const pdfDoc = await ProtectedPdf.load(bytes, password ? { credentials: password } : undefined);
  const form = pdfDoc.getForm();
  if (!form) {
    return [];
  }

  return form.getFields().map((field) => {
    if (field.type === 'text') {
      const textField = form.getTextField(field.name);
      return {
        name: field.name,
        kind: 'text',
        value: textField?.getValue() ?? '',
      } satisfies FormFieldSchema;
    }

    if (field.type === 'checkbox') {
      const checkboxField = form.getCheckbox(field.name);
      return {
        name: field.name,
        kind: 'checkbox',
        value: checkboxField?.isChecked() ?? false,
      } satisfies FormFieldSchema;
    }

    if (field.type === 'dropdown') {
      const dropdownField = form.getDropdown(field.name);
      return {
        name: field.name,
        kind: 'dropdown',
        value: dropdownField?.getValue() ?? '',
        options: dropdownField?.getOptions().map((option) => option.value) ?? [],
      } satisfies FormFieldSchema;
    }

    if (field.type === 'listbox') {
      const listboxField = form.getListBox(field.name);
      return {
        name: field.name,
        kind: 'option-list',
        value: listboxField?.getValue() ?? [],
        options: listboxField?.getOptions().map((option) => option.value) ?? [],
      } satisfies FormFieldSchema;
    }

    if (field.type === 'radio') {
      const radioField = form.getRadioGroup(field.name);
      return {
        name: field.name,
        kind: 'radio',
        value: radioField?.getValue() ?? '',
        options: radioField?.getOptions() ?? [],
      } satisfies FormFieldSchema;
    }

    return {
      name: field.name,
      kind: 'unknown',
      value: '',
    } satisfies FormFieldSchema;
  });
}

export async function exportEditedPdf(options: {
  bytes: Uint8Array;
  annotations: AnnotationRecord[];
  formValues: Record<string, string | string[] | boolean>;
  signatures: StoredSignatureAsset[];
  password?: string | null;
  protectionStatus: DocumentProtectionStatus;
}) {
  const sourceBytes =
    options.protectionStatus.kind === 'encrypted'
      ? await unlockPdfForEditing({
          bytes: options.bytes,
          password: options.password ?? undefined,
        }).then((result) => {
          if (result.kind === 'loaded') {
            return result.bytes;
          }

          if (result.kind === 'password-required') {
            throw new Error('A password is required to prepare this PDF for editing.');
          }

          throw new Error('The password for this PDF was not accepted.');
        })
      : options.bytes;

  const pdfDoc = await PDFDocument.load(sourceBytes);
  await applyFormValues(pdfDoc, options.formValues);

  const signatureMap = new Map(options.signatures.map((signature) => [signature.id, signature]));
  for (const annotation of options.annotations) {
    await drawAnnotation(pdfDoc, annotation, signatureMap);
  }

  const saved = await pdfDoc.save();
  return new Uint8Array(saved);
}

export { AnnotationMode };
