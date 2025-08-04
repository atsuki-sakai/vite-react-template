import crypto from "node:crypto";
import { LineWebhookEvent } from "../shared/schemas";
import { AppContext, type LineMessageWorkflowParams } from "../worker/types";

export default class LineWebhookService {

  async handle(c: AppContext) {
    console.log("LINE webhook received:", {
      method: c.req.method,
      path: c.req.path,
      headers: Object.fromEntries(c.req.raw.headers),
    });

    // Request size limit check (8MB)
    const contentLength = c.req.header("content-length");
    if (contentLength && parseInt(contentLength) > 8 * 1024 * 1024) {
      console.error("Request too large:", contentLength);
      return c.json({ error: "Request too large" }, 413);
    }
    
    // Get raw body for signature verification
    const rawBody = await c.req.text();
    const signature = c.req.header("x-line-signature");
    
    console.log("Signature verification details:", {
      hasSignature: !!signature,
      hasChannelSecret: !!c.env.LINE_CHANNEL_SECRET,
      channelSecretLength: c.env.LINE_CHANNEL_SECRET?.length || 0,
      bodyLength: rawBody.length,
      signaturePreview: signature?.substring(0, 10) + "...",
    });
    
    if (!signature) {
      console.error("Missing x-line-signature header");
      return c.json({}, 400);
    }
    
    if (!c.env.LINE_CHANNEL_SECRET) {
      console.error("LINE_CHANNEL_SECRET environment variable is not set");
      return c.json({}, 500);
    }
    
    if (!this.verifySignature(rawBody, signature, c.env.LINE_CHANNEL_SECRET)) {
      console.error("Signature verification failed");
      return c.json({}, 403);
    }

    // Parse and validate body after signature verification
    const parsedBody = JSON.parse(rawBody);
    const { events } = parsedBody;

    // Start Workflow for each message event
    c.executionCtx.waitUntil((async () => {
      try {
        for (const event of events) {
          if (event.type === "message" && event.message && event.source.userId) {
            await this.startWorkflow(c, event);
          }
        }
      } catch (error) {
        console.error("Critical error in Workflow startup:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    })());

    return c.json({}, 200);
  }

  private verifySignature(body: string, signature: string, secret: string): boolean {
    const hash = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("base64");
    
    console.log("Signature verification:", {
      expectedHash: hash.substring(0, 10) + "...",
      receivedSignature: signature.substring(0, 10) + "...",
      match: signature === hash,
    });
    
    if (signature !== hash) {
      console.error("Signature verification failed - mismatch detected", {
        expectedHash: hash,
        receivedSignature: signature,
      });
    }
    
    return signature === hash;
  }

  private async startWorkflow(c: AppContext, event: LineWebhookEvent) {
    if (!event.message || !event.source.userId) return;

    const userId = event.source.userId;
    const messageType = event.message.type;
    const messageContent = event.message.text || null;
    
    let imageUrl: string | null = null;
    if (messageType === "image" && event.message.contentProvider?.originalContentUrl) {
      imageUrl = event.message.contentProvider.originalContentUrl;
    }

    const workflowParams: LineMessageWorkflowParams = {
      userId,
      messageType,
      messageContent,
      imageUrl,
      env: c.env
    };

    try {
      const workflowBinding = c.env.LINE_MESSAGE_WORKFLOW;
      
      await workflowBinding.create({
        params: workflowParams
      });

    } catch (error) {
      console.error(`Failed to create Workflow instance for user: ${userId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

}