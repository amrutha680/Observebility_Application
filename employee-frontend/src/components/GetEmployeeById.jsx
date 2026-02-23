import React, { useState } from 'react';
import './GetEmployeeById.css';

export default function GetEmployeeById({ onBack, onSuccess}) {
    const [id, setId] = useState('');
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!id) {
            setError('Please enter an employee ID');
            return;
        }

        setLoading(true);
        setError('');
        setEmployee(null);

        fetch(`http://localhost:5000/employees/${id}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Employee not found');
                }
                return res.json();
            })
            .then((data) => {
                
                setLoading(false);
                onSuccess(`Employee Found Successfully!
                    ID: ${data.id}
                    Name: ${data.name}
                    Email: ${data.email}
                    Position: ${data.designation}
                    Salary: ${data.salary}
                    `);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    };

    return (
        <div className='getbyid-container'>
            <div className='card-container'>
                <h2>🔍 Get Employee by ID</h2>

                <input
                    type='number'
                    className='input-field'
                    placeholder='Enter Employee ID'
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                />

                <button className='btn blue' onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>

                {error && <div className='error'>{error}</div>}

                {/* {employee && (
                    <div className='result-box'>
                        <h3>Employee Details</h3>
                        <p><strong>ID:</strong> {employee.id}</p>
                        <p><strong>Name:</strong> {employee.name}</p>
                        <p><strong>Email:</strong> {employee.email}</p>
                        <p><strong>Position:</strong> {employee.designation || 'N/A'}</p>
                        <p><strong>Salary:</strong> ${employee.salary ? employee.salary.toLocaleString() : 'N/A'}</p>
                    </div>
                )} */}

                <button className='back-btn' onClick={onBack}>
                   Disconnect
                </button>
            </div>
        </div>
    );
}