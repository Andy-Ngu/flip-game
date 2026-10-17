// A small helper for the glows, dimmers and shadows in this folder.

// The palette keeps its colours as plain hex ("#F2C14E"). A glow needs the same colour partly see-through,
// so hexAlpha("#F2C14E", 0.4) gives "rgba(242,193,78,0.4)". Anything that is not a plain hex colour
// is handed back untouched.
export function hexAlpha(hex: string, alpha: number): string {
  const digits = hex.startsWith("#") ? hex.slice(1) : hex;
  const full = digits.length === 3 ? digits.split("").map((c) => c + c).join("") : digits;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
