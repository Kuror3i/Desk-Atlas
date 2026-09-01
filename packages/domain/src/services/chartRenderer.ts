import { PNG } from "pngjs";

// Clean 5x7 bitmap font for rendering text labels onto pixel canvas
const FONT_5X7: Record<string, number[]> = {
  " ": [0, 0, 0, 0, 0],
  "!": [0, 0, 0x5f, 0, 0],
  '"': [0, 0x07, 0, 0x07, 0],
  "#": [0x14, 0x7f, 0x14, 0x7f, 0x14],
  "$": [0x24, 0x2a, 0x7f, 0x2a, 0x12],
  "%": [0x23, 0x13, 0x08, 0x64, 0x62],
  "&": [0x36, 0x49, 0x55, 0x22, 0x50],
  "'": [0, 0x05, 0x03, 0, 0],
  "(": [0, 0x1c, 0x22, 0x41, 0],
  ")": [0, 0x41, 0x22, 0x1c, 0],
  "*": [0x14, 0x08, 0x3e, 0x08, 0x14],
  "+": [0x08, 0x08, 0x3e, 0x08, 0x08],
  ",": [0, 0x50, 0x30, 0, 0],
  "-": [0x08, 0x08, 0x08, 0x08, 0x08],
  ".": [0, 0x60, 0x60, 0, 0],
  "/": [0x20, 0x10, 0x08, 0x04, 0x02],
  "0": [0x3e, 0x51, 0x49, 0x45, 0x3e],
  "1": [0, 0x42, 0x7f, 0x40, 0],
  "2": [0x42, 0x61, 0x51, 0x49, 0x46],
  "3": [0x21, 0x41, 0x45, 0x4b, 0x31],
  "4": [0x18, 0x14, 0x12, 0x7f, 0x10],
  "5": [0x27, 0x45, 0x45, 0x45, 0x39],
  "6": [0x3c, 0x4a, 0x49, 0x49, 0x30],
  "7": [0x01, 0x71, 0x09, 0x05, 0x03],
  "8": [0x36, 0x49, 0x49, 0x49, 0x36],
  "9": [0x06, 0x49, 0x49, 0x29, 0x1e],
  ":": [0, 0x36, 0x36, 0, 0],
  ";": [0, 0x56, 0x36, 0, 0],
  "<": [0x08, 0x14, 0x22, 0x41, 0],
  "=": [0x14, 0x14, 0x14, 0x14, 0x14],
  ">": [0, 0x41, 0x22, 0x14, 0x08],
  "?": [0x02, 0x01, 0x51, 0x09, 0x06],
  "@": [0x32, 0x49, 0x79, 0x41, 0x3e],
  "A": [0x7e, 0x11, 0x11, 0x11, 0x7e],
  "B": [0x7f, 0x49, 0x49, 0x49, 0x36],
  "C": [0x3e, 0x41, 0x41, 0x41, 0x22],
  "D": [0x7f, 0x41, 0x41, 0x22, 0x1c],
  "E": [0x7f, 0x49, 0x49, 0x49, 0x41],
  "F": [0x7f, 0x09, 0x09, 0x09, 0x01],
  "G": [0x3e, 0x41, 0x49, 0x49, 0x7a],
  "H": [0x7f, 0x08, 0x08, 0x08, 0x7f],
  "I": [0, 0x41, 0x7f, 0x41, 0],
  "J": [0x20, 0x40, 0x41, 0x3f, 0x01],
  "K": [0x7f, 0x08, 0x14, 0x22, 0x41],
  "L": [0x7f, 0x40, 0x40, 0x40, 0x40],
  "M": [0x7f, 0x02, 0x0c, 0x02, 0x7f],
  "N": [0x7f, 0x04, 0x08, 0x10, 0x7f],
  "O": [0x3e, 0x41, 0x41, 0x41, 0x3e],
  "P": [0x7f, 0x09, 0x09, 0x09, 0x06],
  "Q": [0x3e, 0x41, 0x51, 0x21, 0x5e],
  "R": [0x7f, 0x09, 0x19, 0x29, 0x46],
  "S": [0x46, 0x49, 0x49, 0x49, 0x31],
  "T": [0x01, 0x01, 0x7f, 0x01, 0x01],
  "U": [0x3f, 0x40, 0x40, 0x40, 0x3f],
  "V": [0x1f, 0x20, 0x40, 0x20, 0x1f],
  "W": [0x3f, 0x40, 0x38, 0x40, 0x3f],
  "X": [0x63, 0x14, 0x08, 0x14, 0x63],
  "Y": [0x07, 0x08, 0x70, 0x08, 0x07],
  "Z": [0x61, 0x51, 0x49, 0x45, 0x43],
  "[": [0, 0x7f, 0x41, 0x41, 0],
  "\\": [0x02, 0x04, 0x08, 0x10, 0x20],
  "]": [0, 0x41, 0x41, 0x7f, 0],
  "^": [0x04, 0x02, 0x01, 0x02, 0x04],
  "_": [0x40, 0x40, 0x40, 0x40, 0x40],
  "`": [0, 0x01, 0x02, 0x04, 0],
  "a": [0x20, 0x54, 0x54, 0x54, 0x78],
  "b": [0x7f, 0x48, 0x44, 0x44, 0x38],
  "c": [0x38, 0x44, 0x44, 0x44, 0x20],
  "d": [0x38, 0x44, 0x44, 0x48, 0x7f],
  "e": [0x38, 0x54, 0x54, 0x54, 0x18],
  "f": [0x08, 0x7e, 0x09, 0x01, 0x02],
  "g": [0x0c, 0x52, 0x52, 0x52, 0x3e],
  "h": [0x7f, 0x08, 0x04, 0x04, 0x78],
  "i": [0, 0x44, 0x7d, 0x40, 0],
  "j": [0x20, 0x40, 0x44, 0x3d, 0],
  "k": [0x7f, 0x10, 0x28, 0x44, 0],
  "l": [0, 0x41, 0x7f, 0x40, 0],
  "m": [0x7c, 0x04, 0x18, 0x04, 0x78],
  "n": [0x7c, 0x08, 0x04, 0x04, 0x78],
  "o": [0x38, 0x44, 0x44, 0x44, 0x38],
  "p": [0x7c, 0x14, 0x14, 0x14, 0x08],
  "q": [0x08, 0x14, 0x14, 0x18, 0x7c],
  "r": [0x7c, 0x08, 0x04, 0x04, 0x08],
  "s": [0x48, 0x54, 0x54, 0x54, 0x20],
  "t": [0x04, 0x3f, 0x44, 0x40, 0x20],
  "u": [0x3c, 0x40, 0x40, 0x20, 0x7c],
  "v": [0x1c, 0x20, 0x40, 0x20, 0x1c],
  "w": [0x3c, 0x40, 0x30, 0x40, 0x3c],
  "x": [0x44, 0x28, 0x10, 0x28, 0x44],
  "y": [0x0c, 0x50, 0x50, 0x50, 0x3c],
  "z": [0x44, 0x64, 0x54, 0x4c, 0x44],
  "|": [0, 0, 0x7f, 0, 0],
  "~": [0x08, 0x04, 0x08, 0x10, 0x08],
  "₱": [0x7e, 0x19, 0x19, 0x19, 0x0e], // Philippine Peso symbol
};

