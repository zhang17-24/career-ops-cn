import {
  localPermissionRequest,
  readCodexPermissions,
  readWorkbuddyPermissions,
  saveCodexPermissions,
  saveWorkbuddyPermissions,
} from "@/lib/codex-permissions.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Both CLIs' consent in one payload, so the settings page renders from one read. */
function readAll() {
  return { fullAccess: readCodexPermissions().fullAccess, workbuddyFullAccess: readWorkbuddyPermissions().fullAccess };
}

export async function GET() {
  try { return Response.json(readAll()); }
  catch (e) { return Response.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: Request) {
  if (!localPermissionRequest(req)) return Response.json({ error: "只允许本机页面修改权限" }, { status: 403 });
  try {
    const body = await req.json();
    const hasCodex = typeof body?.fullAccess === "boolean";
    const hasWorkbuddy = typeof body?.workbuddyFullAccess === "boolean";
    // Require an explicit field rather than defaulting: a POST with no flags
    // would otherwise silently mean "set both to false" and revoke consent the
    // user never asked to revoke.
    if (!hasCodex && !hasWorkbuddy) return Response.json({ error: "权限值无效" }, { status: 400 });
    // Present-but-wrong-type is a client bug, not a request to change nothing.
    if (body.fullAccess !== undefined && !hasCodex) return Response.json({ error: "权限值无效" }, { status: 400 });
    if (body.workbuddyFullAccess !== undefined && !hasWorkbuddy) return Response.json({ error: "权限值无效" }, { status: 400 });

    if (hasCodex) saveCodexPermissions(body.fullAccess);
    if (hasWorkbuddy) saveWorkbuddyPermissions(body.workbuddyFullAccess);
    return Response.json(readAll());
  } catch (e) { return Response.json({ error: String(e) }, { status: 500 }); }
}
