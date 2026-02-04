import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { app as apiApp } from "@blackwall/backend";

interface ServeOptions {
  port: string;
  publicDir: string;
}

export async function serve(options: ServeOptions) {
  const port = parseInt(options.port, 10);
  const publicDir = options.publicDir;

  // Create a new app that combines API routes with static file serving
  const app = new Hono();

  // Mount the API
  app.route("/", apiApp);

  // Serve static files from public directory
  app.use("/*", serveStatic({ root: publicDir }));

  // Fallback to index.html for SPA routing
  app.get("/*", serveStatic({ path: `${publicDir}/index.html` }));

  console.log(`Starting Blackwall server on port ${port}`);
  console.log(`Serving static files from ${publicDir}`);

  Bun.serve({
    port,
    fetch: app.fetch,
  });
}
