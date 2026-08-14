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

async function renderHomeVideos() {
  const heroEl = document.getElementById("hero");
  const clipsEl = document.getElementById("clips");
  if (!heroEl && !clipsEl) return;

  const { hero, clips } = await fetch("data/clips.json").then((r) => r.json());

  if (heroEl && hero) {
    heroEl.innerHTML = `
      ${videoEmbed(hero.youtubeId, hero.title)}
      ${hero.title ? `<figcaption>${escapeHtml(hero.title)}</figcaption>` : ""}`;
  }

  if (!clipsEl) return;

  clipsEl.innerHTML = clips
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
      <div class="card player-card${p.guest ? " guest" : ""}">
        ${p.guest ? `<span class="guest-badge">Secret guest</span>` : ""}
        <img src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.name)}">
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.bio)}</p>
        <p class="quirk">${escapeHtml(p.quirk)}</p>
      </div>
    `
    )
    .join("");
}

const RATING_MAX = 5;
const DEFAULT_VIDEO_SLOTS = 3;

function formatRoundDate(iso) {
  if (!iso) return "";
  // Midday avoids the date sliding a day either way across time zones.
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// ISO dates compare correctly as plain strings, which sidesteps time zones.
function todayIso() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function roundStatus(iso) {
  if (!iso) return { label: "Coming up", className: "" };
  const today = todayIso();
  if (iso < today) return { label: "Played", className: " played" };
  if (iso === today) return { label: "Today", className: " today" };
  return { label: "Coming up", className: "" };
}

function ratingDots(value) {
  const filled = Math.round(value);
  let dots = "";
  for (let i = 1; i <= RATING_MAX; i += 1) {
    dots += `<span class="dot${i <= filled ? " on" : ""}"></span>`;
  }
  return `<span class="dots" role="img"
            aria-label="${value.toFixed(1)} out of ${RATING_MAX}">${dots}</span>`;
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function courseRatings(reviews) {
  const all = Object.values(reviews);
  return ["condition", "fun"].map((key) => ({
    key,
    label: key === "condition" ? "Condition" : "Fun",
    value: average(all.map((r) => r[key]).filter((v) => typeof v === "number")),
  }));
}

function holeTiles(course) {
  const title = (hole) => `${course.name} — hole ${hole.number}`;

  if (course.holes?.length) {
    return course.holes
      .map((hole) => {
        const meta = [
          hole.number != null ? `Hole ${escapeHtml(String(hole.number))}` : null,
          hole.par != null ? `Par ${escapeHtml(String(hole.par))}` : null,
        ]
          .filter(Boolean)
          .join(" &middot; ");
        return `
        <div class="hole">
          <h4>${meta || "Hole"}</h4>
          ${
            videoEmbed(hole.youtubeId, title(hole)) ||
            `<div class="hole-empty">Clip coming</div>`
          }
          ${hole.notes ? `<p>${escapeHtml(hole.notes)}</p>` : ""}
        </div>`;
      })
      .join("");
  }

  // No holes listed yet — show empty slots so it's obvious where clips land.
  const slots = course.videoSlots ?? DEFAULT_VIDEO_SLOTS;
  return Array.from(
    { length: slots },
    () => `
      <div class="hole placeholder">
        <h4>Hole &mdash;</h4>
        <div class="hole-empty">Clip after we play it</div>
      </div>`
  ).join("");
}

function reviewBlock(course, roster) {
  const reviews = course.reviews ?? {};
  const byName = new Map(
    Object.entries(reviews).map(([name, r]) => [name.trim().toLowerCase(), r])
  );

  const written = [];
  const waiting = [];
  for (const p of roster) {
    const r = byName.get(p.name.trim().toLowerCase());
    if (r) written.push({ name: p.name, ...r });
    else waiting.push(p.name);
  }

  if (!written.length) {
    return `<p class="note">No reviews yet — they land here once we've played it.</p>`;
  }

  const scoreLine = (r) =>
    ["condition", "fun"]
      .filter((k) => typeof r[k] === "number")
      .map(
        (k) =>
          `<span class="review-score">${
            k === "condition" ? "Condition" : "Fun"
          } ${r[k]}/${RATING_MAX}</span>`
      )
      .join("");

  return `
    <div class="review-list">
      ${written
        .map(
          (r) => `
        <div class="review">
          <div class="review-head">
            <strong>${escapeHtml(r.name)}</strong>
            ${scoreLine(r)}
          </div>
          ${r.thoughts ? `<p>${escapeHtml(r.thoughts)}</p>` : ""}
        </div>`
        )
        .join("")}
    </div>
    ${
      waiting.length
        ? `<p class="note">Still owing a review: ${waiting
            .map((n) => escapeHtml(n))
            .join(", ")}.</p>`
        : ""
    }`;
}

