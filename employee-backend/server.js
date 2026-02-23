const express  = require("express");
const app = express();
require("dotenv").config();

const pool = require("./db");
const cors = require("cors");
const { requestCount, requestDuration } = require('./metrics');
require("./tracing");
const { context, trace, propagation } = require('@opentelemetry/api');
const { logger } = require("./tracing");

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;

// ==========================
// ADD EMPLOYEE
// ==========================
app.post("/employees", async (req, res) => {
    requestCount.add(1, { route: "Application1-POST /employees" }); 
    const ctx = propagation.extract(context.active(), req.headers);
    const span = trace.getTracer('Application1-employee-backend-tracer').startSpan('Application1-Backend event: Add-Employee', undefined, ctx);
    const sc = span.spanContext();

    

    const start = Date.now();
    console.log("POST /AddEmployees - TraceId:", sc.traceId, "SpanId:", sc.spanId);
    logger.emit({
        severityText: "INFO",
        body: "🟦 [API-HIT] Add Employee endpoint triggered",
        attributes: { route: "POST /employees", traceId: sc.traceId, spanId: sc.spanId }
    });

    try {
        const { name, email, designation, salary } = req.body;
        logger.emit({
            severityText: "INFO",
            body: "✏️ Preparing to insert employee",
            attributes: { name, email, designation, salary, traceId: sc.traceId, spanId: sc.spanId }
        });

        const query = 'INSERT INTO employee_inf (name, email, designation, salary) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(query, [name, email, designation, salary]);

        logger.emit({
            severityText: "INFO",
            body: "✅ Employee inserted successfully",
            attributes: { employeeId: result.rows[0].id, traceId: sc.traceId, spanId: sc.spanId }
        });

        res.status(201).json({ message: "Employee created successfully", employee: result.rows[0] });
    } catch (error) {
        logger.emit({
            severityText: "ERROR",
            body: "❌ Error while creating employee",
            attributes: { error: error.message, traceId: sc.traceId, spanId: sc.spanId }
        });
        res.status(500).json({ error: "Failed to create employee" });
    } finally {
        const duration = Date.now() - start;
        requestDuration.record(duration, { route: "POST /employees" });
        span.end();
        
    }
});

// ==========================
// GET ALL EMPLOYEES
// ==========================
app.get("/employees", async (req, res) => {
    requestCount.add(1, { route: "Application1-GET /employees" }); 
    const ctx = propagation.extract(context.active(), req.headers);

    const span = trace.getTracer().startSpan('Application1-Backend event: Get-Employee', undefined, ctx);
    const sc = span.spanContext();

    const start = Date.now();
    console.log("GET /Employess - TraceId:", sc.traceId, "SpanId:", sc.spanId);
    logger.emit({
        severityText: "INFO",
        body: "🟦 [API-HIT] Get All Employees endpoint triggered",
        attributes: { route: "GET /employees", traceId: sc.traceId, spanId: sc.spanId }
    });

    try {
        const result = await pool.query("SELECT * FROM employee_inf ORDER BY id");
        res.json({ count: result.rows.length, employees: result.rows });

        logger.emit({
            severityText: "INFO",
            body: `✅ Fetched ${result.rows.length} employees`,
            attributes: { traceId: sc.traceId, spanId: sc.spanId }
        });
    } catch (error) {
        logger.emit({
            severityText: "ERROR",
            body: "❌ Error while fetching employees",
            attributes: { error: error.message, traceId: sc.traceId, spanId: sc.spanId }
        });
        res.status(500).json({ error: "Failed to fetch employees" });
    } finally {
        const duration = Date.now() - start;
        requestDuration.record(duration, { route: "GET /employees" });
        span.end();
        
    }
});

// ==========================
// GET EMPLOYEE BY ID
// ==========================
app.get("/employees/:id", async (req, res) => {
    const ctx = propagation.extract(context.active(), req.headers);
    const span = trace.getTracer('employee-backend-tracer').startSpan('Application1-Backend event: Get-Employee-By-ID', undefined, ctx);
    const sc = span.spanContext();
    const start = Date.now();

    logger.emit({
        severityText: "INFO",
        body: "🟦 [API-HIT] Get Employee By ID endpoint triggered",
        attributes: { route: "GET /employees/:id", traceId: sc.traceId, spanId: sc.spanId }
    });

    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM employee_inf WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Employee not found" });
            logger.emit({
                severityText: "WARN",
                body: "⚠️ Employee not found",
                attributes: { employeeId: id, traceId: sc.traceId, spanId: sc.spanId }
            });
            return;
        }

        res.json(result.rows[0]);
        logger.emit({
            severityText: "INFO",
            body: "✅ Employee fetched successfully",
            attributes: { employeeId: id, traceId: sc.traceId, spanId: sc.spanId }
        });
    } catch (error) {
        logger.emit({
            severityText: "ERROR",
            body: "❌ Error while fetching employee by ID",
            attributes: { error: error.message, traceId: sc.traceId, spanId: sc.spanId }
        });
        res.status(500).json({ error: "Failed to fetch employee" });
    } finally {
        const duration = Date.now() - start;
        requestDuration.record(duration, { route: "GET /employees/:id" });
        span.end();
        
    }
});

