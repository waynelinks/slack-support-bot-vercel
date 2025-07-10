import axios from "axios";
import axiosRetry from "axios-retry";

export const slackClient = axios.create({
  baseURL: "https://slack.com/api",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
  },
});

axiosRetry(slackClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});