export interface PixelColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export class PixelCanvas {
  public png: PNG;
  public width: number;
  public height: number;

  constructor(width: number, height: number, bgColor: PixelColor = { r: 255, g: 255, b: 255, a: 255 }) {
    this.width = width;
    this.height = height;
    this.png = new PNG({ width, height });
    this.fill(bgColor);
  }

  setPixel(x: number, y: number, color: PixelColor) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (this.width * Math.floor(y) + Math.floor(x)) << 2;
    const a = color.a !== undefined ? color.a / 255 : 1;
    if (a < 1) {
      const existingR = this.png.data[idx] ?? 255;
      const existingG = this.png.data[idx + 1] ?? 255;
      const existingB = this.png.data[idx + 2] ?? 255;
      this.png.data[idx] = Math.round(color.r * a + existingR * (1 - a));
      this.png.data[idx + 1] = Math.round(color.g * a + existingG * (1 - a));
      this.png.data[idx + 2] = Math.round(color.b * a + existingB * (1 - a));
      this.png.data[idx + 3] = 255;
    } else {
      this.png.data[idx] = color.r;
      this.png.data[idx + 1] = color.g;
      this.png.data[idx + 2] = color.b;
      this.png.data[idx + 3] = 255;
    }
  }

  fill(color: PixelColor) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.setPixel(x, y, color);
      }
    }
  }

  fillRect(x: number, y: number, w: number, h: number, color: PixelColor, radius = 0) {
    const xStart = Math.max(0, Math.floor(x));
    const yStart = Math.max(0, Math.floor(y));
    const xEnd = Math.min(this.width, Math.floor(x + w));
    const yEnd = Math.min(this.height, Math.floor(y + h));

    for (let py = yStart; py < yEnd; py++) {
      for (let px = xStart; px < xEnd; px++) {
        if (radius > 0) {
          // Check rounded corner distance
          const inLeft = px < x + radius;
          const inRight = px >= x + w - radius;
          const inTop = py < y + radius;
          const inBottom = py >= y + h - radius;

          if ((inLeft || inRight) && (inTop || inBottom)) {
            const cx = inLeft ? x + radius : x + w - radius;
            const cy = inTop ? y + radius : y + h - radius;
            const distSq = (px - cx) ** 2 + (py - cy) ** 2;
            if (distSq > radius ** 2) {
              continue;
            }
          }
        }
        this.setPixel(px, py, color);
      }
    }
  }

  strokeRect(x: number, y: number, w: number, h: number, color: PixelColor, thickness = 1) {
    for (let t = 0; t < thickness; t++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, y + t, color);
        this.setPixel(px, y + h - 1 - t, color);
      }
      for (let py = y; py < y + h; py++) {
        this.setPixel(x + t, py, color);
        this.setPixel(x + w - 1 - t, py, color);
      }
    }
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, color: PixelColor, thickness = 1) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let cx = x1;
    let cy = y1;

    while (true) {
      if (thickness <= 1) {
        this.setPixel(cx, cy, color);
      } else {
        this.fillRect(cx - Math.floor(thickness / 2), cy - Math.floor(thickness / 2), thickness, thickness, color);
      }

      if (cx === x2 && cy === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  }

  drawText(text: string, x: number, y: number, color: PixelColor, scale = 1) {
    let cursorX = Math.floor(x);
    const cursorY = Math.floor(y);

    for (let i = 0; i < text.length; i++) {
      const char = text[i] ?? " ";
      const bitmap = FONT_5X7[char] ?? FONT_5X7["?"] ?? [0, 0, 0, 0, 0];

      for (let col = 0; col < 5; col++) {
        const colBits = bitmap[col] ?? 0;
        for (let row = 0; row < 7; row++) {
          if ((colBits >> row) & 1) {
            if (scale === 1) {
              this.setPixel(cursorX + col, cursorY + row, color);
            } else {
              this.fillRect(cursorX + col * scale, cursorY + row * scale, scale, scale, color);
            }
          }
        }
      }
      cursorX += (5 + 1) * scale;
    }
  }

  measureTextWidth(text: string, scale = 1): number {
    return text.length * 6 * scale;
  }

  toBuffer(): Buffer {
    return PNG.sync.write(this.png);
  }
}

