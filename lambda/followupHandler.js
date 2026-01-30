// AWS Lambda function to trigger follow-up reminders
// This function is invoked by CloudWatch EventBridge on a schedule

const https = require("https");

exports.handler = async (event) => {
  console.log("Follow-up reminder Lambda triggered", event);

  // Your API endpoint URL
  const apiUrl = process.env.API_URL || "https://your-domain.com";
  const apiToken = process.env.API_SECRET_TOKEN; // Set this in Lambda environment variabless

  const options = {
    hostname: new URL(apiUrl).hostname,
    port: 443,
    path: "/api/cron/followup",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
      "X-Cron-Source": "aws-lambda",
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log("Response status:", res.statusCode);
        console.log("Response body:", data);

        if (res.statusCode === 200) {
          resolve({
            statusCode: 200,
            body: JSON.stringify({
              message: "Follow-up reminder triggered successfully",
              response: JSON.parse(data),
            }),
          });
        } else {
          reject({
            statusCode: res.statusCode,
            body: JSON.stringify({
              error: "Failed to trigger follow-up",
              details: data,
            }),
          });
        }
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
      reject({
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      });
    });

    req.end();
  });
};
