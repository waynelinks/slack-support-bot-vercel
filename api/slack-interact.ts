import type { NextApiRequest, NextApiResponse } from "next";
import { verifySlackSignature } from "../src/utils/verifySlackSignature";
import { slackClient } from "../src/clients/slackClient";
import {
  clickupClient,
  mapSlackPriorityToClickUp,
} from "../src/clients/clickupClient";
import type { ViewSubmissionPayload } from "../src/schemas/slack";
import { CHANNEL_ROUTES, CLIENT_LIST_ID } from "../src/utils/internalRouting";
import { readRawBody } from "./_shared/rawBody";

export const config = { api: { bodyParser: false } };

export default async function slackInteract(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
    return;
  }

  const raw = await readRawBody(req);
  // if (!verifySlackSignature(req, raw)) {
  //   res.status(401).end("Invalid Slack signature");
  //   return;
  // }

  const payloadStr = new URLSearchParams(raw).get("payload");
  if (!payloadStr) {
    res.status(400).end("Missing payload");
    return;
  }

  const payload = JSON.parse(payloadStr) as ViewSubmissionPayload;
  if (
    payload.type !== "view_submission" ||
    payload.view.callback_id !== "support_modal"
  ) {
    res.status(200).end();
    return;
  }

  const meta = JSON.parse(payload.view.private_metadata) as {
    channel_id: string;
    user_id: string;
  };
  const v = payload.view.state.values;

  const requestType = v.request_type.input.selected_option.value;
  const priority = v.priority.input.selected_option.value;
  const subject = v.subject.input.value;
  const description = v.description.input.value;

  /* Determine ClickUp list */
  const internalRoute = CHANNEL_ROUTES[meta.channel_id];
  const listId = internalRoute?.listId ?? CLIENT_LIST_ID;
  if (!listId) {
    res.status(500).end("No ClickUp list configured");
    return;
  }

  const { data: task } = await clickupClient.post(`/list/${listId}/task`, {
    name: subject,
    description,
    priority: mapSlackPriorityToClickUp(priority),
    tags: [requestType],
  });

  await slackClient.post("/chat.postMessage", {
    channel: meta.channel_id,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🎫 Support Ticket Created" },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Ticket ID:* #${task.id}` },
          { type: "mrkdwn", text: `*Priority:* ${priority}` },
          { type: "mrkdwn", text: `*Type:* ${requestType}` },
          { type: "mrkdwn", text: `*Submitted by:* <@${payload.user.id}>` },
        ],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Subject:* ${subject}` },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View in ClickUp" },
            style: "primary",
            url: task.url,
          },
        ],
      },
    ],
  });

  res.status(200).json({ response_action: "clear" });
}
