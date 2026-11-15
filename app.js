/* Glute & Tone — 16-week, cycle-synced home-screen app. Data lives only on this phone (localStorage). */
const KEY = "evaapp.v1";
const DEFAULT = {
  profile: { age: 23, height: 162, startWeight: 45 },
  meas: [],
  periods: ["2026-10-25"],
  cycleLen: 30, periodLen: 5,
  start: "2026-11-16",
  logs: {}, habits: {}
};
let S = null;
try { S = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { S = null; }
if (!S || typeof S !== "object") S = JSON.parse(JSON.stringify(DEFAULT));
for (const k in DEFAULT) if (S[k] === undefined) S[k] = JSON.parse(JSON.stringify(DEFAULT[k]));
S.meas = S.meas || [];

function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Couldn't save. Storage is full or blocked."); } }
save();
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}

/* ---------- helpers ---------- */
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
const pad = n => String(n).padStart(2, "0");
const iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function parseD(s) { const p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function addD(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function dDiff(a, b) { return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5); }
function today() { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
const fmt = d => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const fmtY = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const DOWKEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const PROGRAM_DAYS = 112;
let toastT = null;
function toast(msg) { let t = document.querySelector(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); } t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2200); }

/* ---------- cycle ---------- */
function cycleLen() {
  const p = [...S.periods].sort(); const diffs = [];
  for (let i = 1; i < p.length; i++) { const x = dDiff(parseD(p[i - 1]), parseD(p[i])); if (x >= 20 && x <= 40) diffs.push(x); }
  if (!diffs.length) return S.cycleLen;
  const last = diffs.slice(-3); return Math.round(last.reduce((a, b) => a + b, 0) / last.length);
}
function phaseKey(day, len) {
  const pl = S.periodLen || 5, ov = len - 14;
  if (day <= pl) return "period"; if (day < ov - 1) return "foll"; if (day <= ov + 1) return "ovu"; if (day <= len - 5) return "lut"; return "late";
}
function cycleAt(date) {
  const ps = [...S.periods].sort(); if (!ps.length) return null;
  const len = cycleLen(); let base = ps[0];
  for (const p of ps) if (parseD(p) <= date) base = p;
  const n = dDiff(parseD(base), date); const day = ((n % len) + len) % len + 1;
  const cs = addD(parseD(base), Math.floor(n / len) * len); const k = phaseKey(day, len);
  return { day, len, k, ph: PH[k], cs };
}
function progWeek(date) { return Math.floor(dDiff(parseD(S.start), date) / 7) + 1; }
function inProgram(date) { const n = dDiff(parseD(S.start), date); return n >= 0 && n < PROGRAM_DAYS; }

/* ---------- home workouts after the gym membership ends ---------- */
if (!S.gymEnd) S.gymEnd = "2099-12-31";
Object.assign(EX, {
  marchwarm: { n: "Marching warm-up", s: "Gets your body warm without equipment.", how: ["March on the spot, lifting your knees to hip height, swinging your arms.", "Every 30 seconds switch to: arm circles, side steps, gentle torso turns.", "3–5 minutes, until you feel warm."], q: "low impact warm up" },
  sofahip: { n: "Hip thrust on the sofa", tag: ["back", "back-safe"], s: "Your home version of the hip thrust machine.", start: "Start: bodyweight. Later: a backpack with books on your hips", how: ["Sit on the floor with your upper back (just under the shoulder blades) against the edge of a sofa or bed.", "Feet flat, hip-width apart, knees bent. Chin tucked.", "Push through your heels and lift your hips until your body is straight from knees to shoulders. Squeeze 2 seconds.", "Lower slowly until your hips almost touch the floor."], avoid: ["Arching your lower back at the top. Ribs stay down.", "The sofa sliding: put it against a wall."], q: "hip thrust on couch" },
  slbridge: { n: "Single-leg glute bridge", tag: ["side", "hip-dip area"], s: "One-leg glute work for the side glutes, no equipment.", how: ["Lie on your back, knees bent, feet flat.", "Lift one foot and hold that knee toward your chest.", "Push through the heel of the other foot and lift your hips, keeping them level.", "Squeeze 1 second at the top, lower slowly. All reps one side, then the other."], avoid: ["Hips tilting to one side.", "Arching your lower back."], q: "single leg glute bridge" },
  frogpump: { n: "Frog pumps", s: "Fast glute burner with knees turned out. Very low TFL.", how: ["Lie on your back, put the soles of your feet together and let your knees fall open.", "Pull your heels toward your glutes.", "Push through the outside edges of your feet and lift your hips, squeezing hard.", "Lower and repeat quickly but controlled."], avoid: ["Arching your back at the top."], q: "frog pumps glutes" },
  sliderhc: { n: "Towel hamstring curl", tag: ["back", "back-safe"], s: "Firms the back of the thighs (cellulite area) at home.", how: ["Lie on your back on a smooth floor, heels on a towel (or socks), knees bent.", "Lift your hips into a bridge.", "Slowly slide your heels away until your legs are almost straight, keeping hips up.", "Pull your heels back in. Too hard? Lower your hips between reps."], avoid: ["Letting your hips drop and your back arch."], q: "towel hamstring curl" },
  kneepush: { n: "Push-up on knees", s: "Tones chest and the back of the arms with your bodyweight.", how: ["Hands a little wider than your shoulders, knees on a mat, body straight from head to knees.", "Tighten your belly and squeeze your glutes.", "Lower your chest toward the floor, elbows at about 45° from your body.", "Push back up."], avoid: ["Hips sagging. If your back hurts, do them against a kitchen counter instead."], q: "knee push ups" },
  bottlekick: { n: "Triceps kickback with water bottles", s: "Back of the upper arms. Use two full 1–1.5 L bottles.", how: ["Stand with feet hip-width, soft knees, lean forward slightly with a flat back.", "Elbows pinned at your sides, bent at 90°.", "Straighten your arms back until they're straight, squeeze the backs of your arms.", "Bend them back slowly."], avoid: ["Swinging the elbows.", "Rounding your back."], q: "tricep kickback" },
  proneyt: { n: "Floor Y and T raises", s: "Posture: strengthens the upper back without equipment.", how: ["Lie face down, forehead on a folded towel, legs relaxed on the floor.", "Y: arms stretched forward in a Y, thumbs up. Lift your arms a few centimetres by squeezing your shoulder blades. Hold 2 s.", "T: arms out to the sides like a T, thumbs up. Lift and hold 2 s.", "Alternate Y and T. Only the arms lift, never the legs."], avoid: ["Lifting your chest high or your legs (that strains the lower back)."], q: "prone y t raise" }
});
Object.assign(WORKS, { marchwarm: "Heart, whole body (warm-up)", sofahip: "Glute max (main); some hamstrings and gluteus medius", slbridge: "Glute max and gluteus medius (side glutes)", frogpump: "Glute max, especially with the knees turned out", sliderhc: "Hamstrings (back of the thighs) and glutes", kneepush: "Chest, triceps (back of the arms), core", bottlekick: "Triceps (back of the upper arm)", proneyt: "Middle and lower trapezius, rear shoulders (posture)" });
Object.assign(TIPS, { sofahip: "Back: brace first, ribs down. Lock out with your glutes, not your lower back.", slbridge: "Back: ribs down and hips level.", sliderhc: "Back: keep your hips up and belly tight.", proneyt: "Posture: shoulders down away from your ears, chin slightly tucked.", kneepush: "Back: belly tight so your hips don't sag." });
Object.assign(VIDEOS, {
  sofahip: [YT("RR0oZhhUVWo", "Get Strong with Emily"), YT("PCzON8KAV1A", "at home · Casey Shipp")],
  slbridge: [YT("9bl48SV62u4", "Doctor Jo, physical therapist")],
  frogpump: [YT("OCMhnXQFzCI", "Hailey Happens Fitness")],
  sliderhc: [YT("cjtsLDniFpk", "Gillian Gelinas")],
  kneepush: [YT("CbjT4e_BgAs", "Sami Leigh Fitness")],
  bottlekick: [YT("9pKPXi69uJs", "Krissy Cela (dumbbells: use water bottles)")],
  proneyt: [YT("Xgi0r1pYmvk", "Y raise · Doctor Jo, physical therapist"), YT("Yv6sUKOwOY8", "Y, T and more · Doctor Jo")],
  marchwarm: [YT("TkrmqzZ5UGI", "Lucy Wyndham-Read")]
});
const HOME = {
  mon: { t: "Monday · Home A", s: "Home · glutes + core + posture · ~45 min", gym: true, home: true, dow: 1, b: [
    { h: "Warm-up", t: "~10 min", warm: true, x: [["marchwarm", "4 min"], ["catcow", "8"], ["n9090", "8 / side"], ["cars", "5 / dir"], ["openbook", "8 / side"], ["bridge", "2 × 12", "30s"]] },
    { h: "1 · Glutes (mat)", t: "sets × reps · rest", x: [["clamshell", "3 × 20 / side", "30s"], ["sofahip", "4 × 12–15", "90s"], ["slbridge", "3 × 10 / side", "60s"], ["donkey", "3 × 20 / side", "30s"], ["frogpump", "2 × 20", "45s"]] },
    { h: "2 · Core + posture (mat)", t: "sets × reps · rest", x: [["deadbug", "3 × 10 / side", "30s"], ["birddog", "3 × 8 / side", "30s"], ["proneyt", "3 × 8", "45s"]] },
    DAYS.A[3]] },
  wed: { t: "Wednesday · Home B", s: "Home · back of legs + core + arms · ~45 min", gym: true, home: true, dow: 3, b: [
    { h: "Warm-up", t: "~10 min", warm: true, x: [["marchwarm", "4 min"], ["legswing", "12 / side"], ["wallhinge", "10"], ["rockback", "10 / side"], ["wallslide", "10 + 10"]] },
    { h: "1 · Glutes + hamstrings (mat)", t: "sets × reps · rest", x: [["sliderhc", "3 × 8–10", "60s"], ["slbridge", "3 × 12 / side", "60s"], ["donkey", "3 × 20 / side", "30s"], ["frogpump", "3 × 20", "45s"]] },
    { h: "2 · Core + arms (mat)", t: "sets × reps · rest", x: [["birddog", "3 × 8 / side", "30s"], ["sideplank", "3 × 30s / side", "30s"], ["kneepush", "3 × 6–10", "60s"]] },
    DAYS.B[3]] },
  fri: { t: "Friday · Home C", s: "Home · glutes + posture + arms · ~45 min", gym: true, home: true, dow: 5, b: [
    { h: "Warm-up", t: "~10 min", warm: true, x: [["marchwarm", "4 min"], ["childs", "8 + 30s"], ["n9090", "8 / side"], ["cars", "5 / dir"], ["wallslide", "10 + 10"], ["bridge", "2 × 10", "30s"]] },
    { h: "1 · Glutes (mat)", t: "sets × reps · rest", x: [["clamshell", "3 × 20 / side", "30s"], ["sofahip", "3 × 15", "90s"], ["slbridge", "3 × 12 / side", "60s"]] },
    { h: "2 · Core, posture + arms (mat)", t: "sets × reps · rest", x: [["curlup", "3 × 10 holds", "30s"], ["deadbug", "2 × 10 / side", "30s"], ["proneyt", "3 × 8", "45s"], ["bottlekick", "3 × 12–15", "45s"], ["kneepush", "2 × 6–10", "60s"]] },
    DAYS.C[3]] }
};
/* busy days (submissions etc.): no workout, habits only */
const BUSY_DEFAULT = ["2026-11-21", "2026-11-22", "2026-11-23", "2026-11-25", "2026-12-09", "2026-12-19", "2026-12-20", "2026-12-21", "2026-12-23", "2027-01-14", "2027-01-15", "2027-01-16", "2027-01-19"];
if (!Array.isArray(S.busy)) S.busy = BUSY_DEFAULT.slice();
if (!Array.isArray(S.deadlines)) S.deadlines = ["2026-11-23", "2026-12-21", "2027-01-16"];
function isDeadline(date) { return S.deadlines.includes(iso(date)); }
function isBusy(date) { return S.busy.includes(iso(date)); }
function busyPlan(date) { const name = date.toLocaleDateString("en-GB", { weekday: "long" }); const dl = isDeadline(date); return { t: name + (dl ? " · 📌 Submission day" : " · Busy day"), s: dl ? "Submission today: no workout. Good luck! Just tick your daily habits." : "No workout today. Just tick your daily habits.", b: [], busy: true, deadline: dl, lbl: dl ? "📌 Due" : "✕ Busy", dow: date.getDay() }; }
/* Each week Gym A, B and C go on their usual days (Mon, Wed, Fri). If one of those is a busy day,
   the workout moves to the nearest free day that week, avoiding back-to-back gym days where possible. */
