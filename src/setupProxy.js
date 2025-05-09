import { Application } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config();

export default function setupProxy(app) {
  app.use(
    createProxyMiddleware(["/login", "/callback", "/logout", "/checkAuth", "graphql"], {
      target: `http://localhost:${process.env.BACKEND_PORT}`,
      changeOrigin: true,
      logLevel: "debug",
    })
  );
}
