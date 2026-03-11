import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createId } from '../../lib/utils/ids';
import type {
  AnnotationRecord,
  InkPayload,
  LinePayload,
  NotePayload,
  Point,
  RectPayload,
  ShapePayload,
  SignaturePlacementPayload,
  StoredSignatureAsset,
  ViewerTool,
} from '../../lib/pdf/types';

type AnnotationOverlayProps = {
  pageIndex: number;
  width: number;
  height: number;
  tool: ViewerTool;
  annotations: AnnotationRecord[];
  selectedAnnotationId: string | null;
  selectedSignature: StoredSignatureAsset | null;
  onSelect: (annotationId: string | null) => void;
  onCommit: (annotation: AnnotationRecord) => void;
};

const TOOL_COLORS: Record<Exclude<ViewerTool, 'move' | 'signature'>, string> = {
  highlight: '#f5ab35',
  underline: '#38bdf8',
  strikeout: '#ff7b72',
  note: '#ffd166',
  shape: '#58d68d',
  ink: '#38bdf8',
};

type DraftShape =
  | {
      kind: 'rect';
      start: Point;
      current: Point;
    }
  | {
      kind: 'ink';
      strokes: Point[][];
    }
  | null;

function clampPoint(value: Point) {
  return {
    x: Math.max(0, Math.min(1, value.x)),
    y: Math.max(0, Math.min(1, value.y)),
  };
}

function normalizePoint(
  event: ReactPointerEvent<HTMLDivElement>,
  width: number,
  height: number,
): Point {
  const bounds = event.currentTarget.getBoundingClientRect();
  return clampPoint({
    x: (event.clientX - bounds.left) / width,
    y: (event.clientY - bounds.top) / height,
  });
}

function buildRecord(
  pageIndex: number,
  tool: ViewerTool,
  start: Point,
  current: Point,
  signature: StoredSignatureAsset | null,
): AnnotationRecord | null {
  const createdAt = new Date().toISOString();
  const id = createId('annotation');

  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);

  if (tool === 'highlight') {
    const payload: RectPayload = {
      x: left,
      y: top,
      width,
      height,
      color: TOOL_COLORS.highlight,
      opacity: 0.3,
    };
    return {
      id,
      kind: 'highlight',
      pageIndex,
      authorLabel: 'You',
      createdAt,
      updatedAt: createdAt,
      payload,
    };
  }

  if (tool === 'shape') {
    const payload: ShapePayload = {
      x: left,
      y: top,
      width,
      height,
      color: TOOL_COLORS.shape,
      strokeWidth: 2,
    };
    return {
      id,
      kind: 'shape',
      pageIndex,
      authorLabel: 'You',
      createdAt,
      updatedAt: createdAt,
      payload,
    };
  }

  if (tool === 'underline' || tool === 'strikeout') {
    const y =
      tool === 'underline'
        ? Math.max(start.y, current.y)
        : Math.min(start.y, current.y) + height * 0.55;
    const payload: LinePayload = {
      x1: left,
      y1: y,
      x2: left + width,
      y2: y,
      color:
        tool === 'underline' ? TOOL_COLORS.underline : TOOL_COLORS.strikeout,
      thickness: 2.4,
    };
    return {
      id,
      kind: tool,
      pageIndex,
      authorLabel: 'You',
      createdAt,
      updatedAt: createdAt,
      payload,
    };
  }

  if (tool === 'signature' && signature) {
    const payload: SignaturePlacementPayload = {
      assetId: signature.id,
      x: left,
      y: top,
      width: Math.max(0.08, width || 0.18),
      height: Math.max(0.05, height || 0.12),
      color: '#14213d',
    };
    return {
      id,
      kind: 'signature',
      pageIndex,
      authorLabel: 'You',
      createdAt,
      updatedAt: createdAt,
      payload,
    };
  }

  return null;
}