const LETTERDAY = { A: "mon", B: "wed", C: "fri", D: "sat" };
const LETTERPREF = { A: 0, B: 2, C: 4, D: 5 };
function weekSched(monday) {
  const free = [0, 1, 2, 3, 4, 5, 6].map(i => !isBusy(addD(monday, i))); const at = {};
  for (const L of ["A", "B", "C"]) {
    let best = null, bs = 1e9;
    for (let i = 0; i < 7; i++) {
      if (!free[i] || at[i]) continue;
      let sc = Math.abs(i - LETTERPREF[L]) + (i < LETTERPREF[L] ? 0.5 : 0);
      if (at[i - 1] || at[i + 1]) sc += 2;
      if (sc < bs) { bs = sc; best = i; }
    }
    if (best !== null) at[best] = L;
  }
  if (free[5] && !at[5]) at[5] = "D";
  return at;
}
function planFor(date) {
  if (isBusy(date)) return busyPlan(date);
  const k = DOWKEY[date.getDay()]; const i = (date.getDay() + 6) % 7; const L = weekSched(addD(date, -i))[i];
  const name = date.toLocaleDateString("en-GB", { weekday: "long" });
  if (L) { const base = PLAN[LETTERDAY[L]]; if (LETTERDAY[L] === k) return base; return Object.assign({}, base, { t: name + " · Day " + L, moved: true, dow: date.getDay() }); }
  const base = PLAN[k];
  if (base.gym) return Object.assign({}, PLAN.thu, { t: name + " · Yoga + posture", s: "Home · yoga + posture · ~30 min. Your gym workout moved to another day this week.", lbl: "Yoga", dow: date.getDay() });
  return base;
}
function dayLabel(p) { if (p.lbl) return p.lbl; return p.gym ? (p.home ? "Home " : "Gym ") + p.t.slice(-1) : (p.dow === 4 ? "Rest" : (p.dow === 6 ? "Yoga" : "Splits")); }

/* ---------- 16-week progression ---------- */
const BLOCKS = [
  { w: [1, 2], name: "Learn", cap: 2, note: "Learn the moves: 2 sets of everything, light weights, 3–4 reps left in the tank. Watch the videos and focus on form." },
  { w: [3, 4], name: "Foundation", note: "Full sets now. Weights that leave 2 reps in the tank. Write everything down." },
  { w: [5, 8], name: "Build", note: "New this block: 4 sets of hip thrusts with a 2-second squeeze at the top, more reps on the mat exercises, and a weight on clamshells and donkey kicks." },
  { w: [9, 9], name: "Easy week", cap: 2, note: "Recovery week: same weights as last week but only 2 sets. Your body gets stronger while it rests." },
  { w: [10, 13], name: "Strength", note: "New this block: heavier weights with fewer reps on the glute machines and Romanian deadlifts. Add weight whenever the app tells you to. Optional, if you feel confident: try a light dumbbell Romanian deadlift instead of the Smith one, and ask the staff to check your form." },
  { w: [14, 16], name: "Shape", note: "New this block: higher reps with slow lowering (3 seconds down) for a full, rounded glute shape. Week 16 is your final check." }
];
const OVR = {
  Build: { htm: "4 × 10–12", bstance: "4 × 10–12 / side", smithrdl: "3 × 8–10", kickback: "3 × 15 / side", legcurl: "3 × 10–12", clamshell: "3 × 15 / side", donkey: "3 × 15 / side", deadbug: "3 × 10 / side", birddog: "3 × 8 / side", sideplank: "3 × 30–40s / side", curlup: "3 × 8 holds" },
  Strength: { htm: "4 × 6–10", slht: "3 × 8–10 / side", bstance: "4 × 8–10 / side", smithrdl: "4 × 8", kickback: "3 × 12 / side", legcurl: "3 × 8–12", cablerow: "3 × 8–12", closerow: "3 × 8–12", pulldown: "3 × 8–12", pushdown: "3 × 10–12", chestpress: "2 × 10–12", clamshell: "3 × 20 / side", donkey: "3 × 20 / side", deadbug: "3 × 12 / side", birddog: "3 × 10 / side", sideplank: "3 × 40s / side", curlup: "3 × 10 holds" },
  Shape: { sofahip: "4 × 15–20", slbridge: "3 × 15 / side", frogpump: "3 × 25", sliderhc: "3 × 10–12", kneepush: "3 × 8–12", bottlekick: "3 × 15", proneyt: "3 × 10", htm: "4 × 12–15", slht: "3 × 12–15 / side", bstance: "3 × 12–15 / side", smithrdl: "3 × 10–12", kickback: "4 × 15 / side", legcurl: "3 × 12–15", clamshell: "3 × 20 / side", donkey: "3 × 20 / side", deadbug: "3 × 12 / side", birddog: "3 × 10 / side", sideplank: "3 × 40s / side", curlup: "3 × 10 holds" }
};
const BLOCKCUE = {
  Build: { htm: "This block: squeeze 2 seconds at the top of every rep.", clamshell: "This block: rest a 2.5–5 kg plate on your top knee.", donkey: "This block: hold a light dumbbell behind your knee or use an ankle weight." },
  Strength: { htm: "This block: heavier. Pick a weight where 6–10 reps is hard.", smithrdl: "This block: heavier, 4 sets of 8. Back flat, every rep.", sideplank: "This block: if it's pain-free, try it with straight legs." },
  Shape: { sofahip: "This block: hold a backpack with books on your hips, 3 seconds down, 2-second squeeze.", slbridge: "This block: 3 seconds lowering.", htm: "This block: 3 seconds lowering + 2-second squeeze at the top.", smithrdl: "This block: 3 seconds on the way down.", slht: "This block: 3 seconds lowering.", bstance: "This block: 3 seconds lowering." }
};
const STEP = { htm: 5, slht: 5, bstance: 5, smithrdl: 5, legcurl: 2.5, kickback: 2.5, cablerow: 2.5, closerow: 2.5, pulldown: 2.5, pushdown: 2.5, chestpress: 2.5, facepull: 2.5, pullthrough: 2.5 };
function blockOf(week) { return BLOCKS.find(b => week >= b.w[0] && week <= b.w[1]) || BLOCKS[BLOCKS.length - 1]; }
function prescribe(id, baseSR, week) { const b = blockOf(week); return (OVR[b.name] && OVR[b.name][id]) || baseSR; }

/* ---------- daily cycle-based adjustments ---------- */
function dayMods(plan, week, ci) {
  const b = blockOf(week); let cap = b.cap || 99; const notes = []; let food = "";
  if (ci) {
    const d = ci.day;
    if (ci.k === "period") {
      food = "Iron day: have red meat today (burger, kıymalı makarna, bolognese or kıymalı yumurta). Keep çay away from meals. Don't skip meals (Gilbert's).";
      if (plan.gym && d <= 2) { cap = Math.min(cap, 2); notes.push(`Period day ${d}: lighter session. 2 sets per exercise and about 20% lighter than last time. If you have bad cramps, do Thursday's yoga class instead.`); }
      else if (plan.gym) notes.push(`Period day ${d}: normal sets. Go about 10% lighter if you feel low on energy.`);
      else if (plan.split && d <= 2) notes.push(`Period day ${d}: be gentle. Swap the deep split stretches for the yoga class if you feel crampy.`);
      else notes.push(`Period day ${d}: gentle movement helps cramps. Keep the walk easy.`);
    } else if (ci.k === "foll") {
      notes.push(plan.gym ? "Strong phase: try 1 more rep or the next weight on hip thrusts and Romanian deadlifts today." : "High-energy phase: a good time to push your split stretch a little further, gently.");
    } else if (ci.k === "ovu") {
      notes.push(plan.gym ? "Around ovulation: you're strong, but joints can be looser. Warm up fully and control every rep." : "Around ovulation: joints can be looser, so stretch slowly and don't force the split.");
    } else if (ci.k === "lut") {
      notes.push(plan.gym ? "Luteal phase: keep the same weights and focus on clean form." : "Luteal phase: steady and calm. Keep your stretches the same as last time.");
      food = "Hungrier? Good: add a snack like kaşarlı tost or yoğurt with walnuts. You're building.";
    } else {
      notes.push(plan.gym ? "Pre-period days: if you're tired, drop the last set of each exercise. That's completely fine." : "Pre-period days: you may feel stiffer and bloated. Gentle stretching only.");
      food = "Bloating and 1–2 kg of water are normal now, so ignore the scale this week. Keep eating regular meals.";
    }
  }
  return { cap, notes, food, block: b };
}

