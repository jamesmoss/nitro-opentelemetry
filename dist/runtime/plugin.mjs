import * as api from "@opentelemetry/api";
import { ATTR_URL_PATH, ATTR_URL_FULL, ATTR_HTTP_REQUEST_METHOD, ATTR_HTTP_RESPONSE_STATUS_CODE, ATTR_URL_SCHEME, ATTR_SERVER_ADDRESS, ATTR_SERVER_PORT } from "@opentelemetry/semantic-conventions";
import { getRequestProtocol, getRequestURL, getHeaders } from "h3";
const context = api.context, trace = api.trace;
export default ((nitro) => {
  nitro.hooks.hook("request", async (_event) => {
    const event = _event;
    const tracer = trace.getTracer("nitro-opentelemetry");
    const requestURL = getRequestURL(event);
    const currentContext = context.active();
    const parentCtx = trace.getSpan(currentContext) ? currentContext : api.propagation.extract(currentContext, getHeaders(event));
    const matchedRoute = event.context?.matchedRoute?.route;
    const path = event.url?.pathname;
    const span = tracer.startSpan(await getSpanName(event), {
      attributes: {
        [ATTR_URL_PATH]: matchedRoute || path,
        [ATTR_URL_FULL]: path,
        [ATTR_HTTP_REQUEST_METHOD]: event.req.method,
        [ATTR_URL_SCHEME]: getRequestProtocol(event),
        [ATTR_SERVER_ADDRESS]: requestURL.host,
        [ATTR_SERVER_PORT]: requestURL.port
      },
      kind: api.SpanKind.SERVER
    }, parentCtx);
    const ctx = trace.setSpan(context.active(), span);
    event.otel = {
      span,
      __endTime: void 0,
      ctx
    };
  });
  nitro.hooks.hook("response", (_res, _event) => {
    const event = _event;
    if (!event.otel) return;
    event.otel.span.setAttribute(ATTR_HTTP_RESPONSE_STATUS_CODE, _res.status);
    nitro.hooks.callHook("otel:span:end", { event, span: event.otel.span });
    event.otel.span.end(event.otel.__endTime);
  });
  nitro.hooks.hook("error", async (error, { event: _event }) => {
    const event = _event;
    const ctx = { event, error, shouldRecord: true };
    await nitro.hooks.callHook("otel:recordException:before", ctx);
    if (event?.otel) {
      if (ctx.shouldRecord) {
        event.otel.span.recordException(error);
        event.otel.span.setAttribute(ATTR_HTTP_RESPONSE_STATUS_CODE, 500);
      }
      await nitro.hooks.callHook("otel:span:end", { event, span: event.otel.span });
      event.otel.span.end();
    } else {
      if (ctx.shouldRecord) {
        const span = trace.getSpan(api.ROOT_CONTEXT);
        span?.recordException(error);
        span?.end();
      }
    }
  });
  async function getSpanName(event) {
    const ctx = { event, name: void 0 };
    await nitro.hooks.callHook("otel:span:name", ctx);
    const matchedRoute = event.context?.matchedRoute?.route;
    const path = event.url?.pathname;
    return ctx.name || matchedRoute || path;
  }
});
