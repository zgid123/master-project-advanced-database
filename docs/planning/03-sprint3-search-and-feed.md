# Sprint 3 — Read-Side Projections (Search + Feed)

> **Goal:** Build the read-optimized side of the system. Indexer + Search Service deliver full-text search with relevance, highlights, and filters. Feed Projector + Feed Service deliver Reddit-style home/tag feeds backed by MongoDB read models.
> **Exit criteria:** E2E `ask question → searchable in OpenSearch within 3s → appears in tag feed → appears in home feed for a tag-following user` is green.

Mirrors HLD §18 Sprint 3.

---

## Scope (services delivered in this sprint)

- OpenSearch + Dashboards operational; index mappings designed
- Indexer Service (Kafka → OpenSearch projection)
- Search Service (query API)
- MongoDB operational
- Feed Projector Service (Kafka → MongoDB projection)
- Feed Service (read API + Redis cache)

---

## Tasks

### Search side

#### S3-OS-01 — OpenSearch + Dashboards operational

- Depends on: S0-INFRA-01
- Deliverable: OpenSearch 2.19 + Dashboards healthy in compose; security plugin disabled in dev (matches design compose); persistent volume; `OPENSEARCH_JAVA_OPTS` tuned for dev (~512m heap)
- Definition of done: `curl http://localhost:9200` returns cluster info; Dashboards reachable on `http://localhost:5601`
- Owner: _unassigned_
- Status: ⏳

#### S3-OS-02 — Index mapping for `questions`

- Depends on: S3-OS-01
- Deliverable: `infra/opensearch/mappings/questions.json` with:
  - `title` — text, analyzer `standard`, fields `.keyword` (256) for sorting
  - `body` — text, analyzer `english` (stemming), `index_options: positions` for highlighting
  - `tags` — keyword (multi-value)
  - `author.userId` — keyword; `author.displayName` — text + keyword
  - `score` — integer; `answerCount` — integer; `accepted` — boolean
  - `status` — keyword (`open|closed|deleted`)
  - `createdAt`, `updatedAt`, `lastActivityAt` — date
  - Index template `questions-v1` with alias `questions` for zero-downtime reindex
- Definition of done: mapping applied via `infra/opensearch/init.sh`; rerun is idempotent
- Owner: _unassigned_
- Status: ⏳

#### S3-INDEXER-01 — Indexer Service (consumer pipeline)

- Depends on: S3-OS-02, S2-LIB-01
- Deliverable: `packages/services/indexer-service` consuming:
  - `question.created` → index full document (denormalize tags + author from inline payload)
  - `question.updated` → partial update (title/body/tags)
  - `question.closed` / `question.deleted` → update `status`
  - `answer.created` → increment `answerCount`, set `lastActivityAt`
  - `answer.accepted` → set `accepted = true`
  - `vote.changed` → update `score` by delta
  - `tag.created` → no-op (informational)
  - DLQ on repeated failure (3 retries with exponential backoff)
- Idempotency: every update uses OpenSearch `_update` with `if_seq_no` / `if_primary_term` or a version field derived from `eventId` ordering; document choice in service README
- Definition of done: from a cold OpenSearch + replayed Kafka topic, the resulting index matches the expected document set (golden test)
- Owner: _unassigned_
- Status: ⏳

#### S3-INDEXER-02 — Reindex CLI

- Depends on: S3-INDEXER-01, S1-QUESTION-02
- Deliverable: `pnpm --filter indexer-service reindex` command that:
  - Pulls all questions from Question Service (paged)
  - Pulls answer counts from Answer Service
  - Pulls vote scores from Vote Service
  - Writes a new versioned index (`questions-v2`), then atomically swaps the `questions` alias
- Definition of done: reindex completes against seed dataset in < 30s; alias swap has zero search downtime
- Owner: _unassigned_
- Status: ⏳

#### S3-SEARCH-01 — Search Service API

- Depends on: S3-INDEXER-01, S0-LIB-03
- Deliverable: `packages/services/search-service` exposing:
  - `GET /search?q=...&tags=...&accepted=...&unanswered=...&sort=relevance|newest|top&page=...&size=...`
  - Query strategy:
    - `multi_match` over `title^3` + `body^1` with `fuzziness: AUTO`
    - Tag filter: `terms` on `tags`
    - Status filter: hard-coded `status: open`
    - Highlights on `title` + `body`
  - Returns `{ items: [{ id, title, snippet, tags, author, score, answerCount, accepted, createdAt, lastActivityAt }], total, took }`
- Definition of done: typo-tolerant search returns a known question; tag + accepted filter combos return the right subset
- Owner: _unassigned_
- Status: ⏳

### Feed side

#### S3-MONGO-01 — MongoDB operational + indexes

- Depends on: S0-INFRA-01
- Deliverable: MongoDB 8 healthy in compose; `feed_read_db` created; collection `feed_items` with indexes:
  - `{ "tags": 1, "rankSignals.hotScore": -1 }` — tag feed
  - `{ "createdAt": -1 }` — time-ordered
  - `{ "questionId": 1 }` unique — upsert key
  - Collection `user_personalized_timeline` with `{ userId: 1, "items.rankSignals.hotScore": -1 }` — personalized timeline
- Definition of done: indexes created via init script; mongosh confirms presence
- Owner: _unassigned_
- Status: ⏳

#### S3-FEEDPROJ-01 — Feed Projector consumers (global + tag timelines)

