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
| 10000 | sync    |    50.4 | 198,413 |        1 (55) |            **46** |
| 10000 | batched |    54.1 | 184,843 |         0 (0) |               9.5 |
| 10000 | worker  |   112.9 |  88,574 |         0 (0) |              15.9 |
| 50000 | sync    |   219.5 | 227,790 |       1 (225) |         **211.7** |
| 50000 | batched |   221.2 | 226,040 |         0 (0) |              92.6 |
| 50000 | worker  |   636.5 |  78,555 |       2 (161) |               140 |

### WebKit (Safari engine)

| count | mode    | gen(ms) | thr(/s) | longTasks(ms) | worstFrameGap(ms) |
| ----: | ------- | ------: | ------: | ------------: | ----------------: |
| 10000 | sync    |      31 | 322,581 |       0 (n/a) |            **34** |
| 10000 | batched |      67 | 149,254 |       0 (n/a) |                18 |
| 10000 | worker  |      45 | 222,222 |       0 (n/a) |                18 |
| 50000 | sync    |     164 | 304,878 |       0 (n/a) |           **165** |
| 50000 | batched |     320 | 156,250 |       0 (n/a) |                19 |
| 50000 | worker  |    1301 |  38,432 |       0 (n/a) |               210 |

### Takeaways

- **batched** is the best general non-blocking strategy on both engines: zero long
  tasks (Chromium) and a tiny worst frame gap in Safari (19ms at 50k vs sync's 165ms).
- **sync** blocks proportionally to count (211ms frozen at 50k in Chromium).
- **worker** frees raw compute but the `postMessage` copy of many result strings costs
  main-thread time (heavy in WebKit) — prefer batched when returning strings.
- **cached** is a repeat-render optimization; a cold first run costs the same as sync.
