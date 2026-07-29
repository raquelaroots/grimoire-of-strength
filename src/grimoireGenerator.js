"use strict";

// Renders a parsed plan (see planParser.js) into the full Grimoire HTML page.
// Reuses grimoire-of-strength.html's original CSS verbatim; only the content
// blocks are generated from plan data. Wording that was hand-polished in the
// original static file (flavor phrases like "The Working Itself", moon-phase
// footers) is reproduced where it follows a simple, derivable rule; anything
// that was freely reworded by the original author is rendered from the raw
// plan text instead of guessed at, so output always matches the .md verbatim.

function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/[&<>"]/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]
  ));
}

function renderBulletList(items) {
  const lis = items.map((it) => (
    it.lead
      ? `<li><b>${escapeHtml(it.lead)}</b> ${escapeHtml(it.text)}</li>`
      : `<li>${escapeHtml(it.text)}</li>`
  )).join("\n    ");
  return `<ul class="simple">\n    ${lis}\n  </ul>`;
}

function renderTable(exercises) {
  const rows = exercises.map((ex) => (
    `<tr><td>${escapeHtml(ex.exercise)}</td><td>${escapeHtml(ex.reps)}</td><td>${escapeHtml(ex.notes)}</td></tr>`
  )).join("\n    ");
  return `<table class="spell">\n    <tr><th>Exercise</th><th>Reps / Time</th><th>Notes</th></tr>\n    ${rows}\n  </table>`;
}

function corners() {
  return `<div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>`;
}

function renderCoverPage(meta) {
  const rules = meta.generalRules.map((r) => escapeHtml(r)).join(" ");
  return `
<div class="page">
  ${corners()}
  <div class="eyebrow">Being a Compendium of</div>
  <h1 class="title">Grimoire of Strength</h1>
  <p class="subtitle">${escapeHtml(meta.title)}</p>

  <div class="divider"><div class="line"></div><div class="moons">☽ ✦ ☾</div><div class="line"></div></div>

  <div class="ex-libris">
    <b>Frequency:</b> ${escapeHtml(meta.frequency)}<br>
    <b>Variety:</b> ${escapeHtml(meta.variety)}<br>
    <b>Complements:</b> ${escapeHtml(meta.complement)}<br>
    <b>Goals:</b> ${escapeHtml(meta.goals)}<br>
    <b>Hernia-safe:</b> ${escapeHtml(meta.herniaSafe)}
  </div>

  <div class="warning-seal">
    <b>A Word of Caution</b> &mdash; before beginning this rite, consult a healer (physician or physical therapist) familiar with your hernia. ${rules}
  </div>

  <div class="footer-mark">✦ turn the page to begin the first working ✦</div>
</div>`;
}

function renderWorkoutPage(workout) {
  const moonPhase = workout.week === "A" ? "Waxing Moon" : "Waning Moon (Alternate)";
  const footerGlyph = workout.week === "A" ? "☽" : "☾";
  const workingLabel = workout.number === 1 ? "First" : "Second";
  const circuitHeading = workout.number === 1
    ? `The Working Itself (${workout.circuit.duration})`
    : `${workout.circuit.title} (${workout.circuit.duration})`;

  const noteLine = workout.note
    ? `<p style="text-align:center; font-style:italic; font-size:14px; color:var(--sage); margin-top:-8px;">${escapeHtml(workout.note)}</p>`
    : "";

  const roundsNote = workout.circuit.roundsNote
    ? `<p class="rounds-note">${escapeHtml(workout.circuit.roundsNote)}</p>`
    : "";

  const mobilitySection = workout.mobilityFlow
    ? `
  <h3 class="rite"><span class="glyph">✦</span> Mobility Flow (${escapeHtml(workout.mobilityFlow.duration)})</h3>
  ${renderBulletList(workout.mobilityFlow.items)}
`
    : "";

  return `
<div class="page">
  ${corners()}

  <h2 class="working">${workingLabel} Working &mdash; Week ${workout.week}</h2>
  <p class="working-sub">${moonPhase} &middot; ${escapeHtml(workout.title)} &middot; ${escapeHtml(workout.durationLabel)}</p>
  ${noteLine}

  <h3 class="rite"><span class="glyph">✦</span> Rite of Waking (Warm-up, ${escapeHtml(workout.warmup.duration)})</h3>
  ${renderBulletList(workout.warmup.items)}

  <h3 class="rite"><span class="glyph">✦</span> ${escapeHtml(circuitHeading)}</h3>
  ${roundsNote}
  ${renderTable(workout.circuit.exercises)}
  ${mobilitySection}
  <h3 class="rite"><span class="glyph">✦</span> Rite of Closing (Cool-down, ${escapeHtml(workout.cooldown.duration)})</h3>
  ${renderBulletList(workout.cooldown.items)}

  <div class="footer-mark">✦ ${footerGlyph} ✦</div>
</div>`;
}