/* ---------- measurements ---------- */
/* dir: -1 = going down is good, 1 = going up is good, 0 = neutral */
const MEAS = [
  { g: "Body", k: "weight", n: "Weight", u: "kg", dir: 1, how: "Morning, after the toilet, before eating or drinking, in underwear. Same scale every time, on a hard floor (not carpet). Weight alone can mislead: muscle replaces fat, so trust the tape more." },
  { g: "Upper body", k: "bust", n: "Bust (fullest point)", u: "cm", dir: 0, how: "Wear a thin non-padded bra or nothing. Arms down. Tape around the fullest part of the bust and straight across the back. Don't squash." },
  { g: "Upper body", k: "ribcage", n: "Under the bust (ribcage)", u: "cm", dir: 0, how: "Directly under the bust, where a bra band sits. Tape level all the way round, breathe out normally." },
  { g: "Waist & belly", k: "waist", n: "Waist (narrowest point)", u: "cm", dir: 0, how: "Bend to one side: the crease that forms is your natural waist, usually 2–3 cm above the belly button. Stand straight, breathe out normally and measure at the end of the breath. Don't suck in. This tracks your small waist." },
  { g: "Waist & belly", k: "navel", n: "Belly button", u: "cm", dir: 0, how: "Tape straight across the middle of your belly button, level all the way round your back. Relaxed belly, after a normal breath out. This is your main belly-fat number." },
  { g: "Waist & belly", k: "lowbelly", n: "Lower belly", u: "cm", dir: 0, how: "Measure about 5 cm (three fingers) below the belly button, level all the way round. Tracks the lower belly 'pouch'." },
  { g: "Hips & glutes", k: "hipdip", n: "Hip-dip line", u: "cm", dir: 1, how: "Feel the bony bump at the side of your upper thigh (the top of the thigh bone), roughly level with the bottom of your pubic bone. Measure all the way round at that height, feet together. As your side glutes grow, this should go UP." },
  { g: "Hips & glutes", k: "hips", n: "Hips (fullest part of glutes)", u: "cm", dir: 1, how: "Feet together. Stand side-on to a mirror and move the tape up and down until you find the fullest part of your glutes. Keep it level all the way round. This should go UP or stay the same as your glutes grow." },
  { g: "Legs", k: "thighTopR", n: "Inner/upper thigh, right (highest point)", u: "cm", dir: 0, how: "Stand with feet hip-width apart and weight on both legs, muscles relaxed. Slide the tape as high as it goes on the right thigh, right up into the groin and just under the glute crease. This tracks the inner thigh." },
  { g: "Legs", k: "thighTopL", n: "Inner/upper thigh, left (highest point)", u: "cm", dir: 0, how: "Same as the right side, on the left leg. Comparing both sides shows if one leg is different." },
  { g: "Legs", k: "knee", n: "Above the knee, right", u: "cm", dir: 0, how: "Measure around the leg about 5 cm (three fingers) above the top of the kneecap, leg straight and relaxed." },
  { g: "Legs", k: "calf", n: "Calf, right", u: "cm", dir: 0, how: "Stand with weight on both feet. Measure around the widest part of the calf." },
  { g: "Arms", k: "armR", n: "Upper inner arm, right", u: "cm", dir: 0, how: "Let the arm hang relaxed by your side, palm facing your leg. Find the softest, fullest part of the inner/back of the upper arm, about a third of the way down from the armpit to the elbow. Measure around the arm there, tape level. Don't flex." },
  { g: "Arms", k: "armL", n: "Upper inner arm, left", u: "cm", dir: 0, how: "Same as the right side, on the left arm, at the same height." }
];
/* migrate old keys from earlier versions */
S.meas.forEach(m => {
  if (m.belly != null && m.navel == null) { m.navel = m.belly; delete m.belly; }
  if (m.thigh != null && m.thighTopR == null) { m.thighTopR = m.thigh; delete m.thigh; }
  if (m.arm != null && m.armR == null) { m.armR = m.arm; delete m.arm; }
  if (m.armMidR != null && m.armR == null) m.armR = m.armMidR; if (m.armTop != null && m.armR == null) m.armR = m.armTop; if (m.armMidL != null && m.armL == null) m.armL = m.armMidL;
  delete m.armMidR; delete m.armTop; delete m.armMidL; delete m.midthigh;
});
function measureDays() {
  const out = []; const st = parseD(S.start);
  for (let i = 0; i < PROGRAM_DAYS; i++) {
    const d = addD(st, i);
    if (i === 0) { out.push(iso(d)); continue; }
    const ci = cycleAt(d); const last = parseD(out[out.length - 1]);
    if (ci && ci.day === 7 && dDiff(last, d) >= 14) out.push(iso(d));
  }
  return out;
}
function isMeasureDay(dIso) { return measureDays().includes(dIso); }
function measForm(dIso, prefix) {
  const cur = S.meas.find(m => m.d === dIso) || {};
  const groups = [...new Set(MEAS.map(m => m.g))];
  return groups.map(g => `<div class="mgroup">${esc(g)}</div><div class="mgrid">${MEAS.filter(m => m.g === g).map(m => `<label class="field">${esc(m.n)} (${m.u})<input type="number" inputmode="decimal" step="${m.k === "weight" ? "0.1" : "0.5"}" id="${prefix}-${m.k}" value="${cur[m.k] != null ? esc(cur[m.k]) : ""}"></label>`).join("")}</div>`).join("") + `
  <button type="button" class="btn" data-msave="${dIso}" data-prefix="${prefix}" style="margin-top:10px">Save measurements</button>`;
}

/* ---------- exercise rows with logging ---------- */
function parseSR(sr) {
  const m = String(sr).match(/^(\d+)\s*×\s*(.+)$/); if (!m) return null;
  const target = m[2]; const r = target.match(/(\d+)\s*[–-]\s*(\d+)/);
  const top = r ? +r[2] : (target.match(/^(\d+)/) ? +target.match(/^(\d+)/)[1] : null);
  return { sets: +m[1], target, top, secs: /\d+s\b/.test(target) };
}
function dayLog(date, create) { if (!S.logs[date] && create) S.logs[date] = { ex: {}, chk: {} }; return S.logs[date]; }
function lastFor(id, beforeIso) {
  const dates = Object.keys(S.logs).filter(d => d < beforeIso).sort().reverse();
  for (const d of dates) { const ex = S.logs[d].ex || {}; for (const k in ex) if (k.split(":")[1] === id && ex[k].some(s => s && s.r !== "" && s.r != null)) return { d, sets: ex[k], base: k }; }
  return null;
}
function suggestKg(id, last, p, baseSR) {
  if (!last) return null;
  const rs = last.sets.filter(s => s && s.r !== "" && s.r != null); const kgs = rs.map(s => parseFloat(s.k)).filter(x => !isNaN(x));
  if (!kgs.length) return null; const lastKg = Math.max(...kgs); const step = STEP[id] || 2.5;
  const lastP = parseSR(prescribe(id, baseSR, progWeek(parseD(last.d))));
  const hitTop = lastP && lastP.top && rs.length >= 2 && rs.every(s => +s.r >= lastP.top);
  const heavierBlock = lastP && p.top && p.top < lastP.top;
  const lighterBlock = lastP && p.top && p.top > lastP.top + 2;
  if (hitTop || heavierBlock) return { kg: lastKg + step, why: hitTop ? `You hit ${lastP.top} reps on every set last time.` : "New block with fewer reps: go a little heavier." };
  if (lighterBlock) return { kg: Math.max(0, lastKg - step), why: "New block with more reps: go a little lighter." };
  return { kg: lastKg, why: "Same weight. Aim for 1 more rep than last time." };
}
function howHTML(id) {
  const e = EX[id];
  const steps = (e.how || []).map(s => `<li>${esc(s)}</li>`).join("");
  const avoid = e.avoid ? `<div class="avoid"><b>Avoid:</b><ul>${e.avoid.map(a => `<li>${esc(a).replace(/&lt;(\/?)b&gt;/g, "<$1b>")}</li>`).join("")}</ul></div>` : "";
  const vids = (VIDEOS[id] || []).map(v => `<a class="vid" href="${esc(v.u)}" target="_blank" rel="noopener">▶ ${esc(v.l)} ↗</a>`).join("");
  return `<details class="how"><summary>How to do it</summary><ol>${steps}</ol>${avoid}${vids}</details>`;
}
function setCount(block, item, week, cap) { if (block.warm) return 0; const p = parseSR(prescribe(item[0], item[1], week)); return p ? Math.min(p.sets, cap) : 0; }
function exRow(date, bi, block, item, week, cap) {
  const id = item[0], rest = item[2]; const e = EX[id]; if (!e) return "";
  const sr = block.warm ? item[1] : prescribe(id, item[1], week);
  const key = bi + ":" + id; const lg = S.logs[date] || { ex: {}, chk: {} };
  const tag = e.tag ? `<span class="tag ${e.tag[0]}">${esc(e.tag[1])}</span>` : "";
  const works = WORKS[id] ? `<span class="works"><b>Works:</b> ${esc(WORKS[id])}</span>` : "";
  const tip = (TIPS[id] ? `<span class="tip">${esc(TIPS[id])}</span>` : "") + (typeof ALT !== "undefined" && ALT[id] && !block.warm ? `<span class="alt">${esc(ALT[id])}</span>` : "");
  const bname = blockOf(week).name; const cue = !block.warm && BLOCKCUE[bname] && BLOCKCUE[bname][id] ? `<span class="cue">${esc(BLOCKCUE[bname][id])}</span>` : "";
  const p = !block.warm ? parseSR(sr) : null;
  const isMachine = /Machine/i.test(block.h);
  let logUI = "", done = false, startTxt = "";
  if (p) {
    const n = Math.min(p.sets, cap);
    const cur = (lg.ex || {})[key] || [];
    const last = lastFor(id, date);
    let lastTxt = "";
    if (last) {
      const rs = last.sets.filter(s => s && s.r !== "" && s.r != null); const kg = rs.map(s => s.k).filter(k => k !== "" && k != null);
      lastTxt = `<div class="last">Last time (${esc(fmt(parseD(last.d)))}): ${esc(rs.map(s => s.r).join(", "))} ${p.secs ? "sec" : "reps"}${kg.length ? " · " + esc(kg[kg.length - 1]) + " kg" : ""}</div>`;
    }
    const sug = isMachine ? suggestKg(id, last, p, item[1]) : null;
    if (sug) lastTxt += `<div class="up">Today: <b>${esc(sug.kg)} kg</b>. ${esc(sug.why)}</div>`;
    else if (isMachine && e.start) startTxt = `<span class="start">${esc(e.start)}</span>`;
    let rows = "";
    for (let i = 0; i < n; i++) {
      const s = cur[i] || {}; const lastS = last && last.sets[i] ? last.sets[i] : {};
      const kgPh = sug ? sug.kg + " kg" : (lastS.k ? lastS.k + " kg" : "kg");
      rows += `<div class="setrow"><input type="checkbox" aria-label="Set ${i + 1} done" data-k="${key}" data-i="${i}" data-f="d" ${s.d ? "checked" : ""}><label class="k">Set ${i + 1}</label>` +
        `<input type="number" inputmode="numeric" aria-label="Set ${i + 1} ${p.secs ? "seconds" : "reps"}" placeholder="${esc(lastS.r || (p.secs ? "sec" : "reps"))}" value="${esc(s.r || "")}" data-k="${key}" data-i="${i}" data-f="r">` +
        (isMachine ? `<input type="number" inputmode="decimal" step="0.5" aria-label="Set ${i + 1} kg" placeholder="${esc(kgPh)}" value="${esc(s.k || "")}" data-k="${key}" data-i="${i}" data-f="k">` : "<span></span>") + `</div>`;
    }
    done = cur.length >= n && cur.slice(0, n).every(s => s && s.d);
    logUI = `${lastTxt}<div class="sets">${rows}</div>`;
    var shownSR = n < p.sets ? `${n} × ${p.target}` : sr;
  } else {
    done = !!(lg.chk || {})[key];
    logUI = `<label class="single"><input type="checkbox" data-c="${key}" ${done ? "checked" : ""}> Done</label>`;
  }
  const srTxt = (typeof shownSR !== "undefined" && shownSR) ? shownSR : sr;
  return `<div class="ex${done ? " isdone" : ""}" data-row="${key}"><div class="exhead"><div class="n"><strong>${esc(e.n)}</strong>${tag}${works}<small class="s">${esc(e.s)}</small>${startTxt}${tip}${cue}</div><div class="sr">${esc(srTxt)}${rest ? `<span class="rest">rest ${esc(rest)}</span>` : ""}</div></div>${howHTML(id)}${logUI}</div>`;
}
function countProgress(dIso) {
  const date = parseD(dIso); const plan = planFor(date); const week = progWeek(date); const m = dayMods(plan, week, cycleAt(date));
  let total = 0, done = 0; const lg = S.logs[dIso] || { ex: {}, chk: {} };
  plan.b.forEach((b, bi) => {
    if (b.yoga) { total++; if ((lg.chk || {})[bi + ":yoga"]) done++; return; }
    b.x.forEach(item => {
      const key = bi + ":" + item[0]; const n = setCount(b, item, week, m.cap);
      if (n) { total += n; const cur = (lg.ex || {})[key] || []; for (let i = 0; i < n; i++) if (cur[i] && cur[i].d) done++; }
      else { total++; if ((lg.chk || {})[key]) done++; }
    });
  });
  if (isMeasureDay(dIso)) { total++; if (S.meas.some(x => x.d === dIso)) done++; }
  return { total, done };
}

