import * as api from "@opentelemetry/api";
import { defineHandler } from "h3";
const context = api.context;
export function defineTracedEventHandler(handler) {
  if (isEventHandler(handler)) {
    return defineHandler((event) => {
      return context.with(event.otel.ctx, handler, void 0, event);
    });
  } else if (isEventHandlerObject(handler)) {
    const { handler: h, ...rest } = handler;
    if (!h) throw new Error("EventHandlerObject must have a handler function");
    return defineHandler({
      ...rest,
      handler: (event) => {
        return context.with(event.otel.ctx, h, void 0, event);
      }
    });
  }
  throw new Error("Event handler must satisfy either EventHandler or EventHandlerObject from h3");
}
function isEventHandler(handler) {
  return typeof handler === "function";
}
function isEventHandlerObject(handler) {
  return typeof handler === "object" && typeof handler.handler === "function";
}
