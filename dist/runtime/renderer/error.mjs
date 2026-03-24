import { context } from "@opentelemetry/api";
import errorRenderer from "#nitro-error-handler";
export default ((error, _event) => {
  const event = _event;
  return context.with(event.otel.ctx, errorRenderer, void 0, error, event);
});
