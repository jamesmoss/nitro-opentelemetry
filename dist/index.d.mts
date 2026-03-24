import { Context } from '@opentelemetry/api';
import { Span } from '@opentelemetry/sdk-trace-base';
import { H3Event } from 'h3';
import { AzureMonitorOpenTelemetryOptions } from '@azure/monitor-opentelemetry';
import { TraceConfig } from '@microlabs/otel-cf-workers';

interface CustomPreset {
    name: 'custom';
    /**
     * The path to the initializer file.
     * This file will be imported in the entry file and need to initialize the OpenTelemetry SDK or one of its providers.
     */
    filePath: string;
}
interface NodePreset {
    name: 'node';
}
interface AzureMonitorPreset {
    name: 'azure-monitor';
    options: AzureMonitorOpenTelemetryOptions;
}
/**
 * Cloudflare Worker preset
 * uses @microlabs/otel-cf-workers under the hood and re-export the entry file
 */
interface CfWorkerPreset {
    name: 'cf-worker';
    /**
     * The options to pass to the @microlabs/otel-cf-workers
     * This only accept serializable objects
     */
    options: TraceConfig;
}
type Presets = NodePreset | AzureMonitorPreset | CustomPreset | CfWorkerPreset;

declare module 'h3' {
    interface H3Event {
        otel: {
            span: Span;
            /**
             * @internal
             */
            __endTime: number | undefined;
            ctx: Context;
        };
    }
}
declare module 'nitro/types' {
    interface NitroRuntimeHooks {
        'otel:span:name': (context: {
            event: H3Event;
            name: undefined | string;
        }) => void;
        'otel:span:end': (context: {
            event: H3Event;
            span: Span;
        }) => void;
        'otel:recordException:before': (context: {
            event?: H3Event;
            error: Error;
            shouldRecord: boolean;
        }) => void;
    }
    interface NitroOptions {
        otel?: Partial<{
            /**
             * The path to the initializer file.
             * This file will be imported in the entry file and need to initialize the OpenTelemetry SDK or one of its providers.
             * Fallback to the default initializer file for the selected preset.
             * If set to `false`, no initializer file will be imported.
             */
            preset: Presets | false;
        }>;
    }
}

declare function moduleWithCompat(arg1: unknown, arg2: unknown): Promise<void>;

export { moduleWithCompat as default };
export type { AzureMonitorPreset, CfWorkerPreset, CustomPreset, NodePreset, Presets };