// DeskAtlas Theme Colors
export const DA_COLORS = {
  BRAND_DARK: { r: 12, g: 59, b: 39, a: 255 }, // #0C3B27
  BRAND_ACCENT: { r: 200, g: 244, b: 81, a: 255 }, // #C8F451
  CANVAS: { r: 243, g: 247, b: 244, a: 255 }, // #F3F7F4
  WHITE: { r: 255, g: 255, b: 255, a: 255 },
  TEXT_PRIMARY: { r: 18, g: 37, b: 26, a: 255 }, // #12251A
  TEXT_SECONDARY: { r: 101, g: 115, b: 106, a: 255 }, // #65736A
  BORDER: { r: 220, g: 230, b: 223, a: 255 }, // #DCE6DF
  GRIDLINE: { r: 235, g: 242, b: 237, a: 255 },
  BAR_DEFAULT: { r: 12, g: 59, b: 39, a: 210 }, // #0C3B27
  BAR_HIGHLIGHT: { r: 34, g: 197, b: 94, a: 255 }, // #22C55E
  SUCCESS: { r: 34, g: 197, b: 94, a: 255 },
  ATTENTION: { r: 252, g: 240, b: 96, a: 255 },
  DANGER: { r: 239, g: 68, b: 68, a: 255 },
};

/**
 * Generate 7-Day Revenue Trend Bar Chart Image (PNG Buffer)
 */
