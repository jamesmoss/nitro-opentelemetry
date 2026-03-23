import { defineTracedEventHandler } from 'nitro-opentelemetry/runtime/utils'
import { getQuery } from 'h3'
import { serverFetch } from 'nitro'

export default defineTracedEventHandler(async (e) => {
    const ms = Number(getQuery(e).ms)

    await new Promise((resolve) => setTimeout(resolve, ms))
    const res = await serverFetch('/another-endpoint')
    const { traceId, parentSpanId } = await res.json()
    return {
        traceId: e.otel.span.spanContext().traceId,
        spanId: e.otel.span.spanContext().spanId,
        anotherEndpoint: {
            traceId,
            parentSpanId
        }
    }
})
