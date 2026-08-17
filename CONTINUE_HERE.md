# Continue Here — Treasure Hunt Boat Game

Paste this whole file into a new Claude Code session in `D:\portfolio` to
resume exactly where this one left off. Context ran out mid-polish-pass on
the new boat game.

## What this project is

`D:\portfolio` is Gowtham Sai Chimmana's job-application portfolio.
- **Main site**: React + Tailwind + Framer Motion, `src/portfolio/`, entry
  `index.html` → `src/portfolio/main.jsx`. Deployed live at
  **https://portfolio-three-sable-99.vercel.app**
- **Game mode** ("🚤 Treasure Hunt" button in the nav / a floating button):
  a from-scratch three.js game at `game.html` → `src/ocean/main.js`. This
  **replaced** an earlier ski-village game entirely (that game's whole
  source tree — terrain, NPCs, vehicle, particles, village — was deleted
  in a prior session; don't try to resurrect it, it's gone on purpose).

Deploy is via Vercel CLI (`npx vercel --prod --yes` from `D:\portfolio`),
already logged in as `gow2` team, project `portfolio`, aliased to the URL
above. Git repo is local-only (`D:\portfolio\.git`), not pushed to GitHub —
deploys are one-off CLI pushes, not connected to auto-deploy. **Always ask
the user before redeploying** (established pattern from earlier sessions —
they like to confirm before anything goes live) and before committing (they
like to review, though committing local-only is lower-stakes than deploy).

## The game concept (what it's supposed to be)

First-person powerboat exploring a day/night tropical ocean. A glowing
route connects 5 islands, each one = one of Gowtham's **real shipped
projects** (not generic placeholders — this matters, see
`src/ocean/data/projectsData.js` for the exact list/links, sourced from his
resume/`career-twin` skill). A whirlpool sits between two islands and the
route curves around it — real obstacle with a gameplay pull force, not
decoration. Two treasure chests are hidden **off** the main labeled route
(not signposted) — finding one unlocks the résumé PDF download, the other
unlocks the GitHub profile link. That's the whole "play the game to reach
my resume" hook the user asked for.

Visual reference was an AI-generated concept image (day/night split ocean,
dolphins, glowing island labels, boat console with a physical Day/Night
toggle, whirlpool between islands) — but real-time three.js can't match
photoreal AI-art fidelity, so the agreed direction (confirmed with the user
via AskUserQuestion earlier) is: **push toward realism where it's
achievable, stylized-but-good everywhere else**, not literal cinematic
reproduction.

## Session history so far (chronological, so you understand *why* things are
built the way they are)

1. Built the whole game from scratch: `SceneSetup`, `DayNightSky` (Sky.js +
   moon + stars + fog, driven by one `factor` 0..1), `Ocean` (Water.js),
   `Islands`, `Dolphins`, `Whirlpool`, `Boat` + `BoatController` +
   `BoatCamera` + `BoatWake`, `RouteLayout` + `RouteVisual` +
   `TreasureMarkers`, `ConsoleUI` (HTML/CSS overlay: map, compass,
   day/night toggle, prompts, modal panel).
2. Verified via a **temporary `window.__debugOcean` hook** in `main.js`
   (added → tested via javascript_exec → removed → rebuilt clean) — this
   is the established verification pattern in this repo, copy it, don't
   skip it. Screenshots in this Browser pane have been **unreliable this
   session** (stale/frozen results more than once) — trust direct
   JS/DOM/geometry checks over screenshots when they disagree.
3. Found and fixed a **severe bug** during that testing: approaching a
   treasure chest threw `Cannot read properties of undefined (reading
   'replace')` because the code did `nearestTarget.data.title` when
   `nearestTarget.data` for a treasure is the `TreasureMarker` *instance*,
   not the raw data — needed `.data.data.title`. This error was thrown
   inside the `requestAnimationFrame` loop **before** the trailing
   `requestAnimationFrame(tick)` call, so it **permanently froze the whole
   game** the instant anyone got near a treasure. Fixed. If you add new
   interaction branches, be paranoid about this same class of bug — wrap
   risky new code or double-check property paths, because one uncaught
   throw in `tick()` kills the entire game silently (no error banner, it
   just stops responding).
4. Also fixed: `THREE.Clock` → `THREE.Timer` (deprecated), `PCFSoftShadowMap`
   → `VSMShadowMap` (deprecated in this three version, 0.185.1).
