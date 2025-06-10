/**
 * LLM Chat Application Template
 *
 * A simple chat application using Cloudflare Workers AI.
 * This template demonstrates how to implement an LLM-powered chat interface with
 * streaming responses using Server-Sent Events (SSE).
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

// Model ID for Workers AI model
// https://developers.cloudflare.com/workers-ai/models/
const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

// Enhanced system prompt for coding and technical knowledge
const SYSTEM_PROMPT = `You are a highly knowledgeable AI coding assistant with expertise in programming, software development, and technical problem-solving.

Your capabilities include:
- Writing clean, efficient code in multiple programming languages (JavaScript, TypeScript, Python, Go, Rust, Java, C#, C++, etc.)
- Explaining complex technical concepts in a clear, concise manner
- Debugging code issues and suggesting optimizations
- Providing best practices for software architecture and design patterns
- Explaining modern technologies, frameworks, and libraries
- Helping with algorithms and data structures

When sharing code:
- Always format code blocks with proper syntax highlighting using markdown triple backticks with the language specified
- Include helpful comments to explain the code
- Provide explanations of how the code works
- Consider edge cases and potential improvements

For technical explanations:
- Use clear, structured responses with headings and bullet points when appropriate
- Include examples to illustrate concepts
- Link to relevant documentation when helpful

Be accurate, helpful, and prioritize clean, maintainable solutions.`;

export default {
  /**
   * Main request handler for the Worker
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle static assets (frontend)
    if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    // API Routes
    if (url.pathname === "/api/chat") {
      // Handle POST requests for chat
      if (request.method === "POST") {
        return handleChatRequest(request, env);
      }

      // Method not allowed for other request types
      return new Response("Method not allowed", { status: 405 });
    }

    // Handle 404 for unmatched routes
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

/**
 * Handles chat API requests
 */
async function handleChatRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    // Parse JSON request body
    const { messages = [] } = (await request.json()) as {
      messages: ChatMessage[];
    };

    // Add system prompt if not present
    if (!messages.some((msg) => msg.role === "system")) {
      messages.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    const response = await env.AI.run(
      MODEL_ID,
      {
      messages,
      max_tokens: 1024,
      temperature: 0.7, // Slightly lower temperature for more precise coding responses
      },
      {
      returnRawResponse: true,
      gateway: {
        id: "829921384c97e0dbbb34430e307d6b52", // AI Gateway ID
        skipCache: false,      // Set to true to bypass cache
        cacheTtl: 3600,        // Cache time-to-live in seconds
      },
      },
    );

    // Return streaming response
    return response;
  } catch (error) {
    console.error("Error processing chat request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
