import React, { useEffect, useState } from "react";
import "./UpdateEmployee.css";

import { context, trace, propagation } from "@opentelemetry/api";
import { tracer, logger } from "../tracing";

export default function UpdateEmployee({ onBack, onSuccess, parentSpan }) {
  const [id, setId] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    designation: "",
    salary: "",
  });

  const [uiText, setUiText] = useState(null);

  // --------------------------
  // INPUT CHANGE HANDLER
  // --------------------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ---------------------------------------------------------
  // LOAD UI TEXT (CHILD SPAN)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!parentSpan) return;

    context.with(trace.setSpan(context.active(), parentSpan), () => {
      tracer.startActiveSpan(
        "Application1-frontend event:load UpdateEmployee text from backend",
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
              body: "✅ Load UI text successful for UpdateEmployee",
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
              body: "❌ UI Load Error for UpdateEmployee",
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
  // UPDATE EMPLOYEE (CHILD SPAN)
  // ---------------------------------------------------------
  const handleUpdate = () => {
    if (!parentSpan) return;

    context.with(trace.setSpan(context.active(), parentSpan), () => {
      tracer.startActiveSpan(
        "Application1-frontend event: Sending updated employee details to the backend",
        async (span) => {
          try {
            console.log("🎯 Child span for update submit created:", span.spanContext());
            console.log("🟢 Parent span context:", parentSpan.spanContext());

            const activeCtx = trace.setSpan(context.active(), span);
            const headers = {};
            propagation.inject(activeCtx, headers);

            const res = await fetch(`http://localhost:5000/employees/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", ...headers },
              body: JSON.stringify({ ...form, salary: parseFloat(form.salary) }),
            });

            if (!res.ok) {
              span.setStatus({ code: 2, message: "Update failed" });
              onSuccess("Failed to update employee");

              logger.emit({
                severityText: "ERROR",
                body: `❌ UpdateEmployee failed for ID: ${id}`,
                attributes: {
                  traceId: span.spanContext().traceId,
                  spanId: span.spanContext().spanId,
                  employeeId: id
                }
              });
            } else {
              span.setStatus({ code: 1 });
              onSuccess("Employee updated successfully! The changes have been saved.");
              onBack();

              logger.emit({
                severityText: "INFO",
                body: `✅ UpdateEmployee successful for ID: ${id}`,
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
            onSuccess("Failed to update employee");
            console.error("❌ Update Error:", err);

            logger.emit({
              severityText: "ERROR",
              body: "❌ UpdateEmployee error",
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
  return (
    <div>
      <button className="back-btn" onClick={onBack}>Disconnect</button>

      {context.with(trace.setSpan(context.active(), parentSpan), () => {
        tracer.startActiveSpan(
          "Application1-frontend event:load-UpdateEmployee-ui-frontend",
          async (span) => {
            try {
              console.log("📌 Child Span Created for Loading UI:", span.spanContext());
              console.log("🟢 Parent Span Context:", parentSpan?.spanContext());

              logger.emit({
                severityText: "INFO",
                body: "⏳ Loading UpdateEmployee UI...",
                attributes: {
                  traceId: span.spanContext().traceId,
                  spanId: span.spanContext().spanId
                }
              });

              // No actual fetch, only span creation during Loading state  

              span.setStatus({ code: 1 });
            } catch (err) {
              console.error("❌ Error in loading UI span:", err);

              span.recordException(err);
              span.setStatus({ code: 2, message: err.message });

              logger.emit({
                severityText: "ERROR",
                body: "❌ Error in UpdateEmployee UI load span",
                attributes: {
                  error: err.message
                }
              });
            } finally {
              span.end();  // valid because the span exists in this callback
            }
          }
        );
      })}

      <p>Loading...</p>
    </div>
  );
}

  return (
    <div className="update-container">
      <div className="card-container">
        <h2>{uiText.updateEmployee}</h2>

        <input
          type="number"
          placeholder="Enter ID to Update"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="input-field"
        />

        <input type="text" name="name" placeholder="Name" onChange={handleChange} className="input-field" />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} className="input-field" />
        <input type="text" name="designation" placeholder="Position" onChange={handleChange} className="input-field" />
        <input type="number" name="salary" placeholder="Salary" onChange={handleChange} className="input-field" />

        <button onClick={handleUpdate} className="btn orange">Update</button>
        <button className="back-btn" onClick={onBack}>Disconnect</button>
      </div>
    </div>
  );
}
