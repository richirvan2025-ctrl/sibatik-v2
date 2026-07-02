import axios from "axios";
import https from "https";

async function testSSOEndpoints() {
  const baseUrl = "https://sinergy.idbbali.ac.id";
  const appKey = "bHF9L3Pem8Kz2kWvXrqT0nDsYjU6CgAI";

  console.log("Testing SSO endpoints...");
  console.log("Base URL:", baseUrl);
  console.log("");

  // Test 1: pDash.php with validateToken
  console.log("=== Test 1: pDash.php validateToken ===");
  try {
    const params = new URLSearchParams({
      action: "validateToken",
      token: "test",
      app_key: appKey,
    });

    const res = await axios.post(`${baseUrl}/request/pDash.php`, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Host: "sinergy.idbbali.ac.id",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 10000,
    });
    console.log("Response:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.log("Error:", e.message);
    if (e.response) {
      console.log("Response data:", e.response.data);
    }
  }
  console.log("");

  // Test 2: checkToken.php
  console.log("=== Test 2: checkToken.php ===");
  try {
    const res = await axios.get(`${baseUrl}/class/checkToken.php`, {
      params: { token: "test" },
      headers: { Host: "sinergy.idbbali.ac.id" },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 10000,
    });
    console.log("Response:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.log("Error:", e.message);
    if (e.response) {
      console.log("Response data:", e.response.data);
    }
  }
}

testSSOEndpoints().catch(console.error);
