import { context } from '@opentelemetry/api';
// @ts-ignore - alias
import renderer from "#nitro-renderer"
import { defineHandler } from "h3"

export default defineHandler((e) => {
    return context.with(e.otel.ctx, renderer, undefined, e)
})
