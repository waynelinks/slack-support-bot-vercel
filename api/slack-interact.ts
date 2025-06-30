// pages/api/slack-interact.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import qs from "qs";
import axios from "axios";

const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

function verifySlackRequest(req: NextApiRequest, body: string): boolean {
	const slackSignature = req.headers["x-slack-signature"] as string;
	const slackTimestamp = req.headers["x-slack-request-timestamp"] as string;
	if (!slackSignature || !slackTimestamp) return false;

	const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
	if (Number.parseInt(slackTimestamp) < fiveMinutesAgo) return false;

	const sigBaseString = `v0:${slackTimestamp}:${body}`;
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const hmac = crypto.createHmac("sha256", SLACK_SIGNING_SECRET!);
	hmac.update(sigBaseString);

	const mySignature = `v0=${hmac.digest("hex")}`;
	return crypto.timingSafeEqual(
		Buffer.from(mySignature),
		Buffer.from(slackSignature),
	);
}

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") return res.status(405).send("Method not allowed");

	let rawBody = "";
	await new Promise<void>((resolve, reject) => {
		req.on("data", (chunk) => {
			rawBody += chunk;
		});
		req.on("end", resolve);
		req.on("error", reject);
	});

	if (!verifySlackRequest(req, rawBody)) {
		return res.status(401).send("Invalid Slack signature");
	}

	try {
		const payload = qs.parse(rawBody).payload as string;
		const parsed = JSON.parse(payload);

		if (
			parsed.type === "view_submission" &&
			parsed.view.callback_id === "support_ticket_modal"
		) {
			const values = parsed.view.state.values;
			const userId = parsed.user.id;

			const ticketData = {
				slack_user: userId,
				request_type:
					values.request_type_block.request_type.selected_option?.value,
				priority: values.priority_block.priority.selected_option?.value,
				subject: values.subject_block.subject.value,
				description: values.description_block.description.value,
				affected_users:
					values.affected_users_block?.affected_users?.value || "",
				additional_context:
					values.additional_context_block?.additional_context?.value || "",
			};

			try {
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				await axios.post(GHL_WEBHOOK_URL!, ticketData);
			} catch (error) {
				console.error("Failed to send to GHL webhook:", error);
			}

			return res.status(200).json({ response_action: "clear" });
		}

		return res.status(200).end();
	} catch (err) {
		console.error("Slack Interact Error:", err);
		return res.status(500).send("Internal Server Error");
	}
}
