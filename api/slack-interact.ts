import axios from "axios";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

function getClickUpPriority(priority: string) {
	return (
		{
			urgent: 1,
			high: 2,
			normal: 3,
			low: 4,
		}[priority.toLowerCase()] || 4
	);
}

export default async function handler(req, res) {
	if (req.method !== "POST") return res.status(405).send("Method not allowed");

	const payload = JSON.parse(req.body.payload);
	if (
		payload.type !== "view_submission" ||
		payload.view.callback_id !== "support_modal"
	) {
		return res.status(200).send();
	}

	const metadata = JSON.parse(payload.view.private_metadata || "{}");
	const channelId = metadata.channel_id;
	const userId = metadata.user_id || payload.user.id;
	const values = payload.view.state.values;

	const requestType = values.request_type.input.selected_option.value;
	const priority = values.priority.input.selected_option.value;
	const subject = values.subject.input.value;
	const description = values.description.input.value;
	const slackUser = payload.user.username;

	try {
		// 🔁 1. Send to GHL
		await axios.post(process.env.GHL_WEBHOOK_URL, {
			slack_user: slackUser,
			slack_user_id: userId,
			slack_channel_id: channelId,
			request_type: requestType,
			priority,
			subject,
			description,
		});
    if (!process.env.CLICKUP_API_TOKEN) {
					console.error("Missing CLICKUP_API_TOKEN");
				}
    
		// 📝 2. Create ClickUp Task
		const clickupResponse = await axios.post(
			`https://api.clickup.com/api/v2/list/${process.env.CLICKUP_LIST_ID}/task`,
			{
				name: subject,
				description: description,
				priority: getClickUpPriority(priority),
				tags: [requestType],
			},
			{
				headers: {
					Authorization: process.env.CLICKUP_API_TOKEN,
					"Content-Type": "application/json",
				},
			},
		);

		const clickupTaskId = clickupResponse.data.id;
		const clickupTaskUrl = clickupResponse.data.url;
		const timestamp = new Date().toLocaleString();

		// ✅ 3. Post Slack confirmation
		await axios.post(
			"https://slack.com/api/chat.postMessage",
			{
				channel: channelId,
				blocks: [
					{
						type: "header",
						text: { type: "plain_text", text: "🎫 Support Ticket Created" },
					},
					{
						type: "section",
						fields: [
							{ type: "mrkdwn", text: `*Ticket ID:*\n#${clickupTaskId}` },
							{ type: "mrkdwn", text: `*Priority:*\n🔴 ${priority}` },
							{ type: "mrkdwn", text: `*Type:*\n${requestType}` },
							{ type: "mrkdwn", text: `*Submitted by:*\n<@${userId}>` },
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
								url: clickupTaskUrl,
							},
						],
					},
					{
						type: "context",
						elements: [
							{
								type: "mrkdwn",
								text: `✅ Ticket submitted at ${timestamp} | Expected response: 2h`,
							},
						],
					},
				],
			},
			{
				headers: {
					Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
					"Content-Type": "application/json",
				},
			},
		);

		return res.status(200).json({ response_action: "clear" });
	} catch (err) {
		console.error("Error submitting ticket:", err);
		return res.status(200).json({
			response_action: "errors",
			errors: {
				subject: "Something went wrong. Please try again.",
			},
		});
	}
}
