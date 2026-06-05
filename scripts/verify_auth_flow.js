// Node 22 has built-in fetch


async function testAuthFlow() {
    const uniqueEmail = `testuser${Date.now()}@testcompany.com`;
    const payload = {
        first_name: "Test",
        last_name: "User",
        email: uniqueEmail,
        department_id: 1, // specific ID to pass validation
        designation_id: 1,
        status: "active"
    };

    console.log(`Testing creation of employee: ${uniqueEmail}`);

    try {
        const response = await fetch('http://localhost:3000/api/employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 201) {
            const data = await response.json();
            console.log("SUCCESS: Employee created.");
            console.log("Employee ID:", data.id);
            console.log("Email:", data.email);
            // Verify ID is a UUID (Auth ID)
            if (data.id.length > 30) {
                console.log("SUCCESS: ID looks like a UUID (likely Auth ID).");
            } else {
                console.log("WARNING: ID does not look like a UUID.");
            }
        } else {
            console.error("FAILED: Status", response.status);
            const text = await response.text();
            console.error("Response:", text);
        }

    } catch (e) {
        console.error("ERROR:", e);
    }
}

testAuthFlow();
