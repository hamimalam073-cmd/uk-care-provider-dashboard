// Netlify Serverless Function for CQC API proxy.
// Complies with no em dash, no double/triple hyphen rules.

const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  const query = event.queryStringParameters.query || "";
  const type = event.queryStringParameters.type || "location";
  const apiKey = process.env.CQC_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "CQC API key is missing on the server" })
    };
  }

  try {
    let url = "";
    if (query.startsWith("1-")) {
      // Direct ID lookup
      url = `https://api.cqc.org.uk/public/v1/${type}s/${query}`;
    } else {
      // General query search
      url = `https://api.cqc.org.uk/public/v1/${type}s?q=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `CQC API responded with status ${response.status}` })
      };
    }

    const data = await response.json();
    
    // Map response back to standard structure
    let results = [];
    if (query.startsWith("1-")) {
      results = [data];
    } else {
      results = data.locations || data.providers || [];
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `CQC Function Error: ${error.message}` })
    };
  }
};
