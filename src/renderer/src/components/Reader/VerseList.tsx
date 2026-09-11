import { useEffect, useRef, type JSX } from "react";
import type { ColumnVerse } from "./ReaderColumn";
import { SpeakIcon } from "../icons";
import styles from "./VerseList.module.scss";

interface VerseListProps {
  verses: ColumnVerse[];
  onSpeakVerse?: (n: number, text: string) => void;
  speakLabel?: string;
  speakingVerse?: number | null;
}

export function VerseList({ verses, onSpeakVerse, speakLabel, speakingVerse }: VerseListProps): JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep the verse being read in view (block:"nearest" only scrolls when
  // it's actually out of sight, so it never fights the reader).
  useEffect(() => {
    if (speakingVerse == null) return;
    wrapRef.current
      ?.querySelector(`[data-verse="${speakingVerse}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [speakingVerse]);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      {verses.map((v) => (
        <p
          key={v.n}
          data-verse={v.n}
          data-hl={v.hl}
          className={v.n === speakingVerse ? `${styles.verse} ${styles.speaking}` : styles.verse}
        >
          <sup className={styles.verseNumber}>{v.n}</sup>
          {v.text}
          {onSpeakVerse && (
            <button
              type="button"
              className={styles.verseSpeak}
              title={speakLabel}
              aria-label={speakLabel ? `${speakLabel} ${v.n}` : undefined}
              onClick={() => onSpeakVerse(v.n, v.text)}
            >
              <SpeakIcon size={12} />
            </button>
          )}
        </p>
      ))}
    </div>
  );
}
