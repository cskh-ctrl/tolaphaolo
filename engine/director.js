// engine/director.js — data-driven shots for the "Tớ là Phaolo" series.
// Every shot in story/shots.json carries params.type + params; autoRegister() turns them into draw functions,
// so an episode is written as data (shots.json) instead of one JS file per shot.
import { E, V, registerShot, layer, blurLayer, veil, ease, prog, key, talkAmount, shake, glow, circle, ring, rr, seg, poly, text, measure, FONTS, alpha, shade, mix, linGrad, radGrad, S } from './core.js';
import { POSES, posesAt, breathe, walkPose, EXPR } from './rig2d.js';
EXPR.down = { eyes: 'dot', brows: null, mouth: 'frown', look: [0, 0.4] };
EXPR.downTears = { eyes: 'closed', brows: null, mouth: 'frown', tears: true };
import { drawChibi, chibiClose, chibiHead, blinkAt, signCross } from './stick.js';
import { BIN, NA, ME, ME_AODAI, BO, CHA, CHA_LE, LITURGICAL, EXTRA } from './cg-cast.js';
import * as SETLIB from './cg-sets.js';
import { cross, crucifix, candle, maryStatue, pew, altar, tabernacle, bible, rosaryProp, motorbike, table, dove, heart, box, ob, keyLight, fgBlur, motes, churchIcon, stainedGlass, plant, sofa } from './cg-sets.js';
import { say, think, emote, hook, factCard, lessonLine, labelTag, timeTag, endQuestion, freeze, wrap } from './cg-ui.js';

// ---------------- series cast (fixed looks) ----------------
const mk = (name, stick, extra = {}) => ({ name, ...extra, stick });
export const CAST = {
  PHAOLO: mk('Phaolo', { top: 'hoodie', color: '#7fcfb0', head: 'none' }),
  KHOA: EXTRA.anhKhoa,
  HANG: EXTRA.chiLan,
  LONG: mk('Anh Long', { top: 'tshirt', color: '#ffd66e', legs: '#5a6a8a', head: 'none' }),
  ONG: EXTRA.ongNoi, BA: EXTRA.baNoi,
  BAN: mk('Bà ngoại', { top: 'dress', color: '#b8a8d8', head: 'bun' }),
  BO, ME, ME_AODAI, BIN, NA, CHA, CHA_LE: CHA_LE(LITURGICAL.ordinary), CHA_TIM: CHA_LE(LITURGICAL.lent),
  SO: EXTRA.soAnna, CO: EXTRA.coThao, HUY: EXTRA.huy, TY: EXTRA.ty,
  MAN: mk('Người đàn ông', { top: 'tshirt', color: '#a8b8d8', legs: '#6a6a7a', head: 'none' }),
  MAN2: mk('Người đàn ông', { top: 'suit', color: '#8a7a9a', color2: '#ff9fb8', head: 'none' }),
  WOMAN: mk('Người phụ nữ', { top: 'dress', color: '#f2b8a0', head: 'ponytail', headColor: '#8ec5ea' }),
  WOMAN2: mk('Người phụ nữ', { top: 'aodai', color: '#ffb8c8', legs: '#ffffff', head: 'bun' }),
  GIRL: mk('Cô gái', { top: 'dress', color: '#ffb4d0', head: 'ponytail', headColor: '#ffffff' }),
  BRIDE: mk('Cô dâu', { top: 'aodai', color: '#ffffff', legs: '#ffffff', head: 'veil', headColor: '#ffffff' }),
  GROOM: mk('Chú rể', { top: 'suit', color: '#3a3a5a', color2: '#ff7a8a', head: 'none' }),
  BOSS: mk('Sếp', { top: 'suit', color: '#6a6a7a', color2: '#e8584a', head: 'none' }, { }),
  KID: BIN, KID2: NA,
  OLDLADY: EXTRA.baNoi, OLDMAN: EXTRA.ongNoi,
  BAY: mk('Chú Bảy', { top: 'tshirt', color: '#c8e0a8', legs: '#7a6a5a', head: 'cap', headColor: '#8ec5ea' }),
  MAI: mk('Mai', { top: 'dress', color: '#ffc8a0', head: 'bun' }),
};
const C = (k) => (typeof k === 'string' ? CAST[k] || CAST.MAN : k);

// ---------------- extra sets ----------------
function shop(g, t, cam, o = {}) { const M = SETLIB.SETS.office ? null : null; const r = SETLIB.SETS.street(g, t, cam, { ...o, bikes: false });
  const { GY, CX } = r; layer(g, cam, 0.85, g => { box(g, CX - V(500, 420), GY - 260, V(1000, 840), 260, '#ffe7c0', 14); box(g, CX - V(480, 400), GY - 250, V(960, 800), 120, '#cfe8ff', 10);
    for (let k = 0; k < 7; k++) { const x = CX - V(420, 350) + k * V(140, 116); g.strokeStyle = '#f2c75a'; g.lineWidth = 5; g.beginPath(); g.arc(x, GY - 210, 26, 0.2, Math.PI - 0.2); g.stroke(); cross(g, x, GY - 150, 0.28, { color: '#f2c75a' }); } });
  return r; }
