'use strict';

const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { metrics } = require('@opentelemetry/api');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'Application1-backend',
});

// OTLP → Collector
const exporter = new OTLPMetricExporter({
  url: 'http://localhost:4319/v1/metrics',
});

// Provider
const meterProvider = new MeterProvider({
  resource,
});

meterProvider.addMetricReader(
  new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: 5000,
  })
);

metrics.setGlobalMeterProvider(meterProvider);

// Meters
const meter = metrics.getMeter('Application1-employee-meter');

const requestCount = meter.createCounter('employee_requests_total');
const requestDuration = meter.createHistogram('employee_request_duration_ms');

module.exports = {
  requestCount,
  requestDuration,
};