export function generateRevenueTrendChartPng(params: {
  bars: Array<{ label: string; date: string; amount: number; formattedAmount: string }>;
  currency: string;
  totalFormatted: string;
  width?: number;
  height?: number;
}): Buffer {
  const width = params.width ?? 680;
  const height = params.height ?? 300;
  const canvas = new PixelCanvas(width, height, DA_COLORS.WHITE);

  // Border & Header Card
  canvas.fillRect(0, 0, width, height, DA_COLORS.WHITE, 12);
  canvas.strokeRect(0, 0, width, height, DA_COLORS.BORDER, 1);

  // Card Header Banner
  canvas.fillRect(16, 16, width - 32, 42, DA_COLORS.CANVAS, 8);
  canvas.drawText("REVENUE OVERVIEW (LAST 7 DAYS)", 30, 26, DA_COLORS.BRAND_DARK, 2);
  const totalText = `Total: ${params.totalFormatted}`;
  const totalWidth = canvas.measureTextWidth(totalText, 2);
  canvas.drawText(totalText, width - 30 - totalWidth, 26, DA_COLORS.TEXT_PRIMARY, 2);

  // Chart plotting area
  const plotX = 50;
  const plotY = 80;
  const plotW = width - 80;
  const plotH = height - 130;

  const maxAmount = Math.max(...params.bars.map((b) => b.amount), 100);

  // Grid lines & Y-axis labels
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const gy = plotY + plotH - Math.round((i / gridSteps) * plotH);
    canvas.drawLine(plotX, gy, plotX + plotW, gy, DA_COLORS.GRIDLINE, 1);
    const val = Math.round((i / gridSteps) * maxAmount);
    const valLabel = val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`;
    canvas.drawText(valLabel, 10, gy - 4, DA_COLORS.TEXT_SECONDARY, 1);
  }

  // Draw Bars
  const barCount = params.bars.length || 7;
  const barSlotWidth = plotW / barCount;
  const barWidth = Math.min(54, Math.floor(barSlotWidth * 0.65));

  params.bars.forEach((bar, index) => {
    const bx = Math.floor(plotX + index * barSlotWidth + (barSlotWidth - barWidth) / 2);
    const barHeight = maxAmount > 0 ? Math.max(bar.amount > 0 ? 8 : 2, Math.round((bar.amount / maxAmount) * plotH)) : 2;
    const by = plotY + plotH - barHeight;

    const isToday = index === barCount - 1;
    const barColor = isToday ? DA_COLORS.BRAND_DARK : { ...DA_COLORS.BRAND_DARK, a: 160 };

    // Bar column with top rounded effect
    canvas.fillRect(bx, by, barWidth, barHeight, barColor, 4);

    if (isToday) {
      // Highlight accent top cap
      canvas.fillRect(bx, by, barWidth, 4, DA_COLORS.BRAND_ACCENT, 2);
    }

    // Value text above bar
    if (bar.amount > 0) {
      const shortVal = bar.amount >= 1000 ? `${(bar.amount / 1000).toFixed(1)}k` : `${bar.amount}`;
      const textW = canvas.measureTextWidth(shortVal, 1);
      canvas.drawText(shortVal, bx + (barWidth - textW) / 2, by - 12, DA_COLORS.TEXT_PRIMARY, 1);
    }

    // X-Axis Day label
    const labelW = canvas.measureTextWidth(bar.label, 2);
    canvas.drawText(bar.label, bx + (barWidth - labelW) / 2, plotY + plotH + 10, DA_COLORS.TEXT_PRIMARY, 2);

    // Short date
    const dateStr = bar.date.slice(5); // MM-DD
    const dateW = canvas.measureTextWidth(dateStr, 1);
    canvas.drawText(dateStr, bx + (barWidth - dateW) / 2, plotY + plotH + 28, DA_COLORS.TEXT_SECONDARY, 1);
  });

  return canvas.toBuffer();
}

/**
 * Generate Top Workspace Utilization Chart Image (PNG Buffer)
 */
export function generateWorkspaceUtilizationChartPng(params: {
  workspaces: Array<{ name: string; templateName: string; reservationCount: number; occupancyPercentage: number }>;
  width?: number;
  height?: number;
}): Buffer {
  const width = params.width ?? 680;
  const height = params.height ?? 300;
  const canvas = new PixelCanvas(width, height, DA_COLORS.WHITE);

  // Border
  canvas.fillRect(0, 0, width, height, DA_COLORS.WHITE, 12);
  canvas.strokeRect(0, 0, width, height, DA_COLORS.BORDER, 1);

  // Card Header Banner
  canvas.fillRect(16, 16, width - 32, 42, DA_COLORS.CANVAS, 8);
  canvas.drawText("TOP WORKSPACE UTILIZATION & BOOKINGS", 30, 26, DA_COLORS.BRAND_DARK, 2);

  const topItems = params.workspaces.slice(0, 5);
  const maxCount = Math.max(...topItems.map((w) => w.reservationCount), 1);

  const startY = 76;
  const rowHeight = 42;

  if (topItems.length === 0) {
    canvas.drawText("No workspace activity recorded for this period.", 40, 140, DA_COLORS.TEXT_SECONDARY, 2);
    return canvas.toBuffer();
  }

  topItems.forEach((ws, index) => {
    const y = startY + index * rowHeight;

    // Rank & Name
    const rankLabel = `#${index + 1}`;
    canvas.drawText(rankLabel, 30, y + 8, DA_COLORS.TEXT_SECONDARY, 2);

    const nameText = `${ws.name.slice(0, 18)} (${ws.templateName.slice(0, 14)})`;
    canvas.drawText(nameText, 70, y + 8, DA_COLORS.TEXT_PRIMARY, 2);

    // Bar progress meter
    const barX = 320;
    const maxBarW = width - barX - 140;
    const barW = Math.max(6, Math.round((ws.reservationCount / maxCount) * maxBarW));

    // Background track
    canvas.fillRect(barX, y + 8, maxBarW, 14, DA_COLORS.CANVAS, 4);
    // Filled bar
    canvas.fillRect(barX, y + 8, barW, 14, index === 0 ? DA_COLORS.BRAND_DARK : { ...DA_COLORS.BRAND_DARK, a: 180 }, 4);

    // Count badge
    const countText = `${ws.reservationCount} ${ws.reservationCount === 1 ? 'booking' : 'bookings'}`;
    canvas.drawText(countText, width - 125, y + 8, DA_COLORS.BRAND_DARK, 2);
  });

  return canvas.toBuffer();
}