function wedding(g, t, cam, o = {}) { const r = SETLIB.churchInside(g, t, cam, { ...o, flowers: true });
  layer(g, cam, 0.62, g => { for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { const x = r.CX + sx * V(330, 300), y = r.GY - V(330, 420) - k * 40; g.beginPath(); g.arc(x + k * 14 * sx, y, 34, 0, Math.PI * 2); g.fillStyle = ['#ffffff', '#ffc8d8', '#ffe8a8'][k]; g.fill(); } });
  return r; }
function hospital(g, t, cam, o = {}) { const r = SETLIB.bedroom(g, t, cam, { ...o, mood: o.mood || 'pday' });
  layer(g, cam, 0.9, g => { box(g, r.CX - V(420, 380), r.GY - 160, V(560, 520), 40, '#ffffff', 10); box(g, r.CX - V(420, 380), r.GY - 220, 40, 220, '#c8d8e8', 6); box(g, r.CX + V(260, 360) , r.GY - 420, 14, 420, '#c8c8d8', 4); box(g, r.CX + V(240, 340), r.GY - 440, 60, 80, '#e8f4ff', 8); });
  return r; }
function cafe(g, t, cam, o = {}) { const r = SETLIB.kitchen(g, t, cam, { ...o, noTable: true, mood: o.mood || 'pday' });
  layer(g, cam, 0.92, g => { table(g, r.CX, r.GY + 10, V(520, 480), '#c99a6a'); }); return r; }
function home(g, t, cam, o = {}) { return SETLIB.livingRoom(g, t, cam, o); }
const SETS = { ...SETLIB.SETS, shop, wedding, hospital, cafe, home, night: (g, t, cam, o) => SETLIB.bedroom(g, t, cam, { ...o, night: true, mood: 'pnight' }) };
function drawSet(g, t, cam, name = 'livingRoom', opt = {}) { const fn = SETS[name] || SETS.livingRoom; return fn(g, t, cam, opt); }

