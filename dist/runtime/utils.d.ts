import type { EventHandlerRequest, EventHandlerResponse, EventHandler, EventHandlerObject } from "h3";
export declare function defineTracedEventHandler<Request extends EventHandlerRequest = EventHandlerRequest, Response = EventHandlerResponse>(handler: EventHandler<Request, Response> | EventHandlerObject<Request, Response>): import("h3").EventHandlerWithFetch<EventHandlerRequest, unknown>;
