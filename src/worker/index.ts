import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { safeParseCreateDatasetRequest, safeParseCreateDocumentByTextRequest, UpdateDocumentByTextRequest, CreateSegmentRequest, ChatHistoryListRequestSchema } from "../shared";
import { createDifyService } from "../services/DifyService";
import { createDb, DrizzleDB } from "../db";
import { lineMessages } from "../db/schema";
import { desc, and, eq } from "drizzle-orm";
import { basicAuth } from "hono/basic-auth";
import { LineMessageWorkflow } from "./workflows/lineMessageWorkflow";
import LineWebhookService from "../services/LineWebhookService";

const app = new Hono<{ Bindings: Env } & { Variables: { db: DrizzleDB } }>();

// API routes
const api = new Hono<{ Bindings: Env } & { Variables: { db: DrizzleDB } }>();


// Add Drizzle database middleware
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  c.set("db", db);
  await next();
});

app.onError((err, c) => {
  // --- HTTPException の処理を追加 ---
  // このようにしないとBasicAuthの認証がうまく動かない.
  if (err instanceof HTTPException) {
    return err.getResponse(); // 正しいレスポンスを返す
  }
  // ------------------------------------

  console.error("Global error handler caught:", err);
  // スタックトレースも出力 (任意)
  if (err.stack) {
    console.error("Error stack:", err.stack);
  }

  return c.json(
    {
      success: false,
      errors: [{ code: 7000, message: "Internal Server Error" }],
    },
    500,
  );
});

// Simple test endpoint WITHOUT auth middleware
api.get("/test", (c) => {
  console.log("TEST endpoint reached!");
  return c.json({ message: "test success!", timestamp: new Date().toISOString() });
});

api.get("/line/webhook", (c) => {
  console.log("LINE webhook GET endpoint reached!");
  return c.json({ message: "webhook check!" });
});

api.post("/line/webhook", async (c) => {
  const lineService = new LineWebhookService();
  return await lineService.handle(c);
});

// Apply basic auth to API routes except LINE webhook and test
api.use("*", async (c, next) => {
  console.log("API Auth middleware - path:", c.req.path, "method:", c.req.method);
  
  // Skip basic auth for LINE webhook endpoint and test endpoint
  if (c.req.path === "/line/webhook" || c.req.path === "/test") {
    console.log("Skipping basic auth for:", c.req.path);
    await next();
    return;
  }
  
  // Apply basic auth to other API routes
  const basicAuthMiddleware = basicAuth({
    verifyUser: (username, password, c) => {
      // 環境変数が設定されているか確認 (堅牢性向上)
      const expectedUser = c.env.ADMIN_USER;
      const expectedPass = c.env.ADMIN_PASSWORD;

      if (expectedUser === undefined || expectedPass === undefined) {
          console.error("ADMIN_USER or ADMIN_PASSWORD is not set in environment variables.");
          return false;
      }
      return username === expectedUser && password === expectedPass;
    }
  });
  
  await basicAuthMiddleware(c, next);
});


