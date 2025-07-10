import crypto from "crypto";
import type { NextApiRequest } from "next";

const WINDOW_SECONDS = 60 * 5;

export function verifySlackSignature(
  req: NextApiRequest,
  rawBody: string
): boolean {
  const ts = req.headers["x-slack-request-timestamp"] as string | undefined;
  const sig = req.headers["x-slack-signature"] as string | undefined;
  if (!ts || !sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > WINDOW_SECONDS) return false;

  const base = `v0:${ts}:${rawBody}`;
  const myHash = crypto
    .createHmac("sha256", process.env.SLACK_SIGNING_SECRET ?? "")
    .update(base, "utf8")
    .digest("hex");
  const mySig = `v0=${myHash}`;

  return crypto.timingSafeEqual(Buffer.from(mySig), Buffer.from(sig));
}
