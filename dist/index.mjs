import { resolvePathSync, resolvePath } from 'mlly';
import MagicString from 'magic-string';
import { consola } from 'consola';
import { normalize } from 'pathe';
import defu from 'defu';
import { resolveModulePath } from 'exsolve';

const presets = {
  package: resolvePathSync("nitro-opentelemetry/runtime/utils", {
    extensions: [".mjs", ".ts"]
  })
};

const logger = consola.withTag("nitro-opentelemetry");

async function getPresetFile(nitro) {
  if (nitro.options.otel?.preset === false) {
    return "";
  }
  if (nitro.options.otel?.preset?.name === "custom") {
    return await resolvePath(nitro.options.otel.preset.filePath, {
      extensions: [".mjs", ".ts"],
      url: nitro.options.rootDir
    });
  }
  const nitroPreset = nitro.options.otel?.preset?.name || nitro.options.preset;
  switch (nitroPreset) {
    case "node":
    case "node-cluster":
    case "nitro-dev":
    case "node-server": {
      return await resolvePath("nitro-opentelemetry/runtime/presets/node", {
        extensions: [".mjs", ".ts"]
      });
    }
    case "azure-monitor": {
      return await resolvePath("nitro-opentelemetry/runtime/presets/azure-monitor", {
        extensions: [".mjs", ".ts"]
      });
    }
    case "cf-worker": {
      return await resolvePath("nitro-opentelemetry/runtime/presets/cf-worker", {
        extensions: [".mjs", ".ts"]
      });
    }
  }
  logger.warn(`Initializer file for preset ${nitroPreset} not found. Please provide your own or open an issue on the repository.`);
  return "";
}
function isPresetEntry(nitro) {
  const preset = (nitro.options.otel?.preset ? nitro.options.otel?.preset.name : void 0) || nitro.options.preset;
  return ["cf-worker"].includes(preset);
}

async function module$1(nitro) {
  nitro.options.alias["#nitro-opentelemetry/init"] = await getPresetFile(nitro);
  if (isPresetEntry(nitro)) {
    nitro.options.alias["#nitro-entry-file"] = nitro.options.entry;
    nitro.options.entry = await getPresetFile(nitro);
  }
  const noExternals = nitro.options.noExternals || [];
  if (Array.isArray(noExternals)) {
    noExternals.push(
      /nitro-opentelemetry/,
      /@opentelemetry\//
    );
    nitro.options.noExternals = noExternals;
  }
  const otelPackages = [
    "@opentelemetry/api",
    "@opentelemetry/semantic-conventions",
    "@opentelemetry/sdk-trace-base"
  ];
  for (const pkg of otelPackages) {
    try {
      nitro.options.alias[pkg] = resolveModulePath(pkg, {
        from: import.meta.url
      });
    } catch {
    }
  }
  if (nitro.options.otel?.preset !== false) {
    nitro.hooks.hook("rollup:before", (nitro2, rollupConfig) => {
      if (!rollupConfig.plugins) rollupConfig.plugins = [];
      const plugins = rollupConfig.plugins;
      if (Array.isArray(plugins)) {
        rollupConfig.plugins = plugins.filter((plugin) => {
          if (plugin && "name" in plugin) {
            return plugin.name !== "impound";
          }
          return true;
        });
      }
      rollupConfig.plugins.push({
        name: "inject-init-plugin",
        async transform(code, id) {
          const normalizedId = normalize(id);
          if (normalizedId.includes("runtime/entries") || normalizedId.includes("presets/") || this.getModuleInfo(id)?.isEntry) {
            const s = new MagicString(code);
            s.prepend(`import '#nitro-opentelemetry/init';`);
            return {
              code: s.toString(),
              map: s.generateMap({ hires: true }),
              moduleSideEffects: true
            };
          }
          if (normalizedId === nitro2.options.alias["#nitro-opentelemetry/init"]) {
            const s = new MagicString(code);
            return {
              moduleSideEffects: true,
              code: s.toString(),
              map: s.generateMap({ hires: true })
            };
          }
        }
      });
    });
    nitro.options.virtual["#nitro-otel-options"] = nitro.options.otel?.preset && typeof nitro.options.otel.preset === "object" && "options" in nitro.options.otel.preset ? `export default ${JSON.stringify(nitro.options.otel.preset.options || {})}` : `export default {}`;
  }
  if (nitro.options.imports) {
    nitro.options.imports.presets ??= [];
    nitro.options.imports.presets.push(presets);
  }
  if (nitro.options.renderer?.handler) {
    nitro.options.alias["#nitro-renderer"] = nitro.options.renderer.handler;
    nitro.options.renderer.handler = await resolvePath("nitro-opentelemetry/runtime/renderer/renderer", {
      extensions: [".mjs", ".ts"]
    });
  }
  if (nitro.options.errorHandler) {
    if (typeof nitro.options.errorHandler === "string") {
      nitro.options.alias["#nitro-error-handler"] = nitro.options.errorHandler;
      nitro.options.errorHandler = await resolvePath("nitro-opentelemetry/runtime/renderer/error", {
        extensions: [".mjs", ".ts"]
      });
    } else if (Array.isArray(nitro.options.errorHandler)) {
      nitro.hooks.hook("rollup:before", async (nitro2, rollupConfig) => {
        const errorHandlers = await Promise.all(nitro2.options.errorHandler.map((path) => {
          return resolveModulePath(path, {
            from: [
              import.meta.url,
              nitro2.options.rootDir
            ],
            extensions: [".mjs", ".ts", ".js", ".cjs"]
          });
        }));
        rollupConfig.plugins.push({
          name: "nitro-otel:inject-error-handlers",
          async transform(code, id) {
            if (errorHandlers.includes(normalize(id))) {
              const s = new MagicString(code);
              s.prepend(`import { context } from "@opentelemetry/api";
`);
              const defaultExport = this.parse(code).body.find((node) => node.type === "ExportDefaultDeclaration");
              if (defaultExport) {
                s.overwrite(
                  defaultExport.declaration.start,
                  defaultExport.declaration.end,
                  `(...args) => context.with(args?.[1]?.otel?.ctx, ${code.slice(defaultExport.declaration.start, defaultExport.declaration.end)}, undefined, ...args)`
                );
                return {
                  code: s.toString(),
                  map: s.generateMap({ hires: true })
                };
              }
            }
          }
        });
      });
    }
  }
  nitro.options.typescript.tsConfig = defu(nitro.options.typescript.tsConfig, {
    compilerOptions: {
      types: ["nitro-opentelemetry"]
    }
  });
  nitro.options.plugins.push(await resolvePath("nitro-opentelemetry/runtime/plugin", {
    extensions: [".mjs", ".ts"]
  }));
  nitro.hooks.hook("rollup:before", (_, rollupConfig) => {
    const ogModuleCtx = rollupConfig.moduleContext;
    rollupConfig.moduleContext = (_id) => {
      const id = normalize(_id);
      if (id.includes("node_modules/@opentelemetry/api")) {
        return "(undefined)";
      }
      return typeof ogModuleCtx === "object" ? ogModuleCtx[id] : ogModuleCtx?.(id);
    };
  });
}
async function moduleWithCompat(arg1, arg2) {
  if (arg2?.options.nitro) {
    arg2.hooks.hookOnce("nitro:config", (nitroConfig) => {
      nitroConfig.modules = nitroConfig.modules || [];
      nitroConfig.modules.push(module$1);
    });
  } else {
    await module$1(arg1);
  }
}

export { moduleWithCompat as default };
