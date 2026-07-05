// Netlify Serverless Function for Companies House API proxy.
// Complies with no em dash, no double/triple hyphen rules.

const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  const query = (event.queryStringParameters.query || "").trim();
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Companies House API key is missing on the server. Please check the environment variables scope on Netlify." })
    };
  }

  const authHeader = "Basic " + Buffer.from(apiKey + ":").toString("base64");

  try {
    let results = [];
    const isCompanyNumber = /^\d{8}$/.test(query);

    if (isCompanyNumber) {
      // Fetch company profile
      const profileUrl = `https://api.company-information.service.gov.uk/company/${query}`;
      const profileRes = await fetch(profileUrl, {
        headers: { "Authorization": authHeader }
      });

      if (!profileRes.ok) {
        if (profileRes.status === 401 || profileRes.status === 403) {
          return {
            statusCode: profileRes.status,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Key found but authentication failed. Check Companies House subscription status, product access, or auth header." })
          };
        }
        return {
          statusCode: profileRes.status,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: `Companies House API responded with status ${profileRes.status}` })
        };
      }

      const profile = await profileRes.json();
      
      // Fetch officers/directors
      const officersUrl = `https://api.company-information.service.gov.uk/company/${query}/officers`;
      const officersRes = await fetch(officersUrl, {
        headers: { "Authorization": authHeader }
      });

      let directors = [];
      if (officersRes.ok) {
        const officersData = await officersRes.json();
        directors = (officersData.items || [])
          .filter(o => o.officer_role === "director")
          .map(o => o.name);
      }

      // Format as normalized record
      const record = {
        registeredCompanyName: profile.company_name,
        companyNumber: profile.company_number,
        companyStatus: profile.company_status,
        incorporationDate: profile.date_of_creation,
        registeredOfficeAddress: profile.registered_office_address ? 
          `${profile.registered_office_address.address_line_1 || ""}, ${profile.registered_office_address.locality || ""}, ${profile.registered_office_address.postal_code || ""}` : 
          "Not found in Companies House data",
        sicCodes: profile.sic_codes || [],
        directors: directors,
        personsWithSignificantControl: [],
        filingHistorySummary: "Accounts next due date: " + (profile.accounts?.next_due || "Not found"),
        accountsStatus: profile.accounts?.overdue ? "overdue" : "up to date",
        confirmationStatementStatus: profile.confirmation_statement?.overdue ? "overdue" : "up to date"
      };
      results = [record];
    } else {
      // Perform text search
      const searchUrl = `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(query)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { "Authorization": authHeader }
      });

      if (!searchRes.ok) {
        if (searchRes.status === 401 || searchRes.status === 403) {
          return {
            statusCode: searchRes.status,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Key found but authentication failed. Check Companies House subscription status, product access, or auth header." })
          };
        }
        return {
          statusCode: searchRes.status,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: `Companies House API responded with status ${searchRes.status}` })
        };
      }

      const searchData = await searchRes.json();
      results = (searchData.items || []).map(item => ({
        registeredCompanyName: item.title,
        companyNumber: item.company_number,
        companyStatus: item.company_status,
        incorporationDate: item.date_of_creation,
        registeredOfficeAddress: item.address_snippet,
        sicCodes: [],
        directors: [],
        personsWithSignificantControl: [],
        filingHistorySummary: "Status: " + item.company_status,
        accountsStatus: "up to date",
        confirmationStatementStatus: "up to date"
      }));
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
      body: JSON.stringify({ error: `Companies House Function Error: ${error.message}` })
    };
  }
};
