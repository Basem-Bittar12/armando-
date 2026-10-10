/**
 * نقطة دخول Worker «armando-ops» — الشرح الكامل في ops.ts.
 * (ملف الدخول لا يصدّر إلا المعالج نفسه: Workers يرفض أي تصدير آخر من الملف الرئيسي)
 */
import { backup, ping, type Env, type ExecutionContext, type ScheduledController } from "./ops";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    // كل تشغيل (يومي أو أسبوعي) فيه قراءة صغيرة؛ النسخة الكاملة فقط مع cron الأسبوعي
    const work = async () => {
      const result = await ping(env);
      console.log(`[ops] ping ok (${result.status})`);
      if (controller.cron === env.BACKUP_CRON) {
        const saved = await backup(env, new Date(controller.scheduledTime));
        console.log(`[ops] backup ${saved.key}: ${saved.rows} rows, ${saved.bytes} bytes, removed ${saved.deleted.length}`);
      }
    };
    ctx.waitUntil(work());
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const authorized = Boolean(env.OPS_TOKEN) && request.headers.get("authorization") === `Bearer ${env.OPS_TOKEN}`;
    if (!authorized || url.pathname !== "/run" || request.method !== "POST") return new Response("Not found", { status: 404 });
    try {
      const task = url.searchParams.get("task");
      if (task === "ping") return json({ task, ...(await ping(env)) });
      if (task === "backup") return json({ task, ...(await backup(env)) });
      return json({ error: "task must be ping or backup" }, 400);
    } catch (error) {
      return json({ error: (error as Error).message }, 500);
    }
  },
};
