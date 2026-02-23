const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const metricExporter = new OTLPMetricExporter({
  url: "http://localhost:4318/v1/metrics",
});


// ----- TRACES (new) -----
const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // Tempo OTLP endpoint
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'Application1-backend',
  }),
  traceExporter,          // tracing
  metricReader,           // metrics
  instrumentations: [getNodeAutoInstrumentations()], // auto-instrumentation
});

sdk.start();
console.log("OpenTelemetry Metrics & Traces initialized");