function renderAnnotationShape(
  annotation: AnnotationRecord,
  isSelected: boolean,
) {
  const shared = {
    position: 'absolute' as const,
    pointerEvents: 'auto' as const,
    outline: isSelected ? '2px solid rgba(255,255,255,0.85)' : 'none',
    outlineOffset: '2px',
  };

  if (annotation.kind === 'highlight') {
    const payload = annotation.payload as RectPayload;
    return {
      ...shared,
      left: `${payload.x * 100}%`,
      top: `${payload.y * 100}%`,
      width: `${payload.width * 100}%`,
      height: `${payload.height * 100}%`,
      background: payload.color,
      opacity: payload.opacity ?? 0.3,
      borderRadius: '6px',
    };
  }

  if (annotation.kind === 'shape') {
    const payload = annotation.payload as ShapePayload;
    return {
      ...shared,
      left: `${payload.x * 100}%`,
      top: `${payload.y * 100}%`,
      width: `${payload.width * 100}%`,
      height: `${payload.height * 100}%`,
      border: `${payload.strokeWidth}px solid ${payload.color}`,
      borderRadius: '8px',
      background: payload.fill ?? 'transparent',
      opacity: payload.fill ? 0.15 : 1,
    };
  }

  if (annotation.kind === 'note') {
    const payload = annotation.payload as NotePayload;
    return {
      ...shared,
      left: `${payload.x * 100}%`,
      top: `${payload.y * 100}%`,
      width: '28px',
      height: '28px',
      background: payload.color,
      borderRadius: '9px',
      boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
    };
  }

  if (annotation.kind === 'signature') {
    const payload = annotation.payload as SignaturePlacementPayload;
    return {
      ...shared,
      left: `${payload.x * 100}%`,
      top: `${payload.y * 100}%`,
      width: `${payload.width * 100}%`,
      height: `${payload.height * 100}%`,
      borderRadius: '8px',
      border: '2px dashed rgba(20, 33, 61, 0.58)',
      background: 'rgba(20, 33, 61, 0.08)',
    };
  }

  if (annotation.kind === 'underline' || annotation.kind === 'strikeout') {
    const payload = annotation.payload as LinePayload;
    const left = Math.min(payload.x1, payload.x2);
    const width = Math.abs(payload.x2 - payload.x1);
    return {
      ...shared,
      left: `${left * 100}%`,
      top: `${payload.y1 * 100}%`,
      width: `${width * 100}%`,
      height: '0',
      borderTop: `${payload.thickness}px solid ${payload.color}`,
    };
  }

  return shared;
}

function annotationLabel(annotation: AnnotationRecord) {
  switch (annotation.kind) {
    case 'highlight':
      return 'Highlight';
    case 'underline':
      return 'Underline';
    case 'strikeout':
      return 'Strikeout';
    case 'note':
      return 'Note';
    case 'ink':
      return 'Ink';
    case 'shape':
      return 'Shape';
    case 'signature':
      return 'Signature';
    default:
      return 'Annotation';
  }
}

