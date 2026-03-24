import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { ConsoleSpanExporter, NodeTracerProvider, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
const contextManager = new AsyncLocalStorageContextManager();
const provider = new NodeTracerProvider({
  spanProcessors: [
    new SimpleSpanProcessor(new ConsoleSpanExporter())
  ]
});
provider.register({
  contextManager
});
registerInstrumentations({
  instrumentations: [
    new UndiciInstrumentation()
  ]
});
