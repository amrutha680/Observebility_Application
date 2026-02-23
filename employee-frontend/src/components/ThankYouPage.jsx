import React from 'react';
import './ThankYouPage.css';
import { tracer } from '../tracing';
import { context, trace } from '@opentelemetry/api';
import { logger } from '../tracing'; // assuming your logger is exported from tracing.js

export default function ThankYouPage({ message, onHome, parentSpan }) {

    const handleHomeClick = () => {
        if (parentSpan) {
            context.with(trace.setSpan(context.active(), parentSpan), () => {
                tracer.startActiveSpan('Application1-frontend event:thankyou-back-to-home', (span) => {

                    console.log('🔙 Back to Home Click Child Span:', span.spanContext());
                    console.log('🟢 Parent Span Context:', parentSpan.spanContext());

                    // Emit frontend log
                    logger.emit({
                        severityText: 'INFO',
                        body: '🟦 Back to Home button clicked on ThankYou page',
                        attributes: {
                            traceId: span.spanContext().traceId,
                            spanId: span.spanContext().spanId
                        }
                    });

                    try {
                        span.addEvent('button_click', { button: 'Back to Home' });

                        // Call the original onHome function
                        onHome();

                        span.setStatus({ code: 1 }); // success
                        console.log('🟢 Back to Home action completed successfully');

                        // Optional: emit another success log
                        logger.emit({
                            severityText: 'INFO',
                            body: '✅ Back to Home action completed',
                            attributes: {
                                traceId: span.spanContext().traceId,
                                spanId: span.spanContext().spanId
                            }
                        });

                    } catch (err) {
                        console.error('❌ Error in Back to Home:', err);
                        span.recordException(err);
                        span.setStatus({ code: 2, message: err.message });

                        // Log error
                        logger.emit({
                            severityText: 'ERROR',
                            body: `❌ Error in Back to Home: ${err.message}`,
                            attributes: {
                                traceId: span.spanContext().traceId,
                                spanId: span.spanContext().spanId
                            }
                        });
                    } finally {
                        span.end();
                    }
                });
            });
        } else {
            // fallback if no parent span
            onHome();
        }
    };

    return (
        <div className='thankyou-container'>
            <div className='thankyou-card'>
                <div className='success-icon'>✅</div>
                <h1 className='thankyou-title'>Thank You!</h1>
                <div className='thankyou-message'>
                    <div className='result-box'>
                        {message}
                    </div>
                </div>
                <button onClick={handleHomeClick} className='home-btn'>Back to Home</button>
            </div>
        </div>
    );
}
