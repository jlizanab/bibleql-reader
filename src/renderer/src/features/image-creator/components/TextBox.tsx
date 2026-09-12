import { useRef, type JSX, type KeyboardEvent, type PointerEvent } from "react";
import { fontSizePx, clamp01 } from "../model/coords";
import type { TextElement } from "../model/types";
import styles from "./TextBox.module.scss";

const NUDGE = 0.005;
const NUDGE_LARGE = 0.02;

interface TextBoxProps {
  element: TextElement;
  selected: boolean;
  containerWidth: number;
  containerHeight: number;
  onSelect(): void;
  onMove(x: number, y: number): void;
  onResize(width: number): void;
}

export function TextBox({ element, selected, containerWidth, containerHeight, onSelect, onMove, onResize }: TextBoxProps): JSX.Element {
  const dragState = useRef<{ startX: number; startY: number; elX: number; elY: number } | null>(null);
  const resizeState = useRef<{ startX: number; elWidth: number } | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (containerWidth === 0 || containerHeight === 0) return;
    onSelect();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = { startX: event.clientX, startY: event.clientY, elX: element.x, elY: element.y };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!dragState.current) return;
    const { startX, startY, elX, elY } = dragState.current;
    const dx = (event.clientX - startX) / containerWidth;
    const dy = (event.clientY - startY) / containerHeight;
    onMove(clamp01(elX + dx), clamp01(elY + dy));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>): void {
    dragState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleResizePointerDown(event: PointerEvent<HTMLDivElement>): void {
    event.stopPropagation();
    if (containerWidth === 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeState.current = { startX: event.clientX, elWidth: element.width };
  }

  function handleResizePointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!resizeState.current) return;
    const { startX, elWidth } = resizeState.current;
    const dx = (event.clientX - startX) / containerWidth;
    const maxWidth = 1 - element.x;
    onResize(Math.min(maxWidth, Math.max(0.05, elWidth + dx)));
  }

  function handleResizePointerUp(event: PointerEvent<HTMLDivElement>): void {
    resizeState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const step = event.shiftKey ? NUDGE_LARGE : NUDGE;
    switch (event.key) {
      case "ArrowLeft":
        onMove(clamp01(element.x - step), element.y);
        event.preventDefault();
        break;
      case "ArrowRight":
        onMove(clamp01(element.x + step), element.y);
        event.preventDefault();
        break;
      case "ArrowUp":
        onMove(element.x, clamp01(element.y - step));
        event.preventDefault();
        break;
      case "ArrowDown":
        onMove(element.x, clamp01(element.y + step));
        event.preventDefault();
        break;
      default:
        break;
    }
  }

  return (
    <div
      className={selected ? `${styles.box} ${styles.selected}` : styles.box}
      style={{
        left: `${element.x * 100}%`,
        top: `${element.y * 100}%`,
        width: `${element.width * 100}%`,
        fontFamily: element.fontFamily,
        fontSize: `${fontSizePx(element.fontSize, containerHeight)}px`,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        color: element.color,
        opacity: element.opacity,
        textAlign: element.textAlign,
        lineHeight: element.lineHeight
      }}
      tabIndex={0}
      role="textbox"
      aria-readonly
      aria-label={element.text || element.kind}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onFocus={onSelect}
      onKeyDown={handleKeyDown}
    >
      {element.text}
      {selected && (
        <div
          className={styles.resizeHandle}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
        />
      )}
    </div>
  );
}
