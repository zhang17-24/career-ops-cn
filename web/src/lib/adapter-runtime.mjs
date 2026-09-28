import { prepareCodexAdapter } from "./codex-adapter-runtime.mjs";
import { prepareWorkbuddyAdapter } from "./workbuddy-adapter-runtime.mjs";

/**
 * Pick the adapter runtime for a CLI, or `null` when it has none.
 *
 * A dispatcher rather than an `else if` chain in the route: the route's job is
 * to run the agent, not to know which runtimes exist. Adding the next runtime
 * should not mean editing the transport layer.
 *
 * `null` is the important return. A candidate exists and the user picked a CLI
 * that cannot drive an adapter — the route must then keep its EXISTING
 * behaviour (spawn the CLI with its normal argv) rather than silently degrade
 * to something that looks like a successful adaptation. Returning a
 * "best effort" runtime here is how a run gets banked as a result it never
 * produced.
 *
 * The implementations are injectable so the dispatch itself is testable without
 * launching a CLI or touching a real permission file.
 *
 * @param {{cliId: string, root: string, candidateId: string, binPath: string, prompt: string}} input
 * @returns {Promise<{args: string[], env: NodeJS.ProcessEnv, dispose: () => void, warmup?: Function} | null>}
 */
export async function prepareAdapterRuntime({
  cliId,
  codex = prepareCodexAdapter,
  workbuddy = prepareWorkbuddyAdapter,
  ...rest
}) {
  if (cliId === "codex") return codex(rest);
  if (cliId === "workbuddy") return workbuddy(rest);
  return null;
}