5. Fixed a real shader bug: at night, the water surface showed harsh
   black/white banding. Root cause: three.js's `Sky.js` (Preetham model)
   and `Water.js`'s reflection both produce undefined/garbage results once
   `sunPosition.y` goes below the horizon — it's simply not a supported
   case. Fix: **the physical sun elevation is now clamped to stay just
   above the horizon** (`lerp(48, 1.5, f)` in `DayNightSky.js`), and
   "looks like night" is instead sold entirely by the moon, stars, fog
   darkening, and turbidity/rayleigh shifts. Don't reintroduce a negative
   sun elevation without re-testing the water reflection at night.
6. Fixed the camera: it was originally placed at local `z=-3.6` relative
   to the boat, which is **behind the boat's own stern** (hull spans
   roughly local z=+3.4 bow to z=-2.1 stern) — so the camera was looking
   at the back of the whole boat from outside it. Moved to
   `z=-0.6` (just behind the console, roughly where a driver would stand)
   in `BoatCamera.js`. This is the actual fix if the "first-person" view
   ever looks like it's watching the boat from a distance again.
7. **This session's user feedback (see below) — steering + waves fixed,
   the rest is NOT done yet:**
   - ✅ **Fixed**: steering was inverted (D turned left). Root cause:
     `heading -= turnInput * ...` needed a sign flip for this world's
     `dir = (sin(heading), cos(heading))` convention — was `+=`, verified
     numerically (pressing D now swings direction toward +X, confirmed via
     `window.__debugOcean` that this is the driver's right when facing
     -Z). Also flipped the visual roll/outboard-tilt signs to match.
   - ✅ **Fixed**: ocean had zero real waves — Water.js's built-in "waves"
     are purely a flat-plane normal-map illusion, not geometry. Added real
     vertex displacement via `material.onBeforeCompile` injecting layered
     sine swells into Water.js's vertex shader (see
     `addWaveDisplacement()` in `src/ocean/environment/Ocean.js`), with
     matching geometry subdivision (`PlaneGeometry(3000, 3000, 160, 160)`,
     shrunk down from the original flat un-subdivided 6000-unit plane).
     Also shrunk `BoatController`'s `WORLD_HALF` boundary from 2600 to
     1400 to match the smaller ocean plane.
   - ❌ **NOT done — no driver character.** User wants "a man driving the
     boat" — right now the boat is empty, camera just floats near the
     console. Need to build and add a low-poly driver figure standing/
     seated at the console, visible in peripheral view (arms on wheel,
     maybe a simple idle sway). Look at how the *old, now-deleted* ski
     game built its skier character for the established visual style/
     scale this portfolio uses (git history has it —
     `git show <commit-before-the-boat-game>:src/player/CharacterModel.js`
     if you want the reference; it doesn't exist on disk anymore). Keep
     scale/proportions consistent with the boat (`Boat.js` — hull ~2.3
     units wide, console top ~0.9 high).
   - ❌ **NOT done — no whale.** User explicitly wants a whale surfacing
     and breathing/spouting water — described as a "cinematic scene."
     Suggest: a separate `Whale.js` in `src/ocean/environment/`, a large
     low-poly whale body that periodically surfaces near the route (not
     constantly — an occasional scripted "moment," e.g. every 30-60s or
     triggered when the boat is within some distance of a fixed whale-
     spawn zone), breaches partially with a particle-based blowhole spout
     (reuse the `BoatWake.js` pooled-particle pattern — spawn a burst of
     upward-arcing white particles from the blowhole position over ~0.5s),
     then submerges again. This is a meaningful build, budget real time
     for it.
   - ❌ **NOT done — dolphins look bad ("capsule... very sad").** Current
     `src/ocean/environment/Dolphins.js` builds each dolphin from a single
     stretched `CapsuleGeometry` + a cone snout/dorsal/tail/fins bolted on
     — reads as a blob, not a dolphin. Needs a real tapered-body silhouette
     (thinner at the tail, distinct rounded "melon" head, gently curved
     dorsal fin — not a straight cone, a proper crescent), better material
     (dolphins are glossy/countershaded: darker gray-blue back, pale/white
     belly — the code already has `bodyMat`/`bellyMat` but the belly
     capsule barely reads at this geometry quality). Consider building the
     body from a `LatheGeometry` profile curve (rotate a tapered outline)
     for a proper streamlined shape instead of a capsule primitive.
   - ❌ **NOT done — islands are "not real... generic... green triangle,
     bring it to life."** Every island in `src/ocean/environment/Islands.js`
     is currently the *same* `ConeGeometry` mound + palm ring, just at
     different scales — reads as one repeated template, not 5 distinct
     places. User wants **real creative variety, one unique island per
     project** since "this is my portfolio, I should go full on with my
     creativity." Ideas to actually differentiate them (don't just tweak
     radius):
       - Vary the landform silhouette per island — not every island needs
         a center peak; try a flat sandbar with a lagoon, a jagged twin-
         peak ridge, a ring-shaped atoll, a low grassy plateau, a tall
         rocky spire with a waterfall.
       - Match each island's *theme* to its project's personality — e.g.
         AgentFlow Studio (the most technical/agentic project) could get a
         more dramatic/dark rocky island; the Career Copilot island could
         feel more "welcoming" (beach + palm cluster); the offline/GPU-free
         projects could get a more remote/stark island. This is a genuine
         creative-design task, not just parameter randomization — spend
         real thought on each one individually rather than one
         `buildIsland({radius, seed})` call with different seeds.
       - The current cone shape is the main "generic triangle" complaint —
         almost certainly needs to stop being a single `ConeGeometry` and
         instead be built from an irregular, gently-undulating custom
         mesh (e.g. displaced `IcosahedronGeometry` or a custom heightmap-
         like approach) so it doesn't read as a perfect geometric primitive
         from any angle.
       - Add life: consider small huts/docks, a lighthouse, driftwood,
         shells, a bonfire, birds, moving water at the shoreline — whatever
         fits each island's individual character within reasonable scope.