// ---------------- insert props (big, simple, centred) ----------------
const ITEMS = {
  holyWater(g, t, x, y) { box(g, x - 230, y - 60, 460, 120, '#d8d0c8', 50); g.beginPath(); g.ellipse(x, y - 60, 230, 50, 0, 0, Math.PI * 2); ob(g, '#cfc6bc'); g.beginPath(); g.ellipse(x, y - 56, 190, 36, 0, 0, Math.PI * 2); g.fillStyle = '#a8dcf2'; g.fill();
    for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3) % 1; g.strokeStyle = alpha('#ffffff', 0.7 * (1 - ph)); g.lineWidth = 4; g.beginPath(); g.ellipse(x + 30, y - 56, 30 + ph * 140, 8 + ph * 26, 0, 0, Math.PI * 2); g.stroke(); }
    box(g, x - 120, y + 60, 240, 260, '#d8d0c8', 20); const dip = Math.max(0, Math.sin(Math.min(1, t / 1.5) * Math.PI)); seg(g, [[x + 300, y - 420], [x + 60, y - 120 + dip * 60]], 64, S().ink); circle(g, x + 50, y - 110 + dip * 60, 40, S().ink); },
  redLamp(g, t, x, y) { seg(g, [[x, y - 700], [x, y - 330]], 6, '#c8a860'); const fl = 1 + 0.08 * Math.sin(t * 9) + 0.05 * Math.sin(t * 23); glow(g, x, y - 200, 340 * fl, '#ff6a6a', 0.55);
    g.beginPath(); g.moveTo(x - 110, y - 330); g.lineTo(x + 110, y - 330); g.quadraticCurveTo(x + 130, y - 100, x, y - 60); g.quadraticCurveTo(x - 130, y - 100, x - 110, y - 330); ob(g, alpha('#ff5a5a', 0.85)); box(g, x - 130, y - 345, 260, 26, '#e8c870', 8);
    g.fillStyle = '#fff3a0'; g.beginPath(); g.ellipse(x, y - 210, 22, 44 * fl, 0, 0, Math.PI * 2); g.fill(); },
  tabernacle(g, t, x, y) { glow(g, x, y - 200, 380, '#fff0b0', 0.5); tabernacle(g, x, y, 3.2, t); ITEMS._lamp(g, t, x + 320, y - 120); },
  _lamp(g, t, x, y) { const fl = 1 + 0.08 * Math.sin(t * 9); glow(g, x, y, 120 * fl, '#ff6a6a', 0.6); g.beginPath(); g.ellipse(x, y, 30, 44, 0, 0, Math.PI * 2); ob(g, alpha('#ff5a5a', 0.85)); seg(g, [[x, y - 44], [x, y - 300]], 3, '#c8a860'); },
  cross(g, t, x, y) { cross(g, x, y, 4.2, { color: '#d8a878', glowC: '#fff2c0' }); },
  crucifix(g, t, x, y) { crucifix(g, x, y, 4.0, { glowC: '#fff2c0' }); },
  woodCross(g, t, x, y) { glow(g, x, y - 300, 380, '#ffe8b8', 0.45); box(g, x - 34, y - 640, 68, 640, '#b8865a', 12); box(g, x - 240, y - 500, 300, 64, '#b8865a', 12); box(g, x + 60, y - 500, 120, 64, alpha('#b8865a', 0.35), 12); },
  necklace(g, t, x, y) { g.strokeStyle = '#f2c75a'; g.lineWidth = 7; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(x - 300, y - 600); g.quadraticCurveTo(x, y - 40 + Math.sin(t * 2) * 10, x + 300, y - 600); g.stroke(); g.setLineDash([]); glow(g, x, y - 80, 220, '#fff2b0', 0.5); cross(g, x, y + 120, 1.8, { color: '#f2c75a' }); },
  phone(g, t, x, y) { box(g, x - 230, y - 820, 460, 880, S().ink, 60); box(g, x - 205, y - 790, 410, 790, '#cfe8ff', 34); const cols = ['#ff9fb8', '#ffd66e', '#8fd9c0', '#8ec5ea', '#c9a8ec', '#ffb07a'];
    for (let i = 0; i < 16; i++) { const cx = x - 150 + (i % 4) * 100, cy = y - 720 + Math.floor(i / 4) * 120, k = ease.outBack(prog(t, i * 0.04, i * 0.04 + 0.3)); box(g, cx - 34 * k, cy - 34 * k, 68 * k, 68 * k, cols[i % 6], 18); }
    circle(g, x, y - 60, 34, '#ffffff'); ring(g, x, y - 60, 34, 6, '#9ab'); },
  candles(g, t, x, y) { keyLight(g, t, x, y - 300, { color: '#ffe0a0', r: 300, rays: false }); for (let k = -2; k <= 2; k++) candle(g, x + k * 110, y - Math.abs(k) * 30, 2.2 - Math.abs(k) * 0.2, t + k, {}); },
  candle(g, t, x, y) { glow(g, x, y - 300, 300, '#ffd27a', 0.5); candle(g, x, y, 4, t); },
  rosary(g, t, x, y) { rosaryProp(g, x, y, 4.5); },
  bible(g, t, x, y) { bible(g, x + 60, y, 3.4, true); },
  ring(g, t, x, y) { glow(g, x, y - 200, 300, '#fff2b0', 0.5); for (const dx of [-80, 80]) { g.strokeStyle = '#f2c75a'; g.lineWidth = 36; g.beginPath(); g.ellipse(x + dx, y - 200, 130, 150, dx * 0.003, 0, Math.PI * 2); g.stroke(); } },
  letters(g, t, x, y) { for (let k = 0; k < 6; k++) { g.save(); g.translate(x + (k - 2.5) * 30, y - 120 - k * 50); g.rotate((k % 2 ? 1 : -1) * 0.08 * k); box(g, -260, -160, 520, 320, k % 2 ? '#fff6e0' : '#ffe8d0', 12); seg(g, [[-260, -160], [0, 20], [260, -160]], 6, '#e0c8a8'); g.restore(); } },
  photo(g, t, x, y) { g.save(); g.translate(x, y - 380); g.rotate(-0.05); box(g, -260, -330, 520, 660, '#fbf6ea', 12); box(g, -220, -290, 440, 500, '#9a9aa0', 4); circle(g, 0, -100, 90, '#6a6a70'); g.beginPath(); g.ellipse(0, 150, 170, 140, 0, Math.PI, 0); g.fillStyle = '#6a6a70'; g.fill(); g.restore(); },
  basket(g, t, x, y) { g.beginPath(); g.ellipse(x, y - 160, 330, 80, 0, 0, Math.PI * 2); ob(g, '#c99a6a'); g.beginPath(); g.moveTo(x - 330, y - 160); g.quadraticCurveTo(x - 300, y + 60, x, y + 70); g.quadraticCurveTo(x + 300, y + 60, x + 330, y - 160); ob(g, '#b8865a');
    for (let k = 0; k < 7; k++) { g.save(); g.translate(x - 200 + k * 66, y - 180 - (k % 3) * 16); g.rotate(-0.3 + k * 0.1); box(g, -60, -30, 120, 60, ['#a8e0b8', '#ffd8a8', '#c8d8ff'][k % 3], 6); g.restore(); } seg(g, [[x - 330, y - 160], [x - 620, y - 260]], 26, '#8a6a4a'); },
  bell(g, t, x, y) { const sw = Math.sin(t * 14) * 0.2 * Math.max(0, 1 - t / 2); g.save(); g.translate(x, y - 500); g.rotate(sw); seg(g, [[0, -220], [0, -60]], 30, '#b8865a'); for (const dx of [-140, 0, 140]) { g.beginPath(); g.moveTo(dx - 90, 160); g.quadraticCurveTo(dx - 80, -10, dx, -20); g.quadraticCurveTo(dx + 80, -10, dx + 90, 160); g.closePath(); ob(g, '#f2c75a'); circle(g, dx, 175, 22, '#d8a840'); } g.restore();
    for (let k = 0; k < 3; k++) { const ph = (t * 0.9 + k / 3) % 1; g.strokeStyle = alpha('#ffd66e', 0.6 * (1 - ph)); g.lineWidth = 6; g.beginPath(); g.arc(x, y - 380, 260 + ph * 260, -2.6, -0.5); g.stroke(); } },
  mic(g, t, x, y) { seg(g, [[x, y], [x, y - 520]], 18, '#5a5a6a'); g.beginPath(); g.ellipse(x, y - 620, 80, 120, 0, 0, Math.PI * 2); ob(g, '#3a3a4a'); for (let k = 0; k < 5; k++) seg(g, [[x - 60, y - 680 + k * 30], [x + 60, y - 680 + k * 30]], 3, '#6a6a7a'); box(g, x - 160, y - 10, 320, 30, '#5a5a6a', 10); },
  rice(g, t, x, y) { g.beginPath(); g.moveTo(x - 300, y - 300); g.quadraticCurveTo(x, y + 60, x + 300, y - 300); ob(g, '#8ec5ea'); g.beginPath(); g.ellipse(x, y - 300, 300, 70, 0, 0, Math.PI * 2); ob(g, '#ffffff'); for (let k = 0; k < 40; k++) { circle(g, x - 240 + (k * 53 % 480), y - 330 + (k * 31 % 60), 7, '#f8f4ea'); } seg(g, [[x + 120, y - 420], [x + 340, y - 700]], 10, '#d8a878'); seg(g, [[x + 160, y - 410], [x + 400, y - 680]], 10, '#d8a878'); },
  jars(g, t, x, y) { for (let k = -2; k <= 2; k++) { const jx = x + k * 150, s = 1 - Math.abs(k) * 0.08; g.beginPath(); g.moveTo(jx - 50 * s, y - 360 * s); g.quadraticCurveTo(jx - 110 * s, y - 180 * s, jx - 70 * s, y); g.lineTo(jx + 70 * s, y); g.quadraticCurveTo(jx + 110 * s, y - 180 * s, jx + 50 * s, y - 360 * s); g.closePath(); ob(g, k % 2 ? '#d8b898' : '#c8a888'); } },
  statue(g, t, x, y) { maryStatue(g, x, y, 3.6, { glowC: '#fff2c0' }); },
  heart(g, t, x, y) { glow(g, x, y - 300, 300, '#ffd0d8', 0.6); heart(g, x, y - 300 + Math.sin(t * 3) * 10, 5.5); },
  dove(g, t, x, y) { dove(g, x, y - 300, 3.2, t); },
  church(g, t, x, y) { churchIcon(g, x, y, 3.2); },
  gift(g, t, x, y) { box(g, x - 260, y - 360, 520, 360, '#ffb4c8', 20); box(g, x - 30, y - 360, 60, 360, '#ffe08a', 0); box(g, x - 290, y - 440, 580, 100, '#ffc8d8', 20); for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * 80, y - 480, 90, 50, s * 0.5, 0, Math.PI * 2); ob(g, '#ffe08a'); } },
  card(g, t, x, y) { g.save(); g.translate(x, y - 360); g.rotate(0.04); box(g, -300, -220, 600, 440, '#fff8ec', 18); heart(g, 0, -80, 1.4); for (let k = 0; k < 4; k++) seg(g, [[-200, 40 + k * 44], [200 - (k === 3 ? 140 : 0), 40 + k * 44]], 8, '#c8b8c8'); g.restore(); },
  calendar(g, t, x, y) { box(g, x - 260, y - 640, 520, 600, '#ffffff', 20); box(g, x - 260, y - 640, 520, 140, '#ff8a8a', 20); text(g, String(30 - Math.floor(Math.min(29, t * 6))), x, y - 300, { size: 220, color: S().ink, font: FONTS.title }); },
  book(g, t, x, y) { box(g, x - 300, y - 600, 600, 560, '#a8d4f2', 16); box(g, x - 270, y - 570, 540, 500, '#c8e4f8', 10); cross(g, x, y - 210, 1.6, { color: '#ffe08a' }); },
  money(g, t, x, y) { for (let k = 0; k < 5; k++) { g.save(); g.translate(x + (k - 2) * 40, y - 200 - k * 30); g.rotate(-0.15 + k * 0.08); box(g, -230, -110, 460, 220, ['#a8e0b8', '#c8f0d0'][k % 2], 12); circle(g, 0, 0, 60, alpha('#ffffff', 0.6)); g.restore(); } },
  cat(g, t, x, y) { g.fillStyle = '#f2b880'; g.beginPath(); g.ellipse(x, y - 160, 220, 150, 0, 0, Math.PI * 2); g.fill(); circle(g, x + 170, y - 330, 110, '#f2b880'); for (const dx of [110, 230]) poly(g, [[x + dx - 40, y - 410], [x + dx, y - 500], [x + dx + 30, y - 400]], '#f2b880'); circle(g, x + 140, y - 340, 12, S().ink); circle(g, x + 210, y - 340, 12, S().ink); seg(g, [[x - 210, y - 160], [x - 330, y - 330 + Math.sin(t * 4) * 30]], 40, '#f2b880'); },
  grave(g, t, x, y) { box(g, x - 200, y - 520, 400, 520, '#d8d4dc', 120); cross(g, x, y - 200, 1.6, { color: '#b8b0c0' }); for (let k = -1; k <= 1; k++) candle(g, x + k * 120 + 300, y, 1.2, t + k); },
  wine(g, t, x, y) { glow(g, x, y - 300, 300, '#fff0b0', 0.4); g.beginPath(); g.moveTo(x - 140, y - 560); g.quadraticCurveTo(x - 130, y - 330, x, y - 320); g.quadraticCurveTo(x + 130, y - 330, x + 140, y - 560); g.closePath(); ob(g, '#f2c75a'); seg(g, [[x, y - 320], [x, y - 60]], 30, '#f2c75a'); g.beginPath(); g.ellipse(x, y - 50, 150, 34, 0, 0, Math.PI * 2); ob(g, '#e8b84a'); },
  host(g, t, x, y) { glow(g, x, y - 360, 360, '#fff6d0', 0.7); circle(g, x, y - 360, 200, '#fffaf0'); ring(g, x, y - 360, 180, 4, '#e8dcc0'); cross(g, x, y - 300, 0.9, { color: '#e8d8b0' }); },
  bread(g, t, x, y) { g.beginPath(); g.ellipse(x, y - 200, 320, 160, 0, 0, Math.PI * 2); ob(g, '#e8b878'); for (let k = -1; k <= 1; k++) seg(g, [[x + k * 120 - 40, y - 280], [x + k * 120 + 40, y - 140]], 10, '#c8945a'); },
  water(g, t, x, y) { for (let k = 0; k < 14; k++) { const ph = (t * 0.8 + k / 14) % 1; circle(g, x - 200 + (k * 71 % 400), y - 700 + ph * 600, 16, alpha('#8ec5ea', 0.8)); } g.beginPath(); g.ellipse(x, y - 60, 320, 70, 0, 0, Math.PI * 2); ob(g, '#a8dcf2'); },
};
function drawItem(g, t, name, x, y) { const f = ITEMS[name]; if (f) f(g, t, x, y); else { glow(g, x, y - 300, 300, '#fff2c0', 0.5); text(g, name, x, y - 300, { size: 90, color: S().ink, font: FONTS.title }); } }