/* ---------- views ---------- */
const HABITS = [["meals", "3 meals + 2 snacks"], ["protein", "90 g+ protein"], ["steps", "8–10k steps"], ["water", "2 L water"], ["iron", "Iron tablet"], ["vitd", "Vitamin D"], ["posture", "Posture breaks every 45 min"]];
function viewDay(dateIso) {
  const date = parseD(dateIso); const key = DOWKEY[date.getDay()]; const plan = planFor(date);
  const week = progWeek(date); const ci = cycleAt(date); const isToday = dateIso === iso(today());
  const m = dayMods(plan, week, ci); const pr = countProgress(dateIso); const inP = inProgram(date);
  const weekTxt = inP ? `Week ${week} of 16 · ${m.block.name}` : (week < 1 ? "Your plan starts Mon 16 Nov" : "16 weeks finished!");
  const hab = (S.habits[dateIso] || {});
  const measure = isMeasureDay(dateIso) ? `<div class="card mcard"><h3>📏 Measurement day</h3><p class="small">Do this first thing in the morning: after the toilet, before eating or drinking. Also take photos (front, side, back). See the <a href="#measure">Measure tab</a> for exactly where to measure.</p>${measForm(dateIso, "dm")}</div>` : "";
  const blockNote = plan.gym && inP && week === blockOf(week).w[0] ?`<div class="note accent"><strong>${esc(m.block.name)} block:</strong> ${esc(m.block.note)}</div>` : "";
  const brace = plan.gym ? `<details class="note warn"><summary><strong>Neck & posture reminders</strong> (tap)</summary><ul><li>Keep your neck long and in line with your spine in every exercise: no looking up at the ceiling, no pulling on your head.</li><li>Brace before every rep: breathe into your belly, then tighten.</li><li>Between sets, stand tall with shoulders down and back.</li><li>Stop anything that causes neck pain, dizziness or tingling in the arms.</li><li>Eat a meal 1–3 hours before training. Never train on an empty stomach (Gilbert's).</li><li>Before using a machine, check the pin, the cable and its clip, and that dumbbell screws are tight. Tell the attendant if anything is loose.</li><li><b>Pain rule:</b> mild (3/10 or less) and gone by tomorrow is OK. Sharp pain, pain down a leg, numbness or pain that grows means stop.</li></ul></details>` : "";
  const blocks = plan.b.map((b, bi) => {
    if (b.yoga) { const k = bi + ":yoga"; const dn = !!((S.logs[dateIso] || {}).chk || {})[k];
      return `<div class="block"><div class="block-h"><h3>Yoga class</h3><span class="t">pick one</span></div><div class="ex vlist${dn ? " isdone" : ""}" data-row="${k}"><small class="s">Gentle beginner classes, kind to your lower back.</small>${YOGA.map(v => `<a href="${esc(v.u)}" target="_blank" rel="noopener">▶ ${esc(v.l.replace("Watch the video · ", ""))} ↗</a>`).join("")}<label class="single"><input type="checkbox" data-c="${k}" ${dn ? "checked" : ""}> Done</label></div></div>`; }
    return `<div class="block${b.warm ? " warm" : ""}"><div class="block-h"><h3>${esc(b.h)}</h3><span class="t">${esc(b.t)}</span></div>${b.x.map(it => exRow(dateIso, bi, b, it, week, m.cap)).join("")}</div>`;
  }).join("");
  const ph = ci ? `<span class="chip ph-${ci.k}">Cycle day ${ci.day} · ${esc(ci.ph.n)}</span>` : "";
  return `<div class="top"><div class="datenav"><button type="button" data-go="${iso(addD(date, -1))}" aria-label="Previous day">‹</button><button type="button" data-go="${iso(addD(date, 1))}" aria-label="Next day">›</button></div>${isToday ? `<span class="pill">Today</span>` : `<button type="button" class="btn ghost" data-go="${iso(today())}">Go to today</button>`}</div>
  <div class="hero"><div class="small" style="color:#fff;opacity:.92">${esc(fmt(date))} · ${esc(weekTxt)}</div><h1>${esc(plan.t)}</h1><div class="sub">${esc(plan.s)}</div><div style="margin-top:8px">${ph}</div><div class="progress"><i id="pbar" style="width:${pr.total ? Math.round(pr.done / pr.total * 100) : 0}%"></i></div><div class="small" style="color:#fff;opacity:.92;margin-top:4px" id="ptxt">${pr.done} of ${pr.total} done</div></div>
  ${m.notes.length ? `<div class="note good"><strong>Today:</strong> ${m.notes.map(esc).join(" ")}</div>` : ""}
  ${m.food ? `<div class="note accent"><strong>Food today:</strong> ${esc(m.food)}</div>` : ""}
  ${dateIso === S.gymEnd && plan.gym && !plan.home ? `<div class="note accent"><strong>Last gym day!</strong> From Monday your Mon/Wed/Fri workouts are home mat workouts. Write down your best hip thrust weight today.</div>` : ""}
  ${plan.home ? `<div class="note accent"><strong>Home workout:</strong> same goals, no machines. Do the reps slowly and squeeze hard. To make it harder, add reps or put a backpack with books on your hips for the sofa hip thrust.</div>` : ""}
  ${plan.moved ? `<div class="note accent"><strong>Moved workout:</strong> this gym day moved here because of a busy day this week.</div>` : ""}
  ${plan.busy ? `<div class="note accent"><strong>Busy day: no workout.</strong> Focus on your deadline. Eat regular meals (Gilbert's), drink water, and take posture breaks while you work. Your workouts continue on the next training day.</div>` : ""}
  ${blockNote}${measure}
  <div class="card"><h3>Daily habits</h3><div class="habits">${HABITS.map(h => `<label class="chk"><input type="checkbox" data-h="${h[0]}" data-date="${dateIso}" ${hab[h[0]] ? "checked" : ""}>${esc(h[1])}</label>`).join("")}</div></div>
  ${brace}${blocks}`;
}
function viewCalendar() {
  const st = parseD(S.start); const end = addD(st, PROGRAM_DAYS - 1); const t = today(); const tI = iso(t); const md = measureDays();
  const before = t < st, after = t > end;
  const ref = before ? st : (after ? end : t); const rI = iso(ref);
  const wk = progWeek(ref); const b = blockOf(wk); const plan = planFor(ref); const ci = cycleAt(ref); const pr = countProgress(rI);
  const nextM = md.find(d => d >= tI);
  const label = dayLabel;
  let html = `<a class="here" href="#d-${rI}">
    <span class="small">${before ? "Your plan starts" : (after ? "Last day of your plan" : "You are here · today")}</span>
    <span class="hdate">${esc(ref.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }))}</span>
    <span class="hplan">${esc(label(plan))} · ${esc(plan.s.split(" · ").slice(1).join(" · ") || plan.s)}</span>
    <span class="hmeta">Week ${wk} of 16 · ${esc(b.name)}${ci ? ` · cycle day ${ci.day} (${esc(ci.ph.n)})` : ""}${md.includes(rI) ? " · 📏 measure today" : ""}</span>
    <span class="hgo">${pr.done ? `${pr.done} of ${pr.total} done · continue` : "Open this day"} →</span></a>
  ${nextM && nextM !== rI ? `<p class="small" style="margin:8px 0 0">📏 Next measurement: <b>${esc(fmt(parseD(nextM)))}</b></p>` : ""}
  <div class="card keybox"><b>How to read the calendar</b>
    <div class="keyrow"><span class="kc gymk">Gym A</span> gym days (A, B, C, and D = optional) · <span class="kc duek">📌 Due</span> submission day · <span class="kc busyk">Busy</span> no workout (before deadlines and busy days) · <span class="kc">Splits</span> <span class="kc">Yoga</span> <span class="kc">Rest</span> home days</div>
    <div class="keyrow">Colour = cycle phase: <span class="chip ph-period">Period</span><span class="chip ph-foll">Strong</span><span class="chip ph-ovu">Ovulation</span><span class="chip ph-lut">Luteal</span><span class="chip ph-late">Pre-period</span></div>
    <div class="keyrow">📏 measurement day · ✓ finished · • started · outlined = today</div></div>`;
  let m = new Date(st.getFullYear(), st.getMonth(), 1);
  while (m <= end) {
    const y = m.getFullYear(), mo = m.getMonth(); const days = new Date(y, mo + 1, 0).getDate();
    const lead = (new Date(y, mo, 1).getDay() + 6) % 7;
    html += `<h2>${esc(m.toLocaleDateString("en-GB", { month: "long", year: "numeric" }))}</h2><div class="calgrid"><div class="ch">Mon</div><div class="ch">Tue</div><div class="ch">Wed</div><div class="ch">Thu</div><div class="ch">Fri</div><div class="ch">Sat</div><div class="ch">Sun</div>`;
    for (let i = 0; i < lead; i++) html += `<span class="cell empty"></span>`;
    for (let dn = 1; dn <= days; dn++) {
      const d = new Date(y, mo, dn); const dI = iso(d);
      if (d < st || d > end) { html += `<span class="cell out"><span class="dn">${dn}</span></span>`; continue; }
      const p = planFor(d); const c = cycleAt(d); const pc = countProgress(dI);
      const mark = (md.includes(dI) ? "📏" : "") + (pc.total && pc.done >= pc.total ? "✓" : (pc.done ? "•" : ""));
      html += `<a href="#d-${dI}" class="cell ph-${c ? c.k : "none"}${dI === tI ? " istoday" : ""}${p.gym ? " gymcell" : ""}${p.busy ? " busycell" : ""}${p.deadline ? " duecell" : ""}" aria-label="${esc(fmt(d))}: ${esc(label(p))}${c ? ", cycle day " + c.day + ", " + esc(c.ph.n) : ""}"><span class="dn">${dn}</span><span class="ic">${esc(label(p))}</span><span class="mk">${mark}</span></a>`;
    }
    html += `</div>`;
    m = new Date(y, mo + 1, 1);
  }
  html += `<h2>The 16 weeks</h2><div class="card">${BLOCKS.map(bl => `<div class="phase"><div class="w">Week${bl.w[0] === bl.w[1] ? " " + bl.w[0] : "s " + bl.w[0] + "–" + bl.w[1]}</div><div><b>${esc(bl.name)}</b> · ${esc(fmt(addD(st, (bl.w[0] - 1) * 7)))} – ${esc(fmt(addD(st, bl.w[1] * 7 - 1)))}<br><span class="small">${esc(bl.note)}</span></div></div>`).join("")}</div>`;
  return html;
}
function viewMeasure() {
  const md = measureDays(); const t = iso(today()); const next = md.find(d => d >= t);
  const m = [...S.meas].sort((a, b) => a.d < b.d ? -1 : 1);
  const firstOf = k => { const r = m.find(x => x[k] != null); return r ? r[k] : null; };
  const lastOf = k => { const r = [...m].reverse().find(x => x[k] != null); return r ? r[k] : null; };
  const cards = MEAS.map(x => {
    const f = firstOf(x.k), l = lastOf(x.k); if (f == null) return "";
    const ch = Math.round((l - f) * 10) / 10; const good = x.dir === 0 || ch === 0 ? "" : ((ch * x.dir) > 0 ? "good" : "bad");
    return `<div class="li"><span>${esc(x.n)}</span><span class="mv"><span class="small">${esc(f)} → </span><b>${esc(l)} ${esc(x.u)}</b> <span class="delta ${good}">${m.length > 1 ? (ch > 0 ? "+" : "") + ch : ""}</span></span></div>`;
  }).join("");
  const whr = (r) => (r && r.waist && r.hips) ? Math.round(r.waist / r.hips * 100) / 100 : null;
  const wFirst = m.find(x => whr(x) != null), wLast = [...m].reverse().find(x => whr(x) != null);
  const whrCard = wFirst ? `<div class="li"><span><b>Waist-to-hip ratio</b><br><span class="small">waist ÷ hips, lower = curvier</span></span><span class="mv"><span class="small">${whr(wFirst)} → </span><b>${whr(wLast)}</b> <span class="delta ${whr(wLast) < whr(wFirst) ? "good" : (whr(wLast) > whr(wFirst) ? "bad" : "")}">${m.length > 1 && whr(wLast) !== whr(wFirst) ? (whr(wLast) > whr(wFirst) ? "+" : "") + Math.round((whr(wLast) - whr(wFirst)) * 100) / 100 : ""}</span></span></div>` : "";
  const sched = md.map((d, i) => { const did = S.meas.some(x => x.d === d); const ci = cycleAt(parseD(d)); return `<a href="#d-${d}"><span><b>${i === 0 ? "Start" : "Check " + i}</b> · ${esc(fmt(parseD(d)))}<br><span class="small">${ci ? "Cycle day " + ci.day : ""}${i === 0 ? " · your starting point" : " · just after your period, least water retention"}</span></span><span class="stat">${did ? "✓" : (d < t ? "missed" : "")}</span></a>`; }).join("");
  const rows = m.slice().reverse().map(r => `<tr><td>${esc(fmt(parseD(r.d)))}</td>${MEAS.map(c => `<td>${r[c.k] != null ? esc(r[c.k]) : "–"}</td>`).join("")}<td><button type="button" class="btn ghost" style="padding:2px 8px" data-delm="${r.d}" aria-label="Delete ${esc(r.d)}">✕</button></td></tr>`).join("");
  const groups = [...new Set(MEAS.map(x => x.g))];
  return `<h1>Measurements</h1>
  <div class="card"><div class="small">Next measurement</div><div style="font-family:var(--display);font-size:1.3rem;font-weight:700;color:var(--accent)">${next ? esc(fmt(parseD(next))) : "All done!"}</div><p class="small" style="margin:4px 0 0">Measurement days fall on cycle day 7, just after your period, when water retention is lowest, so every check compares fairly. If you log a period on a different date, they move automatically.</p></div>
  <h2>My progress</h2>${cards ? `<div class="list">${whrCard}${cards}</div><p class="small">Green = moving the way you want. Weight, hips and the hip-dip line should slowly go up; waist and belly should stay about the same.</p>` : `<p class="small">No measurements yet. Your first one is on ${esc(fmt(parseD(md[0])))}.</p>`}
  <h2>Schedule</h2><div class="list">${sched}</div>
  <h2>Add or edit measurements</h2><div class="card"><label class="field" style="max-width:200px">Date<input type="date" id="mdate" value="${esc(t)}"></label><p class="small" style="margin:6px 0 0">Leave a box empty if you skip it. Choosing a date you already saved loads those numbers so you can fix them.</p>${measForm("__pick__", "mm")}</div>
  <h2>How to measure</h2>
  <div class="note accent"><strong>Rules for every check</strong><ul><li>Morning, after the toilet, before eating or drinking.</li><li>Underwear only, standing relaxed, feet together, looking straight ahead.</li><li>Soft tape measure, snug on the skin but not pressing in.</li><li>Keep the tape level all the way round. Check in a mirror, or ask someone to help with the back.</li><li>Measure each spot twice. If they differ by more than 0.5 cm, do a third and use the middle number.</li><li>The first time, mark tricky spots (mid-thigh, above the knee) with a pen and note the distance from a landmark, so you measure the same place every time.</li><li>Photos the same day: front, side and back, same light, outfit and distance.</li></ul></div>
  ${groups.map(g => `<h3 style="margin-top:14px">${esc(g)}</h3>` + MEAS.filter(x => x.g === g).map(x => `<details class="card"><summary><b>${esc(x.n)}</b></summary><p style="margin:8px 0 0">${esc(x.how)}</p></details>`).join("")).join("")}
  <h2>All entries</h2>${m.length ? `<div class="card scroll"><table class="tbl"><thead><tr><th>Date</th>${MEAS.map(c => `<th>${esc(c.n.split(" (")[0])}</th>`).join("")}<th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="small">Nothing saved yet.</p>`}`;
}
function viewCycle() {
  const t = today(); const ci = cycleAt(t); const len = cycleLen(); let body = "";
  if (ci) {
    const next = addD(ci.cs, ci.len); const until = dDiff(t, next); const pl = S.periodLen || 5; const ov = ci.len - 14;
    const rows = [[1, pl, "period"], [pl + 1, ov - 2, "foll"], [ov - 1, ov + 1, "ovu"], [ov + 2, ci.len - 5, "lut"], [ci.len - 4, ci.len, "late"]].filter(r => r[1] >= r[0]);
    body = `<div class="card"><div class="small">Today · ${esc(fmt(t))}</div><div class="big">Day ${ci.day}</div><div style="margin-top:6px"><span class="chip ph-${ci.k}">${esc(ci.ph.n)}</span></div><p class="small" style="margin-top:6px">${esc(ci.ph.tip)}</p><p style="margin:0">Next period expected <b>${esc(fmt(next))}</b> (in ${until} day${until === 1 ? "" : "s"}).</p></div>
    <h2>This cycle</h2><div class="card">${rows.map(r => `<div class="phase${ci.day >= r[0] && ci.day <= r[1] ? " now" : ""}"><div class="w">Days ${r[0]}–${r[1]}</div><div><span class="chip ph-${r[2]}">${esc(PH[r[2]].n)}</span><br>${esc(fmt(addD(ci.cs, r[0] - 1)))} – ${esc(fmt(addD(ci.cs, r[1] - 1)))}</div></div>`).join("")}</div>`;
  }
  const list = [...S.periods].sort().reverse().map(p => `<div class="li"><span>${esc(fmtY(parseD(p)))}</span><button type="button" class="btn ghost" style="padding:4px 10px" data-delp="${p}" aria-label="Delete ${esc(p)}">Delete</button></div>`).join("");
  return `<h1>My cycle</h1>${body}
  <h2>Log a period</h2><p class="small">When your period starts, save the date. The whole 16-week calendar, daily tips and measurement days adjust automatically.</p><div class="row"><label class="field">Period started on<input type="date" id="pdate" value="${iso(t)}"></label><button type="button" class="btn" id="padd">Save</button></div>
  <h2>Period history</h2><div class="list">${list || `<div class="li">No periods logged yet</div>`}</div>
  <h2>Settings</h2><div class="row"><label class="field">Period length (days)<input type="number" inputmode="numeric" id="plen" value="${S.periodLen}"></label><label class="field">Cycle length if unknown<input type="number" inputmode="numeric" id="clen" value="${S.cycleLen}"></label><button type="button" class="btn ghost" id="csave">Save</button></div>
  <p class="small" style="margin-top:8px">Cycle length used now: <b>${len} days</b>. ${S.periods.length >= 2 ? "Calculated from your logged periods." : "After you log your next period, the app uses your real average."}</p>
  <div class="note warn"><strong>Warning sign:</strong> if your period becomes irregular or stops, you're eating too little. Make sure you eat enough every day and see a doctor.</div>`;
}
function viewOverview() {
  return `<h1>Overview</h1><p class="small">Ekin · beginner · 3–4 gym days · 16 weeks · ${esc(fmtY(parseD(S.start)))} – ${esc(fmtY(addD(parseD(S.start), PROGRAM_DAYS - 1)))}</p>
  <div class="stats"><div class="stat"><b>2,000–2,200</b><span>kcal per day</span></div><div class="stat"><b>90–110 g</b><span>protein per day</span></div><div class="stat"><b>8–10k</b><span>steps per day</span></div></div>
  <div class="note accent"><strong>Body recomposition, not weight loss.</strong> At 45 kg and 162 cm you're a little under a healthy weight and have very little fat, so there is nothing to lose. To build glutes you need a <b>small surplus</b>: about 200 kcal more than you burn. Expect slow gains (around +0.1–0.25 kg a week) that go to your glutes and muscle; legs, arms and waist stay toned, not bigger. Your abs will show as they get stronger. Talk to your doctor about a healthy weight for you too. Talk to your doctor about your weight goal too.</div>
  <div class="soft"><h3 style="color:var(--accent)">My goals</h3><ul class="clean"><li><b>Glutes (top priority):</b> grow, lift and shape them. Rounder, fuller projection, more upper-glute for a lifted look, and softer hip dips.</li><li><b>Waist & core:</b> defined, visible abs with a slim waist. Strong core without a bigger waist, and no oblique bulk.</li><li><b>Waist-to-hip ratio:</b> balanced and feminine (tracked in Measure).</li><li><b>Legs:</b> toned and sculpted without getting bigger. Glutes over quads.</li><li><b>Back & upper body:</b> defined and strong for posture and shoulder alignment, without width or bulk.</li><li><b>Overall:</b> lean, toned, functional strength, better flexibility, mobility and body control. Body recomposition, not weight loss.</li></ul>
  <h3 style="color:var(--accent);margin-top:10px">My rules</h3><ul class="clean"><li><b>Not muscular, no wide back:</b> rows and face pulls for posture, little lat work, light upper body</li><li><b>No boxy hips:</b> no abduction machine, side leg raises, lunges or split squats</li><li><b>No thick legs:</b> no squats, leg press or leg extensions</li><li><b>Slim waist:</b> abs that resist movement, no weighted twists, side bends or weighted side planks; small surplus from real food</li><li><b>Glutes over quads:</b> hip-dominant exercises, upper-glute focus, hip-dip work with low-TFL moves</li><li><b>Neck-safe:</b> neck long and neutral in every exercise, no crunches that pull on the head</li><li><b>Machines first:</b> weeks 1–9 use only machines, cables, the Smith machine, bands or bodyweight. From week 10, if you feel confident, you can try light free-weight versions (optional).</li><li>Order: warm-up → mat → machines → cool-down</li></ul></div>
  <h2>My week</h2><div class="list">${["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map(k => `<div class="li"><b class="${PLAN[k].gym ? "gymtxt" : ""}">${esc(PLAN[k].t)}</b><span class="small" style="text-align:right">${esc(PLAN[k].s)}</span></div>`).join("")}</div>
  <h2>How the 16 weeks get harder</h2><div class="card">${BLOCKS.map(b => `<div class="phase"><div class="w">Week${b.w[0] === b.w[1] ? " " + b.w[0] : "s " + b.w[0] + "–" + b.w[1]}</div><div><b>${esc(b.name)}</b><br><span class="small">${esc(b.note)}</span></div></div>`).join("")}</div>
  <div class="note accent"><strong>Weights:</strong> on machine exercises the app suggests today's weight from what you logged last time. If you did the top of the rep range on every set, it adds a step. Always choose good form over the number.</div>
  <h2>Posture & neck: a top priority</h2><ul class="clean"><li><b>Every day has posture work:</b> rows and face pulls on every gym day, wall slides in the warm-ups, upper-back extension and the doorway stretch in every cool-down, and a full posture routine on Tue, Thu and Sun.</li><li>Keep your neck long and in line with your spine in every exercise (loss of cervical lordosis). Green tips under the exercises remind you.</li><li><b>Studying:</b> screen or book at eye level (use a laptop stand or a pile of books), feet flat, back against the chair. Stand up and roll your shoulders back every 45 minutes (it's a daily habit to tick).</li><li><b>Phone:</b> lift it to eye level instead of looking down.</li><li><b>Check your progress:</b> on measurement days take a side photo standing relaxed. Over the weeks your ear, shoulder and hip should line up more.</li><li>Ask a physiotherapist which neck-specific exercises are right for you, and stop anything that causes neck pain, dizziness or tingling in the arms.</li></ul>
  <h2>How your cycle changes each day</h2><ul class="clean"><li><b>Period days 1–2:</b> gym days drop to 2 sets and about 20% lighter.</li><li><b>Days 3–5:</b> normal sets, a bit lighter if tired.</li><li><b>Strong phase:</b> push for an extra rep or weight.</li><li><b>Ovulation:</b> strong, but extra careful warm-up.</li><li><b>Luteal:</b> same weights, clean form.</li><li><b>Pre-period:</b> drop the last set if you're tired.</li></ul>
  <h2>Gym basics</h2><div class="gloss"><div><b>Rep</b>: one full movement.</div><div><b>Set</b>: reps in a row. "3 × 10" = 3 sets of 10.</div><div><b>Rest</b>: pause between sets.</div><div><b>/ side</b>: all reps on one side, then the other.</div><div><b>Reps left</b>: stop most sets when 1–3 more would be possible.</div><div><b>Weight</b>: move the pin, or add plates.</div></div>
  <p class="small">İTÜ doesn't publish its machine list, so every machine exercise has a <b>"No machine?"</b> alternative. Before using a machine, check the pin, cable and clips, and that dumbbell screws are tight; tell the attendant if anything is loose.</p>
  <h2>Busy days (no workout)</h2><p class="small">Deadlines and days you can't train. They stay in the calendar for your daily habits. Submission days: ${S.deadlines.map(x => esc(fmt(parseD(x)))).join(", ")}.</p>
  <div class="list">${[...S.busy].sort().map(b => `<div class="li"><span>${esc(fmtY(parseD(b)))}</span><button type="button" class="btn ghost" style="padding:4px 10px" data-delb="${b}" aria-label="Remove ${esc(b)}">Remove</button></div>`).join("") || `<div class="li">No busy days</div>`}</div>
  <div class="row" style="margin-top:8px"><label class="field">Add a busy day<input type="date" id="bdate"></label><button type="button" class="btn ghost" id="badd">Add</button></div>
  <h2>My details</h2><div class="card"><div class="row"><label class="field">Age<input type="number" inputmode="numeric" id="age" value="${esc(S.profile.age || "")}"></label><label class="field">Height (cm)<input type="number" inputmode="numeric" id="height" value="${esc(S.profile.height || "")}"></label><label class="field">Start weight (kg)<input type="number" inputmode="decimal" step="0.1" id="sweight" value="${esc(S.profile.startWeight || "")}"></label><input type="hidden" id="gymend" value="${esc(S.gymEnd)}"></div><button type="button" class="btn ghost" id="psave" style="margin-top:10px">Save details</button></div>
  <h2>Backup</h2><p class="small">Everything is saved only on this phone. Make a backup once a month and keep it in Files or iCloud Drive.</p>
  <div class="row"><button type="button" class="btn" id="exp">Save a backup</button><label class="btn ghost" for="imp">Restore a backup</label><input type="file" id="imp" accept="application/json,.json" hidden></div>
  <p class="small" style="margin-top:20px">General guidance, not medical advice. Follow your doctor's dosing for iron and vitamin D.</p>`;
}

