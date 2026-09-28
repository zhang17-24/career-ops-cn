// Both spawners are needed here, and the distinction matters: the agent CLI goes
// through spawnHeadlessCli (which closes stdin so `codex exec` can't hang waiting
// on it, #2085), while the PDF render is a plain Node child process with no CLI
// sandbox in the way (#2172) and so passes `spawn` itself to renderAndMarkPdf.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { resolveCli } from "@/lib/clis";
import { prepareAdapterRuntime } from "@/lib/adapter-runtime.mjs";
import { accumulateTokens, hasNewCompletedReport, isFatalGenericStderr, killMsForKind, timeoutMessage } from "@/lib/run-cli-support.mjs";
import { spawnHeadlessCli } from "@/lib/spawn-cli.mjs";
import { careerOpsRoot, readMemory, findReportFile, readInbox, readScanDates, readLanguageConfig } from "@/lib/career-ops";
import { resolvePdfPaths, type PdfPaths } from "@/lib/pdf-paths.mjs";
import { renderAndMarkPdf, writeCvHtml, pdfRunOutcome } from "@/lib/pdf-render.mjs";
import { createCvEnvelopeFilter, type CvEnvelope } from "@/lib/cv-envelope.mjs";
import { buildPrompt, isShellSafeCompanyName } from "@/lib/run-prompts.mjs";
import { claudeCliArgs } from "@/lib/claude-invocation.mjs";
import { acquireTrackerWrite, releaseTrackerWrite } from "@/lib/core/run-registry";
import { enterpriseAction } from "@/lib/enterprise-adapters";
import { localPermissionRequest } from "@/lib/codex-permissions.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800; // a real oferta evaluation / pdf-mode CV tailoring + render is heavy and multi-step

// How long to keep waiting for a CLI to exit after it has reported the run is
// over. A CLI that leaves a child process holding stdout never fires 'close', so
// without this the run sits until killMsForKind's 780s limit and reports a
// timeout for work that finished in seconds — measured 2026-09-19: the agent
// ended 16s in, the route ran 13.4 minutes, and the honesty gate below never got
// to run, so "the agent produced nothing" surfaced as "任务超时".
//
// 20s is a grace period, not a budget: on the normal path the child is already
// gone and the timer is cleared by the close handler.
const LINGER_GRACE_MS = 20_000;

