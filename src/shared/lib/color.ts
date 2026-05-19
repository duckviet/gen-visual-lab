export function hexToRgbFloat(hex: string): [number, number, number] {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  const safe = normalized.length === 6 ? normalized : "ffffff";

  return [
    parseInt(safe.slice(0, 2), 16) / 255,
    parseInt(safe.slice(2, 4), 16) / 255,
    parseInt(safe.slice(4, 6), 16) / 255,
  ];
}

export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgbFloat(hex).map((channel) => Math.round(channel * 255));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
