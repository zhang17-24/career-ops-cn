/**
 * run-prompts.mjs — the prompts /api/run sends each worker kind (#2185).
 *
 * The web ORCHESTRATES the real career-ops engine — it does NOT reimplement it.
 * kind "evaluate" runs the REAL modes/oferta.md and persists the canonical
 * artifacts (A–F report + tracker row) via the SAME scripts the CLI uses
 * (reserve-report-num.mjs → reports/ → batch/tracker-additions/ → merge-tracker.mjs),
 * so a web evaluation is byte-identical to a CLI one (single source of truth, no
 * drift). kind "research" stays read-only.
 */
import { CV_ENVELOPE_INSTRUCTION } from "./cv-envelope.mjs";

/**
 * Is this company name safe to interpolate into a shell command inside a prompt?
 *
 * The fix-portal prompt tells the agent to run
 * `node verify-portals.mjs --add "<company>"`, and fix-portal is one of the kinds
 * that still holds Bash. Company names are not always the user's own typing — they
 * reach the dashboard from public ATS listings — so a crafted one could close the
 * quote and append a command. Allow the characters real company names use and
 * refuse the rest. The caller turns a refusal into a 400 rather than sanitizing,
 * because a silently rewritten name would resolve the wrong portal.
 *
 * @param {string} name
 * @returns {boolean}
 */
export function isShellSafeCompanyName(name) {
  return typeof name === "string"
    && name.length > 0
    && name.length <= 80
    && SAFE_COMPANY_NAME.test(name)
    // A single & is needed (AT&T, Marks & Spencer); && is a command separator and
    // appears in no real company name. Every other chaining character — ; | $ `
    // quotes, newline — is already outside the character class.
    && !name.includes("&&");
}