async function renderCourses() {
  const container = document.getElementById("courses");
  if (!container) return;

  const [data, roster] = await Promise.all([
    fetch("data/courses.json").then((r) => r.json()),
    fetch("data/players.json").then((r) => r.json()),
  ]);
  const courses = data.courses ?? [];

  container.innerHTML = courses
    .map((course) => {
      const ratings = courseRatings(course.reviews ?? {});
      const rated = ratings.filter((r) => r.value !== null);
      const status = roundStatus(course.roundDate);
      // The repo ships a placeholder SVG; rendering it nine times added nothing.
      const photo =
        course.photo && !course.photo.includes("placeholder")
          ? `<img src="${escapeHtml(course.photo)}" alt="${escapeHtml(
              course.name
            )}" class="course-photo">`
          : "";

      return `
      <article class="card course">
        ${photo}
        <div class="course-head">
          <div>
            <h3 class="course-name">${escapeHtml(course.name)}</h3>
            <p class="course-meta">
              ${escapeHtml(course.location)} &middot; ${escapeHtml(
        formatRoundDate(course.roundDate)
      )}${course.note ? ` &middot; ${escapeHtml(course.note)}` : ""}
            </p>
          </div>
          <span class="course-status${status.className}">${status.label}</span>
        </div>

        ${
          rated.length
            ? `<div class="course-ratings">
                 ${rated
                   .map(
                     (r) => `
                   <div class="rating">
                     <span class="rating-label">${r.label}</span>
                     ${ratingDots(r.value)}
                     <span class="rating-value">${r.value.toFixed(1)}</span>
                   </div>`
                   )
                   .join("")}
               </div>`
            : ""
        }

        <section class="course-section">
          <h4 class="section-label">Holes on film</h4>
          <div class="hole-list">${holeTiles(course)}</div>
        </section>

        <section class="course-section">
          <h4 class="section-label">Reviews</h4>
          ${reviewBlock(course, roster)}
        </section>
      </article>`;
    })
    .join("");
}

async function renderLeaderboard() {
  const scoreEl = document.getElementById("scores");
  const counterEl = document.getElementById("counters");
  if (!scoreEl && !counterEl) return;

  // The roster lives in players.json so names and the guest flag are stated
  // once; this file only holds each player's numbers, keyed by name.
  const [board, roster] = await Promise.all([
    fetch("data/leaderboard.json").then((r) => r.json()),
    fetch("data/players.json").then((r) => r.json()),
  ]);
  const { rounds, counters } = board;

  const entries = new Map(
    Object.entries(board.players ?? {}).map(([name, data]) => [
      name.trim().toLowerCase(),
      data,
    ])
  );

  // A player with no entry still gets a row; every cell just reads as unplayed.
  const players = roster.map((p) => {
    const entry = entries.get(p.name.trim().toLowerCase());
    entries.delete(p.name.trim().toLowerCase());
    return {
      name: p.name,
      guest: p.guest,
      scores: entry?.scores ?? {},
      counters: entry?.counters ?? {},
    };
  });

  // Leftovers mean a key here no longer matches anyone in players.json —
  // usually a rename or a typo, which would otherwise silently lose scores.
  for (const stale of entries.keys()) {
    console.warn(
      `leaderboard.json has scores for "${stale}", who isn't in players.json`
    );
  }

  const total = (p) =>
    rounds
      .map((r) => p.scores?.[r.id])
      .filter((s) => typeof s === "number")
      .reduce((a, b) => a + b, 0);

  const cell = (v) => (typeof v === "number" ? v : "—");

  const nameCell = (p) =>
    `<td>${escapeHtml(p.name)}${
      p.guest ? ` <span class="guest-tag">guest</span>` : ""
    }</td>`;

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
              ${nameCell(p)}
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
              ${nameCell(p)}
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
// Takes every container the renderer fills, so none of them stay silently blank.
function guard(render, ...containerIds) {
  render().catch((err) => {
    console.error(`${containerIds.join(" / ")} failed to render:`, err);
    for (const id of containerIds) {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = `<p class="note">Couldn't load this section — ${escapeHtml(
          err.message
        )}. Check the browser console.</p>`;
      }
    }
  });
}

guard(renderHomeVideos, "hero", "clips");
guard(renderPlayers, "players");
guard(renderCourses, "courses");
guard(renderLeaderboard, "scores", "counters");
