// tracing.js (Node.js backend)

const { NodeSDK } = require("@opentelemetry/sdk-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { W3CTraceContextPropagator } = require("@opentelemetry/core");


const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");




// -----------------------
// LOGGING
// -----------------------
const { LoggerProvider, BatchLogRecordProcessor } = require("@opentelemetry/sdk-logs");
const { OTLPLogExporter } = require("@opentelemetry/exporter-logs-otlp-http");
const { logs } = require("@opentelemetry/api-logs");

// LOG EXPORTER
const logExporter = new OTLPLogExporter({
  url: "http://localhost:4319/v1/logs",
});

// LOGGER PROVIDER
const loggerProvider = new LoggerProvider({
  resource: new Resource({
     [SemanticResourceAttributes.SERVICE_NAME]: "Application1-backend",
   
  }),
});

loggerProvider.addLogRecordProcessor(
  new BatchLogRecordProcessor(logExporter)
);

// SET GLOBAL LOGGER
logs.setGlobalLoggerProvider(loggerProvider);

// LOGGER INSTANCE
const logger = logs.getLogger("Application1-backend-logger");

// Export logger
module.exports.logger = logger;

// -----------------------
// TRACES
// -----------------------
const traceExporter = new OTLPTraceExporter({
  url: "http://localhost:4319/v1/traces",
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "Application1-employee-backend",
  }),

  spanProcessor: new BatchSpanProcessor(traceExporter),
  textMapPropagator: new W3CTraceContextPropagator(),

  instrumentations: [],
});

// Start OpenTelemetry
sdk.start();
console.log("✅ OpenTelemetry backend tracing + logging started");

module.exports = { logger };

// Graceful shutdown
process.on("SIGTERM", async () => {
  await loggerProvider.shutdown();
  await sdk.shutdown();
  process.exit(0);
});