// Get knowledge list (datasets) with pagination
api.get('/get-knowledge-list', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.getKnowledgeList(page, limit);
    return c.json(response);
  } catch (error) {
    console.error('[API] get-knowledge-list error:', error);
    return c.json({ 
      error: 'Failed to initialize Dify service',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Create new dataset
api.post('/datasets', async (c) => {
  try {
    const rawBody = await c.req.json();
    const validationResult = safeParseCreateDatasetRequest(rawBody);
    
    if (!validationResult.success) {
      console.error('[API] create dataset - Invalid request body:', validationResult.error);
      return c.json({ 
        error: 'Validation failed',
        message: 'Invalid request data',
        details: validationResult.error.issues
      }, 400);
    }

    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.createDataset(validationResult.data);
    return c.json(response);
  } catch (error) {
    console.error('[API] create dataset error:', error);
    return c.json({ 
      error: 'Failed to create dataset',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get single dataset details
api.get('/datasets/:datasetId', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.getDataset(datasetId);
    return c.json(response);
  } catch (error) {
    console.error('[API] get dataset error:', error);
    return c.json({ 
      error: 'Failed to get dataset',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Delete dataset
api.delete('/datasets/:datasetId', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.deleteDataset(datasetId);
    return c.json(response);
  } catch (error) {
    console.error('[API] delete dataset error:', error);
    return c.json({ 
      error: 'Failed to delete dataset',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get documents in dataset
api.get('/datasets/:datasetId/documents', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.getDocuments(datasetId, page, limit);
    return c.json(response);
  } catch (error) {
    console.error('[API] get documents error:', error);
    return c.json({ 
      error: 'Failed to get documents',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Create document from text
api.post('/datasets/:datasetId/documents/text', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const rawBody = await c.req.json();
    const validationResult = safeParseCreateDocumentByTextRequest(rawBody);
    
    if (!validationResult.success) {
      console.error('[API] create document from text - Invalid request body:', validationResult.error);
      return c.json({ 
        error: 'Validation failed',
        message: 'Invalid request data',
        details: validationResult.error.issues
      }, 400);
    }
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.createDocumentByText(datasetId, validationResult.data);
    return c.json(response);
  } catch (error) {
    console.error('[API] create document from text error:', error);
    return c.json({ 
      error: 'Failed to create document from text',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Create document from file
api.post('/datasets/:datasetId/documents/file', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const formData = await c.req.formData();
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.createDocumentByFile(datasetId, formData);
    return c.json(response);
  } catch (error) {
    console.error('[API] create document from file error:', error);
    return c.json({ 
      error: 'Failed to create document from file',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update document with text
api.put('/datasets/:datasetId/documents/:documentId/text', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const documentId = c.req.param('documentId');
    const body = await c.req.json() as UpdateDocumentByTextRequest;
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.updateDocumentByText(datasetId, documentId, body);
    return c.json(response);
  } catch (error) {
    console.error('[API] update document with text error:', error);
    return c.json({ 
      error: 'Failed to update document with text',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update document with file
api.put('/datasets/:datasetId/documents/:documentId/file', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const documentId = c.req.param('documentId');
    const formData = await c.req.formData();
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.updateDocumentByFile(datasetId, documentId, formData);
    return c.json(response);
  } catch (error) {
    console.error('[API] update document with file error:', error);
    return c.json({ 
      error: 'Failed to update document with file',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get single document details
api.get('/datasets/:datasetId/documents/:documentId', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const documentId = c.req.param('documentId');
    const metadata = c.req.query('metadata') || 'all';
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.getSingleDocumentDetails(datasetId, documentId, metadata);
    return c.json(response);
  } catch (error) {
    console.error('[API] get document details error:', error);
    return c.json({ 
      error: 'Failed to get document details',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get document embedding status
api.get('/datasets/:datasetId/documents/:documentId/status', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const documentId = c.req.param('documentId');
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.getDocumentEmbeddingStatus(datasetId, documentId);
    return c.json(response);
  } catch (error) {
    console.error('[API] get document embedding status error:', error);
    return c.json({ 
      error: 'Failed to get document embedding status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Delete document
api.delete('/datasets/:datasetId/documents/:documentId', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const documentId = c.req.param('documentId');
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.deleteDocument(datasetId, documentId);
    return c.json(response);
  } catch (error) {
    console.error('[API] delete document error:', error);
    return c.json({ 
      error: 'Failed to delete document',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get document segments (chunks)
api.get('/datasets/:datasetId/documents/:documentId/segments', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const documentId = c.req.param('documentId');
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.getDocumentSegments(datasetId, documentId);
    return c.json(response);
  } catch (error) {
    console.error('[API] get document segments error:', error);
    return c.json({ 
      error: 'Failed to get document segments',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Create document segments
api.post('/datasets/:datasetId/documents/:documentId/segments', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const documentId = c.req.param('documentId');
    const body = await c.req.json() as CreateSegmentRequest;
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.createDocumentSegments(datasetId, documentId, body);
    return c.json(response);
  } catch (error) {
    console.error('[API] create document segments error:', error);
    return c.json({ 
      error: 'Failed to create document segments',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update document segment
api.post('/datasets/:datasetId/documents/:documentId/segments/:segmentId', async (c) => { 
  try {
    const datasetId = c.req.param('datasetId');
    const documentId = c.req.param('documentId');
    const segmentId = c.req.param('segmentId');
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.updateDocumentSegment(datasetId, documentId, segmentId);
    return c.json(response);
  } catch (error) {
    console.error('[API] update document segment error:', error);
    return c.json({ 
      error: 'Failed to update document segment',
    }, 500);
  }
});

// Delete document segment
api.delete('/datasets/:datasetId/documents/:documentId/segments/:segmentId', async (c) => {
  try {
    const datasetId = c.req.param('datasetId');
    const documentId = c.req.param('documentId');
    const segmentId = c.req.param('segmentId');
    
    const difyService = createDifyService(c.env, "knowledge");
    const response = await difyService.deleteDocumentSegment(datasetId, documentId, segmentId);
    return c.json(response);
  } catch (error) {
    console.error('[API] delete document segment error:', error);
    return c.json({ 
      error: 'Failed to delete document segment',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Chat History Endpoints
api.get('/chat/messages', async (c) => {
  try {
    const db = c.get("db");
    
    // Parse query parameters with validation
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const conversation_id = c.req.query('conversation_id');
    const user_id = c.req.query('user_id');
    
    // Validate parameters using Zod
    const validationResult = ChatHistoryListRequestSchema.safeParse({
      limit,
      offset,
      conversation_id,
      user_id
    });
    
    if (!validationResult.success) {
      return c.json({ 
        success: false,
        error: 'Invalid query parameters',
        details: validationResult.error.issues
      }, 400);
    }
    
    // Build WHERE conditions dynamically
    const whereConditions = [];
    if (conversation_id) {
      whereConditions.push(eq(lineMessages.conversation_id, conversation_id));
    }
    if (user_id) {
      whereConditions.push(eq(lineMessages.user_id, user_id));
    }
    
    // Get total count
    const totalResult = await db.select()
      .from(lineMessages)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    // Get paginated messages
    const messages = await db.select()
      .from(lineMessages)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(lineMessages.created_at))
      .limit(limit)
      .offset(offset);
    
    return c.json({
      success: true,
      data: {
        messages,
        total: totalResult.length,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('[API] get chat messages error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to get chat messages',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get single message by ID
api.get('/chat/messages/:id', async (c) => {
  try {
    const db = c.get("db");
    const messageId = parseInt(c.req.param('id'));
    
    if (isNaN(messageId)) {
      return c.json({ 
        success: false,
        error: 'Invalid message ID' 
      }, 400);
    }
    
    const message = await db.select()
      .from(lineMessages)
      .where(eq(lineMessages.id, messageId))
      .limit(1);
    
    if (message.length === 0) {
      return c.json({ 
        success: false,
        error: 'Message not found' 
      }, 404);
    }
    
    return c.json({
      success: true,
      data: message[0]
    });
  } catch (error) {
    console.error('[API] get single message error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to get message',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Mount API routes under /api prefix
app.route('/api', api);

export default app;

export { LineMessageWorkflow };