// ---------------- helpers ----------------
const tl = (v, t, def) => { if (v == null) return def; if (!Array.isArray(v)) return v; let cur = v[0][1]; for (const [k, x] of v) if (t >= k) cur = x; return cur; };
const poseAt = (v, t, seed) => { if (v && typeof v === 'object' && !Array.isArray(v)) return v; if (Array.isArray(v)) return breathe(posesAt(t, v), t, 1, seed); return breathe(POSES[v || 'stand'] || POSES.stand, t, 1, seed); };
function camOf(p, t, info) { const u = ease.inOut(info.p); const c = p.cam || 'push'; const base = { z: 1, x: 0, y: 0 };
  if (c === 'push') Object.assign(base, { z: 1.0 + 0.08 * u }); else if (c === 'pull') Object.assign(base, { z: 1.1 - 0.08 * u }); else if (c === 'panL') Object.assign(base, { z: 1.06, x: 50 - 100 * u }); else if (c === 'panR') Object.assign(base, { z: 1.06, x: -50 + 100 * u }); else if (c === 'up') Object.assign(base, { z: 1.05, y: 60 - 120 * u }); else if (c === 'zoom') Object.assign(base, { z: 1.0 + 0.25 * ease.inOut(info.p) });
  if (p.camX) base.x += p.camX; if (p.camY) base.y += p.camY; if (p.camZ) base.z *= p.camZ; if (p.shake) { const [sx, sy] = shake(t, p.shake, 9); if (t < 1) { base.x += sx; base.y += sy; } } return base; }
