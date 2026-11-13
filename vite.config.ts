import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { createInterpretHandler } from "./server/interpret";

export default defineConfig({
  server: {
    fs: {
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/gemini.local.json"],
    },
  },
  plugins: [react(), {
    name: "local-interpret-api",
    configureServer(server) {
      const localConfigPath = resolve(server.config.root, "gemini.local.json");
      let localConfig: { GEMINI_API_KEY?: string; GEMINI_MODEL?: string } = {};
      if (existsSync(localConfigPath)) {
        let value: unknown;
        try {
          value = JSON.parse(readFileSync(localConfigPath, "utf8"));
        } catch (error) {
          if (error instanceof SyntaxError) throw new Error("gemini.local.json: JSON khong hop le. Kiem tra dau ngoac kep va dau phay.");
          throw error;
        }
        const parsed = z.object({
          GEMINI_API_KEY: z.string().trim(),
          GEMINI_MODEL: z.string().trim().optional(),
        }).strict().safeParse(value);
        if (!parsed.success) throw new Error("gemini.local.json: GEMINI_API_KEY va GEMINI_MODEL phai la chuoi, khong them truong khac.");
        localConfig = parsed.data;
      }
      const interpret = createInterpretHandler({
        env: {
          GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim() || localConfig.GEMINI_API_KEY,
          GEMINI_MODEL: process.env.GEMINI_MODEL?.trim() || localConfig.GEMINI_MODEL,
        },
      });
      server.middlewares.use("/api/interpret", async (incoming, outgoing) => {
        try {
          const chunks: Buffer[] = [];
          let length = 0;
          for await (const chunk of incoming) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            length += buffer.byteLength;
            if (length > 4096) {
              outgoing.writeHead(413, { "Content-Type": "application/json", "Cache-Control": "no-store" });
              outgoing.end(JSON.stringify({ error: "Yêu cầu quá lớn.", code: "BODY_TOO_LARGE" }));
              return;
            }
            chunks.push(buffer);
          }
          const headers = new Headers();
          for (const [name, value] of Object.entries(incoming.headers)) {
            if (value) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
          }
          const method = incoming.method ?? "GET";
          const request = new Request(`http://${incoming.headers.host}/api/interpret`, {
            method,
            headers,
            body: method === "GET" || method === "HEAD" ? undefined : Buffer.concat(chunks),
          });
          const response = await interpret(request);
          outgoing.writeHead(response.status, Object.fromEntries(response.headers));
          outgoing.end(await response.text());
        } catch {
          console.error("Local interpretation adapter failed");
          outgoing.writeHead(500, { "Content-Type": "application/json", "Cache-Control": "no-store" });
          outgoing.end(JSON.stringify({ error: "Không thể kết nối API local.", code: "LOCAL_API_ERROR" }));
        }
      });
    },
  }],
});