- Depends on: S3-MONGO-01, S2-LIB-01
- Deliverable: `packages/services/feed-projector-service` consuming:
  - `question.created` → upsert feed item (denormalize title, excerpt, tags, author, counters init)
  - `question.updated` → patch title/excerpt/tags
  - `question.deleted` / `question.closed` → set `visible: false`
  - `answer.created` → increment `counters.answers`, refresh `lastActivityAt`, recompute `rankSignals.hotScore`
  - `answer.accepted` → set `accepted: true`, recompute hotScore (boost)
  - `comment.created` → increment `counters.comments`
  - `vote.changed` → update `counters.upvotes/downvotes`, recompute hotScore
- Idempotency: each handler uses `withIdempotency(eventId)`; upserts are deterministic
- Definition of done: replaying topics from offset 0 produces the same `feed_items` collection (deep-equal golden test)
- Owner: _unassigned_
- Status: ⏳

#### S3-FEEDPROJ-02 — Personalized timeline materialization

- Depends on: S3-FEEDPROJ-01, S2-PROD-TAG, S2-PROD-USER
- Deliverable: consumer pipeline that maintains `user_personalized_timeline`:
  - `tag.followed` → add user's interest in tag; backfill recent items for that tag into the user's timeline (bounded, e.g. top 50)
  - `question.created` → push into the timeline of every user who follows any of its tags or watches the question
  - Trim each user's timeline to max 500 items (drop oldest)
- Definition of done: a new user follows tag `nestjs`, then asks a question — backfill populates timeline; subsequent `nestjs`-tagged questions appear in their timeline within seconds
- Owner: _unassigned_
- Status: ⏳

#### S3-FEED-01 — Feed Service read API

- Depends on: S3-FEEDPROJ-01, S3-FEEDPROJ-02, S0-LIB-03, S2-INFRA-01
- Deliverable: `packages/services/feed-service`:
  - `GET /feed/home?cursor=...&limit=...` — reads `user_personalized_timeline`; falls back to global hot feed if user has no follows
  - `GET /feed/tags/:slug?cursor=...&limit=...` — reads `feed_items` filtered by tag, sorted by hotScore
  - `GET /feed/trending` — global hot feed
  - Cursor-based pagination (opaque base64 cursor: `{ hotScore, createdAt, questionId }`)
  - Response shape matches HLD §10 example
  - Redis cache for the **first page** of each feed (key: `feed:home:<userId>:p0`, `feed:tag:<slug>:p0`, `feed:trending:p0`), TTL 30s, busted on relevant projector writes via Redis pub/sub channel `feed:invalidate`
- Definition of done: cold read latency p95 < 80ms; cached p95 < 10ms
- Owner: _unassigned_
- Status: ⏳

#### S3-FEED-02 — Ranking formula implementation

- Depends on: S3-FEEDPROJ-01
- Deliverable: shared utility `computeHotScore({ upvotes, downvotes, answers, accepted, ageHours, followedTagMatch, watchedQuestionMatch })`. Implementation per HLD §10:
  ```
  score = freshnessWeight(ageHours)
        + tagFollowWeight(followedTagMatch)
        + watchedQuestionWeight(watchedQuestionMatch)
        + voteWeight(upvotes - downvotes)
        + answerActivityWeight(answers)
        + acceptedAnswerBonus(accepted)
  ```
  Weights configurable via env so they can be tuned without redeploy
- Definition of done: unit tests on representative inputs match documented expected scores; tuning a weight changes ranking immediately
- Owner: _unassigned_
- Status: ⏳

### Glue

#### S3-COMPOSE-01 — Wire all Sprint 3 services into compose

- Depends on: S3-INDEXER-01, S3-SEARCH-01, S3-FEEDPROJ-01, S3-FEED-01
- Deliverable: build contexts, dependencies on `kafka`, `opensearch`, `mongo-feed`, `redis`; gateway routes for `/api/search/*` and `/api/feed/*`
- Definition of done: full stack healthy under `docker compose up`
- Owner: _unassigned_
- Status: ⏳

#### S3-E2E-01 — Smoke E2E: ask → search → tag feed → home feed

- Depends on: S3-COMPOSE-01, S2-E2E-01
- Deliverable: `tests/e2e/sprint3.spec.ts`:
  1. `alice` follows tag `nestjs`
  2. `bob` asks a question tagged `nestjs`
  3. Within 3s: `GET /search?q=<title-fragment>&tags=nestjs` returns the question
  4. Within 3s: `GET /feed/tags/nestjs` first page contains the question
  5. Within 3s: `GET /feed/home` (as `alice`) first page contains the question
  6. `bob` posts an accepted answer; assert `accepted: true` reflected in search and feed
- Definition of done: test green in CI; latency assertions met
- Owner: _unassigned_
- Status: ⏳

---

## Risks (Sprint 3 specific)

- **Eventual consistency window.** Search and feed are eventually consistent with the source-of-truth DBs. Document and demonstrate the typical lag (< 3s in dev) — examiners will ask.
- **Out-of-order events.** `vote.changed` arriving before `question.created` for a brand-new question. Consumers must tolerate "target not yet present" by buffering or by retrying via DLQ.
- **Reindex coordination.** The alias swap in S3-INDEXER-02 must be atomic. Test with active producers running.
- **Hot-score drift.** If projector is down, hot scores stale. Add a periodic recomputation job (post-class scope; document).
- **Cache invalidation correctness.** First-page Redis cache + writes from projector → if the invalidation channel misses a message, users see stale top items for up to 30s. Acceptable; documented.