function renderClosingPage(optionalSession, progression) {
  const optionalItems = optionalSession ? renderBulletList(optionalSession.items) : "";
  const description = optionalSession && optionalSession.description
    ? `<p style="text-align:center; font-style:italic; font-size:14.5px; color:#3a2a35; margin-top:-6px;">${escapeHtml(optionalSession.description)}</p>`
    : "";
  const progressionItems = progression.map((p) => `<li>${escapeHtml(p)}</li>`).join("\n    ");

  return `
<div class="page">
  ${corners()}

  <h2 class="working">The Quick Charm</h2>
  <p class="working-sub">${optionalSession ? escapeHtml(optionalSession.title) : "Optional Session"} &middot; ${optionalSession ? escapeHtml(optionalSession.duration) : ""}</p>
  ${description}

  <div style="margin-top:18px;">${optionalItems}</div>

  <div class="divider"><div class="line"></div><div class="moons">☽ ✦ ☾</div><div class="line"></div></div>

  <h3 class="rite" style="border:none; justify-content:center;"><span class="glyph">✦</span> On the Growth of Power <span class="glyph">✦</span></h3>
  <ul class="simple">
    ${progressionItems}
  </ul>

  <div class="footer-mark">✦ so mote it be ✦</div>
</div>`;
}

const STYLE_BLOCK = `
  :root{
    --ink:#241521;
    --parchment:#efe3c4;
    --parchment-dark:#e5d5ab;
    --burgundy:#6c1f3c;
    --gold:#a9822f;
    --sage:#5c6b45;
    --line: rgba(36,21,33,0.25);
  }

  *{box-sizing:border-box;}

  body{
    margin:0;
    padding:40px 16px;
    background: #1b1017;
    background-image:
      radial-gradient(circle at 20% 10%, rgba(169,130,47,0.08), transparent 40%),
      radial-gradient(circle at 80% 90%, rgba(108,31,60,0.15), transparent 45%);
    font-family:'EB Garamond', serif;
    color:var(--ink);
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }

  .print-bar{
    max-width:800px;
    margin:0 auto 20px;
    text-align:right;
  }
  .print-bar button{
    font-family:'EB Garamond',serif;
    font-size:14px;
    letter-spacing:0.08em;
    text-transform:uppercase;
    background:var(--burgundy);
    color:var(--parchment);
    border:1px solid var(--gold);
    padding:10px 20px;
    border-radius:2px;
    cursor:pointer;
  }
  .print-bar button:hover{ background:#83254a; }

  .page{
    position:relative;
    max-width:800px;
    margin:0 auto 40px;
    background:
      linear-gradient(var(--parchment), var(--parchment)),
      repeating-linear-gradient(0deg, rgba(108,31,60,0.02) 0 2px, transparent 2px 4px);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 25px 60px rgba(0,0,0,0.55);
    padding:56px 54px 48px;
    border:1px solid var(--gold);
    outline: 1px solid rgba(36,21,33,0.5);
    outline-offset: -8px;
  }

  .corner{
    position:absolute;
    width:34px; height:34px;
    border: 2px solid var(--gold);
    opacity:0.8;
  }
  .corner.tl{ top:10px; left:10px; border-right:none; border-bottom:none; }
  .corner.tr{ top:10px; right:10px; border-left:none; border-bottom:none; }
  .corner.bl{ bottom:10px; left:10px; border-right:none; border-top:none; }
  .corner.br{ bottom:10px; right:10px; border-left:none; border-top:none; }

  .eyebrow{
    text-align:center;
    letter-spacing:0.35em;
    text-transform:uppercase;
    font-size:12px;
    color:var(--burgundy);
    margin-bottom:6px;
  }

  h1.title{
    font-family:'UnifrakturMaguntia', cursive;
    font-weight:400;
    text-align:center;
    font-size:52px;
    color:var(--ink);
    margin:6px 0 4px;
    text-shadow: 1px 1px 0 rgba(169,130,47,0.4);
  }

  .subtitle{
    text-align:center;
    font-style:italic;
    font-size:19px;
    color:#3a2a35;
    margin:0 0 22px;
  }

  .divider{
    display:flex;
    align-items:center;
    justify-content:center;
    gap:14px;
    margin:22px 0 26px;
    color:var(--gold);
  }
  .divider .line{
    height:1px;
    width:120px;
    background:linear-gradient(to right, transparent, var(--gold), transparent);
  }
  .divider .moons{
    font-size:15px;
    letter-spacing:6px;
  }

  .ex-libris{
    border:1px solid var(--line);
    background:rgba(169,130,47,0.06);
    padding:16px 20px;
    font-size:15px;
    line-height:1.65;
    margin:26px 0;
  }
  .ex-libris b{ color:var(--burgundy); }

  h2.working{
    font-family:'Cormorant Garamond', serif;
    font-weight:700;
    font-size:30px;
    color:var(--burgundy);
    text-align:center;
    margin:0 0 2px;
    letter-spacing:0.02em;
  }
  .working-sub{
    text-align:center;
    font-size:14px;
    letter-spacing:0.15em;
    text-transform:uppercase;
    color:var(--sage);
    margin-bottom:22px;
  }

  h3.rite{
    font-family:'Cormorant Garamond', serif;
    font-size:20px;
    font-weight:600;
    color:var(--ink);
    border-bottom:1px solid var(--line);
    padding-bottom:6px;
    margin:26px 0 12px;
    display:flex;
    align-items:baseline;
    gap:10px;
  }
  h3.rite .glyph{ color:var(--gold); font-size:16px; }

  ul.simple{ margin:0; padding-left:22px; line-height:1.75; font-size:16px;}
  ul.simple li{ margin-bottom:4px; }

  table.spell{
    width:100%;
    border-collapse:collapse;
    margin-top:6px;
    font-size:15.5px;
  }
  table.spell th{
    text-align:left;
    font-family:'Cormorant Garamond',serif;
    font-size:13px;
    letter-spacing:0.1em;
    text-transform:uppercase;
    color:var(--burgundy);
    border-bottom:1px solid var(--gold);
    padding:6px 8px;
  }
  table.spell td{
    padding:9px 8px;
    border-bottom:1px solid var(--line);
    vertical-align:top;
    line-height:1.5;
  }
  table.spell td:first-child{
    font-weight:600;
    width:34%;
  }
  table.spell td:nth-child(2){
    width:16%;
    color:var(--burgundy);
    font-style:italic;
    white-space:nowrap;
  }
  table.spell tr:last-child td{ border-bottom:none; }

  .note-box{
    margin-top:22px;
    border-left:3px solid var(--sage);
    padding:10px 16px;
    background:rgba(92,107,69,0.08);
    font-size:14.5px;
    line-height:1.6;
    font-style:italic;
    color:#2f2b26;
  }

  .rounds-note{
    text-align:center;
    font-size:14px;
    font-style:italic;
    color:var(--sage);
    margin:-4px 0 4px;
  }

  .footer-mark{
    text-align:center;
    margin-top:34px;
    font-size:12px;
    letter-spacing:0.25em;
    text-transform:uppercase;
    color:var(--gold);
  }

  .warning-seal{
    margin-top:28px;
    border:1px dashed var(--burgundy);
    padding:14px 18px;
    font-size:13.5px;
    line-height:1.6;
    color:var(--burgundy);
    background:rgba(108,31,60,0.05);
  }
  .warning-seal b{ text-transform:uppercase; letter-spacing:0.08em; }

  @media print{
    body{ background:var(--parchment); padding:0; }
    .print-bar{ display:none; }
    .page{
      box-shadow:none;
      border:none;
      outline:none;
      margin:0 auto;
      max-width:none;
      width:100%;
      page-break-after:always;
    }
    .page:last-child{ page-break-after:auto; }
  }

  @page{
    size: letter;
    margin: 0.35in;
  }
`;

function generateGrimoireHTML(plan) {
  const pages = [renderCoverPage(plan.meta)]
    .concat(plan.workouts.map(renderWorkoutPage))
    .concat([renderClosingPage(plan.optionalSession, plan.progression)])
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Grimoire of Strength</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>${STYLE_BLOCK}</style>
</head>
<body>

<div class="print-bar"><button onclick="window.print()">🕯 Print this Grimoire</button></div>
${pages}

</body>
</html>
`;
}

module.exports = { generateGrimoireHTML };