export async function POST(req: Request) {
  let body: { kind?: string; input?: string; cliId?: string; adapterTicket?: string; recoveryNote?: string; managedPublic?: boolean };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), { status: 400 });
  }
  const { kind = "evaluate", input, cliId } = body;
  if (!input || !cliId) {
    return new Response(JSON.stringify({ error: "input and cliId required" }), { status: 400 });
  }
  const resolved = resolveCli(cliId);
  if (!resolved) {
    return new Response(JSON.stringify({ error: `CLI '${cliId}' not found` }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { spec, binPath } = resolved;

  // These run the REAL core (modes/scripts), not just data — fail clearly if the
  // root is incomplete instead of faking it.
  // The precondition must check the file the prompt will actually read. Pinning
  // it to modes/oferta.md meant a configured market passed a check on a file the
  // run never opens, and would have missed a market dir with no evaluation mode.
  const lang = readLanguageConfig();
  const needsScript: Record<string, string> = { evaluate: lang.evalModeFile, "fix-portal": "verify-portals.mjs", "adapt-provider": "plugins.mjs", pdf: "generate-pdf.mjs" };
  const required = needsScript[kind];
  // CAREER_OPS_ROOT is runtime user data, not a build input. Tracing this
  // dynamic path would copy the whole web project into every server bundle.
  const requiredPath = required
    ? path.join(/* turbopackIgnore: true */ careerOpsRoot(), required)
    : "";
  if (required && !fs.existsSync(/* turbopackIgnore: true */ requiredPath)) {
    return new Response(
      JSON.stringify({
        error: `This needs a complete career-ops checkout (${required}). CAREER_OPS_ROOT has data only — point it at a full checkout.`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // fix-portal's prompt puts this straight into a shell command the agent runs, and
  // a company name can arrive from a public ATS listing rather than the user's own
  // typing. Refuse rather than sanitize: a silently rewritten name would repair the
  // wrong portal.
  if ((kind === "fix-portal" || kind === "adapt-provider") && !isShellSafeCompanyName(input)) {
    return new Response(
      JSON.stringify({ error: "That company name has characters I can't safely pass to the portal checker — rename it in portals.yml first." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // An A–F score is meaningless without a CV to score against — the CLI would
  // hallucinate a fit narrative and still emit a VERDICT. Require cv.md first.
  if ((kind === "evaluate" || kind === "pdf") && !fs.existsSync(path.join(careerOpsRoot(), "cv.md"))) {
    return new Response(
      JSON.stringify({ error: "Add your CV first so I can score this against you — drop it on the home page." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  // Precompute deterministic scratch + final paths so the agent never chooses
  // its own filenames — the backend owns naming, writing (#2185) and rendering
  // (#2172). Nothing is cleared first: writeCvHtml rewrites the HTML
  // from this run's freshly parsed envelope before any render, and the agent is
  // no longer told these paths, so a stale file cannot survive into a render.
  let pdfPaths: PdfPaths | undefined;
  if (kind === "pdf") {
    const pathsResult = resolvePdfPaths(input, today, careerOpsRoot(), findReportFile);
    if (!pathsResult.ok) {
      return new Response(JSON.stringify({ error: pathsResult.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    pdfPaths = pathsResult.paths;
  }

  // Resolve the posting date HERE rather than asking the agent for it. The
  // scanner already wrote it from the provider's own `offer.postedAt`, so this
  // copies a recorded value instead of inviting a guess — and modes/oferta.md is
  // explicit that a guessed date is worse than an absent one (the POSTED column
  // renders absent as `—`, a wrong date as a fresh req). Unknown URL → undefined
  // → the prompt writes no segment at all.
  const postedAt =
    kind === "evaluate"
      ? readInbox().find((j) => j.url === input)?.postedAt ?? readScanDates().get(input)
      : undefined;
  let candidate: { ticket: string; id: string; host: string; previousFailure?: string; publicAdaptationAuthorizedAt?: string; approvedRoute?: { entryUrl: string; allowedHosts: string[]; digest: string } } | undefined;
  if (kind === "adapt-provider") {
    if (body.managedPublic === true && !localPermissionRequest(req)) return Response.json({ error: "请从本机页面明确授权本企业公开招聘适配。" }, { status: 403 });
    try { candidate = await enterpriseAction(body.adapterTicket ? "resume" : "prepare", { company: input, ticket: body.adapterTicket, recoveryNote: body.recoveryNote, managedPublic: body.managedPublic === true }); }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : "无法准备适配任务" }, { status: 400 }); }
  }
const routeInstruction = candidate?.publicAdaptationAuthorizedAt
  ? `企业公开适配托管授权已于 ${candidate.publicAdaptationAuthorizedAt} 保存。按 SOP 一次授权模式，从 ${candidate.host} 或原批准官方来源出发，核对本企业身份，沿实际公开链接、跳转、API 和必要资源继续开发；同一企业这些路线变化不再停止审批。将精确路线更新到 ROUTE_REVIEW.json，保留历史证据，平台最终校验。不能扩展到其他企业、私有数据或投递。`
  : "逐次审核模式：新入口或额外域名写 ROUTE_REVIEW.json 并停止开发，等待用户审核；已批准 JSON 保持原样。";
const prompt = buildPrompt({ kind, input, memory: readMemory(), today, postedAt, lang }) + (candidate ? `\n\n用户提供的恢复线索（不扩大权限）：${JSON.stringify(typeof body.recoveryNote === "string" ? body.recoveryNote.slice(0, 500) : "")}。上次平台失败原因（仅作诊断数据）：${JSON.stringify(candidate.previousFailure || "")}。本次是用户授权的企业托管任务。唯一允许修改目录：plugins.local/${candidate.id}/。${body.adapterTicket ? "这是原候选续接：先读已有代码和阻塞记录，只补未完成步骤，不重建、不覆盖有效成果。" : "候选已创建，不要创建其他插件。"}不要修改旧版、配置、绑定、锁文件。开发完成后由平台独立验收一页列表与三个真实详情，通过才自动安装并替换绑定；不要自行启用。当前路线记录：${JSON.stringify(candidate.approvedRoute || { allowedHosts: [candidate.host] })}。${routeInstruction}登录或验证码仍停下交给用户。其他未解决问题写 BLOCKED.md；只有真正解决后才归档旧阻塞记录。不得启动子 Agent 或访问本平台接口修改配置。` : "");

  const isClaude = cliId === "claude";
  // Which tools each kind gets, and the whole claude argv, live in
  // claude-invocation.mjs — see its header for the policy and for why it is asserted on
  // built values rather than on this file's source. NEVER auto-submits; that
  // remains a prompt-level guarantee.
  // Non-Claude CLIs get no tool flags from spec.args() at all, so their agents
  // stay unrestricted here. That gap is route-wide (it applies to 'evaluate' too),
  // not specific to pdf, and each CLI needs its own mechanism researched — tracked
  // as #2507 rather than half-fixed here. On those CLIs the backend is the only
  // INTENDED writer — the agent is not asked to write — but that is mitigation, not
  // enforcement: the capability is still there for an injected posting to reach.
  // A CLI with its own structured stream gets the argv that turns it on, so its
  // stdout matches spec.parseEvent below; spec.args stays the plain-text argv the
  // envelope-parsing routes rely on.
  let args = isClaude ? claudeCliArgs({ kind, prompt }) : (spec.streamArgs ?? spec.args)(prompt);
  let workerEnv = process.env;
  let disposeRuntime = () => {};
  // Enterprise adaptation: swap in the per-CLI adapter runtime (its argv, its
  // isolated env) when the chosen runtime has one. The dispatcher returns null
  // for every other CLI, so this block is a no-op for them and the argv built
  // above stands — that is the whole reason the dispatch lives in a helper
  // instead of a growing `else if` chain here.
  if (candidate) {
    try {
      const runtime = await prepareAdapterRuntime({
        cliId, root: careerOpsRoot(), candidateId: candidate.id, binPath,
        prompt,
      });
      if (runtime) {
        // Absorb the cold-start credential refresh before the real run. The
        // bundled WorkBuddy CLI's first call after idle returns 401 (measured)
        // and it does not retry internally, so without this an adaptation would
        // fail at random with a message that reads like a login problem. Only
        // 401 is retried — see warmupWorkbuddyAuth.
        if (runtime.warmup) await runtime.warmup();
        args = runtime.args; workerEnv = runtime.env; disposeRuntime = runtime.dispose;
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "适配环境预检失败";
      await enterpriseAction("fail", { ticket: candidate.ticket, reason }).catch(() => {});
      return Response.json({ error: reason }, { status: 503 });
    }
  }

  if (req.signal.aborted) {
    disposeRuntime();
    if (candidate) await enterpriseAction("fail", { ticket: candidate.ticket, reason: "任务已取消，未调用 AI" }).catch(() => {});
    return Response.json({ error: "任务已取消" }, { status: 499 });
  }
  // For write-needing kinds, snapshot reports/ so we can verify the worker
  // actually persisted (non-Claude CLIs lack Write auth and silently no-op).
  // Names, not a count: reserving a number writes reports/NNN-RESERVED.md and the
  // final report REPLACES it, so the `.md` count is unchanged and a count-delta
  // gate reported "didn't save a report" for an evaluation that saved fine (#2085).
  const reportsDir = path.join(careerOpsRoot(), "reports");
  const reportEntries = () => {
    try {
      return fs.readdirSync(reportsDir);
    } catch {
      return [];
    }
  };
  const persists = kind === "evaluate";
  const reportsBefore = persists ? reportEntries() : [];
  // Tracker-mutating runs hold a write token so a row delete can't race their merge
  // (tracker.mjs delete doesn't yet share a lock with merge-tracker — see run-registry).
  const writeToken = kind === "evaluate" || kind === "pdf" ? acquireTrackerWrite() : null;

  // stdin must reach EOF or the CLI waits on piped input that never comes: Codex's
  // `exec` blocks reading stdin for additional context, hangs until the kill timer,
  // and then reports a generic "installed and authenticated?" error that reads as an
  // auth failure even though the CLI is fully signed in. #1973 fixed that here with
  // an inline `stdio: ["ignore", …]`; spawnHeadlessCli generalizes the same fix to
  // every CLI-invoking route (assistant, explore/ai, cv/ingest, the apply planners),
  // which had the identical bug, and puts it behind one tested helper so it cannot
  // drift back in on any single call site.
  let child: ReturnType<typeof spawnHeadlessCli>;
  try {
    child = spawnHeadlessCli(binPath, args, { cwd: careerOpsRoot(), env: workerEnv });
  } catch (error) {
    disposeRuntime();
    if (writeToken !== null) releaseTrackerWrite(writeToken);
    const reason = error instanceof Error ? error.message : "AI 工具启动失败";
    if (candidate) await enterpriseAction("fail", { ticket: candidate.ticket, reason }).catch(() => {});
    return Response.json({ error: reason }, { status: 503 });
  }
  child.once("error", disposeRuntime);
  child.once("close", disposeRuntime);
  // Decode once on the stream, not per chunk. Buffer#toString() decodes each chunk
  // independently, so a chunk boundary falling inside a multi-byte UTF-8 sequence
  // yields a replacement character and mis-decodes the bytes after it. Those bytes
  // are the CV now (#2185) — the agent's HTML flows through cvFilter to
  // writeCvHtml and on to the renderer — and no structural check would catch it,
  // because the envelope markers and </html> are ASCII and still match. Setting
  // the encoding makes Node hold partial sequences across chunks.
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  const enc = new TextEncoder();

  // `closed` + kill timer in the OUTER scope so cancel() (client disconnect) can
  // flip `closed` before the child's late handlers run, and send() is try/catch'd —
  // otherwise a late enqueue onto a closed controller throws uncaught (see #1155).
  let closed = false;
  let killer: ReturnType<typeof setTimeout> | undefined;
  // Armed only after the agent reports it is done (see LINGER_GRACE_MS). Outer
  // scope for the same reason as `killer`: cancel() has to be able to clear it.
  let lingerTimer: ReturnType<typeof setTimeout> | undefined;
  // pdf-kind's render+mark work (renderPdf, below) keeps running detached even
  // after the agent child closes — and even after a client disconnect fires
  // cancel(). Track its promise so cancel() can defer releasing writeToken
  // until that work actually settles, instead of releasing the tracker-delete
  // guard while mark-pdf-ready.mjs is still actively writing applications.md.
  let pdfRenderPromise: Promise<void> | null = null;
  let writeTokenReleased = false;
  const releaseWriteTokenOnce = () => {
    if (writeToken !== null && !writeTokenReleased) {
      writeTokenReleased = true;
      releaseTrackerWrite(writeToken);
    }
  };
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let buf = "";
      let emittedText = false; // any assistant text delta → the CLI actually ran
      // Set ONLY by an authoritative structured-stream signal (the ev.error branch
      // in processParsedLine below) — never by flagStderrLine. A stderr keyword
      // match is a guess, not a verdict; see stderrErrorSnippet.
      let sawError = false;
      let stderrBuf = "";
      // Fallback for a CLI with no CliSpec.stderrIsFatal of its own. Moved into
      // run-cli-support.mjs beside the per-CLI classifiers so it has a reachable
      // test: as an inline regex in this closure nothing could assert it, which
      // is how a bare `auth` came to match "Authentication successful" and mark a
      // successful run as failed on six of the eight runtimes (#1974).
      const isFatalStderr = spec.stderrIsFatal ?? isFatalGenericStderr;
      // Snippet only, never fatality. isFatalStderr is a keyword guess over a
      // CLI's own stderr chatter, not a verdict — trusting it to fail the run
      // outright is exactly the bug #1974 reported: "Authentication successful"
      // matched a bare `auth` and marked a clean, successful run as an error, on
      // six of the eight runtimes. The close handler below is the sole place that
      // decides fatality, from cleanExit and the CLI's own structured error event
      // (authoritative — see the ev.error branch in processParsedLine); this only
      // captures human-readable detail for whichever message that decision needs.
      let stderrErrorSnippet: string | null = null;
      const flagStderrLine = (line: string) => {
        if (stderrErrorSnippet || !line.trim() || !isFatalStderr(line)) return;
        stderrErrorSnippet = line.trim().slice(0, 200);
      };
      let lastTokens = 0; // per-run token cost from the CLI's structured usage event (#6) — local only
      let lastCostUsd: number | null = null;
      // pdf-mode's agent only tailors content now (rendering moved to the
      // backend, #2172) — but its killMs still has to leave real headroom
      // inside the route's overall maxDuration (800s): the render+mark phase
      // (renderPdf, below) starts only after this timer's window and has no
      // timeout of its own, so an agent that runs close to its full budget
      // would otherwise leave the platform's hard maxDuration cutoff to kill
      // generate-pdf.mjs mid-render. 600s agent / ~200s render is ample —
      // a Chromium PDF render normally takes low tens of seconds even with a
      // cold Playwright launch.
      // pdf keeps 600s because its render+mark phase runs AFTER this timer; a
      // plain evaluate has no such phase, so it can use almost the whole 800s
      // budget. 285s was cutting real evaluations off mid-run — reading the mode
      // and profile, fetching the posting, ~25 Bash calls and a few web searches
      // routinely run past it — and the SIGTERM then surfaced as "didn't save a
      // report" (see the close handler), blaming the CLI for a limit we imposed
      // (#3124). 780s leaves ~20s under maxDuration for a graceful shutdown.
      const killMs = killMsForKind(kind);
      // Set by the killer so the close handler can tell "we timed it out" apart
      // from "the CLI exited on its own" — different failures, different message.
      let killedByTimeout = false;
      killer = setTimeout(() => {
        killedByTimeout = true;
        try { child.kill("SIGTERM"); } catch { /* ignore */ }
      }, killMs);
      // Declared before send() so send() can clear it the moment it sees the
      // client disconnect; assigned just below, once close() exists.
      let heartbeat: ReturnType<typeof setInterval> | undefined;
      const send = (obj: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
        } catch {
          // The client is gone. Stop the heartbeat here rather than waiting for
          // close(): the child can still run for minutes (maxDuration 800s), and
          // a user retrying a failed run would otherwise accumulate one live
          // timer per abandoned request.
          closed = true;
          if (heartbeat) clearInterval(heartbeat);
        }
      };
      // Time-based keepalive. The stream is silent whenever the agent is thinking
      // or inside a long tool call, and in pdf mode it is silent for the whole
      // 15-25 KB <<cv-html>> envelope (cvFilter swallows every byte). Measured
      // idle gaps on a real pdf run reached 149s — long enough for the browser or
      // a proxy to drop the connection, after which the client reports
      // "Connection error" even though the agent finished and the PDF rendered.
      // It must be a timer, not a hook on incoming text: piggy-backing on agent
      // output cannot fire during exactly the silences it needs to cover.
      // Unknown event types are ignored by the client's switch, so old tabs are safe.
      heartbeat = setInterval(() => send({ type: "keepalive" }), 10_000);
      const close = () => {
        if (!closed) {
          closed = true;
          if (heartbeat) clearInterval(heartbeat);
          if (killer) clearTimeout(killer);
          if (lingerTimer) clearTimeout(lingerTimer);
          releaseWriteTokenOnce();
          try { controller.close(); } catch { /* */ }
        }
      };
      // The agent has reported it is done. Give the child a short window to exit
      // on its own, then stop waiting for it — see LINGER_GRACE_MS. This only
      // ends the WAIT; the close handler still decides the outcome from
      // emittedText/sawError/cleanExit, and killedByTimeout stays reserved for
      // the 780s limit so a real timeout is never confused with this.
      const armLingerGrace = () => {
        if (lingerTimer || closed) return;
        lingerTimer = setTimeout(() => {
          try { child.kill("SIGTERM"); } catch { /* already gone */ }
        }, LINGER_GRACE_MS);
      };
      // pdf's CV arrives inline in a <<cv-html>> envelope instead of being written
      // by the agent (#2185). The filter keeps every byte for the backend while
      // holding the 15-25 KB body out of the run log, which is the agent's
      // narration — see cv-envelope.mjs.
      const cvFilter = kind === "pdf" ? createCvEnvelopeFilter() : null;
      // While the agent emits the 15-25 KB <<cv-html>> envelope, cvFilter swallows
      // every byte, so the response stream goes completely silent for as long as
      // the model takes to write the CV — a minute or more. Nothing downstream can
      // tell that from a hung request, and the browser/proxy drops the connection;
      // the client then reports "Connection error" even though the agent is fine
      // and the PDF renders correctly server-side. Emit a throttled keepalive so
      // the stream never idles during the filtered phase. Unknown event types are
      // ignored by the client's switch, so this is safe for older tabs too.
      const sendAgentText = (text: string) => {
        const visible = cvFilter ? cvFilter.push(text) : text;
        if (visible) send({ type: "text", text: visible });
      };
      /** Surface non-fatal issues in the run log rather than only a server log. */
      const sendWarnings = (warnings: string[]) => {
        for (const w of warnings) send({ type: "text", text: `⚠️ ${w}\n` });
      };
      /** Persist the emitted CV; streams the reason and returns false on failure. */
      const saveCv = (paths: PdfPaths, envelope: CvEnvelope) => {
        const written = writeCvHtml({ pdfPaths: paths, html: envelope.html });
        if (!written.ok) send({ type: "error", msg: written.error.slice(0, 200) });
        return written.ok;
      };

      // One dispatch for every structured CLI: the per-CLI knowledge (which event
      // means text/tool/status/usage) lives in run-cli-support.mjs behind
      // spec.parseEvent, so adding the next such CLI needs no change here.
      // Shared with the close-time flush below, so a final JSONL line the CLI never
      // newline-terminates before exiting isn't dropped along with the usage event
      // it carries.
      const processParsedLine = (line: string) => {
        if (!spec.parseEvent) return;
        const ev = spec.parseEvent(line);
        if (ev?.text) {
          emittedText = true;
          // sendAgentText, NEVER send: pdf's CV arrives inside the agent's text as a
          // <<cv-html>> envelope, so parsed text has to reach cvFilter too or the
          // backend has nothing to save and the 25 KB body floods the run log (#2185).
          sendAgentText(ev.text);
        }
        if (ev?.tool) send({ type: "tool", name: ev.tool });
        if (ev?.status) send({ type: "status", label: ev.status });
        // Accumulated, not assigned: usage events are per-turn, so overwriting made a
        // multi-turn run report only its last turn. The authoritative "done" is sent
        // on close, so the honesty gate decides done-vs-error first.
        lastTokens = accumulateTokens(lastTokens, ev);
        if (typeof ev?.costUsd === "number") lastCostUsd = ev.costUsd;
        if (ev?.error) {
          sawError = true;
          send({ type: "error", msg: ev.error.slice(0, 200) });
        }
        // The agent is done. Stop waiting on stdout — a CLI that leaves a child
        // holding the pipe would otherwise keep this run alive until the 780s
        // kill timer and report a timeout for work that already finished.
        // Asked of the LINE, not of the parsed event: see CliSpec.isTerminal.
        if (spec.isTerminal?.(line)) armLingerGrace();
      };

      child.stdout.on("data", (chunk: string) => {
        if (closed) return;
        if (!spec.parseEvent) {
          emittedText = true;
          sendAgentText(chunk);
          return;
        }
        buf += chunk;
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (line) processParsedLine(line);
        }
      });
      child.stderr.on("data", (chunk: string) => {
        // Match on COMPLETE lines. A chunk boundary can fall mid-word, so testing a
        // raw chunk both misses an error split across two of them and can match a
        // fragment that is not the word it looks like. The captured snippet only
        // supplies message text for whichever failure the close handler already
        // decided on — it never sets sawError itself (see flagStderrLine above).
        stderrBuf += chunk;
        let nl;
        while ((nl = stderrBuf.indexOf("\n")) !== -1) {
          const line = stderrBuf.slice(0, nl);
          stderrBuf = stderrBuf.slice(nl + 1);
          flagStderrLine(line);
        }
      });
      // Render + mark-tracker-ready live in pdf-render.mjs (plain, dependency-
      // injected, unit-tested) so the render-then-mark orchestration isn't
      // buried untested inside this transport-layer closure. Runs generate-
      // pdf.mjs and mark-pdf-ready.mjs as plain Node child processes — no agent
      // CLI or its sandbox involved — so a browser launch never depends on an
      // interactive approval nobody is present to grant in a headless/web-
      // triggered run (#2172). The tracker is marked ✅ only after a CONFIRMED
      // successful render, not optimistically — same honesty-gate discipline as
      // the evaluate path below.
      const renderPdf = async (paths: PdfPaths, format: "letter" | "a4") => {
        send({ type: "status", label: "Rendering PDF…" });
        // renderAndMarkPdf is designed to resolve, never throw — but this is
        // the one place nothing else awaits or catches this promise (cancel()
        // only attaches a .finally for the write-token release), so an
        // unexpected exception here must still close the stream instead of
        // leaving it — and the write-token — open until process shutdown.
        try {
          const result = await renderAndMarkPdf({
            spawnFn: spawn,
            execPath: process.execPath,
            root: careerOpsRoot(),
            pdfPaths: paths,
            format,
            reportNum: input,
          });
          if (result.kind === "render-failed") {
            send({ type: "error", msg: result.error.slice(0, 200) });
            return;
          }
          // Non-fatal issues (a defaulted page format, a tracker row not marked) still
          // surface here rather than only in a server log nobody sees.
          sendWarnings(result.warnings);
          send({ type: "done", tokens: lastTokens, costUsd: lastCostUsd });
        } catch (e) {
          send({ type: "error", msg: `PDF rendering crashed unexpectedly: ${e instanceof Error ? e.message : String(e)}`.slice(0, 200) });
        } finally {
          close();
        }
      };

      child.on("error", (e) => { if (candidate) void enterpriseAction("fail", { ticket: candidate.ticket, reason: e.message }).catch(() => {}); send({ type: "error", msg: e.message }); close(); });
      child.on("close", async (code) => {
        // A trailing line with no newline would otherwise never be tested.
        if (stderrBuf) { flagStderrLine(stderrBuf); stderrBuf = ""; }
        // A client disconnect can fire cancel() (which kills `child`) before
        // this event finally arrives — killing a process doesn't make its
        // 'close' event disappear, just delays it. Without this guard a pdf
        // run could still start a brand-new render (and re-touch the tracker)
        // after the stream — and its writeToken guard — is already gone.
        if (closed) return;
        // A timeout is the ROOT cause behind every "no report / not clean"
        // symptom the gates below test, so classify it FIRST, for any kind.
        // Otherwise a run we cut off at the time limit reads as "the CLI couldn't
        // save a report" and sends the user to re-check a CLI that was working
        // fine (#3124). code is null here (killed by signal), which the gates
        // would read as a generic non-clean exit.
        if (killedByTimeout) {
          if (candidate) await enterpriseAction("fail", { ticket: candidate.ticket, reason: "任务超时，旧版未替换" }).catch(() => {});
          send({
            type: "error",
            msg: timeoutMessage(killMs, kind),
          });
          return close();
        }
        // A final JSONL line with no trailing newline stays in `buf` forever
        // otherwise — flush it through the same parser so the usage/result event it
        // usually carries (the last one of a run) isn't lost. Ahead of the pdf branch,
        // not just the evaluate gate: the pdf path reports lastTokens too.
        const trailing = buf.trim();
        if (trailing) {
          buf = "";
          processParsedLine(trailing);
        }
        const cleanExit = code === 0; // non-zero OR null (killed/signal) = NOT clean
        // Shared by both honesty gates below — the pdf gate receives it as
        // pdfRunOutcome's noOutputMessage — because a CLI that produced no output at
        // all is the same failure mode whether it was evaluating or tailoring
        // a PDF — one place for the condition/message pair instead of two.
        const noOutputError = (): string | null => {
          if (!emittedText && !sawError && !cleanExit) {
            const detail = stderrErrorSnippet ? ` (${stderrErrorSnippet})` : "";
            return `The CLI exited with an error — is it installed and authenticated?${detail}`;
          }
          if (!emittedText && !sawError) return "The CLI produced no output — is it installed and authenticated? (career-ops is best on Claude Code.)";
          return null;
        };

        if (kind === "pdf") {
          // Release any text the filter was still holding, so the log keeps the
          // agent's closing narration and its VERDICT line.
          const tail = cvFilter?.flush();
          if (tail) send({ type: "text", text: tail });
          // The artifact check moved from the filesystem to the stream (#2185):
          // whether pdfPaths.html exists says nothing now that the backend is its
          // only writer. pdfRunOutcome owns the decision and the message.
          const envelope = cvFilter?.result();
          const outcome = pdfRunOutcome({
            envelope,
            noOutputMessage: noOutputError(),
            sawError,
            cleanExit,
            hasPaths: pdfPaths !== undefined,
          });
          if (!outcome.ok) {
            send({ type: "error", msg: outcome.message });
          } else if (!pdfPaths || envelope?.ok !== true) {
            // Unreachable: pdfRunOutcome validated both via hasPaths/envelope.ok.
            // Kept for narrowing, but it must REPORT rather than fall through to a
            // bare close() — a stream that ends with neither error nor done is the
            // one outcome this handler exists to prevent.
            send({ type: "error", msg: "Internal error: the pdf run passed its gate with no CV to save — please report this." });
          } else {
            sendWarnings(envelope.warnings);
            if (saveCv(pdfPaths, envelope)) {
              // Tracked so cancel() can defer releasing writeToken until this
              // settles; close() happens once rendering finishes, not here.
              pdfRenderPromise = renderPdf(pdfPaths, envelope.format);
              return;
            }
            // saveCv already streamed the specific reason.
          }
          return close();
        }

        const wroteReport = hasNewCompletedReport(reportsBefore, reportEntries());
        // Honesty gate (#9): a green "done" with a parsed score requires a CLEAN exit,
        // real output, AND (for evaluations) a report actually written. Anything else
        // is surfaced — an errored run must never be banked as a confident score.
        const baseErr = noOutputError();
        if (candidate) {
          if (baseErr || !cleanExit || sawError) {
            await enterpriseAction("fail", { ticket: candidate.ticket, reason: stderrErrorSnippet || baseErr || "Agent 任务失败，旧版未替换" }).catch(() => {});
          } else {
            if (killer) clearTimeout(killer);
            send({ type: "status", label: "正在独立验收真实列表和详情，通过后自动安装绑定…" });
            try {
              const finished = await enterpriseAction("finish", { ticket: candidate.ticket });
              if (finished.status === "awaiting_review") {
                send({ type: "awaiting_review", msg: "等待路线审核 · 未安装：核对并批准新域名后，续接原候选；不需要重新适配。", tokens: lastTokens, costUsd: lastCostUsd });
                return close();
              }
              send({ type: "text", text: "\n企业适配器已通过平台验收，自动安装、启用并绑定。旧版文件保留。\n" });
              send({ type: "done", tokens: lastTokens, costUsd: lastCostUsd });
            } catch (error) {
              const reason = error instanceof Error ? error.message : "验收失败";
              await enterpriseAction("fail", { ticket: candidate.ticket, reason }).catch(() => {});
              send({ type: "error", msg: `未安装，旧版保留：${reason}` });
            }
            return close();
          }
        }
        if (baseErr) {
          send({ type: "error", msg: baseErr });
        } else if (persists && !wroteReport) {
          // The worker ran but never wrote the report/tracker row (e.g. a CLI
          // without file-write authorization) — surface it instead of a fake score.
          send({ type: "error", msg: "This evaluation didn't save a report, so it's not in your tracker. Full evaluation is verified on Claude Code." });
        } else if (!cleanExit || sawError) {
          // Produced output (maybe even a report) but did NOT finish cleanly — flag it
          // instead of recording a confident score off a half-finished run. sawError
          // here means an authoritative structured error already sent its own
          // message above; a bare non-clean exit gets the stderr snippet instead,
          // when the heuristic classifier found one.
          const detail = !sawError && stderrErrorSnippet ? ` (${stderrErrorSnippet})` : "";
          send({ type: "error", msg: `This run hit an error before finishing, so it isn't recorded as a confident result — re-run it to verify.${detail}`.slice(0, 200) });
        } else {
          send({ type: "done", tokens: lastTokens, costUsd: lastCostUsd });
        }
        close();
      });
    },
    cancel() {
      closed = true;
      if (candidate) void enterpriseAction("fail", { ticket: candidate.ticket, reason: "连接中断，请检查候选产物后重新适配" }).catch(() => {});
      if (lingerTimer) clearTimeout(lingerTimer);
      if (killer) clearTimeout(killer);
      try { child.kill("SIGTERM"); } catch { /* ignore */ }
      if (pdfRenderPromise) {
        // Render/mark keeps running after this client disconnects — wait for
        // it to settle before releasing the guard, so a concurrent tracker
        // delete can't race mark-pdf-ready.mjs's still-in-flight write.
        pdfRenderPromise.finally(releaseWriteTokenOnce);
      } else {
        releaseWriteTokenOnce();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
