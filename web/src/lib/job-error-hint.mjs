// Classifies WHY a worker job ended in error and picks the matching hint.
// Reads ONLY the job's terminal step label — the exact, structured message
// job-store.tsx (client) or /api/run (server) set when the run ended — never
// the free-form assistant output. Scanning accumulated assistant text used to
// false-positive: career-ops evaluates AI/tech job postings, so the output
// routinely contains words like "credential", "sign-in", "authenticate" as
// ordinary JD/CV prose, unrelated to whether the CLI itself is signed in.
//
// Terminal labels this classifies against (see job-store.tsx / api/run/route.ts):
//   Real not-configured / auth failure -> "auth":
//     "No CLI configured — open Config"                                   (job-store.tsx, no cliId)
//     raw CLI stderr matched for auth keywords                            (api/run/route.ts stderr handler)
//     "The CLI exited with an error — is it installed and authenticated?"
//     "The CLI produced no output — is it installed and authenticated? (...)"
//   Connection dropped mid-stream, CLI never got a chance to fail -> "connection":
//     "Connection error"                                                  (job-store.tsx)
//   Page reload orphaned a running job -> "interrupted":
//     "Interrupted (page reloaded)"                                       (job-store.tsx restore effect)
//   Everything else (bad input, missing CV, no report written, etc.) -> null;
//   the error text itself is the explanation.

// "auth" as a bare substring matched inside unrelated words like "author" —
// career-ops evaluates AI/tech job postings, so a terminal label can
// legitimately read something like "Failed to parse author metadata".
// authenticat\w* matches authenticate/authenticated/authentication (the
// actual terminal-label forms listed above) without matching author/authority.
const AUTH_PATTERN =
  /authenticat\w*|login|sign[ -]?in|credential|api[ -]?key|unauthorized|no cli configured/i;

const HINTS = {
  auth: { kind: "auth", text: "请先在设置中确认 AI 工具的登录与配置。" },
  connection: { kind: "connection", text: "与本地服务的连接中断，请先检查服务状态。" },
  interrupted: { kind: "interrupted", text: "页面重载中断了任务，请先检查已有产物，避免重复执行。" },
  policy: { kind: "policy", text: "AI 服务因使用政策拒绝了本次请求，并非招聘接口报错。请查看原始错误与服务政策；不会自动重试。" },
};

/** The message set on the job's last step — the authoritative terminal cause. */
function lastStepLabel(job) {
  if (!job || job.status !== "error") return "";
  const steps = job.steps || [];
  return steps[steps.length - 1]?.label ?? "";
}

/** Pick the hint (or null) for an errored job, based on its terminal label only. */
export function jobErrorHint(job) {
  const label = lastStepLabel(job);
  if (!label) return null;
  if (/violate.*usage policy|usage policy.*viola/i.test(label)) return HINTS.policy;
  if (label === "Connection error" || label === "连接失败") return HINTS.connection;
  if (label === "Interrupted (page reloaded)" || label === "页面重新加载，任务已中断") return HINTS.interrupted;
  if (AUTH_PATTERN.test(label)) return HINTS.auth;
  return null;
}

// Legacy adapter runs used a quality score for a workflow stage. Keep their
// raw output intact, but do not present pending acceptance as a job rating.
export function adapterPendingHint(job) {
  if (job?.kind !== "adapt-provider") return null;
  if (job.status === 'awaiting_review' || (job.status === 'error' && /^待审核 · 未安装[:：]/.test(lastStepLabel(job)))) {
    return { title: '等待路线审核 · 未安装', text: '已发现新的招聘入口或域名，需要你核对后批准。这不是抓取失败；无需重新适配，审核后续接原候选。', href: job.input ? '/portals?adapter=' + encodeURIComponent(job.input) : '/portals' };
  }
  if (job.status !== "done") return null;
  if (!/awaiting activation acceptance/i.test(job.result?.summary ?? "")) return null;
  return { title: "待验收 · 未启用", text: "Agent 已结束，适配器尚未验收启用。请查看输出和 ACCEPTANCE.md；登录、真实岗位及详情链接验证未通过前，不可启用。" };
}
