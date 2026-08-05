# Golf Trip 2026 site

A plain HTML/CSS/JS site, no build step, hosted for free on GitHub Pages.

## Preview it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in a browser.

## How to update content

- **Itinerary** — edit `itinerary.html` directly.
- **Leaderboard** — edit the table rows in `leaderboard.html` directly.
- **Players** — edit `data/players.json`. Add a new `{ "name", "photo", "bio", "quirk" }`
  object per person. Drop a real photo into `images/` and point `photo` at it
  (e.g. `images/player-alex.jpg`), or leave the SVG placeholder.
- **Courses & holes** — edit `data/courses.json`. Add a course object with a `holes`
  array; each hole can have a `youtubeId`.

## Adding a hole video

1. Upload the video to YouTube as **Unlisted** (Visibility → Unlisted when publishing).
   Unlisted videos aren't searchable and won't appear on your channel, but anyone
   with the link (or the embed) can watch.
2. Copy the video ID from the URL: `https://www.youtube.com/watch?v=VIDEO_ID`.
3. Paste `VIDEO_ID` into the matching hole's `youtubeId` field in `data/courses.json`.

Don't commit video files to this repo — GitHub has a 100MB per-file limit and git
handles large binaries badly. YouTube (or Google Drive if you prefer) is the
free, sane place to store them.

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
