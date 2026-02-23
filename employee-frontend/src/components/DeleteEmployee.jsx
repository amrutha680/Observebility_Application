import React, { useEffect, useState } from "react";
import "./DeleteEmployee.css";

import { context, trace, propagation } from "@opentelemetry/api";
import { tracer, logger } from "../tracing";

export default function DeleteEmployee({ onBack, onSuccess, parentSpan }) {
  const [id, setId] = useState("");
  const [uiText, setUiText] = useState(null);

  // ---------------------------------------------------------
  // LOAD UI TEXT (CHILD SPAN)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!parentSpan) return;

    context.with(trace.setSpan(context.active(), parentSpan), () => {
      tracer.startActiveSpan(
        "Application1-frontend event: load the Delete Employee text from backend",
        async (span) => {
          try {
            console.log("🎯 Child span for UI load created:", span.spanContext());
            console.log("🟢 Parent span context:", parentSpan.spanContext());

            const activeCtx = trace.setSpan(context.active(), span);
            const headers = {};
            propagation.inject(activeCtx, headers);

            const res = await fetch("http://localhost:5000/ui-text", {
              method: "GET",
              headers: { "Content-Type": "application/json", ...headers },
            });

            const data = await res.json();
            setUiText(data.titles);

            span.setStatus({ code: 1 });

            // Tempo-style logger
            logger.emit({
              severityText: "INFO",
              body: "✅ Load UI text successful for DeleteEmployee",
              attributes: {
                traceId: span.spanContext().traceId,
                spanId: span.spanContext().spanId
              }
            });
          } catch (err) {
            span.recordException(err);
            span.setStatus({ code: 2, message: err.message });
            console.error("❌ UI Load Error:", err);

            logger.emit({
              severityText: "ERROR",
              body: "❌ UI Load Error for DeleteEmployee",
              attributes: {
                traceId: span.spanContext().traceId,
                spanId: span.spanContext().spanId,
                error: err.message
              }
            });
          } finally {
            span.end();
          }
        }
      );
    });
  }, [parentSpan]);

  // ---------------------------------------------------------
  // DELETE EMPLOYEE (CHILD SPAN)
  // ---------------------------------------------------------
  const handleDelete = () => {
    if (!parentSpan) return;

    context.with(trace.setSpan(context.active(), parentSpan), () => {
      tracer.startActiveSpan(
        "Application1-frontend event: delete-employee-submit to backend",
        async (span) => {
          try {
            console.log("🎯 Child span for delete submit created:", span.spanContext());
            console.log("🟢 Parent span context:", parentSpan.spanContext());

            const activeCtx = trace.setSpan(context.active(), span);
            const headers = {};
            propagation.inject(activeCtx, headers);

            const res = await fetch(`http://localhost:5000/employees/${id}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json", ...headers },
            });

            if (!res.ok) {
              span.setStatus({ code: 2, message: "Delete failed" });
              onSuccess("Delete failed");

              logger.emit({
                severityText: "ERROR",
                body: `❌ DeleteEmployee failed for ID: ${id}`,
                attributes: {
                  traceId: span.spanContext().traceId,
                  spanId: span.spanContext().spanId,
                  employeeId: id
                }
              });
            } else {
              span.setStatus({ code: 1 });
              onSuccess("Employee Deleted Successfully!");

              logger.emit({
                severityText: "INFO",
                body: `✅ DeleteEmployee successful for ID: ${id}`,
                attributes: {
                  traceId: span.spanContext().traceId,
                  spanId: span.spanContext().spanId,
                  employeeId: id
                }
              });
            }
          } catch (err) {
            span.recordException(err);
            span.setStatus({ code: 2, message: err.message });
            onSuccess("Delete failed");
            console.error("❌ Delete Error:", err);

            logger.emit({
              severityText: "ERROR",
              body: "❌ DeleteEmployee error",
              attributes: {
                traceId: span.spanContext().traceId,
                spanId: span.spanContext().spanId,
                error: err.message
              }
            });
          } finally {
            span.end();
          }
        }
      );
    });
  };

  if (!uiText) {
    return <p>Loading...</p>;
  }

  return (
    <div className="delete-container">
      <div className="card-container">
        <h2>🗑️ {uiText.deleteEmployee}</h2>

        <input
          type="number"
          placeholder="Enter Employee ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="input-field"
        />

        <button onClick={handleDelete} className="btn red">Delete</button>
        <button className="back-btn" onClick={onBack}>Disconnect</button>
      </div>
    </div>
  );
}
