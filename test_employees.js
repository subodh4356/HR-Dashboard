
// Native fetch used

async function testEmployees() {
    const baseUrl = 'http://localhost:3000';
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
                email: "john.test.emp@example.com",
                department_id: 1,
                designation_id: 1,
                phone: "123-456-7890"
            })
        });
        console.log(`POST /api/employees: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text.substring(0, 200)}`);
    } catch (e) {
        console.error('Failed:', e);
    }
}
testEmployees();
