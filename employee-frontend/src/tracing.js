// tracing.js
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { trace } from "@opentelemetry/api";

// Tracer setup
const provider = new WebTracerProvider({
  resource: {
    attributes: {
      'service.name': 'Application1-frontend', // Service name for Tempo
    },
  },
});
const exporter = new OTLPTraceExporter({ url: 'http://localhost:4319/v1/traces' });
provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register({ contextManager: new ZoneContextManager() });

export const tracer = trace.getTracer('employee-frontend-tracer');

// -------------------
// Logger setup
// -------------------
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { logs } from '@opentelemetry/api-logs';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const logExporter = new OTLPLogExporter({ url: 'http://localhost:4319/v1/logs' });
const loggerProvider = new LoggerProvider({
  resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: 'employee-frontend' }),
});
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
logs.setGlobalLoggerProvider(loggerProvider);

export const logger = logs.getLogger('application1-frontend-logger'); // <--- Export the logger
