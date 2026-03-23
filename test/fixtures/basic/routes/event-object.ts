import { defineTracedEventHandler } from 'nitro-opentelemetry/runtime/utils'
import { serverFetch } from 'nitro'

export default defineTracedEventHandler({
  handler: async (e) => {
    const res = await serverFetch('/another-endpoint')
    const { traceId, parentSpanId } = await res.json()
    return {
      traceId: e.otel.span.spanContext().traceId,
      spanId: e.otel.span.spanContext().spanId,
      anotherEndpoint: {
        traceId,
        parentSpanId,
      },
    };
  },
});
