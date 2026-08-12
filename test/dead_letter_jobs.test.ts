import { deadLetterPayload, routeFailedJob } from "../src/dead_letter_jobs.ts";

const job = { event_id: "receipt-17", kind: "donor_receipt" as const, recipient: "donor@example.org", attempts: 3 };
if (routeFailedJob(job) !== "dead-letter") throw new Error("three attempts must be routed to dead-letter");
if (routeFailedJob({ ...job, attempts: 2 }) !== "retry") throw new Error("fewer than three attempts must retry");
if (deadLetterPayload(job).destination !== "dead-letter") throw new Error("payload must record its destination");
console.log("dead-letter decision: pass");
