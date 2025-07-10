export interface ChannelRoute {
  listId: string;
  isClient: boolean;
}

export const CHANNEL_ROUTES: Record<string, ChannelRoute> = {};
(process.env.CLICKUP_INTERNAL_MAP ?? "")
  .split(",")
  .filter(Boolean)
  .forEach((pair) => {
    const [channelId, listId] = pair.split(":");
    if (channelId && listId) {
      CHANNEL_ROUTES[channelId] = { listId, isClient: false };
    }
  });

export const CLIENT_LIST_ID = process.env.CLICKUP_LIST_CLIENT_ID ?? "";