## How to verify changes (the pattern this repo uses — follow it)

1. Edit code.
2. `npm run build` from `D:\portfolio` — must stay clean (no errors; a few
   "chunk larger than 500kB" warnings are expected/harmless).
3. Add a temporary `window.__debugOcean = {...}` hook at the bottom of the
   `tick()` function in `src/ocean/main.js` if you need to inspect live
   state (boat, scene, whatever's relevant).
4. Use the Browser pane: `preview_start({name: "portfolio-dev"})` (reads
   `.claude/launch.json`, runs `npm run dev` on port 5173), then
   `navigate` to `http://localhost:5173/game.html`.
5. **Always open a genuinely fresh tab** (`tabs_create` then `navigate`)
   before trusting console messages — `read_console_messages` is
   cumulative across navigations in this harness, not cleared on reload,
   so stale errors from before a fix can look like new ones.
6. Prefer `javascript_exec` (direct state/geometry checks) over
   `computer` screenshots — screenshots were flaky/stale multiple times
   this session. If you do screenshot, sanity-check it against a
   simultaneous JS state read before trusting it.
7. Remove the debug hook, rebuild clean, **then** ask the user before
   committing/deploying.

## Key files map

```
game.html                              → src/ocean/main.js (entry)
src/ocean/main.js                      orchestration + tick loop
src/ocean/core/SceneSetup.js           renderer/camera/resize
src/ocean/environment/DayNightSky.js   sun/moon/stars/fog, factor 0..1
src/ocean/environment/Ocean.js         Water.js + wave vertex displacement
src/ocean/environment/Islands.js       ← needs the creative rework (see above)
src/ocean/environment/Dolphins.js      ← needs the shape rework (see above)
src/ocean/environment/Whirlpool.js     vortex obstacle (done, working)
src/ocean/boat/Boat.js                 boat mesh (hull/console/seats/engine)
src/ocean/boat/BoatController.js       physics/steering/whirlpool pull
src/ocean/boat/BoatWake.js             pooled spray particles (reuse pattern for whale spout)
src/ocean/camera/BoatCamera.js         chase cam, positioned at console
src/ocean/world/RouteLayout.js         island/treasure/whirlpool world positions
src/ocean/world/RouteVisual.js         glowing route tube + project labels
src/ocean/world/TreasureMarkers.js     treasure chest markers
src/ocean/ui/ConsoleUI.js              map/compass/toggle/panel DOM logic
src/ocean/style.css                    console UI styling
src/ocean/data/projectsData.js         REAL project list + treasure content — source of truth
src/input/InputManager.js              shared keyboard input (also used by old ski game, kept)
src/utils/mathUtils.js                 shared lerp/clamp/damp (kept)
```

## Straight-up TODO list for the new session, in priority order (matches
what the user just asked for)

1. Add a visible driver character on the boat.
2. Add a whale with a breathing/spout cinematic moment.
3. Rebuild the dolphins with a real tapered silhouette, not a capsule.
4. Redesign all 5 islands to be genuinely unique per project, not the same
   cone template — this is explicitly a "go full creative" ask, don't
   under-scope it.
5. After all of the above: rebuild, verify via the pattern above, ask the
   user before committing/deploying (don't skip the confirm step even
   though earlier fixes in this session were already approved-by-default —
   always re-confirm for each new deploy).

Good luck — the bones of this game (physics, day/night, route, treasure
hunt, console UI) are solid and tested. What's left is entirely the visual/
character/creature layer the user is asking for.
