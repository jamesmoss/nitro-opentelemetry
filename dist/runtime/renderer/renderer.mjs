import { context } from "@opentelemetry/api";
import renderer from "#nitro-renderer";
import { defineHandler } from "h3";
export default defineHandler((e) => {
  return context.with(e.otel.ctx, renderer, void 0, e);
});
