import axios from "axios";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

export default async function handler(req, res) {
	if (req.method !== "POST") return res.status(405).send("Method not allowed");

	const payload = JSON.parse(req.body.payload);
	const metadata = JSON.parse(payload.view.private_metadata || "{}");
	const channelId = metadata.channel_id;
	const userId = metadata.user_id || payload.user.id;

	if (
		payload.type === "view_submission" &&
		payload.view.callback_id === "support_modal"
	) {
		const values = payload.view.state.values;

		const requestType = values.request_type.input.selected_option.value;
		const priority = values.priority.input.selected_option.value;
		const subject = values.subject.input.value;
		const description = values.description.input.value;
		const slackUser = payload.user.username;

		try {
			if (!process.env.GHL_WEBHOOK_URL) {
				throw new Error("GHL_WEBHOOK_URL is not defined");
			}

			// Simulate ClickUp task ID and URL (replace this with actual task creation logic)
			const clickupTaskId = "TKT-12345";
			const clickupTaskUrl = `https://app.clickup.com/t/${clickupTaskId}`;

			const timestamp = new Date().toLocaleString("en-GB");
			const slaTime = "4 hours";

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

			// ✅ 2. Send confirmation message to Slack with blocks
			await axios.post(
				"https://slack.com/api/chat.postMessage",
				{
					channel: channelId,
					blocks: [
						{
							type: "header",
							text: {
								type: "plain_text",
								text: "🎫 Support Ticket Created",
							},
						},
						{
							type: "section",
							fields: [
								{
									type: "mrkdwn",
									text: `*Ticket ID:*\n#${clickupTaskId}`,
								},
								{
									type: "mrkdwn",
									text: `*Priority:*\n🔴 ${priority}`,
								},
								{
									type: "mrkdwn",
									text: `*Type:*\n${requestType}`,
								},
								{
									type: "mrkdwn",
									text: `*Submitted by:*\n<@${userId}>`,
								},
							],
						},
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text: `*Subject:* ${subject}`,
							},
						},
						{
							type: "actions",
							elements: [
								{
									type: "button",
									text: {
										type: "plain_text",
										text: "View in ClickUp",
									},
									style: "primary",
									url: clickupTaskUrl,
								},
								{
									type: "button",
									text: {
										type: "plain_text",
										text: "Add Comment",
									},
									action_id: "add_comment",
								},
							],
						},
						{
							type: "context",
							elements: [
								{
									type: "mrkdwn",
									text: `✅ Ticket submitted at ${timestamp} | Expected response: ${slaTime}`,
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
			console.error("Error sending to GHL or Slack:", err);
			return res.status(200).json({
				response_action: "errors",
				errors: {
					subject: "Failed to submit ticket.",
				},
			});
		}
	}

	return res.status(200).send();
}
