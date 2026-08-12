export type NonprofitJob = {
  event_id: string;
  kind: "donor_receipt" | "volunteer_reminder" | "campaign_report";
  recipient: string;
  attempts: number;
};

export function routeFailedJob(job: NonprofitJob): "dead-letter" | "retry" {
  return job.attempts >= 3 ? "dead-letter" : "retry";
}

export function deadLetterPayload(job: NonprofitJob): Record<string, unknown> {
  return { ...job, destination: "dead-letter" };
}
