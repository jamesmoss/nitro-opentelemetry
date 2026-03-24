import { useAzureMonitor } from "@azure/monitor-opentelemetry";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import _options from "#nitro-otel-options";
import { defu } from "defu";
const options = {
  azureMonitorExporterOptions: defu(_options, {
    connectionString: process.env["APPLICATIONINSIGHTS_CONNECTION_STRING"]
  })
};
registerInstrumentations({
  instrumentations: [
    new UndiciInstrumentation()
  ]
});
useAzureMonitor(options);
