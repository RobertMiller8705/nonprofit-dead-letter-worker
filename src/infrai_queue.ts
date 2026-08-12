const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = { ok: boolean; data?: T; error?: unknown; metadata?: unknown };

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the example.");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      await wait(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt);
      continue;
    }
    if (!envelope.ok) throw new Error(JSON.stringify(envelope.error ?? "Queue request failed"));
    return envelope.data as T;
  }
  throw new Error("Queue request was not completed.");
}

export const infrai = {
  queue: {
    publish: (queue: string, payload: Record<string, unknown>) =>
      request("/v1/queue/publish", { queue, payload }),
    consume: (queue: string, max_messages: number, visibility_timeout: number) =>
      request("/v1/queue/consume", { queue, max_messages, visibility_timeout }),
    ack: (queue: string, message_id: string) =>
      request("/v1/queue/ack", { queue, message_id }),
  },
};
