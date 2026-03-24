import { instrument } from "@microlabs/otel-cf-workers";
import handler from "#nitro-entry-file";
import options from "#nitro-otel-options";
export default instrument(handler, options);