const ROLE_S = [0, 2.7, 2.4, 2.0, 1.75, 1.55, 1.4];
function placeChars(p, GY, CX, t, info) {
  const list = p.chars || []; const n = list.length; const sDef = (p.wide ? 0.62 : 1) * (ROLE_S[n] || 1.4);
  const spread = n <= 1 ? [0] : list.map((_, i) => (i - (n - 1) / 2) * (E.W * (p.wide ? 0.7 : 0.78) / (n - 1)) * (n === 2 ? 0.75 : 1));
  return list.map((c, i) => { const s = (c.s ?? sDef); const walk = c.walk ? c.walk * t : 0; const x = CX + (c.x ?? spread[i]) + walk; const y = GY + (c.y ?? V(40, 60)) + (p.wide ? 0 : 0);
    const facing = c.f ?? (n === 1 ? 1 : (i < n / 2 ? 1 : -1));
    let pose; if (c.sign != null) pose = signCross(t - c.sign, c.signDur || 2.4); else if (c.walk) pose = breathe(walkPose(t * 7 + i), t, 0.4); else pose = poseAt(c.pose, t, i + 1);
    const tk = c.talk === true ? talkAmount(info.globalT, info.shot.start, info.shot.end) : Array.isArray(c.talk) ? talkAmount(info.globalT, info.shot.start + c.talk[0], info.shot.start + c.talk[1]) : 0;
    return { spec: c, o: { x, y, s, facing, char: C(c.c), pose, expr: tl(c.expr, t, 'neutral'), talk: tk, blink: c.eyes === 'closed' ? 0 : blinkAt(t, 2.8 + i * 0.4, i), look: c.look, prop: c.prop, alpha: c.alpha, rot: c.rot, depth: c.depth || 1, rim: { dir: p.rimDir || [-0.75, -0.55] } } }; }); }
