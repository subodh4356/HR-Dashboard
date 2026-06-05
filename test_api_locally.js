
// Using built-in fetch for Node 18+
// Using built-in fetch for Node 18+

async function testAPIs() {
    const baseUrl = 'http://localhost:3000';

    console.log('--- Testing Notifications API ---');
    try {
        const res = await fetch(`${baseUrl}/api/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic dHJ5LnN1Ym9kaGJhakBnbWFpbC5jb206U3Vib2RoMDU='
            },
            body: JSON.stringify({
                title: 'Test Note',
                message: 'Hello'
            })
        });
        console.log(`POST /api/notifications: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text.substring(0, 100)}`);
    } catch (e) {
        console.error('Failed to test notifications:', e.message);
    }

    console.log('\n--- Testing Jobs API ---');
    try {
        const res = await fetch(`${baseUrl}/api/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Test Job',
                department: 'Eng',
                location: 'Remote'
            })
        });
        console.log(`POST /api/jobs: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text.substring(0, 100)}`);
    } catch (e) {
        console.error('Failed to test jobs:', e.message);
    }
    console.log('\n--- Testing Employees API (TC002 equivalent) ---');
    try {
        const res = await fetch(`${baseUrl}/api/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic dHJ5LnN1Ym9kaGJhakBnbWFpbC5jb206U3Vib2RoMDU='
            },
            body: JSON.stringify({
                first_name: "John",
                last_name: "Doe",
                email: "john.doe.api@example.com",
                department_id: 1,
                designation_id: 1,
                phone: "123-456-7890"
            })
        });
        console.log(`POST /api/employees: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text.substring(0, 100)}`);
    } catch (e) {
        console.error('Failed to test employees:', e.message);
    }
}

testAPIs();
