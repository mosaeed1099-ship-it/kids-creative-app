/**
 * jigsaw.js — jigsaw geometry. Because puzzle pieces sit on an axis-aligned grid
 * (no rotation), every edge is horizontal or vertical, so a knob is just a
 * semicircle (an `arc`). Edge signs are assigned per shared boundary so a tab on
 * one piece is exactly the blank on its neighbour → the pieces interlock.
 *
 *   sign  +1 → tab OUT (bulge away from the piece)
 *         -1 → tab IN  (notch into the piece)
 *          0 → flat (board border)
 */

/** Random ±1 interior signs; 0 on the outer border. */
export function generateEdgeSigns(rows, cols) {
  const rand = () => (Math.random() < 0.5 ? -1 : 1);
  const H = []; // horizontal boundaries: H[r][c], r 0..rows, c 0..cols-1
  for (let r = 0; r <= rows; r++) { H[r] = []; for (let c = 0; c < cols; c++) H[r][c] = (r === 0 || r === rows) ? 0 : rand(); }
  const V = []; // vertical boundaries: V[r][c], r 0..rows-1, c 0..cols
  for (let r = 0; r < rows; r++) { V[r] = []; for (let c = 0; c <= cols; c++) V[r][c] = (c === 0 || c === cols) ? 0 : rand(); }
  return { H, V };
}

/** The four edge signs for piece (r,c). Complementary across shared boundaries. */
export function pieceSigns(edges, r, c) {
  return {
    top: -edges.H[r][c],
    bottom: edges.H[r + 1][c],
    left: -edges.V[r][c],
    right: edges.V[r][c + 1],
  };
}

/**
 * Path2D for a piece in LOCAL coords (cell top-left at 0,0; cell = cw×ch; knob
 * radius `rad`). Traversed clockwise; for every edge `anticlockwise = sign < 0`
 * makes a +sign bulge point OUTWARD and a −sign notch point inward.
 */
export function buildPiecePath(cw, ch, rad, s) {
  const p = new Path2D();
  const HP = Math.PI / 2;
  p.moveTo(0, 0);
  // top (y=0, →x)
  p.lineTo(cw / 2 - rad, 0);
  if (s.top) p.arc(cw / 2, 0, rad, Math.PI, 0, s.top < 0);
  p.lineTo(cw, 0);
  // right (x=cw, →y)
  p.lineTo(cw, ch / 2 - rad);
  if (s.right) p.arc(cw, ch / 2, rad, -HP, HP, s.right < 0);
  p.lineTo(cw, ch);
  // bottom (y=ch, ←x)
  p.lineTo(cw / 2 + rad, ch);
  if (s.bottom) p.arc(cw / 2, ch, rad, 0, Math.PI, s.bottom < 0);
  p.lineTo(0, ch);
  // left (x=0, ←y)
  p.lineTo(0, ch / 2 + rad);
  if (s.left) p.arc(0, ch / 2, rad, HP, -HP, s.left < 0);
  p.closePath();
  return p;
}
