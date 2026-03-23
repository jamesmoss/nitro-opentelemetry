import { context } from "@opentelemetry/api";
import type { NitroErrorHandler } from "nitro/types";
import type { H3Event } from "h3";
// @ts-ignore - alias
import errorRenderer from "#nitro-error-handler";

export default <NitroErrorHandler>((error, _event) => {
    const event = _event as unknown as H3Event
    return context.with(event.otel.ctx, errorRenderer, undefined, error, event)
})
