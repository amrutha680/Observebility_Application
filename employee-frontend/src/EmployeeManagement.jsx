import React, { useEffect, useState } from 'react';
import './EmployeeManagement.css';
import GetAllEmployees from './components/GetAllEmployees';
import GetEmployeeById from './components/GetEmployeeById';
import AddEmployee from './components/AddEmployee';
import DeleteEmployee from './components/DeleteEmployee';
import UpdateEmployee from './components/UpdateEmployee';
import ThankYouPage from './components/ThankYouPage';
import {tracer, logger} from './tracing';
import { context, propagation, trace } from '@opentelemetry/api';


export default function EmployeeManagement() {
    const [isConnected, setIsConnected] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');
    const [showThankYou, setShowThankYou ] = useState(false);
    const [operationMessage, setOperationMessage] = useState('') 
    const [uiText, setUiText] = useState(null);
    const [parentSpan, setParentSpan] = useState(null);

    useEffect(() =>{
        async function loadUI(){
            if (!parentSpan) return; // ensure parent span exists
            
            // Use startActiveSpan with parentSpan context
      const ctx = trace.setSpan(context.active(), parentSpan);

      tracer.startActiveSpan(
        'Application1-frontend event: load the SelectOperation text from backend',
        {},
        ctx,
        async (span) => {
          try {

            console.log("Select Operation Span and trace ");
            console.log('➡️ Child Span Context:', span.spanContext());
            console.log('🟢 Parent Span Context:', parentSpan.spanContext());

            // ----------------
            // Log UI load start
            // ----------------
            logger.emit({
                severityText: 'INFO',
                body: '📥 Loading UI text from backend...',
                attributes: {
                    parentTraceId: parentSpan.spanContext().traceId,
                    parentSpanId: parentSpan.spanContext().spanId,
                }
            });

             
            const headers = {};
            propagation.inject(context.active(), headers);

            const res = await fetch('http://localhost:5000/ui-text', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json', ...headers },
            });
                const data = await res.json();
                setUiText(data.titles)

                // ✅ Success log
            logger.emit({
                severityText: 'INFO',
                body: '✅ UI text loaded successfully 🎨',
                attributes: {
                    traceId: span.spanContext().traceId,
                    spanId: span.spanContext().spanId
                }
            });
                span.setStatus({ code: 1 }); // optional: set success
            } catch (err) {
                console.error("Failed to load UI text", err);
                // ❌ Error log
                logger.emit({
                    severityText: 'ERROR',
                    body: '❌ Failed to load UI text!',
                    attributes: {
                        error: err.message,
                        traceId: span.spanContext().traceId,
                        spanId: span.spanContext().spanId
                    }
                });
                span.recordException(err);
                span.setStatus({ code: 2, message: err.message }); // mark error
            } finally {
            span.end(); // end the child span
            }
        });
    }
        loadUI();
    }, [parentSpan]);
     
    const handleConnect = () =>{
        // Create parent span for connection
        const span = tracer.startSpan('Application1-frontend event: User Click the button to connect');
        console.log("Strating trace and span ")
        console.log('Parent span started for Connect:', span.spanContext());
        setIsConnected(true);

        // Log connection
        logger.emit({
            severityText: 'INFO',
            body: '🔗 User connected to Employee Management System',
            attributes: {
                traceId: span.spanContext().traceId,
                spanId: span.spanContext().spanId,
            }
        });

        // Optionally, store span in state to end it later
        setParentSpan(span);  
    };

    const handleOptionSelect = (option) => {
        if (!parentSpan) {
        console.error("Parent span missing");
        setSelectedOption(option);
        return;
        }

        // Create child span for button click
    tracer.startActiveSpan(
        `Frontend event: user-selected-${option}`,
        {},
        trace.setSpan(context.active(), parentSpan),   // connect to parent
        (span) => {
            console.log("After selecting operation span and trace ")
            console.log("➡️ New Child Span for Button Click:", span.spanContext());
            console.log("🟢 Parent Span:", parentSpan.spanContext());

            // Add event
            span.addEvent("button_click", { option });


            logger.emit({
                    severityText: 'INFO',
                    body: `🖱️ User clicked "${option}" button`,
                    attributes: {
                        selectedOption: option,
                        traceId: span.spanContext().traceId,
                        spanId: span.spanContext().spanId
                    }
                });

            // END the span
            span.end();
        }
       );
        setSelectedOption(option);
        setShowThankYou(false);
    };

    const handleDisconnect = () =>{
        setIsConnected(false);
        setSelectedOption('');
        setShowThankYou(false);
        if(parentSpan){
        parentSpan.end();
        console.log('Parent span ended for Connect:', parentSpan.spanContext());

        // Log disconnect
        logger.emit({
            severityText: 'INFO',
            body: '🔌 User disconnected from Employee Management System',
            attributes: {
                traceId: parentSpan.spanContext().traceId,
                spanId: parentSpan.spanContext().spanId
            }
        });
        setParentSpan(null);
        }
    };

    //Called after successful operation
    const handleOperationSuccess = (message) => {
        setOperationMessage(message);
        setShowThankYou(true);
    }

    // Go back to main menu
    const handleBackToHome =() =>{
        setSelectedOption('');
        setShowThankYou(false);
    }



    // RENDER: INITIAL CONNECT SCREEEN
    if (!isConnected){
        return(
            <div className="connect-container ">
                <div className="connect-card">
                    <h1 className="title">Employee Management System</h1>
                    <p className="subtitle">Connect to manage your employees</p>
                    
                    <button onClick={handleConnect} className="connect-btn">
                        connect
                    </button>
                </div>
            </div>
        );
    }

    if(showThankYou){
        return <ThankYouPage message={operationMessage} onHome={handleDisconnect} parentSpan={parentSpan}  />
    }

    if(selectedOption === 'get-all'){
        return <GetAllEmployees onBack={handleDisconnect} onSuccess={handleOperationSuccess}  parentSpan={parentSpan}/>;
    }


    // Load Get Employee By ID
    if (selectedOption === 'get-by-id') {
        return <GetEmployeeById onBack={handleDisconnect} onSuccess={handleOperationSuccess}  parentSpan={parentSpan}/>;
    }

    // Load Add Employee
    if (selectedOption === 'add') {
        return <AddEmployee onBack={handleDisconnect} onSuccess={handleOperationSuccess}  parentSpan={parentSpan}  />;
    }

    // Load Update Employee
    if (selectedOption === 'update') {
        return <UpdateEmployee onBack={handleDisconnect} onSuccess={handleOperationSuccess}  parentSpan={parentSpan}/>;
    }

    // Load Delete Employee
    if (selectedOption === 'delete') {
        return <DeleteEmployee onBack={handleDisconnect} onSuccess={handleOperationSuccess}  parentSpan={parentSpan}/>;
    }

    if (!uiText) {
    return (
        <div className="loading-container">
            <p>Loading UI...</p>
        </div>
    );
    }

    //After Connect -> show select operation page
    return(
         <div className='operation-container'>
            <div className='operation-card'>
                <h2 className='op-title'>{uiText.selectOperation}</h2>

                 <div className='op-buttons'>
                <button onClick={() => handleOptionSelect('get-all')} className='btn green'>
                    📋 Get All Employees
                </button>
                <button onClick={() => handleOptionSelect('get-by-id')} className="btn blue">
                    🔍 Get Employee by ID
                </button>
                <button onClick={() => handleOptionSelect('add')} className="btn purple">
                    ➕ Add New Employee
                </button>
                <button onClick={() => handleOptionSelect('update')} className="btn orange">
                    ✏️ Update Employee
                </button>
                <button onClick={() => handleOptionSelect('delete')} className="btn red">
                    🗑️ Delete Employee
                </button>
                </div>
                <button onClick={handleDisconnect} className='disconnect-btn'>Disconnect</button>
            </div>
         </div>
    )

}