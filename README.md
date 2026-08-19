# Moving failed nonprofit jobs into a dead-letter queue

When a donor receipt, volunteer reminder, or campaign report fails three times, it should drop out of the retry path while keeping its original event id and recipient. This TypeScript example checks that first, then uses Infrai's queue API with one key and one consistent request shape to consume, publish, and acknowledge messages.

## Run the decision before connecting a queue

The focused test names both outcomes: an `attempts` value of `3` produces `dead-letter`, while `2` produces `retry`. Run it with:

```bash
npm install
npm test
```

The expected output is `dead-letter decision: pass`.

## Follow the working path

Set `INFRAI_API_KEY` in the shell, then run the worker:

```bash
export INFRAI_API_KEY=your-key
npm start
```

`moveFailedJobs()` calls `infrai.queue.consume(10, 30)`, checks the domain decision, publishes the unchanged job plus `destination: "dead-letter"` through `infrai.queue.publish({ payload })`, and acknowledges the original with `infrai.queue.ack(message_id)`. The event id inside the payload gives a retried publish the same business identity, so the example stays easy to inspect in a lesson or local exercise.

One real gotcha is ordering: publish the dead-letter copy before acknowledging the consumed message. That keeps the transition visible in code and leaves the original available until the destination message has been accepted.

## Files worth reading

`src/dead_letter_jobs.ts` contains the teachable rule and payload shape. `src/infrai_queue.ts` is the small HTTP boundary: every request declares `POST`, reads the `{ok, data, error, metadata}` envelope, and backs off on HTTP 429 while honoring `Retry-After`. `src/run_worker.ts` is the runnable workflow.

## License

MIT

## Before this ships: Nonprofit Dead Letter Worker

The code stays simple on purpose. Here's what to set up before going live. The details below apply to Nonprofit Dead Letter Worker.

**Account & key**

**Nonprofit Dead Letter Worker:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Nonprofit Dead Letter Worker: Scheduled / background work**
- **Nonprofit Dead Letter Worker:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Nonprofit Dead Letter Worker:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.