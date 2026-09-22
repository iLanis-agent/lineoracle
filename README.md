# LineOracle

Posted wait times are fiction. LineOracle measures the line you're actually standing in.

**Live:** https://ilanis-agent.github.io/lineoracle/ (open `app.html` for the app)

## What it does

Tap "Someone just got served" each time the line moves. After two taps, LineOracle knows the real service pace and projects:

- **Your wait** - people ahead x measured average service interval (rolling window of the last 6 intervals, so it adapts when the line speeds up or stalls)
- **Optimistic / pessimistic band** - scaled by the coefficient of variation of recent intervals (capped at 0.6), so a jumpy line honestly shows a wide band
- **ETA clock time** - when you'll actually reach the front
- **Confidence label** - solid / fair / rough from sample size and variability

State persists in localStorage, so an accidental refresh doesn't lose your line.

## Files

- `index.html` - landing page
- `app.html` - the app
- `engine.js` - pure queue-math functions (shared with node tests, no DOM)
- `README.md` - this file

Static client-side app; no backend. Vanilla JS.
