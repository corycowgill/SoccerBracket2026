# Background music

Put your song here as **`theme.mp3`** (exact name), i.e. the final path is:

```
public/music/theme.mp3
```

The app automatically loads that file and shows a play/pause button in the
header. Anything in `public/` is copied to the site root at build time, so the
track is served from `/music/theme.mp3`.

## How to add your MP3

Pick whichever is easiest:

- **GitHub web upload (easiest):** open the repo on GitHub → navigate to
  `public/music/` → **Add file → Upload files** → drag your MP3 in, rename it to
  `theme.mp3`, and commit to the branch `claude/fifa-2026-bracket-app-ZWQNu`.
- **Locally:** copy the file in, then commit & push:
  ```bash
  cp ~/Desktop/your-song.mp3 public/music/theme.mp3
  git add public/music/theme.mp3
  git commit -m "Add background music"
  git push
  ```

## Notes
- Use an `.mp3` (most compatible). Keep it a reasonable size (a few MB) so it
  loads fast.
- Make sure you have the rights to use the song (a royalty-free / your-own track
  is safest).
- Want a different filename or multiple tracks? Tell me and I'll adjust the
  player.