function overlays(g, t, info, p, placed, cam) {
  if (p.timeTag) timeTag(g, t, { str: p.timeTag, dur: info.dur });
  for (const b of p.say || []) { const who = placed[b.who ?? 0]; if (!who) continue; const [hx, hy, hr] = chibiHead(who.o); const sx = clampX(hx + (b.dx ?? 0)), sy = hy - hr - V(150, 200) + (b.dy ?? 0);
    const fn = b.think ? think : say; layer(g, cam, 1, g => fn(g, t, { x: sx, y: sy, str: b.str, start: b.at ?? 0.1, dur: b.dur ?? info.dur, tail: [hx, hy - hr], size: b.size })); }
  for (const e of p.emotes || []) { const who = placed[e.who ?? 0]; if (!who) continue; const [hx, hy, hr] = chibiHead(who.o); layer(g, cam, 1, g => emote(g, hx + hr * (e.side ?? 1.1), hy - hr * 1.1, e.type, t - (e.at ?? 0.2), e.s ?? 1.1)); }
  for (const l of p.labels || []) { const who = placed[l.who ?? 0]; if (!who) continue; const [hx, hy, hr] = chibiHead(who.o); layer(g, cam, 1, g => labelTag(g, { str: l.str, x: hx, y: hy - hr - V(70, 90), a: ease.out(prog(t, l.at ?? 0.2, (l.at ?? 0.2) + 0.4)) })); }
  common(g, t, info, p);
}
const closeExpr = (e) => (e === 'sad' ? 'down' : e === 'cry' ? 'downTears' : e);
const clampX = (x) => Math.max(E.W * 0.3, Math.min(E.W * 0.7, x));
function common(g, t, info, p) {
  if (p.freeze) freeze(g, t, { x: E.W / 2, y: E.H * 0.5, badge: p.freeze === true ? null : p.freeze });
  if (p.fact) factCard(g, t, { start: 0.3, dur: info.dur - 0.3, y: E.H * (p.fact.y ?? 0.24), icon: 'bible', ...p.fact });
  if (p.lesson) lessonLine(g, t, { lines: p.lesson, y: E.H * 0.16, dur: info.dur });
  if (p.hook) hook(g, t - 0.2, { kicker: p.hook.kicker || 'TẠI SAO', lines: p.hook.lines, dur: info.dur - 0.2, y: E.H * (p.hook.y ?? 0.17) });
  if (p.big) bigText(g, t, info, p.big);
  if (p.tag) labelTag(g, { str: p.tag, x: E.W / 2, y: E.H * 0.12, a: ease.out(prog(t, 0.1, 0.5)) });
}
function bigText(g, t, info, b) { const a = Math.min(ease.out(prog(t, 0, 0.35)), 1 - prog(t, info.dur - 0.3, info.dur)); if (a <= 0) return; const y = E.H * (b.y ?? 0.2); g.save(); g.globalAlpha *= a;
  if (b.kicker) { const ks = 60, kw = measure(g, b.kicker, ks) + ks * 1.2; const sc = ease.outBack(prog(t, 0, 0.35)); g.save(); g.translate(E.W / 2, y); g.scale(sc, sc); g.beginPath(); rr(g, -kw / 2, -ks * 0.75, kw, ks * 1.5, ks * 0.4); ob(g, b.color || '#ff7a8a'); text(g, b.kicker, 0, 0, { size: ks, color: '#ffffff', font: FONTS.title }); g.restore(); }
  (b.lines || []).forEach((l, i) => { const k = ease.out(prog(t, 0.15 + i * 0.25, 0.5 + i * 0.25)); const s = b.size || 84; const sz = Math.min(s, (E.W * 0.9) / Math.max(1, measure(g, l, s) / s));
    text(g, l, E.W / 2, y + (b.kicker ? 110 : 0) + i * s * 1.15 + (1 - k) * 20, { size: sz, color: i === (b.lines.length - 1) ? '#ffb43c' : '#ffffff', font: FONTS.title, stroke: 14, strokeColor: S().ink, alpha: k }); });
  if (b.strike) { const p2 = ease.inOut(prog(t, b.strike, b.strike + 0.4)); if (p2 > 0) { seg(g, [[E.W * 0.12, y + 160], [E.W * 0.12 + E.W * 0.76 * p2, y + 120]], 18, '#ff5a6a'); } }
  g.restore(); }

