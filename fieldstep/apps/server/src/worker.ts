import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./db.js";
import { authRoutes } from "./routes/auth.js";
import { orgRoutes } from "./routes/org.js";
import { crmRoutes } from "./routes/crm.js";
import { workOrderRoutes } from "./routes/workorders.js";
import { publicRoutes } from "./routes/public.js";
import { billingRoutes } from "./routes/billing.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { notificationRoutes } from "./routes/notifications.js";

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: ["https://field.toris.kr", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/health", (c) => c.json({ ok: true, service: "fieldstep-api" }));

app.route("/", authRoutes);
app.route("/", orgRoutes);
app.route("/", crmRoutes);
app.route("/", workOrderRoutes);
app.route("/", publicRoutes);
app.route("/", billingRoutes);
app.route("/", dashboardRoutes);
app.route("/", notificationRoutes);

// 미매칭 라우트 — 일관된 JSON 404
app.notFound((c) => c.json({ error: "요청한 리소스를 찾을 수 없습니다" }, 404));

// 처리되지 않은 예외 — 내부 정보는 서버 로그에만, 클라이언트에는 일반 메시지
app.onError((err, c) => {
  console.error("[fieldstep-api] unhandled error:", err instanceof Error ? err.stack ?? err.message : err);
  return c.json({ error: "서버 오류가 발생했습니다" }, 500);
});

export default app;
