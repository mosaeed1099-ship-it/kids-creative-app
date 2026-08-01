/**
 * CoverObject.js — decorative cover header shown only on the cover page. Reads
 * the story metadata (title / author / child name / date) live and draws it
 * centred at the top. Non-interactive (edit via the info panel).
 */
import { SceneObject } from '../../../engine/index.js';

export default class CoverObject extends SceneObject {
  constructor(app) {
    super({ type: 'cover', x: 0, y: 0, width: app.PAGE_W, height: app.PAGE_H, anchor: { x: 0, y: 0 }, zIndex: -500, interactive: false });
    this.app = app;
  }

  draw(ctx) {
    const m = this.app.story.meta;
    const w = this.app.PAGE_W;
    const cx = w / 2;
    ctx.save();
    ctx.textAlign = 'center';
    try { ctx.direction = 'rtl'; } catch { /* ignore */ }

    // title
    ctx.fillStyle = '#3a2e6a';
    ctx.font = '800 84px system-ui, "Segoe UI", sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(m.title || 'قصتي', cx, 90);

    ctx.fillStyle = '#6b6b86';
    ctx.font = '600 40px system-ui, sans-serif';
    let y = 210;
    if (m.childName) { ctx.fillText(`⭐ بطل القصة: ${m.childName}`, cx, y); y += 58; }
    if (m.author) { ctx.fillText(`✍️ تأليف: ${m.author}`, cx, y); y += 58; }
    if (m.date) { ctx.fillText(`📅 ${m.date}`, cx, y); }
    ctx.restore();
  }
}