// ---------------- templates ----------------
const T = {
  scene(g, t, info, p) { const cam = camOf(p, t, info); const { GY, CX } = drawSet(g, p.frozen ? 0 : t, cam, p.set, p.setOpt);
    if (p.items) layer(g, cam, 0.95, g => { for (const it of p.items) { g.save(); g.translate(CX + (it.x || 0), GY + (it.y || 0)); g.scale(it.s || 0.4, it.s || 0.4); drawItem(g, t, it.item, 0, 0); g.restore(); } });
    const placed = placeChars(p, GY, CX, p.frozenChars ? 0 : t, info);
    placed.sort((a, b) => (a.o.depth - b.o.depth) || 0); for (const pc of placed) layer(g, cam, pc.o.depth, g => drawChibi(g, pc.o));
    if (p.fg) fgBlur(g, t, cam, p.fg, E.W * (p.fgX ?? 0.12), { color: p.fgColor });
    overlays(g, t, info, p, placeChars(p, GY, CX, p.frozenChars ? 0 : t, info), cam); },
  close(g, t, info, p) { const cam = camOf({ cam: 'push', ...p }, t, info); blurLayer(g, 10, g => drawSet(g, t, { z: 1.3, x: p.bgX ?? -200 }, p.set, p.setOpt)); veil(g, p.veil || '#ffffff', 0.12);
    const r = V(330, p.r || 350), cx = E.W / 2 + (p.dx || 0), cy = E.H * (p.cy ?? 0.55);
    const tk = p.talk ? talkAmount(info.globalT, info.shot.start, info.shot.end) : 0;
    layer(g, cam, 1, g => { chibiClose(g, cx, cy, r, { char: C(p.c), expr: closeExpr(tl(p.expr, t, 'neutral')), talk: tk, blink: blinkAt(t, 3.1), look: p.look, tilt: (p.tilt ?? 0) + 0.03 * Math.sin(t * 1.3), rimSide: p.rimSide });
      if (p.emote) emote(g, cx + r * 1.0, cy - r * 1.05, p.emote, t - (p.emoteAt ?? 0.3), 1.2); });
    if (p.bubble) say(g, t, { x: E.W / 2, y: E.H * 0.17, str: p.bubble, start: 0.1, dur: info.dur, tail: [cx, cy - r] });
    common(g, t, info, p); },
  ots(g, t, info, p) { const cam = camOf({ cam: 'push', ...p }, t, info); const { GY, CX } = drawSet(g, t, cam, p.set, p.setOpt);
    const pc = placeChars({ chars: [{ x: p.x ?? 120, s: 2.9, f: -1, ...p.who }] }, GY, CX, t, info)[0]; layer(g, cam, 1, g => drawChibi(g, pc.o));
    fgBlur(g, t, cam, 'shoulder', E.W * 0.18, { color: C(p.fg)?.stick?.color, s: 2.4 });
    overlays(g, t, info, p, [pc], cam); },
  insert(g, t, info, p) { const cam = camOf({ cam: 'push', ...p }, t, info); blurLayer(g, 12, g => drawSet(g, t, { z: 1.4, x: 120 }, p.set, p.setOpt)); veil(g, '#fff6ec', 0.2);
    layer(g, cam, 1, g => { g.save(); const s = p.s || 1; g.translate(E.W / 2, E.H * (p.y ?? 0.62)); g.scale(s, s); drawItem(g, t, p.item, 0, 0); g.restore(); });
    motes(g, t, { color: '#ffffff', a: 0.6, count: 20 });
    if (p.label) labelTag(g, { str: p.label, x: E.W / 2, y: E.H * 0.2, a: ease.out(prog(t, 0.3, 0.8)) }); common(g, t, info, p); },
  fact(g, t, info, p) { const cam = camOf({ cam: 'push', ...p }, t, info); if (p.set) { blurLayer(g, 10, g => drawSet(g, t, { z: 1.2 }, p.set, p.setOpt)); veil(g, '#ffffff', 0.2); } else SETLIB.dream(g, t, cam, { symbol: p.symbol ?? null });
    if (p.c) chibiClose(g, E.W / 2, E.H * 0.86, 240, { char: C(p.c), expr: tl(p.expr, t, 'thinking'), look: [0, -0.6], blink: blinkAt(t, 3) });
    factCard(g, t, { start: 0.2, dur: info.dur - 0.2, y: E.H * (p.y ?? 0.42), icon: p.icon || 'bible', title: p.title, body: p.body, src: p.src, accent: p.accent }); common(g, t, info, { ...p, fact: null }); },
  text(g, t, info, p) { const cam = camOf({ cam: 'push', ...p }, t, info); blurLayer(g, 10, g => drawSet(g, t, { z: 1.2 }, p.set || 'dream', p.setOpt)); veil(g, '#ffffff', 0.1);
    if (p.c) layer(g, cam, 1, g => chibiClose(g, E.W / 2, E.H * 0.7, 300, { char: C(p.c), expr: tl(p.expr, t, 'neutral'), blink: blinkAt(t, 3), talk: p.talk ? talkAmount(info.globalT, info.shot.start, info.shot.end) : 0 }));
    if (p.item) layer(g, cam, 1, g => { g.save(); g.translate(E.W / 2, E.H * 0.82); g.scale(0.7, 0.7); drawItem(g, t, p.item, 0, 0); g.restore(); });
    bigText(g, t, info, { kicker: p.kicker, lines: p.lines, y: p.y ?? 0.2, strike: p.strike, color: p.color }); common(g, t, info, { ...p }); },
  lesson(g, t, info, p) { const cam = camOf({ cam: 'push', ...p }, t, info); SETLIB.dream(g, t, cam, { symbol: null });
    chibiClose(g, E.W / 2, E.H * 0.62, 320, { char: C(p.c || 'PHAOLO'), expr: tl(p.expr, t, 'peaceful'), look: [0, -0.5], tilt: 0.03 * Math.sin(t) });
    emote(g, E.W / 2 + 320, E.H * 0.42, 'sparkle', t, 1.2); lessonLine(g, t, { lines: p.lines, y: E.H * 0.16, dur: info.dur }); },
  steps(g, t, info, p) { const ui = S().ui; g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#e4f0ff', '#d6e8ff']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    g.strokeStyle = alpha('#6a9ad6', 0.18); g.lineWidth = 2; for (let x = 0; x <= E.W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, E.H); g.stroke(); } for (let y = 0; y <= E.H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(E.W, y); g.stroke(); }
    if (p.title) text(g, p.title, E.W / 2, E.H * 0.16, { size: 74, color: '#3a5a9a', font: FONTS.title });
    const n = p.steps.length, gap = Math.min(220, (E.H * 0.6) / n); p.steps.forEach((s, i) => { const at = p.at ? p.at[i] : (info.dur * 0.8) * i / n; const k = ease.outBack(prog(t, at, at + 0.4)); if (k <= 0) return; const y = E.H * 0.28 + i * gap;
      g.save(); g.translate(E.W / 2, y); g.scale(k, k); g.beginPath(); rr(g, -440, -70, 880, 140, 40); ob(g, '#ffffff'); circle(g, -360, 0, 50, '#ffd66e'); text(g, String(i + 1), -360, 4, { size: 60, color: '#3a5a9a', font: FONTS.title });
      const sz = Math.min(52, 640 / Math.max(1, measure(g, s, 52, FONTS.ui, 800) / 52)); text(g, s, 40, 4, { size: sz, color: '#3a3a5a', font: FONTS.ui, weight: 800 }); g.restore(); });
    if (p.c) drawChibi(g, { x: E.W * 0.82, y: E.H * 0.95, s: 1.6, char: C(p.c), pose: breathe(POSES.point, t, 1, 2), expr: 'smile', facing: -1, blink: blinkAt(t, 3) }); common(g, t, info, p); },
  end(g, t, info, p) { endQuestion(g, t, { question: p.question, cast: (p.cast || ['PHAOLO']).map(C) }); },
};

function drawShot(g, t, info) { const p = info.shot.params || {}; const fn = T[p.type || 'scene'] || T.scene; fn(g, t, info, p); }
export function autoRegister() {
  for (const s of E.shots) if (s.params && s.params.type) registerShot(s.id, { draw: drawShot });
  const cv = E.cfg.cover; if (cv) registerShot('cover', { draw(g) {
    blurLayer(g, 8, g => drawSet(g, 0, { z: 1.2 }, cv.set || 'churchInside', cv.setOpt)); veil(g, '#ffffff', 0.1);
    chibiClose(g, E.W / 2, E.H * 0.62, 360, { char: C(cv.c || 'PHAOLO'), expr: cv.expr || 'shocked', look: [0, -0.3] });
    if (cv.item) { g.save(); g.translate(E.W * 0.78, E.H * 0.9); g.scale(0.45, 0.45); drawItem(g, 1, cv.item, 0, 0); g.restore(); }
    emote(g, E.W / 2 + 380, E.H * 0.42, cv.emote || '?!', 1, 1.6);
    hook(g, 1, { kicker: cv.kicker || 'TẠI SAO', lines: cv.lines, y: E.H * 0.16, dur: 99 }); } });
}
export { CAST as SERIES_CAST, ITEMS };
