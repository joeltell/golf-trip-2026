# Golf Trip 2026 site

A plain HTML/CSS/JS site, no build step, hosted for free on GitHub Pages.

## Preview it locally

```bash
python3 serve.py        # or: python3 serve.py 8080
```

Then open http://localhost:8000 in a browser.

Two reasons to use this instead of `python3 -m http.server`: the pages load their
content with JavaScript, which browsers block on `file://` URLs, so the site has to
be served rather than opened from disk — and `serve.py` sends no-cache headers, so
an edit always shows on refresh instead of the browser quietly handing back the old
CSS or JSON. It serves the repo folder no matter which directory you run it from.

## How to update content

- **Itinerary** — edit `itinerary.html` directly.
- **Scores & counters** — edit `data/leaderboard.json`. Put a score under the round's
  id (`"r4": 86`) and leave it `null` until played; totals add themselves up and
  unplayed rounds show as `—`. Counters (birdies, hole-in-ones, Jerrys) are plain
  numbers, and whoever leads a column gets a badge. The `rounds` array drives the
  column headers, so adding or removing a round renumbers `R1…Rn` automatically.
- **Players** — edit `data/players.json`. Add a new `{ "name", "photo", "bio", "quirk" }`
  object per person. Drop a real photo into `images/` and point `photo` at it
  (e.g. `images/player-alex.jpg`), or leave the SVG placeholder.
- **Home page clips** — edit `data/clips.json`. Each clip takes a `youtubeId`; while
  one is still waiting to be uploaded it can fall back to a local `file` instead.
- **Courses & holes** — edit `data/courses.json`. Add a course object with a `holes`
  array; each hole can have a `youtubeId`.

## Adding a video

1. Upload the video to YouTube as **Unlisted** (Visibility → Unlisted when publishing).
   Unlisted videos aren't searchable and won't appear on your channel, but anyone
   with the link (or the embed) can watch.
2. Copy either the ID or the whole URL — `youtu.be/…`, `watch?v=…` and `/shorts/…` all
   work, the ID gets parsed out.
3. Paste it into `youtubeId`: `data/clips.json` for a home page clip, or the matching
   hole in `data/courses.json`.

Don't commit video files to this repo — GitHub has a 100MB per-file limit and git
handles large binaries badly. YouTube (or Google Drive if you prefer) is the
free, sane place to store them.

Some clips were committed here before that rule was followed, so they're still in the
git history even after being deleted from the working tree. Getting them out for real
needs a history rewrite (`git filter-repo`) and a force push.

## Deploying / updating the live site (GitHub Pages)

**First-time setup:**
1. Create a new **public** repo on GitHub (e.g. `golf-trip-2026`).
2. Push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/golf-trip-2026.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**, set Source to "Deploy from a branch",
   branch `main`, folder `/ (root)`, and save.
4. The site will be live at `https://<your-username>.github.io/golf-trip-2026/`
   within a minute or two.

**Every update after that:**
- Easiest: edit files directly on github.com (click a file → pencil icon → edit →
  commit). The site redeploys automatically within ~1 minute.
- Or locally: edit files, then
  ```bash
  git add .
  git commit -m "Update scores"
  git push
  ```

## When the trip is over

Nothing to cancel — GitHub Pages is free indefinitely. Leave it up as a
souvenir, or delete the repo from GitHub's settings if you want it gone.
