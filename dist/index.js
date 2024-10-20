// src/corsHandler.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400"
};
function handleCors(request, response) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || ""
      }
    });
  }
  if (response) {
    const newResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });
    return newResponse;
  }
  throw new Error("handleCors was called without a response object on a non-OPTIONS request");
}

// src/index.ts
var src_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return handleCors(request);
    }
    try {
      const url = new URL(request.url);
      const prompt = url.searchParams.get("prompt");
      const numSteps = parseInt(url.searchParams.get("num_steps") || "4", 10);
      if (!prompt) {
        return handleCors(request, new Response("Missing prompt parameter", { status: 400 }));
      }
      if (!env.AI) {
        console.error("AI binding is undefined");
        return handleCors(request, new Response("AI binding is not available", { status: 500 }));
      }
      const inputs = {
        prompt,
        num_steps: Math.min(Math.max(numSteps, 1), 8)
      };
      console.log("Attempting to run AI model with inputs:", inputs);
      const result = await env.AI.run(
        "@cf/black-forest-labs/flux-1-schnell",
        inputs
      );
      const imageBuffer = Buffer.from(result.image, "base64");
      return handleCors(request, new Response(imageBuffer, {
        headers: {
          "Content-Type": "image/jpeg"
        }
      }));
    } catch (error) {
      console.error("Error in Worker:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      return handleCors(request, new Response(`Error generating image: ${errorMessage}`, { status: 500 }));
    }
  }
};
export {
  src_default as default
};
