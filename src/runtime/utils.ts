import type {
  EventHandlerRequest,
  EventHandlerResponse,
  EventHandler,
  EventHandlerObject,
  H3Event,
} from "h3"
import * as api from "@opentelemetry/api"
import { defineHandler } from "h3"

const context = api.context

export function defineTracedEventHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response = EventHandlerResponse,
>(handler: EventHandler<Request, Response> | EventHandlerObject<Request, Response>) {
  if (isEventHandler(handler)) {
    return defineHandler<Request, Response>((event) => {
      return context.with(event.otel.ctx, handler, undefined, event)
    })
  } else if (isEventHandlerObject(handler)) {
    const { handler: h, ...rest } = handler
    if (!h) throw new Error("EventHandlerObject must have a handler function")
    return defineHandler({
      ...rest,
      handler: (event) => {
        return context.with(event.otel.ctx, h as (event: H3Event) => unknown, undefined, event)
      },
    })
  }
  throw new Error("Event handler must satisfy either EventHandler or EventHandlerObject from h3")
}

function isEventHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response = EventHandlerResponse,
>(
  handler: EventHandler<Request, Response> | EventHandlerObject<Request, Response>,
): handler is EventHandler<Request, Response> {
  return typeof handler === "function"
}

function isEventHandlerObject<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response = EventHandlerResponse,
>(
  handler: EventHandler<Request, Response> | EventHandlerObject<Request, Response>,
): handler is EventHandlerObject<Request, Response> {
  return typeof handler === "object" && typeof handler.handler === "function"
}
