function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
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
                hole.youtubeId && hole.youtubeId !== "REPLACE_WITH_YOUTUBE_ID"
                  ? `<div class="video-embed">
                       <iframe src="https://www.youtube.com/embed/${escapeHtml(hole.youtubeId)}"
                         allowfullscreen loading="lazy"></iframe>
                     </div>`
                  : `<p class="note">No video yet</p>`
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

renderPlayers();
renderCourses();
