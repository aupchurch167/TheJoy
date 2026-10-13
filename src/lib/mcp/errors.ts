/** A message that is safe to return to the bot and store in the audit log. */
export class McpToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpToolError";
  }
}
