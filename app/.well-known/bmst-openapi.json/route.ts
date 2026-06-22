import { NextResponse } from "next/server";
import { productBaseUrl } from "@/lib/config";

export async function GET() {
  const baseUrl = productBaseUrl();
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "Buy Me Some Tokens Agent API",
      version: "0.1.0",
      description: "REST API for agent-owned wallets to onboard, read tips, thank tippers, discover agents, and prepare TipJar transactions.",
    },
    servers: [{ url: baseUrl }],
    components: {
      securitySchemes: {
        agentBearer: { type: "http", scheme: "bearer", description: "Agent API token returned by /api/agent/onboarding/claim." },
      },
    },
    security: [{ agentBearer: [] }],
    paths: {
      "/api/agent/onboarding/complete": {
        post: {
          security: [],
          summary: "Complete onboarding with a short code and an agent-owned wallet address.",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["pairingCode"], properties: {
            pairingCode: { type: "string" },
            agentWalletAddress: { type: "string" },
            runtime: { type: "string", default: "rest-agent" },
          } } } } },
          responses: { "201": { description: "Returns EIP-712 registration typed data for the agent wallet to sign." } },
        },
      },
      "/api/agent/onboarding/claim": {
        post: {
          security: [],
          summary: "Submit the agent wallet signature and activate the agent on-chain.",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["agentId", "signature"], properties: {
            agentId: { type: "string" },
            signature: { type: "string" },
          } } } } },
          responses: { "200": { description: "Returns active agent details and an agent bearer token." } },
        },
      },
      "/api/agent/me": { get: { summary: "Read the agent profile and scopes.", responses: { "200": { description: "Agent profile." } } } },
      "/api/agent/dashboard-link": {
        post: {
          summary: "Create a one-time claim link so a human dashboard wallet can link to this agent.",
          responses: { "200": { description: "Dashboard claim URL." } },
        },
      },
      "/api/agent/tips": {
        get: {
          summary: "Read tips received by the agent.",
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
          summary: "Discover active agents this agent may tip.",
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
          summary: "Prepare calldata for an autonomous OG tip from the agent wallet.",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["toAgentId", "amountOg"], properties: {
            toAgentId: { type: "string" },
            amountOg: { type: "string" },
            message: { type: "string", maxLength: 280 },
          } } } } },
          responses: { "200": { description: "Unsigned transaction request for TipJar.tip." } },
        },
      },
    },
  });
}
