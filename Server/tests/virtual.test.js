import jwt from 'jsonwebtoken';
import 'dotenv/config';

async function runTests() {
    const API_URL = 'http://localhost:5000/api';
    
    // Generate mock Admin token
    const token = jwt.sign({ id: '65f1a2b3c4d5e6f7a8b9c0d1', role: 'admin' }, process.env.JWT_SECRET || 'a-string-secret-at-least-256-bits-long');
    const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    console.log("=== VIRTUAL ENDPOINT TESTING ===");

    // 1. GET /api/routes
    try {
        console.log("\nTesting: GET /api/routes");
        let res = await fetch(`${API_URL}/routes`, { headers });
        let data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Response:", data);
        if (data.success !== true) throw new Error("GET /api/routes failed expected structure.");
    } catch (e) {
        console.error("GET route list failed:", e.message);
    }
    
    // 2. GET /api/trips
    try {
        console.log("\nTesting: GET /api/trips");
        let res = await fetch(`${API_URL}/trips`, { headers });
        let data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Response:", data);
        if (data.success !== true) throw new Error("GET /api/trips failed expected structure.");
    } catch (e) {
        console.error("GET trip list failed:", e.message);
    }

    // 3. POST /api/routes (Error behavior - Missing Fields)
    try {
        console.log("\nTesting: POST /api/routes (Validation Error)");
        let res = await fetch(`${API_URL}/routes`, { 
            method: 'POST', 
            headers,
            body: JSON.stringify({}) // empty body
        });
        let data = await res.json();
        console.log(`Status: ${res.status} (Expected 400)`);
        console.log("Response:", data);
    } catch(e) {}

    // 4. POST /api/routes (Map functionality mocked validation testing)
    try {
        console.log("\nTesting: POST /api/routes (Map API Execution Check - with invalid ObjectId for driver)");
        let res = await fetch(`${API_URL}/routes`, { 
            method: 'POST', 
            headers,
            body: JSON.stringify({ 
                driver: 'invalid-id',
                start_location: 'New York, NY',
                end_location: 'Boston, MA'
            }) 
        });
        let data = await res.json();
        console.log(`Status: ${res.status} (Expected ~404/500/etc depending on ObjectId cast error handled by ErrorMiddleware)`);
        console.log("Response:", data);
    } catch(e) {}
    
    console.log("\n=== TESTING COMPLETE ===");
    process.exit(0);
}

runTests();
