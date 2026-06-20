# Benchmark results

## Node throughput (`pnpm --filter identicons-esm bench`)

`makeHash` rewritten to allocation-free loops + memoized `chaosHash`, output byte-identical (gated by `test/output-preserving.test.ts`).

| bench                          |    ops/sec | note                  |
| ------------------------------ | ---------: | --------------------- |
| makeHash — old (spread/reduce) |   ~114,000 | baseline              |
| makeHash — new (loops + memo)  | ~1,680,000 | **~14.7× faster**     |
| createIdenticon — `svg`        | ~1,160,000 | raw string            |
| createIdenticon — base64       |   ~671,000 | `svg` is ~1.7× faster |

## Browser (`node bench/browser-bench.mjs`, playground dev server)

Driven via Playwright. Generation only (images not inserted into the DOM, to isolate
the library's cost from DOM/layout). Dev-mode numbers — a production build is faster;
the **relative** behavior is what matters. WebKit has no `longtask` API, so use
`worstFrameGap` there (high gap = main thread was blocked).

### Chromium (Chrome engine)

| count | mode    | gen(ms) | thr(/s) | longTasks(ms) | worstFrameGap(ms) |
| ----: | ------- | ------: | ------: | ------------: | ----------------: |
| 10000 | sync    |    47.4 | 210,970 |        1 (52) |          **45.4** |
| 10000 | batched |    50.3 | 198,807 |         0 (0) |               9.0 |
| 10000 | worker  |    78.5 | 127,389 |         0 (0) |               8.9 |
| 10000 | cached  |    41.9 | 238,663 |         0 (0) |              30.4 |
| 50000 | sync    |   215.2 | 232,342 |       1 (221) |         **211.2** |
| 50000 | batched |   210.4 | 237,643 |         0 (0) |              90.9 |
| 50000 | worker  |   897.4 |  55,717 |       3 (389) |             291.2 |
| 50000 | cached  |   422.3 | 118,399 |       1 (428) |         **408.9** |

### WebKit (Safari engine)

| count | mode    | gen(ms) | thr(/s) | longTasks(ms) | worstFrameGap(ms) |
| ----: | ------- | ------: | ------: | ------------: | ----------------: |
| 10000 | sync    |      33 | 303,030 |       0 (n/a) |            **34** |
| 10000 | batched |      57 | 175,439 |       0 (n/a) |                17 |
| 10000 | worker  |      55 | 181,818 |       0 (n/a) |                27 |
| 10000 | cached  |      37 | 270,270 |       0 (n/a) |                38 |
| 50000 | sync    |     273 | 183,150 |       0 (n/a) |           **274** |
| 50000 | batched |     332 | 150,602 |       0 (n/a) |                19 |
| 50000 | worker  |    1004 |  49,801 |       0 (n/a) |               196 |
| 50000 | cached  |     624 |  80,128 |       0 (n/a) |           **630** |

### Takeaways

- **batched** is the best general non-blocking strategy on both engines: zero long
  tasks (Chromium) and a tiny worst frame gap in Safari (19ms at 50k vs sync's 274ms).
- **sync** blocks proportionally to count (211ms frozen at 50k in Chromium).
- **worker** frees raw compute but the `postMessage` copy of many result strings costs
  main-thread time (heavy in WebKit) — prefer batched when returning strings.
- **cached** only pays off on repeat renders (warm hits are ~free). These numbers are a
  **cold** run — every input is a miss, so it's pure overhead: about the same as sync at
  10k, and slower at 50k where filling and evicting the cache (20k cap) adds work and
  blocks (409ms / 630ms worst frame gap). Use it when the same inputs re-render, not for
  a one-shot batch of unique inputs.