/* ---------- food (Turkey, no fish, no protein powder) ---------- */
const RECIPES = {
  "Breakfasts": [
    { n: "Menemen + beyaz peynir", p: 24, k: 520, t: "15 min", ing: ["2–3 eggs", "1 green + 1 red pepper, 2 tomatoes", "1 tsp olive oil or butter, pul biber", "40 g beyaz peynir", "2 slices bread"], how: ["Soften the peppers in oil, add tomatoes and cook until saucy.", "Stir in the eggs until just set.", "Serve with peynir and bread."], tip: "Peppers and tomatoes = vitamin C, which helps you absorb iron." },
    { n: "Kaşarlı scrambled eggs on toast", p: 30, k: 560, t: "10 min", ing: ["3 eggs", "30 g kaşar, grated", "1 tsp butter", "2 slices bread", "Tomato and cucumber"], how: ["Melt the butter on low heat, add beaten eggs.", "Stir slowly; add the kaşar when almost set.", "Serve on toast with tomato and cucumber."] },
    { n: "Egg & cheese breakfast wrap", p: 25, k: 480, t: "10 min", ing: ["2 eggs", "1 tortilla (lavaş)", "30 g kaşar or beyaz peynir", "Tomato, a few lettuce leaves"], how: ["Make a thin omelette and put it on the tortilla.", "Add cheese, tomato and lettuce, roll it up.", "Toast it in the pan for 1 minute per side."], tip: "Easy to take with you to campus." },
    { n: "Turkish breakfast plate", p: 30, k: 620, t: "10 min", ing: ["2-egg omelette or sahanda yumurta", "60 g beyaz peynir or lor", "Olives, tomato, cucumber, pepper", "2 slices bread", "1 tsp honey or butter"], how: ["Cook the eggs.", "Plate everything up. Have çay after, not with, the meal."] },
    { n: "Oats with banana & peanut butter", p: 22, k: 620, t: "8 min", ing: ["60 g oats", "250 ml milk", "1 banana", "1 tbsp peanut butter", "Cinnamon"], how: ["Cook oats in milk for 4–5 min.", "Top with banana, peanut butter and cinnamon."] },
    { n: "Simit breakfast", p: 25, k: 620, t: "5 min", ing: ["1 simit", "2 eggs (any way)", "40 g beyaz peynir", "Tomato and cucumber"], how: ["Cook the eggs and plate everything."] }
  ],
  "Lunches": [
    { n: "Kıymalı makarna (pasta with beef mince)", p: 35, k: 700, t: "20 min", ing: ["100 g pasta (dry)", "120 g beef mince", "1 tbsp tomato paste or ½ can tomatoes", "Onion, salt, pul biber", "Grated kaşar or yogurt on top"], how: ["Boil the pasta.", "Brown the mince with onion, add tomato paste and a little pasta water.", "Mix with the pasta, top with cheese or yogurt."], tip: "Red meat = iron. Makes a great lunch box." },
    { n: "Homemade burger", p: 35, k: 700, t: "20 min", ing: ["130 g beef mince (shape a patty, salt + pepper)", "1 burger bun", "1 cheese slice", "Lettuce, tomato, pickles", "Side: salad or a few oven potatoes"], how: ["Shape the patty a bit wider than the bun.", "Pan-fry 4 min per side on medium-high heat; add the cheese for the last minute.", "Build the burger with lettuce, tomato and pickles."], tip: "Make 6 patties on Sunday and freeze them between baking paper." },
    { n: "Kıymalı tost + ayran", p: 30, k: 550, t: "10 min", ing: ["2 slices bread", "60 g cooked beef mince", "30 g kaşar", "1 ayran"], how: ["Fill the bread with mince and kaşar.", "Toast in a pan or toaster until golden."] },
    { n: "Chicken wrap", p: 38, k: 550, t: "15 min", ing: ["120 g chicken breast strips", "1 tortilla (lavaş)", "2 tbsp yogurt + garlic", "Lettuce, tomato, cucumber"], how: ["Pan-fry the chicken with paprika and salt, 8–10 min.", "Spread the garlic yogurt on the tortilla, add chicken and salad, roll up."] },
    { n: "Chicken & pepper pan with pasta", p: 45, k: 700, t: "25 min", ing: ["150 g chicken breast, cubed", "Peppers, onion, tomato", "1 tsp olive oil, cumin, pul biber", "80 g pasta (dry)"], how: ["Brown the chicken, add onion and peppers.", "Add tomato and spices, cook 10 min.", "Serve with the pasta."] },
    { n: "Lahmacun + ayran (treat)", p: 30, k: 700, t: "takeaway", ing: ["2 lahmacun", "Lots of parsley, onion, lemon", "1 ayran"], how: ["Squeeze lemon generously (vitamin C for the iron)."], tip: "Fine once a week." }
  ],
  "Dinners": [
    { n: "Mantı with garlic yogurt", p: 35, k: 750, t: "15 min with ready mantı", ing: ["250 g mantı", "150 g yogurt + 1 garlic clove", "1 tsp butter with pul biber and dried mint", "Extra: 40 g cooked beef mince on top"], how: ["Boil the mantı as on the pack.", "Top with garlic yogurt and the spiced butter.", "Add the extra mince for more protein."], tip: "Your favourite fits the plan: the yogurt and mince make it a proper muscle meal." },
    { n: "Spaghetti bolognese", p: 35, k: 700, t: "25 min, makes 3", ing: ["350 g beef mince", "1 onion, 2 garlic cloves", "1 can chopped tomatoes + 1 tbsp tomato paste", "Oregano, salt", "Spaghetti (90 g dry per portion)", "Grated cheese"], how: ["Brown the mince with onion and garlic.", "Add tomatoes, paste and oregano, simmer 15 min.", "Serve on spaghetti with cheese. Keep the rest for tomorrow."], tip: "Best iron meal: have it during and right after your period." },
    { n: "Easy pan köfte with potatoes", p: 35, k: 680, t: "25 min", ing: ["150 g beef mince", "Salt, cumin, pepper, a little grated onion", "2 potatoes in wedges (oven or air fryer)", "Salad with lemon"], how: ["Mix the mince with the spices and shape small flat köfte.", "Pan-fry 4–5 min per side.", "Air fry the potato wedges at 200°C for 18–20 min."] },
    { n: "Kıymalı yumurta + bread", p: 32, k: 550, t: "15 min", ing: ["100 g beef mince", "2 eggs", "1 pepper, 1 tomato", "Bread, yogurt"], how: ["Brown the mince with pepper and tomato.", "Make two holes and crack in the eggs; cover until set.", "Eat with bread and yogurt."], tip: "Eggs + red meat: protein and iron in one pan." },
    { n: "Creamy chicken & mushroom pasta", p: 40, k: 700, t: "25 min", ing: ["130 g chicken breast", "Mushrooms, garlic", "80 g pasta (dry)", "3 tbsp yogurt or light cream", "Grated cheese"], how: ["Pan-fry the chicken pieces, then the mushrooms and garlic.", "Off the heat stir in the yogurt or cream.", "Mix with the pasta and cheese."] },
    { n: "Beef & cheese quesadilla", p: 35, k: 650, t: "15 min", ing: ["100 g beef mince", "1 large tortilla", "40 g kaşar", "Peppers, onion", "Salsa or yogurt"], how: ["Brown the mince with peppers and onion.", "Put it on half the tortilla with the cheese, fold.", "Toast 2–3 min per side until the cheese melts."] },
    { n: "Patatesli yumurta", p: 22, k: 550, t: "20 min", ing: ["2 potatoes, small cubes", "3 eggs", "1 tsp olive oil or butter", "Salt, pul biber; yogurt on the side"], how: ["Fry the potato cubes until soft and golden (10–12 min).", "Add the eggs and stir until set.", "Serve with yogurt."] }
  ],
  "Snacks (to gain weight the healthy way)": [
    { n: "Nuts + dried apricots", p: 8, k: 300, ing: ["30 g walnuts or almonds", "5 dried apricots or 3 dates"] },
    { n: "Kaşarlı tost", p: 18, k: 350, ing: ["2 slices bread", "40 g kaşar", "Tomato"] },
    { n: "Yoğurt + honey + walnuts", p: 15, k: 280, ing: ["200 g yogurt", "1 tsp honey", "15 g walnuts"] },
    { n: "Banana peanut-butter milk", p: 15, k: 400, ing: ["300 ml milk", "1 banana", "1 tbsp peanut butter", "Blend"] },
    { n: "Ayran + half a simit", p: 12, k: 300, ing: ["1 large ayran", "½ simit"] },
    { n: "2 eggs + cucumber", p: 12, k: 160, ing: ["2 boiled eggs", "Cucumber, salt"] },
    { n: "Cheese, bread & grapes", p: 12, k: 300, ing: ["50 g beyaz peynir or kaşar", "1 slice bread", "A handful of grapes"] }
  ]
};
function recipeHTML(r) {
  return `<details class="card recipe"><summary><b>${esc(r.n)}</b><span class="small"> · ${r.p} g protein · ${r.k} kcal${r.t ? " · " + esc(r.t) : ""}</span></summary>
  <ul class="clean" style="margin-top:8px">${r.ing.map(i => `<li>${esc(i)}</li>`).join("")}</ul>${r.how ? `<ol class="clean">${r.how.map(i => `<li>${esc(i)}</li>`).join("")}</ol>` : ""}${r.tip ? `<p class="small" style="color:var(--sage);margin:0">${esc(r.tip)}</p>` : ""}</details>`;
}
function viewFood() {
  return `<h1>Food</h1>
  <p><b>Every day: 2,000–2,200 kcal and 90–110 g protein</b> (about 2 g per kg), spread over 3 meals and 2–3 snacks. This is a small surplus for <b>body recomposition</b>: building glutes and muscle while staying lean. If your weight goes down, or your hips don't grow in 4 weeks, add one more snack (+200–300 kcal).</p>
  <div class="stats"><div class="stat"><b>90–110 g</b><span>protein</span></div><div class="stat"><b>~280 g</b><span>carbs</span></div><div class="stat"><b>65–75 g</b><span>fat</span></div></div>
  <div class="note warn"><strong>Gilbert's syndrome:</strong> never skip meals or go long without food, and drink enough water. Fasting, dehydration, illness and your period can raise bilirubin (tiredness, slightly yellow eyes). It's harmless, but regular meals keep it low. Ask your doctor before any kind of fasting.</div>
  <h2>Build every plate</h2><div class="soft"><ul class="clean"><li><b>⅓ plate vegetables</b> (salad, peppers, spinach, eggplant)</li><li><b>⅓ plate protein</b>: beef mince, red meat, chicken, eggs, yogurt, cheese</li><li><b>⅓ plate carbs</b>: pasta, mantı, bread, potatoes, oats</li><li><b>Healthy fat</b> on top: olive oil, butter, nuts, cheese</li></ul></div>
  <h2>A typical day</h2><div class="card">
    <div class="meal"><span class="m">Breakfast</span><span class="k">~25 g · 550</span><small>Pick a breakfast</small></div>
    <div class="meal"><span class="m">Snack</span><span class="k">~8 g · 300</span><small>e.g. nuts + dried apricots</small></div>
    <div class="meal"><span class="m">Lunch</span><span class="k">~35 g · 650</span><small>Pick a lunch</small></div>
    <div class="meal"><span class="m">Snack</span><span class="k">~15 g · 300</span><small>e.g. yoğurt + walnuts</small></div>
    <div class="meal"><span class="m">Dinner</span><span class="k">~35 g · 650</span><small>Pick a dinner</small></div>
    <div class="total"><span>Total</span><span>~115 g · ~2,250 kcal</span></div></div>
  ${Object.entries(RECIPES).map(([g, list]) => `<h2>${esc(g)}</h2>${list.map(recipeHTML).join("")}`).join("")}
  <h2>Iron (very important for you)</h2><div class="card"><ul class="clean"><li><b>Red meat 3–4× a week</b> (burgers, kıymalı makarna, bolognese, kıymalı yumurta): the best-absorbed iron.</li><li>Eggs, spinach and legumes help too: eat them with <b>vitamin C</b> (lemon, peppers, tomato, orange).</li><li><b>Çay and coffee:</b> 1–2 hours away from meals and from your iron tablet. Tea with breakfast blocks a lot of iron.</li><li>Iron tablet with water or orange juice, away from milk, yogurt and cheese.</li><li>Recheck ferritin with your doctor after about 3 months.</li></ul></div>
  <h2>Vitamin D</h2><div class="card"><ul class="clean"><li>Take it with a meal that has fat (e.g. dinner).</li><li>At a different meal from your iron tablet.</li><li>Eggs and full-fat dairy have a little.</li></ul></div>
  <h2>Building without a wide belly</h2><div class="card"><ul class="clean"><li>More real food, not junk: extra bread, pasta, olive oil, nuts, peanut butter, cheese, milk.</li><li>Drink some calories: ayran, milk, banana milk.</li><li>Train 3–4× a week so the extra food becomes glutes and muscle.</li><li>Keep cardio to your steps; no long running.</li><li>Sweets and fried food once in a while is fine; not every day.</li></ul></div>
  <h2>Sunday meal prep</h2><div class="card"><ol class="clean"><li>Cook a big pot of bolognese sauce (3–4 portions).</li><li>Shape 6 burger patties and freeze them between baking paper.</li><li>Pan-fry 500 g chicken breast strips for wraps and pasta.</li><li>Wash and chop salad vegetables.</li><li>Boil a few eggs for snacks.</li></ol></div>
  <h2>Shopping list</h2><div class="card"><ul class="clean"><li><b>Protein:</b> dana kıyma, tavuk göğsü, eggs, yoğurt, süzme yoğurt, beyaz peynir, lor, kaşar, ayran, milk</li><li><b>Carbs:</b> pasta, spaghetti, ready mantı, burger buns, lavaş/tortillas, bread, oats, potatoes, simit</li><li><b>Veg & fruit:</b> peppers, tomatoes, cucumber, spinach, eggplant, onion, garlic, lemons, oranges, bananas, berries</li><li><b>Extras:</b> olive oil, butter, walnuts, almonds, dried apricots, dates, peanut butter, honey, salça, canned tomatoes, pickles, spices</li></ul></div>
  <h2>Gym days</h2><div class="note good"><strong>Before:</strong> a meal 1–3 hours earlier (e.g. menemen, oats or a tost). <strong>After:</strong> a proper meal with protein within 2 hours.</div>`;
}

