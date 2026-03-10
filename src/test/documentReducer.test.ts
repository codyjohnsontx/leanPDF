import { describe, expect, it } from 'vitest';
import { documentReducer, initialDocumentState } from '../app/documentState';

describe('documentReducer', () => {
  it('upserts annotations and preserves sorted order by page', () => {
    const base = documentReducer(initialDocumentState, {
      type: 'set-active-document',
      document: {
        id: 'doc-1',
        documentId: 'doc-1',
        name: 'sample.pdf',
        bytes: new Uint8Array([1, 2, 3]),
        pageCount: 3,
        currentPage: 1,
        zoom: 1,
        rotation: 0,
        hasUnsavedChanges: false,
        annotations: [],
        formValues: {},
        selectedTool: 'move',
        selectedSignatureAssetId: null,
        protectionStatus: { kind: 'unencrypted' },
        lastOpenedAt: '2026-03-10T00:00:00.000Z',
        formSchema: [],
        selectedAnnotationId: null,
        accessPassword: null,
      },
    });

    const withPageThree = documentReducer(base, {
      type: 'upsert-annotation',
      annotation: {
        id: 'b',
        kind: 'note',
        pageIndex: 2,
        authorLabel: 'You',
        createdAt: '2026-03-10T00:00:02.000Z',
        updatedAt: '2026-03-10T00:00:02.000Z',
        payload: { x: 0.2, y: 0.2, color: '#fff', comment: '' },
      },
    });

    const withPageOne = documentReducer(withPageThree, {
      type: 'upsert-annotation',
      annotation: {
        id: 'a',
        kind: 'highlight',
        pageIndex: 0,
        authorLabel: 'You',
        createdAt: '2026-03-10T00:00:01.000Z',
        updatedAt: '2026-03-10T00:00:01.000Z',
        payload: { x: 0.1, y: 0.1, width: 0.2, height: 0.1, color: '#f5ab35' },
      },
    });

    expect(withPageOne.activeDocument?.annotations.map((annotation) => annotation.id)).toEqual(['a', 'b']);
    expect(withPageOne.activeDocument?.selectedAnnotationId).toBe('a');
    expect(withPageOne.activeDocument?.hasUnsavedChanges).toBe(true);
  });
});