/**
 * Generate Status Breakdown Chart Image (PNG Buffer)
 */
export function generateStatusBreakdownChartPng(params: {
  confirmed: number;
  checkedIn: number;
  completed: number;
  cancelled: number;
  manualResolution: number;
  width?: number;
  height?: number;
}): Buffer {
  const width = params.width ?? 680;
  const height = params.height ?? 240;
  const canvas = new PixelCanvas(width, height, DA_COLORS.WHITE);

  canvas.fillRect(0, 0, width, height, DA_COLORS.WHITE, 12);
  canvas.strokeRect(0, 0, width, height, DA_COLORS.BORDER, 1);

  // Header
  canvas.fillRect(16, 16, width - 32, 42, DA_COLORS.CANVAS, 8);
  canvas.drawText("RESERVATION STATUS DISTRIBUTION", 30, 26, DA_COLORS.BRAND_DARK, 2);

  const statuses = [
    { label: "Confirmed / Paid", count: params.confirmed, color: DA_COLORS.SUCCESS },
    { label: "Checked In", count: params.checkedIn, color: DA_COLORS.BRAND_DARK },
    { label: "Completed", count: params.completed, color: { r: 16, g: 185, b: 129, a: 255 } },
    { label: "Manual Resolution", count: params.manualResolution, color: { r: 245, g: 158, b: 11, a: 255 } },
    { label: "Cancelled", count: params.cancelled, color: DA_COLORS.DANGER },
  ];

  const total = statuses.reduce((sum, s) => sum + s.count, 0) || 1;

  // Single horizontal multi-segment stacked bar
  const barX = 30;
  const barY = 80;
  const barW = width - 60;
  const barH = 28;

  let curX = barX;
  statuses.forEach((s) => {
    if (s.count > 0) {
      const segW = Math.max(4, Math.round((s.count / total) * barW));
      canvas.fillRect(curX, barY, segW, barH, s.color, 2);
      curX += segW;
    }
  });

  // Legend cards below
  const legendY = 135;
  const itemW = Math.floor((width - 60) / statuses.length);

  statuses.forEach((s, idx) => {
    const lx = barX + idx * itemW;
    // Color dot
    canvas.fillRect(lx, legendY, 12, 12, s.color, 3);
    // Label & count
    canvas.drawText(s.label, lx + 18, legendY - 2, DA_COLORS.TEXT_PRIMARY, 1);
    const pct = Math.round((s.count / total) * 100);
    canvas.drawText(`${s.count} (${pct}%)`, lx + 18, legendY + 12, DA_COLORS.TEXT_SECONDARY, 2);
  });

  return canvas.toBuffer();
}
