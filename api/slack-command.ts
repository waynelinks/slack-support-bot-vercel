import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") return res.status(405).send("Method not allowed");

	const { text, trigger_id, channel_id, user_id } = req.body;

	const commandText = text?.trim().toLowerCase();
	if (commandText !== "new") {
		return res
			.status(200)
			.send("Try `/balance new` to create a support ticket.");
	}

	try {
		await axios.post(
			"https://slack.com/api/views.open",
			{
				trigger_id,
				view: {
					type: "modal",
					callback_id: "support_modal",
					private_metadata: JSON.stringify({ channel_id, user_id }),
					title: {
						type: "plain_text",
						text: "New Support Ticket",
					},
					submit: {
						type: "plain_text",
						text: "Submit",
					},
					close: {
						type: "plain_text",
						text: "Cancel",
					},
					blocks: [
						{
							type: "input",
							block_id: "request_type",
							label: { type: "plain_text", text: "Request Type" },
							element: {
								type: "static_select",
								action_id: "input",
								options: [
									{
										text: { type: "plain_text", text: "Technical Support" },
										value: "Technical Support",
									},
									{
										text: { type: "plain_text", text: "CA Assistance" },
										value: "CA Assistance",
									},
									{
										text: { type: "plain_text", text: "Other" },
										value: "Other",
									},
								],
							},
						},
						{
							type: "input",
							block_id: "priority",
							label: { type: "plain_text", text: "Priority Level" },
							element: {
								type: "static_select",
								action_id: "input",
								options: [
									{
										text: { type: "plain_text", text: "Urgent" },
										value: "urgent",
									},
									{
										text: { type: "plain_text", text: "High" },
										value: "high",
									},
									{
										text: { type: "plain_text", text: "Normal" },
										value: "normal",
									},
									{
										text: { type: "plain_text", text: "Low" },
										value: "low",
									},
								],
							},
						},
						{
							type: "input",
							block_id: "subject",
							label: { type: "plain_text", text: "Subject" },
							element: {
								type: "plain_text_input",
								action_id: "input",
								max_length: 100,
							},
						},
						{
							type: "input",
							block_id: "description",
							label: { type: "plain_text", text: "Description" },
							element: {
								type: "plain_text_input",
								action_id: "input",
								multiline: true,
								max_length: 1000,
							},
						},
					],
				},
			},
			{
				headers: {
					Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
					"Content-Type": "application/json",
				},
			},
		);

		return res.status(200).end();
	} catch (error) {
		console.error("Error opening modal:", error);
		return res.status(500).send("Internal Server Error");
	}
}
