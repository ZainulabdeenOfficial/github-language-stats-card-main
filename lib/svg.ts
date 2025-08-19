import type { AggregatedLanguage } from "./github";
import { resolveTheme } from "./themes";
import { colorForLanguageAny } from "./languageColors";

function escapeXml(value: string): string {
  return value.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] as string));
}

const LINES_PER_HOUR = 50; // heuristic
const LABEL_FONT_PX = 11;
const APPROX_CHAR_W = 6; // approx width per char at 11px
const fmtCompact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function truncateToWidth(text: string, maxPx: number): string {
  const maxChars = Math.max(0, Math.floor(maxPx / APPROX_CHAR_W));
  if (text.length <= maxChars) return text;
  if (maxChars <= 1) return "";
  return text.slice(0, maxChars - 1) + "…";
}

function formatHours(hoursFloat: number): string {
  const totalMinutes = Math.max(0, Math.round(hoursFloat * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} mins`;
  if (minutes <= 0) return `${hours} hrs`;
  return `${hours} hrs ${minutes} mins`;
}

type Variant = "legend" | "compact" | "list" | undefined;

export function renderCardSvg(params: {
  username: string;
  languages: AggregatedLanguage[];
  totalEstimatedLines: number;
  totalCommittedLinesAll?: number;
  totalCommittedLinesUser?: number;
  repoCount?: number;
  theme?: string;
  layout?: "compact" | "full";
  variant?: Variant;
  title?: string;
  wakatimeHours?: number;
  accentHex?: string;
  period?: string;
}): string {
  const { username, languages, totalEstimatedLines, totalCommittedLinesAll, totalCommittedLinesUser, repoCount, theme, variant, title, wakatimeHours, accentHex, period } = params;
  const t = resolveTheme(theme);
  const accent = accentHex || t.sub;
  const v: Variant = variant ?? "list";

  if (v === "list") {
    // Single-column list layout similar to the provided mockup
    const width = 520;
    const paddingX = 16;
    const nameY = 22;
    const headerY = nameY + 18;
    const subtitleY = headerY + 16;
    const rowGap = 22;
    const items = languages.length;
    const footerHeight = 26;
    const contentStartY = subtitleY + 6 + 10; // separator under subtitle + padding
    const height = contentStartY + items * rowGap + 12 + footerHeight + 12;

    const sep = (y: number) => `<rect x="${paddingX}" y="${y}" width="${width - paddingX * 2}" height="2" rx="1" ry="1" fill="${t.sub}33" />`;

    const listSvg = languages.map((l, idx) => {
      const y = contentStartY + idx * rowGap;
      const color = colorForLanguageAny(l.name);
      const hours = l.estimatedLines / LINES_PER_HOUR;
      const label = `${escapeXml(l.name)} — ${formatHours(hours)}`;
      return `
        <g>
          <circle cx="${paddingX + 8}" cy="${y + 8}" r="6" fill="${color}" />
          <text x="${paddingX + 22}" y="${y + 12}" fill="${t.fg}" font-size="13">${truncateToWidth(label, width - paddingX * 2 - 40)}</text>
        </g>`;
    }).join("");

    const cardTitle = escapeXml(title || "Language Stats");
    const totalLoc = `Total LOC: ${Intl.NumberFormat().format(totalEstimatedLines)}`;
    const footerTxt = `Tracking period: ${escapeXml(period || "All Time")}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,Roboto,Helvetica Neue,Arial,sans-serif">
  <rect width="100%" height="100%" fill="${t.bg}" rx="10" ry="10" stroke="${accent}44" />
  <g>
    <svg x="${paddingX}" y="${nameY - 14}" width="18" height="18" viewBox="0 0 24 24" fill="${t.fg}" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.47-1.12-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03 .9 1.53 2.36 1.09 2.94.83 .09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.84c.85.01 1.71.12 2.51.35 1.9-1.29 2.74-1.02 2.74-1.02 .55 1.38.2 2.4.1 2.65 .64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95 .36.31.67.92.67 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10 10 0 0 0 12 2z"/>
    </svg>
    <text x="${paddingX + 24}" y="${nameY}" fill="${t.fg}" font-size="16" font-weight="700">${escapeXml(username)}</text>
  </g>
  <text x="${paddingX}" y="${headerY}" fill="${t.fg}" font-size="18" font-weight="700">${cardTitle}</text>
  <text x="${paddingX}" y="${subtitleY}" fill="${t.sub}" font-size="12">${totalLoc}</text>
  ${sep(subtitleY + 6)}
  ${listSvg}
  ${sep(height - footerHeight - 10)}
  <text x="${paddingX}" y="${height - 16}" fill="${t.sub}" font-size="12">${footerTxt}</text>
</svg>`;
  }

  if (v === "legend") {
    // Screenshot-style legend card to resemble the provided WakaTime-like layout
    const width = 500;
    const paddingX = 16;
    const headerHeight = 40;
    const rowGap = 22;
    const cols = 1;
    const legendLangs: AggregatedLanguage[] = languages;
    const items = legendLangs.length;
    const rows = Math.ceil(items / cols);
    const height = headerHeight + 28 + rows * rowGap + 20;

    // Header accent line color
    const legendAccent = accentHex || "#1da1f2";

    // Stacked usage bar
    const totalPercent = legendLangs.reduce((s, l) => s + l.percent, 0) || 100;
    let xCursor = paddingX + 8;
    const available = width - paddingX * 2 - 16;
    const stacked = legendLangs.slice(0, items).map((l) => {
      const pct = l.percent / totalPercent;
      const segWidth = Math.max(6, Math.round(pct * available));
      const color = colorForLanguageAny(l.name);
      const segment = `<rect x="${xCursor}" y="${12}" width="${segWidth}" height="10" rx="5" ry="5" fill="${color}" />`;
      xCursor += segWidth;
      return segment;
    }).join("");

    const itemsSvg = legendLangs.slice(0, items).map((l, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const colWidth = (width - paddingX * 2) / cols;
      const x = paddingX + col * colWidth;
      const y = headerHeight + 16 + row * rowGap;
      const color = colorForLanguageAny(l.name);
      const hours = l.estimatedLines / LINES_PER_HOUR;
      const combined = truncateToWidth(`${escapeXml(l.name)} - ${formatHours(hours)}`, colWidth - 40);
      return `
        <g>
          <circle cx="${x + 8}" cy="${y + 8}" r="6" fill="${color}" />
          <text x="${x + 22}" y="${y + 12}" fill="${t.fg}" font-size="12">${combined}</text>
        </g>`;
    }).join("");

    const cardTitle = escapeXml(title || "Language Stats");

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,Roboto,Helvetica Neue,Arial,sans-serif">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.18" />
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${t.bg}" rx="10" ry="10" stroke="${accent}66" filter="url(#shadow)" />
  <!-- Stacked usage bar before title -->
  <rect x="${paddingX}" y="10" width="${width - paddingX * 2}" height="14" rx="7" ry="7" fill="${t.sub}22" />
  ${stacked}
  <!-- Title only -->
  <text x="${paddingX}" y="30" fill="${t.fg}" font-size="16" font-weight="700">${cardTitle}</text>
  <!-- Accent underline -->
  <rect x="${paddingX}" y="36" width="${width - paddingX * 2}" height="6" rx="3" ry="3" fill="${t.sub}22" />
  <rect x="${paddingX}" y="36" width="${Math.max(30, Math.round((width - paddingX * 2) * 0.6))}" height="6" rx="3" ry="3" fill="${legendAccent}" />
  ${itemsSvg}
</svg>`;
  }

  // Default compact detailed layout
  const totalEstimatedHours = totalEstimatedLines / LINES_PER_HOUR;
  const width = 600;
  const paddingX = 16;
  const headerHeight = 72;
  const rowHeight = 24;
  const rows = languages.length;
  const badgesHeight = 28;
  const height = headerHeight + 20 + rows * rowHeight + 8 + badgesHeight + 10;

  const totalPercent = languages.reduce((s, l) => s + l.percent, 0) || 100;
  let xCursor = paddingX;
  const stackedBg = `<rect x="${paddingX}" y="12" width="${width - paddingX * 2}" height="10" rx="5" ry="5" fill="${t.sub}22" />`;
  const stacked = languages.map((l) => {
    const pct = l.percent / totalPercent;
    const segWidth = Math.max(4, Math.round(pct * (width - paddingX * 2)));
    const color = colorForLanguageAny(l.name);
    const segment = `<rect x="${xCursor}" y="14" width="${segWidth}" height="6" rx="3" ry="3" fill="${color}" />`;
    xCursor += segWidth;
    return segment;
  }).join("");

  const labelStartX = 160;
  const labelRight = width - paddingX;
  const maxLabelPx = labelRight - labelStartX;

  const bars = languages.slice(0, rows).map((l, i) => {
    const y = headerHeight + 16 + i * rowHeight;
    const w = Math.max(2, Math.round((l.percent / 100) * (width - (labelStartX + paddingX))));
    const dotColor = colorForLanguageAny(l.name);
    const hours = l.estimatedLines / LINES_PER_HOUR;
    const combined = escapeXml(truncateToWidth(`${l.name} - ${formatHours(hours)}`, maxLabelPx));
    return `
      <g>
        <rect x="${labelStartX}" y="${y - 12}" rx="6" ry="6" width="${width - (labelStartX + paddingX)}" height="14" fill="${t.border}22" />
        <rect x="${labelStartX}" y="${y - 12}" rx="6" ry="6" width="${w}" height="14" fill="${accent}" />
        <circle cx="${paddingX + 8}" cy="${y - 6}" r="5" fill="${dotColor}" />
        <text x="${paddingX + 20}" y="${y - 2}" fill="${t.fg}" font-size="12">${combined}</text>
      </g>`;
  }).join("");

  const committedAllBadge = `Committed(all): ${fmtCompact.format(Number(totalCommittedLinesAll || 0))}`;
  const badges = [
    `LOC: ${Intl.NumberFormat().format(totalEstimatedLines)}`,
    `Time: ${totalEstimatedHours.toFixed(1)} h`,
    committedAllBadge,
    typeof totalCommittedLinesUser === "number" && totalCommittedLinesUser > 0 ? `Committed(you): ${fmtCompact.format(totalCommittedLinesUser)}` : null,
    typeof repoCount === "number" ? `${repoCount} repos` : null,
    typeof wakatimeHours === "number" && wakatimeHours > 0 ? `WakaTime: ${wakatimeHours.toFixed(1)} h` : null
  ].filter(Boolean) as string[];

  const badgeWidth = 170;
  const badgeGap = 14;
  const maxBadges = Math.max(1, Math.floor(((width - paddingX * 2) + badgeGap) / (badgeWidth + badgeGap)));
  const shownBadges = badges.slice(0, maxBadges);

  const badgesY = headerHeight + 16 + rows * rowHeight + 6;
  const badgeRow = shownBadges.map((txt, i) => {
    const x = paddingX + i * (badgeWidth + badgeGap);
    const safeTxt = escapeXml(truncateToWidth(txt, badgeWidth - 20));
    return `
      <g>
        <rect x="${x}" y="${badgesY}" rx="8" ry="8" width="${badgeWidth}" height="22" fill="${t.border}22" stroke="${t.border}" />
        <text x="${x + 10}" y="${badgesY + 15}" fill="${t.sub}" font-size="12">${safeTxt}</text>
      </g>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GitHub language stats for ${escapeXml(username)}" style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,Roboto,Helvetica Neue,Arial,sans-serif">
  <rect width="100%" height="100%" fill="${t.bg}" rx="12" ry="12" />
  ${stackedBg}
  ${stacked}
  <g>
    <svg x="${paddingX}" y="24" width="20" height="20" viewBox="0 0 24 24" fill="${t.fg}" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.47-1.12-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03 .9 1.53 2.36 1.09 2.94.83 .09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.84c.85.01 1.71.12 2.51.35 1.9-1.29 2.74-1.02 2.74-1.02 .55 1.38.2 2.4.1 2.65 .64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95 .36.31.67.92.67 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10 10 0 0 0 12 2z"/>
    </svg>
    <text x="${paddingX + 26}" y="40" fill="${t.fg}" font-size="18" font-weight="700">${escapeXml(username)}</text>
  </g>
  <text x="${paddingX}" y="58" fill="${t.sub}" font-size="12">Language usage across public repositories</text>
  ${bars}
  ${badgeRow}
</svg>`;
}
