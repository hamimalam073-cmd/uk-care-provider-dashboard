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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "CQC API key is missing on the server. Please check the environment variables scope on Netlify." })
    };
  }

  try {
    let url = "";
    if (query.startsWith("1-")) {
      // Direct ID lookup with mandatory partnerCode parameter
      url = `https://api.cqc.org.uk/public/v1/${type}s/${query}?partnerCode=CareIntel`;
    } else {
      // General name search query using the correct parameter name (name) and partnerCode
      url = `https://api.cqc.org.uk/public/v1/${type}s?name=${encodeURIComponent(query)}&partnerCode=CareIntel`;
    }

    const response = await fetch(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      let errMsg = `CQC API responded with status ${response.status}`;
      if (response.status === 401 || response.status === 403) {
        errMsg = "Key found but authentication failed. Check CQC subscription status, product access, or auth header.";
      }
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: errMsg })
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: `CQC Function Error: ${error.message}` })
    };
  }
};
