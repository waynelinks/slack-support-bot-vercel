import type { NextApiRequest, NextApiResponse } from "next";
import { slackClient } from "@clients/slackClient";
import { verifySlackSignature } from "@utils/verifySlackSignature";
import { buildSupportTicketModal } from "@utils/buildSupportTickModal";
import type { SlashCommandPayload } from "@schemas/slack";
import { readRawBody } from "./_shared/rawBody";

export const config = { api: { bodyParser: false } };

// const rawBody = (req: NextApiRequest) =>
//   new Promise<string>((res, rej) => {
//     let d = "";
//     req
//       .on("data", (c) => (d += c))
//       .on("end", () => res(d))
//       .on("error", rej);
//   });

export default async function slackCommand(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
    return;
  }

  const raw = await readRawBody(req);
  if (!verifySlackSignature(req, raw)) {
    res.status(401).end("Invalid Slack signature");
    return;
  }

  const form = new URLSearchParams(raw);
  const body = Object.fromEntries(form) as unknown as SlashCommandPayload;

  if ((body.text ?? "").trim().toLowerCase() !== "new") {
    res.status(200).send("Try `/balance new` to create a support ticket.");
    return;
  }

  await slackClient.post("/views.open", {
    trigger_id: body.trigger_id,
    view: buildSupportTicketModal({
      channel_id: body.channel_id,
      user_id: body.user_id,
    }),
  });

  res.status(200).end();
}
