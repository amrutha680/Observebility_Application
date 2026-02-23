import React, { useEffect, useState } from "react";
import "./AddEmployee.css";

import { context, trace, propagation } from "@opentelemetry/api";
import { tracer, logger } from "../tracing"; // Tempo logger

export default function AddEmployee({ onBack, onSuccess, parentSpan }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    designation: "",
    salary: ""
  });

  const [uiText, setUiText] = useState(null);

  // --------------------------
  // LOAD UI TEXT (CHILD SPAN)
  // --------------------------
  useEffect(() => {
    if (!parentSpan) return;

    async function loadUI() {
      context.with(trace.setSpan(context.active(), parentSpan), () => {
        tracer.startActiveSpan("Application1-frontend event: load the Add New Employee text from backend", async (span) => {
          try {
            console.log("🎯 Child span for UI load created:", span.spanContext());
            console.log("🟢 Parent span context:", parentSpan.spanContext());

            const activeCtx = trace.setSpan(context.active(), span);
            const headers = {};
            propagation.inject(activeCtx, headers);

            const res = await fetch("http://localhost:5000/ui-text", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...headers,
              },
            });

            const data = await res.json();
            setUiText(data.titles);

            span.setStatus({ code: 1 });

            // Tempo-style logger
            logger.emit({
              severityText: "INFO",
              body: "✅ Load UI text successful for AddEmployee",
              attributes: {
                traceId: span.spanContext().traceId,
                spanId: span.spanContext().spanId
              }
            });
          } catch (err) {
            console.error("❌ UI Load Error", err);
            span.recordException(err);
            span.setStatus({ code: 2, message: err.message });

            logger.emit({
              severityText: "ERROR",
              body: "❌ UI Load Error for AddEmployee",
              attributes: {
                traceId: span.spanContext().traceId,
                spanId: span.spanContext().spanId,
                error: err.message
              }
            });
          } finally {
            span.end();
          }
        });
      });
    }

    loadUI();
  }, [parentSpan]);

  // --------------------------
  // FORM INPUT HANDLER
  // --------------------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // --------------------------
  // SUBMIT FORM (CHILD SPAN)
  // --------------------------
  const handleSubmit = () => {
    if (!parentSpan) return;

    context.with(trace.setSpan(context.active(), parentSpan), () => {
      tracer.startActiveSpan("Application1-frontend event: sends data to the backend", async (childSpan) => {
        console.log("🎯 Child span for submit created:", childSpan.spanContext());
        console.log("🟢 Parent span context:", parentSpan.spanContext());

        const childCtx = trace.setSpan(context.active(), childSpan);
        const headers = {};
        propagation.inject(childCtx, headers);

        const dataToSend = { ...form, salary: parseFloat(form.salary) };

        try {
          const res = await fetch("http://localhost:5000/employees", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify(dataToSend),
          });

          if (!res.ok) {
            const errText = await res.text();
            console.error("❌ Backend Error:", errText);
            childSpan.recordException(errText);
            childSpan.setStatus({ code: 2, message: "Backend error" });

            logger.emit({
              severityText: "ERROR",
              body: "❌ AddEmployee failed",
              attributes: {
                traceId: childSpan.spanContext().traceId,
                spanId: childSpan.spanContext().spanId,
                error: errText
              }
            });

            onSuccess("Failed to add employee");
            return;
          }

          childSpan.setStatus({ code: 1 });

          logger.emit({
            severityText: "INFO",
            body: "✅ Employee added successfully",
            attributes: {
              traceId: childSpan.spanContext().traceId,
              spanId: childSpan.spanContext().spanId,
              employee: JSON.stringify(dataToSend)
            }
          });

          onSuccess("Employee Added Successfully!");
        } catch (error) {
          console.error("❌ Submit Error:", error);
          childSpan.recordException(error);
          childSpan.setStatus({ code: 2, message: error.message });

          logger.emit({
            severityText: "ERROR",
            body: "❌ AddEmployee submit error",
            attributes: {
              traceId: childSpan.spanContext().traceId,
              spanId: childSpan.spanContext().spanId,
              error: error.message
            }
          });

          onSuccess("Failed to add employee");
        } finally {
          childSpan.end();
        }
      });
    });
  };

  if (!uiText) return <p>Loading...</p>;

  return (
    <div className="addContainer">
      <div className="card-container">
        <h2>{uiText.addEmployee}</h2>

        <input type="text" name="name" placeholder="Name" onChange={handleChange} className="input-field" />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} className="input-field" />
        <input type="text" name="designation" placeholder="Designation" onChange={handleChange} className="input-field" />
        <input type="number" name="salary" placeholder="Salary" onChange={handleChange} className="input-field" />

        <button onClick={handleSubmit} className="btn purple">Add Employee</button>
        <button className="back-btn" onClick={onBack}>⬅ Back</button>
      </div>
    </div>
  );
}