const SAFE_COMPANY_NAME = /^[\p{L}\p{N} .,&'()+/-]+$/u;

/**
 * The exact prompt each worker kind is sent.
 *
 * Lives in a plain .mjs so it can be asserted on as a VALUE: the pdf prompt is
 * the load-bearing half of #2185 (it is what tells the agent to emit the CV
 * inline instead of writing it), and a guard that greps route.ts for the marker
 * text matched the route's own comments instead. See test-all.mjs §55.6.
 *
 * @param {{kind: string, input: string, memory: string, today: string}} args
 * @returns {string}
 */
/** ISO calendar date, the only form the dashboard's POSTED column parses. */
const ISO_DATE_RE = /^20\d{2}-\d{2}-\d{2}$/;

export function buildPrompt({ kind, input, memory, today, postedAt, lang }) {
  // AGENTS.md's "Output Language vs Market Modes" composition rule. The CLI
  // picks this up by reading AGENTS.md interactively; a one-shot headless
  // prompt has no such chance, so the rule has to be stated in the prompt or a
  // configured market silently does nothing on a web-triggered run.
  //
  // `lang` is optional and defaults to the English/global configuration:
  // readLanguageConfig() touches the filesystem, so callers that cannot supply
  // it (tests, future callers) keep working instead of this module reaching for
  // fs itself and losing its "plain module, testable as a value" property.
  const resolvedLang = lang ?? { output: "zh-CN", modesDir: "modes/zh", evalModeFile: "modes/zh/oferta.md" };
  const marketNote =
    resolvedLang.modesDir !== "modes"
      ? ` Also read ${resolvedLang.modesDir}/_shared.md for this market's vocabulary, benefits and legal concepts, and keep those terms (explained in the output language) where relevant.`
      : "";
  const languageDirective = `\n\nWrite all human-facing output in "${resolvedLang.output}" regardless of the language of these instructions or the job description.${marketNote}\n`;
  const mem = (memory.trim() ? `\n\nDurable notes about the user (from their profile):\n${memory.trim()}\n` : "") + languageDirective;
  if (kind === "research") {
    return `You are investigating the user's OWN work / portfolio to surface job-search-relevant strengths, headless. Investigate the target (use WebFetch for URLs; read local files if referenced) and report: what it is, why it is impressive, and how to leverage it in their job search — which roles/claims it supports and how to frame it on a CV. Be specific, honest, and encouraging. Report only: never submit, send, or click Apply anywhere, and contact no one — you are investigating the user's own work, not acting on it.${mem}

End with EXACTLY one final line: VERDICT: {0-5 signal strength}/5 — {why it helps their search, ≤12 words}

Target: ${input}`;
  }
  if (kind === "pdf") {
    // The agent tailors content only — it neither renders the PDF nor saves it.
    // Rendering moved to the backend because launching a real browser can hit a
    // sandbox escalation nobody is present to approve (#2172); SAVING moved for a
    // different reason (#2185): tool grants are tool-name-only, so the Write/Edit
    // this step used to need was unscoped, and a prompt injection in the posting
    // or the report — both of which land in this agent's context — could aim it at
    // cv.md or data/applications.md. The agent now emits the CV inline and the
    // backend (a plain Node process, no CLI sandbox) writes and renders it, so
    // pdf mode runs with no write tool at all.
    return `You are tailoring the user's ATS-optimized CV for application #${input}, headless, on their machine. Run the REAL career-ops "pdf" mode's CONTENT step: follow modes/pdf.md's TAILORING rules exactly (do not improvise your own scoring or format). Apply its CONTENT rules — keyword injection, ordering, the competency grid, project selection, and its never-invent-a-skill rule. Its steps that shell out (the jd-skill-gap.mjs check, template resolution) and its build/save/render steps are NOT performed on web runs; the platform handles output itself.
1. Read modes/pdf.md, cv.md, config/profile.yml, and the evaluation report at reports/${input}-*.md (for the JD keywords + analysis).
2. Tailor the CV per modes/pdf.md: inject the JD's keywords into the summary + first bullets, reorder experience by relevance, build the competency grid, pick the top 3–4 projects. NEVER invent skills — only reword REAL experience using the JD's vocabulary.
3. Fill templates/cv-template.html's {{...}} placeholders with the tailored content. Use that template even though modes/pdf.md resolves one via cv-templates.mjs: web runs always use the base template. ${CV_ENVELOPE_INSTRUCTION}
4. Emit the envelope EXACTLY ONCE. The platform writes the HTML, renders the PDF, and updates the tracker's PDF column itself, only after a confirmed successful render. Do not submit anything anywhere.

After the envelope, end with EXACTLY one final line: VERDICT: {5 if the complete HTML envelope was emitted, else 1}/5 — {a one-line summary, ≤12 words}`;
  }
  if (kind === "fix-portal") {
    return `A company's job-portal ATS slug is BROKEN — career-ops can no longer scan it, so it silently disappears from every future scan. Repair it (headless, on the user's machine):
1. Run \`node verify-portals.mjs --add "${input}"\` — it probes Greenhouse/Ashby/Lever for the company's correct ATS slug and prints the suggested ats + slug.
2. Open portals.yml, find the "${input}" entry under tracked_companies, and update its careers_url (and any api/slug field) to the suggested WORKING ATS URL. Change ONLY this one company; preserve all other YAML structure, comments and formatting exactly.
3. Re-run \`node verify-portals.mjs\` and confirm "${input}" now shows ✅ live (not ❌).
If NO slug variant resolves, say so clearly and leave portals.yml unchanged. Never touch any other company. This is a config repair: do not submit, send, or click Apply anywhere, and edit no file other than portals.yml.

End with EXACTLY one final line: VERDICT: {5 if now live, else 1}/5 — {what you changed, ≤12 words}`;
  }
  if (kind === "adapt-provider") {
    return `Create a deterministic zero-token recruitment-source adapter for exactly one company: "${input}". Work headless in this career-ops-cn checkout.
1. Read .agents/skills/recruitment-source-adapter/SKILL.md AND docs/招聘源适配验收SOP.md fully and follow both. Production results must come from real official responses; never import fixtures or fall back to mock jobs. Offline fixture success is NOT live acceptance.
2. Find only the "${input}" entry in portals.yml. Use Ego Lite to inspect its public careers page and public XHR/API. Prefer a reusable public ATS adapter over a company-specific adapter.
Choose capabilities from evidence, not a mandatory single path: follow the SOP 按证据切换能力 section. JSON/HTML parsing, SPA capture, document-start preload, observed click routes, inline data and supported DOM readers are alternatives. One failed method must not terminate the task while a justified alternative exists. You may compose available Ego DOM/CDP tools and implement small candidate-local helpers; that does not authorize changing platform guards or inventing unsupported production capabilities. Record method, evidence and outcome briefly in ACCEPTANCE.md. Do not exhaust every tool or repeatedly invoke AI; when attempts stop adding evidence, reassess the concrete gap; continue a distinct, justified in-scope hypothesis rather than stopping at a fixed failure count. Login/CAPTCHA and policy refusals remain stopping boundaries. Route approval follows the server-supplied mode below: enterprise public delegation or per-route review.
For a dynamic tracking parameter observed changing between requests, publicCaptureScript(endpoint, {ignoreQueryParams: [observedTrackingKey]}) supports explicit matching exceptions; publicCapturePreload accepts those options as its third argument. Only confirmed tracking keys may be ignored, never paging, filters, identity or authentication. The actual outgoing request is unchanged and actual URL is retained. All other URL components still match strictly. Default remains exact matching; no global wildcard or blanket query stripping.
Use the configured careers URL as the starting source when it loads and its visible company identity is consistent. officialUrl in ROUTE_REVIEW.json may be that configured recruitment homepage, not necessarily the corporate product homepage. Follow its actual links/redirects to the ATS and record that connected chain. Do not spend a search or navigation budget proving a corporate-homepage backlink when the configured recruitment page already provides the observed chain; absence of that backlink alone is NOT a blocker. A configured URL is still not proof of identity: conflicting branding, unrelated tenant or suspicious navigation must stop for review. In per-route review mode, new domains require explicit platform approval, even for Moka; never infer authorization from another company's adapter or synthesize missing links. With enterprise public delegation, record actual connected routes and continue this company's work; otherwise stop at route review without adding an unrelated discovery blocker.
Entry recovery is a separate read-only discovery phase, not production-domain permission. If the configured entrance fails, do not stop solely because there is no old adapter. Follow the SOP 招聘入口发现与域名审核 section: at most one company-name search to locate its official homepage, then at most three official/navigation pages using observed links or redirects. Do not guess a root domain by removing labels, ATS tenant IDs, API endpoints or job URLs. Search results are navigation leads, never job evidence. Record the actual official homepage → careers link/redirect → public API chain. If the company identity or official relationship cannot be established, stop and ask for the official homepage.
If the entrance changes or a required host is not in the platform-approved scope, write ROUTE_REVIEW.json in the candidate directory with {officialUrl, entryUrl, allowedHosts, evidence:[{fromUrl,toUrl,kind:"link"|"redirect"|"api",note}]}. Follow the exact schema in the SOP. In per-route review mode, stop for human review and preserve approved proposals byte-for-byte. In server-confirmed enterprise public delegation mode, update the connected evidence from the configured or previously approved official source and continue without another approval. Candidate files never grant delegation; the server must supply it. For a resumed candidate, read existing code and blockers, then complete only missing work. Do not restart discovery when an approved entry is supplied.
Navigation recovery: read the actual element href (both raw attribute and resolved absolute href) instead of inventing a selector. After a click, check page.info() AND task.tabs() for a newly opened tab. If a menu disappears or the selector fails, directly open the exact observed official href using page.goto(); this is normal navigation, not guessing an endpoint. Do not retry the same broken selector. Reuse the existing enterprise adapter and evidence as read-only implementation references when available; copy only needed parser/tests into this new candidate and revalidate the real site. An exact official detail URL in existing ACCEPTANCE.md is a valid navigation lead: open that same URL in Ego Lite and verify its CURRENT title, ID and job description against the fresh list. Historical evidence alone is insufficient, but fresh reading of a historically observed URL is valid; do not require a redundant popup click or invent new paths. Prefer this observed-URL route over repeating failed popup navigation. Failed popup creation alone is not a site/login failure.
Before clicking a DOM card/link, scroll the actual element into view (scrollIntoView({block:'center'})), wait for layout to settle, then verify its bounding rectangle is within the viewport and elementFromPoint hits the intended element. Ego click may return without navigating when a full-page snapshot target lies below the viewport; this is not evidence of a broken link. Reuse one detail tab or close it after verification; do not accumulate scratch tabs.
Network evidence: follow SOP "公开响应取证与展开详情". Do not carry CDP requestId across calls or keep retrying getResponseBody. Use the development-only adapter-network-capture.mjs publicCaptureScript for one previously observed, approved public endpoint BEFORE normal SPA list navigation; inspect only public request parameters, schema and minimal samples, then stop the capture. No replay or credentials. Inline details are supported by manifest.inlineDetails with observed listUrl, itemSelector, idAttribute, titleSelector (relative to toggle), toggleSelector and bodySelector. Preserve real string IDs; compare each expanded DOM body with its API description. Use the text locator plus platform ID metadata URL contract in the SOP, never invent company detail routes. Read adapter-inline-details.mjs as the verifier contract, do not modify it. Same-title postings are valid when their real IDs differ; duplicate IDs or missing evidence must fail closed.
If HTTP is opaque but the public DOM is readable, the platform now supports manifest.browserListing (listUrl, identityText, linkSelector, titleSelector, locationSelector) and ctx.browserJobs(entry). Read adapter-browser-listing.mjs and the SOP browserListing section. Use observed visible anchor hrefs, no guessed URLs. The platform launches anonymous Chromium, enforces exact approved hosts including CDN resources, reads one page with no clicks/pagination and independently checks three details. Do not run Ego CLI inside production plugins. Record required resource domains in ROUTE_REVIEW.json; enterprise public delegation permits continuing, otherwise stop for review. A prior HTTP capture failure budget does not prohibit this new supported method; no need to repeat HTTP capture. Never erase an unresolved blocker to force installation.
For full-document navigation or an initial-load XHR, use publicCapturePreload(endpoint, documentUrl) from adapter-network-capture.mjs with Ego CDP Page.addScriptToEvaluateOnNewDocument BEFORE navigating the selected tab. Follow the SOP for exact-document scoping and finally cleanup of the registration and capture. Do not repeat a page-memory hook that is lost on reload. Non-anchor job cards are not a dead end: observe normal clicks and the page's local navigation handler. A fixed URL mapping explicitly visible in public navigation code and confirmed against three actual clicks may be implemented; never infer the mapping from IDs alone. Prefer real response URLs or plain HTML parsing where available.
3. For a platform-managed run, use ONLY the pre-created candidate directory supplied below; never modify the old version. Implement the fixed parser and add a zero-network fixture test. If no candidate directory was supplied, stop and request one.
Before handing off run node plugin-audit.mjs plugins.local/<id> as well as the fixture and syntax check; all must pass. Keep the generated provider property spelling 'fetch': async (entry, ctx) => {...}; the conservative static guard misreads method shorthand async fetch(...) as global fetch. Use import { strict as assert } from 'node:assert' in tests (the allowlist does not include node:assert/strict). Do not weaken the guard or ignore findings.
4. Do NOT run scan.mjs, verify-portals.mjs, a batch scan, an AI evaluation, or an application flow. Never submit an application. Validate at most one real listing page and three real detail pages using observed official click routes, never guessed URLs. Match titles and string IDs to detail content; treat login/CAPTCHA/timeouts/ERR_CONNECTION_CLOSED as unconfirmed; an explicit job-closed page or job 404 means expired, not a connection error. Record timestamp, source requests, minimal public samples, test results and limitations in plugins.local/<id>/ACCEPTANCE.md. Do not save credentials or personal data.
5. If login, SMS verification, or CAPTCHA appears, stop and clearly ask the user to take over Ego Lite. Never bypass it.
6. Leave the candidate DISABLED; do not edit binding or trust configuration. The platform independently verifies the real list and details, then automatically enables and binds this one company under the user's authorization. A failed check must retain the old version.
7. Change only plugins.local/<id>/ files. Do not edit other companies or commit/push anything.

Follow the SOP blocking-recovery section: inspect existing evidence first. A direct API 401 alone does not prove browser login is required; verify the normal official list page. Do not enumerate endpoints or reverse-engineer security signatures. After a failed method, make an evidence-based correction or switch to a justified alternative instead of repeating it unchanged. The one-list/three-detail budget permits necessary re-navigation of the SAME listing for different evidence methods, not pagination or broader scanning. Before blocking, document applicable alternatives and the remaining concrete gap. Do not retry or route around AI service policy refusals.
Report offline tests, real detail checks, and activation/page acceptance separately. Do not claim installation or activation: the server decides after your task ends.
For incomplete work write BLOCKED.md with the specific cause. For completed work ensure there is no outstanding BLOCKED.md (archive resolved history separately); an ACCEPTANCE.md alone cannot override a blocker. Keep tool output compact and inspect only this enterprise's files, not the full repository or unrelated personal profile.
End with a short Chinese summary of the candidate id and any blockers, not a numeric rating.`;
  }
  // The posting date is INTERPOLATED, not asked for. The scanner wrote it into
  // pipeline.md from the provider's own `offer.postedAt`; the server already has
  // it (readScanDates/readInbox) and passes it here, so the agent copies a value
  // rather than deriving one. modes/oferta.md is explicit that a guessed date is
  // worse than none — the dashboard's POSTED column renders an absent date as
  // `—`, and an invented one reports a months-old req as fresh.
  //
  // Canonical form, taken from the regex that CONSUMES it (dashboard's
  // rePostedOn) rather than from prose: its own trailing segment after `; `,
  // anchored to a separator, ISO `YYYY-MM-DD`. Mid-sentence mentions are
  // deliberately not metadata there, so this must be a segment or nothing.
  //
  // Absent → the empty string, so the row is byte-identical to today's. Same
  // reason the url field is always written but may be empty: the shape an agent
  // reliably follows is one unconditional template, and here the CONTENT is
  // conditional precisely because "write nothing" is the required behaviour.
  const postedSegment = ISO_DATE_RE.test(String(postedAt ?? "")) ? `; posted: ${postedAt}` : "";

  // evaluate (default) — run the REAL oferta mode + persist canonically
  //
  // The TSV row carries 10 fields, the 10th being the posting URL that
  // merge-tracker dedupes on (#1298). The web is a WRITER of that file, not only
  // a reader: emitting 9 fields stays valid forever, so nothing would ever go
  // red — every job evaluated from the web would simply sit outside the
  // URL dedup. Compatible and half-dead at once, which is the failure mode with
  // no symptom.
  //
  // ALWAYS 10 fields, empty when there is no URL, deliberately: an
  // unconditional template is one an agent follows, "emit 9 or 10 depending"
  // is one it sometimes forgets. Empty and absent are byte-identical in the
  // written row (verified against merge-tracker), so the robust instruction
  // costs nothing. Not "N/A" either — parseTsvExtras drops placeholders
  // precisely so they can't be misread as the row's LOCATION.
  return `You are running the OFFICIAL career-ops job evaluation, HEADLESS, on the user's own machine. Today is ${today}. Run the REAL career-ops evaluation — do NOT improvise your own scoring.

1. Read ${resolvedLang.evalModeFile} and follow it EXACTLY (blocks A–F, G posting-legitimacy, and the Machine Summary). Ground the fit in THIS person: read cv.md, config/profile.yml and modes/_profile.md. Use WebFetch to read the posting (you are headless — Playwright is unavailable, so use WebFetch and mark the report header "Verification: unconfirmed (batch mode)").

2. Persist the result CANONICALLY so the web and the CLI share ONE source of truth:
   a. Reserve a report number: run \`node reserve-report-num.mjs\` — its stdout is a 3-digit number (e.g. 035).
   b. Write the full report to reports/{num}-{company-slug}-${today}.md  (company-slug = company lowercased, non-alphanumerics → hyphens).
   c. Append ONE row of 10 TAB-separated columns to batch/tracker-additions/{num}-{company-slug}.tsv, in THIS exact order (real \\t tabs, status BEFORE score). ALWAYS write all 10 fields — leave the last one EMPTY if there is no posting URL, never "N/A" or "-":
      {num}\t${today}\t{Company}\t{Role}\t{CanonicalStatus e.g. Evaluated}\t{score}/5\t❌\t[{num}](reports/{num}-{company-slug}-${today}.md)\t{one-line note}${postedSegment}\t{posting URL, or empty}
   d. Merge into the tracker: run \`node merge-tracker.mjs\` (it dedupes by company+role+report-num, validates the status, and writes data/applications.md — NEVER edit applications.md by hand).

3. NEVER submit an application, fill no forms, contact no one. This is evaluation + persistence ONLY.${mem}

After everything above is written and merged, output EXACTLY one final line, nothing after it:
VERDICT: {score}/5 — {reason in 12 words or fewer}

Posting URL: ${input}`;
}
