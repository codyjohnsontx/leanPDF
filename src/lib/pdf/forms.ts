import { PDF as ProtectedPdf } from '@libpdf/core';
import type { FormFieldSchema } from './types';

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
