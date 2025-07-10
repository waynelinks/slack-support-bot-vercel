import { IncomingMessage } from "http";

export function readRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req
      .on("data", (chunk) => (data += chunk))
      .on("end", () => resolve(data))
      .on("error", reject);
  });
}
