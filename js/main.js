function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// Accepts a bare 11-char ID or any YouTube URL pasted straight from the browser.
// Returns "" for empty values and the old placeholder, so callers can fall back.
function youtubeId(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "REPLACE_WITH_YOUTUBE_ID") return "";
  const fromUrl = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  if (fromUrl) return fromUrl[1];
  return /^[\w-]{11}$/.test(s) ? s : "";
}

function videoEmbed(raw, title) {
  const id = youtubeId(raw);
  if (!id) return "";
  return `<div class="video-embed">
            <iframe src="https://www.youtube-nocookie.com/embed/${id}"
              title="${escapeHtml(title ?? "Clip")}"
              allowfullscreen loading="lazy"></iframe>
          </div>`;
}

async function renderClips() {
  const container = document.getElementById("clips");
  if (!container) return;

  const { clips } = await fetch("data/clips.json").then((r) => r.json());

  container.innerHTML = clips
    .map((c) => {
      const embed = videoEmbed(c.youtubeId, c.title);
      const local = c.file
        ? `<video controls preload="metadata" playsinline>
             <source src="${escapeHtml(c.file)}" type="video/mp4">
             Your browser can't play this clip.
           </video>`
        : `<p class="note">No clip yet</p>`;
      return `
      <figure class="clip">
        ${embed || local}
        ${c.title ? `<figcaption>${escapeHtml(c.title)}</figcaption>` : ""}
      </figure>`;
    })
    .join("");
}

async function renderPlayers() {
  const container = document.getElementById("players");
  if (!container) return;

  const players = await fetch("data/players.json").then((r) => r.json());

  container.innerHTML = players
    .map(
      (p) => `
      <div class="card player-card">
        <img src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.name)}">
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.bio)}</p>
        <p class="quirk">${escapeHtml(p.quirk)}</p>
      </div>
    `
    )
    .join("");
}

async function renderCourses() {
  const container = document.getElementById("courses");
  if (!container) return;

  const courses = await fetch("data/courses.json").then((r) => r.json());

  container.innerHTML = courses
    .map(
      (course) => `
      <div class="card">
        <img src="${escapeHtml(course.photo)}" alt="${escapeHtml(course.name)}" class="course-photo">
        <h2 style="margin-top:0;">${escapeHtml(course.name)}</h2>
        <p>${escapeHtml(course.location)} &middot; ${escapeHtml(course.roundDate)}</p>
        <div class="hole-list">
          ${course.holes
            .map(
              (hole) => `
            <div class="hole">
              <h4>Hole ${hole.number} &middot; Par ${hole.par}</h4>
              <p>${escapeHtml(hole.notes)}</p>
              ${
                videoEmbed(hole.youtubeId, `${course.name} — hole ${hole.number}`) ||
                `<p class="note">No video yet</p>`
              }
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
    )
    .join("");
}

async function renderLeaderboard() {
  const scoreEl = document.getElementById("scores");
  const counterEl = document.getElementById("counters");
  if (!scoreEl && !counterEl) return;

  const data = await fetch("data/leaderboard.json").then((r) => r.json());
  const { rounds, counters, players } = data;

  const total = (p) =>
    rounds
      .map((r) => p.scores?.[r.id])
      .filter((s) => typeof s === "number")
      .reduce((a, b) => a + b, 0);

  const cell = (v) => (typeof v === "number" ? v : "—");

  if (scoreEl) {
    const roundTitle = (r) =>
      `${r.day} · ${r.tee} — ${r.course}${r.note ? `, ${r.note}` : ""}`;

    scoreEl.innerHTML = `
      <table class="leaderboard">
        <thead>
          <tr>
            <th>Player</th>
            ${rounds
              .map(
                (r, i) =>
                  `<th><abbr title="${escapeHtml(roundTitle(r))}">R${i + 1}</abbr></th>`
              )
              .join("")}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${players
            .map((p) => {
              const t = total(p);
              return `
            <tr>
              <td>${escapeHtml(p.name)}</td>
              ${rounds.map((r) => `<td>${cell(p.scores?.[r.id])}</td>`).join("")}
              <td>${t > 0 ? t : "—"}</td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>`;
  }

  if (counterEl) {
    // Highest count in each column gets the badge — ties all get one, zeroes never do.
    const best = Object.fromEntries(
      counters.map((c) => [
        c.id,
        Math.max(0, ...players.map((p) => p.counters?.[c.id] ?? 0)),
      ])
    );

    counterEl.innerHTML = `
      <table class="leaderboard counters">
        <thead>
          <tr>
            <th>Player</th>
            ${counters
              .map(
                (c) =>
                  `<th><abbr title="${escapeHtml(c.title)}">${escapeHtml(
                    c.icon
                  )} ${escapeHtml(c.label)}</abbr></th>`
              )
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${players
            .map(
              (p) => `
            <tr>
              <td>${escapeHtml(p.name)}</td>
              ${counters
                .map((c) => {
                  const v = p.counters?.[c.id] ?? 0;
                  const lead = v > 0 && v === best[c.id];
                  return `<td>${
                    lead ? `<span class="lead-badge">${v}</span>` : v
                  }</td>`;
                })
                .join("")}
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  }
}

// Surface failures on the page instead of leaving an empty section behind.
function guard(render, containerId) {
  render().catch((err) => {
    console.error(`${containerId} failed to render:`, err);
    const el = document.getElementById(containerId);
    if (el) {
      el.innerHTML = `<p class="note">Couldn't load this section — ${escapeHtml(
        err.message
      )}. Check the browser console.</p>`;
    }
  });
}

guard(renderClips, "clips");
guard(renderPlayers, "players");
guard(renderCourses, "courses");
guard(renderLeaderboard, "scores");
