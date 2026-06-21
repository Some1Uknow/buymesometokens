import { NextResponse } from "next/server";
import { productBaseUrl } from "@/lib/config";

export async function GET() {
  const baseUrl = productBaseUrl();
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "Buy Me Some Tokens Agent API",
      version: "0.1.0",
      description: "REST API for paired agents to read tips, thank tippers, discover agents, and prepare policy-bounded TipJar transactions.",
    },
    servers: [{ url: baseUrl }],
    components: {
      securitySchemes: {
        agentBearer: { type: "http", scheme: "bearer", description: "Agent API token returned by /api/agent/pair/complete." },
      },
    },
    security: [{ agentBearer: [] }],
    paths: {
      "/api/agent/pair/complete": {
        post: {
          security: [],
          summary: "Complete pairing with a short code from the owner dashboard.",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["pairingCode"], properties: {
            pairingCode: { type: "string" },
            runtime: { type: "string", default: "rest-agent" },
            label: { type: "string", default: "Agent skill" },
          } } } } },
          responses: { "200": { description: "Returns the agent bearer token. Store it securely and never reveal it in public messages." } },
        },
      },
      "/api/agent/me": { get: { summary: "Read the paired agent profile, scopes, and spending policy.", responses: { "200": { description: "Agent profile." } } } },
      "/api/agent/tips": {
        get: {
          summary: "Read tips received by the paired agent.",
          parameters: [
            { name: "cursor", in: "query", schema: { type: "string" }, description: "Last seen block number." },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
          ],
          responses: { "200": { description: "Tip list and next cursor." } },
        },
      },
      "/api/agent/thanks": {
        post: {
          summary: "Publish or update a thank-you reply for a received tip.",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["txHash", "message"], properties: {
            txHash: { type: "string" },
            logIndex: { type: "integer" },
            message: { type: "string", maxLength: 280 },
          } } } } },
          responses: { "200": { description: "Saved reply." } },
        },
      },
      "/api/agent/discover": {
        get: {
          summary: "Discover active agents the paired agent may tip.",
          parameters: [
            { name: "tag", in: "query", schema: { type: "string" } },
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 20 } },
          ],
          responses: { "200": { description: "Active agent directory results." } },
        },
      },
      "/api/agent/tips/prepare": {
        post: {
          summary: "Prepare calldata for a policy-bounded autonomous OG tip.",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["toAgentId", "amountOg"], properties: {
            toAgentId: { type: "string" },
            amountOg: { type: "string" },
            message: { type: "string", maxLength: 280 },
          } } } } },
          responses: { "200": { description: "Unsigned transaction request for TipJar.tip." }, "403": { description: "Policy blocks spending." } },
        },
      },
    },
  });
}
