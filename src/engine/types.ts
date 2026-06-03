import type { EngineName } from "../types.js";
import type { NormalizedOptions } from "../core/options.js";
import type { ResolvedInput } from "../core/input.js";

export interface EngineRenderResult {
  bytes: Uint8Array;
  pageCount: number;
}

export interface Engine {
  readonly name: Exclude<EngineName, "auto">;
  /** Cheap check: is this engine usable in the current runtime right now? */
  isAvailable(opts: NormalizedOptions): Promise<boolean>;
  render(
    input: ResolvedInput,
    opts: NormalizedOptions
  ): Promise<EngineRenderResult>;
}
