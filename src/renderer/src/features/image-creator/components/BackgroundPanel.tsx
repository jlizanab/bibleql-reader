import { useState, type JSX } from "react";
import { STR, type Locale } from "../../../data/strings";
import { fillTemplate } from "../../../lib/format";
import { ImageIcon } from "../../../components/icons";
import { CURATED_IMAGES } from "../data/curatedImages";
import { pickLocalBackground } from "../providers/localImage";
import { selectCuratedBackground } from "../providers/curatedImages";
import type { Background } from "../model/types";
import styles from "./BackgroundPanel.module.scss";

interface BackgroundPanelProps {
  locale: Locale;
  background: Background | null;
  onChangeBackground(background: Background): void;
  onChangeCrop(crop: Background["crop"]): void;
  onChangeOverlay(overlay: NonNullable<Background["overlay"]>): void;
}

export function BackgroundPanel({ locale, background, onChangeBackground, onChangeCrop, onChangeOverlay }: BackgroundPanelProps): JSX.Element {
  const t = STR[locale];
  const [busy, setBusy] = useState(false);

  async function handleChoose(): Promise<void> {
    setBusy(true);
    try {
      const picked = await pickLocalBackground();
      if (picked) onChangeBackground(picked);
    } finally {
      setBusy(false);
    }
  }

  const overlay = background?.overlay ?? { enabled: false, color: "#000000", opacity: 0.35 };

  return (
    <div className={styles.panel}>
      <div className={styles.sectionTitle}>{t.background}</div>

      <div className={styles.curatedLabel}>{t.curatedImages}</div>
      <div className={styles.curatedGrid}>
        {CURATED_IMAGES.map((image) => {
          const label = fillTemplate(t.photoBy, { s: image.attribution.photographerName, l: image.attribution.sourceName });
          return (
            <button
              key={image.id}
              type="button"
              className={styles.curatedThumb}
              title={label}
              onClick={() => onChangeBackground(selectCuratedBackground(image))}
            >
              <img src={image.thumbUrl} alt={label} loading="lazy" />
            </button>
          );
        })}
      </div>

      <button type="button" className={styles.chooseButton} onClick={handleChoose} disabled={busy}>
        <ImageIcon size={14} />
        {t.uploadFromDisk}
      </button>

      {!background && <p className={styles.help}>{t.noBackground}</p>}

      {background?.attribution && (
        <p className={styles.attribution}>
          {background.attribution.photographerUrl ? (
            <a href={background.attribution.photographerUrl} target="_blank" rel="noreferrer">
              {background.attribution.photographerName}
            </a>
          ) : (
            background.attribution.photographerName
          )}
          {" · "}
          {background.attribution.sourceUrl ? (
            <a href={background.attribution.sourceUrl} target="_blank" rel="noreferrer">
              {background.attribution.sourceName}
            </a>
          ) : (
            background.attribution.sourceName
          )}
        </p>
      )}

      {background && (
        <>
          <label className={styles.field}>
            <span>{t.overlay}</span>
            <input
              type="checkbox"
              checked={overlay.enabled}
              aria-label={t.overlay}
              onChange={(event) => onChangeOverlay({ ...overlay, enabled: event.target.checked })}
            />
          </label>

          {overlay.enabled && (
            <label className={styles.field}>
              <span>{t.overlay}</span>
              <input
                type="range"
                min={0}
                max={0.7}
                step={0.05}
                value={overlay.opacity}
                aria-label={t.overlay}
                onChange={(event) => onChangeOverlay({ ...overlay, opacity: Number(event.target.value) })}
              />
            </label>
          )}

          <label className={styles.field}>
            <span>{t.zoom}</span>
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.05}
              value={background.crop.scale}
              aria-label={t.zoom}
              onChange={(event) => onChangeCrop({ ...background.crop, scale: Number(event.target.value) })}
            />
          </label>

          <label className={styles.field}>
            <span>{t.positionX}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={background.crop.x}
              aria-label={t.positionX}
              onChange={(event) => onChangeCrop({ ...background.crop, x: Number(event.target.value) })}
            />
          </label>

          <label className={styles.field}>
            <span>{t.positionY}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={background.crop.y}
              aria-label={t.positionY}
              onChange={(event) => onChangeCrop({ ...background.crop, y: Number(event.target.value) })}
            />
          </label>
        </>
      )}
    </div>
  );
}
