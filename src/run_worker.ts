import { deadLetterPayload, routeFailedJob, type NonprofitJob } from "./dead_letter_jobs.ts";
import { infrai } from "./infrai_queue.ts";

type Message = { message_id: string; payload: NonprofitJob };

const SOURCE_QUEUE = "nonprofit-jobs";
const DEAD_LETTER_QUEUE = "nonprofit-dead-letter";

export async function moveFailedJobs(): Promise<number> {
  const result = await infrai.queue.consume(SOURCE_QUEUE, 10, 30) as { messages?: Message[] };
  let moved = 0;
  for (const message of result.messages ?? []) {
    if (routeFailedJob(message.payload) === "dead-letter") {
      await infrai.queue.publish(DEAD_LETTER_QUEUE, deadLetterPayload(message.payload));
      moved += 1;
    }
    await infrai.queue.ack(SOURCE_QUEUE, message.message_id);
  }
  return moved;
}

if (process.argv[1]?.endsWith("run_worker.ts")) {
  const moved = await moveFailedJobs();
  console.log(`Moved ${moved} failed nonprofit job(s) to the dead-letter queue.`);
}
