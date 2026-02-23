import React, { useEffect, useState } from 'react';
import "./GetAllEmployees.css";

import { context, trace, propagation } from "@opentelemetry/api";
import { logger, tracer } from "../tracing"; // <-- logger from your tracing.js

export default function GetAllEmployees({ onBack, parentSpan}) {

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ---------------------------------------------------------
    // LOAD ALL EMPLOYEES (CHILD SPAN)
    // ---------------------------------------------------------
    useEffect(() => {
        if (!parentSpan || !tracer) return;

        console.log("📌 Restoring parent context for GetAllEmployees");
        
        // Restore parent context
        context.with(trace.setSpan(context.active(), parentSpan), () => {
            tracer.startActiveSpan(
                "Application1-frontend event: get-all-employees from backend",
                async (span) => {
                    console.log("📡 Child Span Created (GetAllEmployees):", span.spanContext());
                    console.log("🟢 Parent Span:", parentSpan.spanContext());

                   
                    try {
                        // Make this span active
                        const activeCtx = trace.setSpan(context.active(), span);

                        // Inject trace headers
                        const headers = {};
                        propagation.inject(activeCtx, headers);

                        const res = await fetch("http://localhost:5000/employees", {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                                ...headers,
                            },
                        });

                        const data = await res.json();
                        setEmployees(data.employees);
                        setLoading(false);

                        // LOG: success
                        logger.emit({
                            severityText: 'INFO',
                            body: '✅ GetAllEmployees loaded successfully',
                            attributes: {
                                traceId: span.spanContext().traceId,
                                spanId: span.spanContext().spanId,
                                count: Array.isArray(data.employees) ? data.employees.length : 0
                            }
                        });

                        span.setStatus({ code: 1 });
                    } catch (err) {
                        console.error("❌ GetAllEmployees Error:", err);
                        setError("Failed to fetch employees");
                        setLoading(false);

                        // LOG: error
                        logger.emit({
                            severityText: 'ERROR',
                            body: '❌ GetAllEmployees failed to load',
                            attributes: {
                                error: err?.message || String(err),
                                parentTraceId: parentSpan.spanContext().traceId
                            }
                        });

                        span.recordException(err);
                        span.setStatus({ code: 2, message: err.message });
                    } finally {
                        span.end();

                        
                    }
                }
            );
        });

    }, [parentSpan, tracer]);

    return (
        <div className='getall-container'>
            <div className='content-card'>
                <h2 className='title'>All Employees</h2>

                {loading && <p className='loading'>Loading...</p>}
                {error && <p className='error'>{error}</p>}

                {!loading && !error && employees.length === 0 && (
                    <p className='no-data'>No employees found</p>
                )}

                {!loading && !error && employees.length > 0 && (
                    <div className='table-container'>
                        <table className='employee-table'>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Position</th>
                                    <th>Salary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp) => (
                                    <tr key={emp.id}>
                                        <td>{emp.id}</td>
                                        <td>{emp.name}</td>
                                        <td>{emp.email}</td>
                                        <td>{emp.designation}</td>
                                        <td>${emp.salary ? emp.salary.toLocaleString() : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <button className='back-btn' onClick={onBack}>
                    Disconnect
                </button>
            </div>
        </div>
    );
}