/* ---------- router ---------- */
function route() {
  const h = (location.hash || "#cal").slice(1); const app = document.getElementById("app"); let nav = h;
  if (/^d-\d{4}-\d{2}-\d{2}$/.test(h)) { app.innerHTML = viewDay(h.slice(2)); nav = h.slice(2) === iso(today()) ? "today" : "cal"; }
  else if (h === "cal" || h === "") { app.innerHTML = viewCalendar(); nav = "cal"; }
  else if (h === "today") { const st = parseD(S.start); app.innerHTML = (today() < st ? `<div class="note accent"><strong>Your 16 weeks start ${esc(fmt(st))}.</strong> Here's your first day.</div>` : "") + viewDay(iso(today() < st ? st : today())); }
  else if (h === "measure") app.innerHTML = viewMeasure();
  else if (h === "cycle") app.innerHTML = viewCycle();
  else if (h === "overview") app.innerHTML = viewOverview();
  else if (h === "food") app.innerHTML = viewFood();
  else { app.innerHTML = viewCalendar(); nav = "cal"; }
  document.querySelectorAll("nav.bar a").forEach(a => { if (a.dataset.nav === nav) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
}
window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); });
/* the app always opens on the 16-week calendar */
if (!/^#d-/.test(location.hash) && location.hash !== "#cal") { try { history.replaceState(null, "", "#cal"); } catch (e) { location.hash = "cal"; } }

/* ---------- interactions ---------- */
function currentDayIso() { const h = location.hash.slice(1); return /^d-/.test(h) ? h.slice(2) : iso(today()); }
function refreshProgress() {
  const pr = countProgress(currentDayIso()); const b = document.getElementById("pbar"), t = document.getElementById("ptxt");
  if (b) b.style.width = (pr.total ? Math.round(pr.done / pr.total * 100) : 0) + "%"; if (t) t.textContent = pr.done + " of " + pr.total + " done";
  if (pr.total && pr.done === pr.total) toast("Day complete. Well done!");
}
function rowDoneState(key) {
  const lg = S.logs[currentDayIso()] || { ex: {}, chk: {} }; const row = document.querySelector(`[data-row="${CSS.escape(key)}"]`); if (!row) return;
  const boxes = row.querySelectorAll('input[data-f="d"]'); row.classList.toggle("isdone", boxes.length ? [...boxes].every(b => b.checked) : !!(lg.chk || {})[key]);
}
document.addEventListener("input", ev => {
  const el = ev.target; if (!el.dataset || !el.dataset.k || !(el.dataset.f === "r" || el.dataset.f === "k")) return;
  const lg = dayLog(currentDayIso(), true); const k = el.dataset.k, i = +el.dataset.i;
  lg.ex[k] = lg.ex[k] || []; lg.ex[k][i] = lg.ex[k][i] || {}; lg.ex[k][i][el.dataset.f] = el.value;
  if (el.dataset.f === "r" && el.value !== "") { lg.ex[k][i].d = true; const cb = document.querySelector(`input[data-k="${CSS.escape(k)}"][data-i="${i}"][data-f="d"]`); if (cb) cb.checked = true; }
  save(); rowDoneState(k); refreshProgress();
});
document.addEventListener("change", ev => {
  const el = ev.target; if (!el.dataset) return; const dIso = currentDayIso();
  if (el.dataset.k && el.dataset.f === "d") { const lg = dayLog(dIso, true); const k = el.dataset.k, i = +el.dataset.i; lg.ex[k] = lg.ex[k] || []; lg.ex[k][i] = lg.ex[k][i] || {}; lg.ex[k][i].d = el.checked; save(); rowDoneState(k); refreshProgress(); }
  else if (el.dataset.c) { const lg = dayLog(dIso, true); lg.chk[el.dataset.c] = el.checked; save(); rowDoneState(el.dataset.c); refreshProgress(); }
  else if (el.dataset.h) { const d = el.dataset.date; S.habits[d] = S.habits[d] || {}; S.habits[d][el.dataset.h] = el.checked; save(); }
  else if (el.id === "imp" && el.files && el.files[0]) {
    const r = new FileReader(); r.onload = () => { try { const o = JSON.parse(r.result); if (!o || !o.logs || !o.periods) throw 0; S = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), o); save(); route(); toast("Backup restored"); } catch (e) { toast("That file isn't a Tone backup"); } }; r.readAsText(el.files[0]);
  }
  else if (el.id === "mdate") { const cur = S.meas.find(m => m.d === el.value) || {}; MEAS.forEach(m => { const i = document.getElementById("mm-" + m.k); if (i) i.value = cur[m.k] != null ? cur[m.k] : ""; }); }
});
document.addEventListener("click", async ev => {
  const el = ev.target.closest("button"); if (!el) return;
  if (el.dataset.go) { location.hash = el.dataset.go === iso(today()) ? "today" : "d-" + el.dataset.go; return; }
  if (el.dataset.msave) {
    const d = el.dataset.msave === "__pick__" ? (document.getElementById("mdate").value || iso(today())) : el.dataset.msave; const pre = el.dataset.prefix; const e = { d };
    MEAS.forEach(m => { const v = document.getElementById(pre + "-" + m.k).value; if (v !== "") e[m.k] = +v; });
    if (Object.keys(e).length < 2) { toast("Enter at least one number"); return; }
    S.meas = S.meas.filter(x => x.d !== d); S.meas.push(e); save(); toast("Measurements saved"); if (pre === "dm") refreshProgress(); else route(); return;
  }
  if (el.id === "padd") { const v = document.getElementById("pdate").value; if (!v) return; if (!S.periods.includes(v)) S.periods.push(v); save(); route(); toast("Period saved. Your calendar has been updated."); }
  else if (el.id === "badd") { const v = document.getElementById("bdate").value; if (!v) return; if (!S.busy.includes(v)) S.busy.push(v); save(); route(); toast("Busy day added"); }
  else if (el.dataset.delb) { S.busy = S.busy.filter(b => b !== el.dataset.delb); save(); route(); }
  else if (el.dataset.delp) { S.periods = S.periods.filter(p => p !== el.dataset.delp); save(); route(); }
  else if (el.id === "csave") { const pl = +document.getElementById("plen").value, cl = +document.getElementById("clen").value; if (pl >= 2 && pl <= 10) S.periodLen = pl; if (cl >= 20 && cl <= 40) S.cycleLen = cl; save(); route(); toast("Saved"); }
  else if (el.id === "psave") { const a = +document.getElementById("age").value, h = +document.getElementById("height").value, w = +document.getElementById("sweight").value; if (a) S.profile.age = a; if (h) S.profile.height = h; if (w) S.profile.startWeight = w; const ge = document.getElementById("gymend").value; if (ge) S.gymEnd = ge; save(); toast("Details saved"); }
  else if (el.dataset.delm) { S.meas = S.meas.filter(x => x.d !== el.dataset.delm); save(); route(); }
  else if (el.id === "exp") {
    const txt = JSON.stringify(S); const name = "tone-backup-" + iso(today()) + ".json";
    try { const f = new File([txt], name, { type: "application/json" }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: "Tone backup" }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "application/json" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
});
route();
