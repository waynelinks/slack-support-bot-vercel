import axios from "axios";
import axiosRetry from "axios-retry";

export const clickupClient = axios.create({
  baseURL: "https://api.clickup.com/api/v2",
  headers: {
    "Content-Type": "application/json",
    Authorization: process.env.CLICKUP_API_TOKEN,
  },
});
axiosRetry(clickupClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});

export function mapSlackPriorityToClickUp(priority: string): number {
  return { urgent: 1, high: 2, normal: 3, low: 4 }[priority.toLowerCase()] ?? 4;
}