export function AnnotationOverlay({
  pageIndex,
  width,
  height,
  tool,
  annotations,
  selectedAnnotationId,
  selectedSignature,
  onSelect,
  onCommit,
}: AnnotationOverlayProps) {
  const [draft, setDraft] = useState<DraftShape>(null);
  const activeStrokeRef = useRef<Point[] | null>(null);
  const [strokeVersion, setStrokeVersion] = useState(0);

  const inkPath = useMemo(() => {
    if (!draft || draft.kind !== 'ink') {
      return '';
    }

    // Read directly from the ref so we avoid copying the array on every point.
    // strokeVersion is listed as a dependency so React re-runs this memo each
    // time a new point is pushed.
    void strokeVersion;
    const currentStroke = activeStrokeRef.current ?? [];
    return currentStroke
      .map(
        (point, index) =>
          `${index === 0 ? 'M' : 'L'} ${point.x * width} ${point.y * height}`,
      )
      .join(' ');
  }, [draft, strokeVersion, height, width]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (tool === 'move') {
      onSelect(null);
      return;
    }

    const point = normalizePoint(event, width, height);
    event.currentTarget.setPointerCapture(event.pointerId);

    if (tool === 'note') {
      const createdAt = new Date().toISOString();
      const payload: NotePayload = {
        x: point.x,
        y: point.y,
        color: TOOL_COLORS.note,
        comment: '',
      };
      onCommit({
        id: createId('annotation'),
        kind: 'note',
        pageIndex,
        authorLabel: 'You',
        createdAt,
        updatedAt: createdAt,
        payload,
      });
      return;
    }

    if (tool === 'ink') {
      activeStrokeRef.current = [point];
      setDraft({ kind: 'ink', strokes: [[point]] });
      return;
    }

    setDraft({ kind: 'rect', start: point, current: point });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draft) {
      return;
    }

    const point = normalizePoint(event, width, height);

    if (draft.kind === 'ink') {
      activeStrokeRef.current = activeStrokeRef.current ?? [];
      activeStrokeRef.current.push(point);
      setStrokeVersion((v) => v + 1);
      return;
    }

    setDraft({ ...draft, current: point });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (!draft) {
      return;
    }

    if (draft.kind === 'ink') {
      const createdAt = new Date().toISOString();
      const payload: InkPayload = {
        color: TOOL_COLORS.ink,
        thickness: 2.8,
        strokes: [activeStrokeRef.current ?? []],
      };
      onCommit({
        id: createId('annotation'),
        kind: 'ink',
        pageIndex,
        authorLabel: 'You',
        createdAt,
        updatedAt: createdAt,
        payload,
      });
      activeStrokeRef.current = null;
      setDraft(null);
      return;
    }

    const annotation = buildRecord(
      pageIndex,
      tool,
      draft.start,
      draft.current,
      selectedSignature,
    );
    if (annotation) {
      onCommit(annotation);
    }
    setDraft(null);
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: tool === 'move' ? 'default' : 'crosshair',
      }}
    >
      {annotations.map((annotation) =>
        annotation.kind === 'ink' ? (
          <svg
            key={annotation.id}
            viewBox={`0 0 ${width} ${height}`}
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'visible',
              pointerEvents: 'none',
            }}
          >
            {(annotation.payload as InkPayload).strokes.map((stroke, index) => (
              <path
                key={`${annotation.id}-${index}`}
                d={stroke
                  .map(
                    (point, pointIndex) =>
                      `${pointIndex === 0 ? 'M' : 'L'} ${point.x * width} ${point.y * height}`,
                  )
                  .join(' ')}
                stroke={(annotation.payload as InkPayload).color}
                strokeWidth={(annotation.payload as InkPayload).thickness}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </svg>
        ) : (
          <button
            key={annotation.id}
            aria-label={annotationLabel(annotation)}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(annotation.id);
            }}
            style={renderAnnotationShape(
              annotation,
              selectedAnnotationId === annotation.id,
            )}
          >
            {annotation.kind === 'note' ? (
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: '100%',
                  height: '100%',
                  fontWeight: 700,
                  color: '#10161f',
                }}
              >
                N
              </span>
            ) : null}
          </button>
        ),
      )}

      {draft && draft.kind === 'rect' ? (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(draft.start.x, draft.current.x) * 100}%`,
            top: `${Math.min(draft.start.y, draft.current.y) * 100}%`,
            width: `${Math.abs(draft.current.x - draft.start.x) * 100}%`,
            height: `${Math.abs(draft.current.y - draft.start.y) * 100}%`,
            background:
              tool === 'highlight' ? 'rgba(245, 171, 53, 0.25)' : 'transparent',
            border:
              tool === 'shape'
                ? `2px solid ${TOOL_COLORS.shape}`
                : tool === 'signature'
                  ? '2px dashed rgba(20,33,61,0.58)'
                  : '0',
          }}
        />
      ) : null}

      {draft && draft.kind === 'ink' ? (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          <path
            d={inkPath}
            stroke={TOOL_COLORS.ink}
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      ) : null}
    </div>
  );
}
