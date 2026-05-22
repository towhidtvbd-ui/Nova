# Nova Snake 2D

A comprehensive browser-based 2D Snake game with:

- Classic snake movement and collision detection.
- Progressive difficulty (level + speed scaling).
- Multiple lives.
- Power food pickups with temporary slow-motion and bonus points.
- Session stats (foods eaten, power foods, longest snake, survival time).
- Persistent high score via `localStorage`.
- Keyboard and button controls.

## Run

Because this uses browser APIs, serve the folder with a local web server:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Controls

- Move: Arrow keys or `W A S D`
- Pause/Resume: `P`
- Restart: `R`