// ==========================
// UPDATE EMPLOYEE
// ==========================
app.put("/employees/:id", async (req, res) => {
    requestCount.add(1, { route: "Application1-PUT  /employees" }); 
    const ctx = propagation.extract(context.active(), req.headers);
    const span = trace.getTracer('employee-backend-tracer').startSpan('Application1-Backend event: Update-Employee', undefined, ctx);
    const sc = span.spanContext();
    const start = Date.now();

    console.log("PUT /Update Employee - TraceId:", sc.traceId, "SpanId:", sc.spanId);

    logger.emit({
        severityText: "INFO",
        body: "🟦 [API-HIT] Update Employee endpoint triggered",
        attributes: { route: "PUT /employees/:id", traceId: sc.traceId, spanId: sc.spanId }
    });

    try {
        const { id } = req.params;
        const { name, email, designation, salary } = req.body;
        const query = 'UPDATE employee_inf SET name=$1, email=$2, designation=$3, salary=$4 WHERE id=$5 RETURNING *';
        const result = await pool.query(query, [name, email, designation, salary, id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Employee not found" });
            logger.emit({
                severityText: "WARN",
                body: "⚠️ Employee not found for update",
                attributes: { employeeId: id, traceId: sc.traceId, spanId: sc.spanId }
            });
            return;
        }

        res.json({ message: "Employee updated successfully", employee: result.rows[0] });
        logger.emit({
            severityText: "INFO",
            body: "✅ Employee updated successfully",
            attributes: { employeeId: id, traceId: sc.traceId, spanId: sc.spanId }
        });
    } catch (error) {
        logger.emit({
            severityText: "ERROR",
            body: "❌ Error while updating employee",
            attributes: { error: error.message, traceId: sc.traceId, spanId: sc.spanId }
        });
        res.status(500).json({ error: "Failed to update employee" });
    } finally {
        const duration = Date.now() - start;
        requestDuration.record(duration, { route: "PUT /employees/:id" });
        span.end();
       
    }
});

// ==========================
// DELETE EMPLOYEE
// ==========================
app.delete("/employees/:id", async (req, res) => {
    requestCount.add(1, { route: "Application1-DELETE /employees" });
    const ctx = propagation.extract(context.active(), req.headers);
    const span = trace.getTracer('employee-backend-tracer').startSpan('Application1-Backend event: Delete-Employee', undefined, ctx);
    const sc = span.spanContext();
    const start = Date.now();
    console.log("DELETE /Delete Employee - TraceId:", sc.traceId, "SpanId:", sc.spanId);

    logger.emit({
        severityText: "INFO",
        body: "🟦 [API-HIT] Delete Employee endpoint triggered",
        attributes: { route: "DELETE /employees/:id", traceId: sc.traceId, spanId: sc.spanId }
    });

    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM employee_inf WHERE id=$1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Employee not found" });
            logger.emit({
                severityText: "WARN",
                body: "⚠️ Employee not found for delete",
                attributes: { employeeId: id, traceId: sc.traceId, spanId: sc.spanId }
            });
            return;
        }

        res.json({ message: "Employee deleted successfully", employee: result.rows[0] });
        logger.emit({
            severityText: "INFO",
            body: "✅ Employee deleted successfully",
            attributes: { employeeId: id, traceId: sc.traceId, spanId: sc.spanId }
        });
    } catch (error) {
        logger.emit({
            severityText: "ERROR",
            body: "❌ Error while deleting employee",
            attributes: { error: error.message, traceId: sc.traceId, spanId: sc.spanId }
        });
        res.status(500).json({ error: "Failed to delete employee" });
    } finally {
        const duration = Date.now() - start;
        requestDuration.record(duration, { route: "DELETE /employees/:id" });
        span.end();
        
    }
});

// ==========================
// GET UI TEXT
// ==========================
app.get("/ui-text", async (req, res) => {
    requestCount.add(1, { route: "Application1-GET /ui-text" }); 
    const ctx = propagation.extract(context.active(), req.headers);
    const span = trace.getTracer().startSpan('Application1-Backend event: load-ui-text', undefined, ctx);
    const sc = span.spanContext();
    const start = Date.now();

    console.log("GET /ui-text - TraceId:", sc.traceId, "SpanId:", sc.spanId);

    logger.emit({
        severityText: "INFO",
        body: "🟦 [API-HIT] Load UI Text endpoint triggered",
        attributes: { route: "GET /ui-text", traceId: sc.traceId, spanId: sc.spanId }
    });

    try {
        const result = await pool.query("SELECT key, value FROM ui_text");
        const titles = {};
        result.rows.forEach(row => { titles[row.key] = row.value; });

        res.json({ titles });
        logger.emit({
            severityText: "INFO",
            body: `✅ UI Text loaded successfully (${result.rows.length} entries)`,
            attributes: { traceId: sc.traceId, spanId: sc.spanId }
        });
    } catch (err) {
        logger.emit({
            severityText: "ERROR",
            body: "❌ Error while loading UI text",
            attributes: { error: err.message, traceId: sc.traceId, spanId: sc.spanId }
        });
        res.status(500).json({ error: "Failed to fetch UI text" });
    } finally {
        const duration = Date.now() - start;
        requestDuration.record(duration, { route: "GET /ui-text" });
        span.end();
        
    }
});

// ==========================
// SERVER START
// ==========================
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    logger.emit({
        severityText: "INFO",
        body: "🚀 Server Started Successfully",
        attributes: { port: PORT }
    });
});
 