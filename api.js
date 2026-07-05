// API handler for UK Care Provider Intelligence Dashboard.
// Queries the Netlify serverless functions directly for live records.
// Complying with the rule of no double hyphens, triple hyphens, or em dashes.

export async function fetchCqcData(query, type = "location") {
  try {
    const response = await fetch(`/api/cqc?query=${encodeURIComponent(query)}&type=${type}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errMsg = errorData.error || `Server responded with status ${response.status}`;
      
      if (response.status === 401 || response.status === 403) {
        errMsg = "Live CQC search is not configured. Please add CQC_API_KEY in Netlify environment variables.";
      } else if (response.status === 429) {
        errMsg = "Rate limit exceeded on CQC API. Please try again later.";
      } else {
        errMsg = "CQC API service is currently unavailable.";
      }
      
      return { success: false, error: errMsg };
    }
    const data = await response.json();
    return { success: true, results: data.results || [] };
  } catch (error) {
    return { success: false, error: "CQC API service is currently unavailable." };
  }
}

export async function fetchCompaniesHouseData(query) {
  try {
    const response = await fetch(`/api/companies-house?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errMsg = errorData.error || `Server responded with status ${response.status}`;
      
      if (response.status === 401 || response.status === 403) {
        errMsg = "Live Companies House search is not configured. Please add COMPANIES_HOUSE_API_KEY in Netlify environment variables.";
      } else if (response.status === 429) {
        errMsg = "Rate limit exceeded on Companies House API. Please try again later.";
      } else {
        errMsg = "Companies House API service is currently unavailable.";
      }
      
      return { success: false, error: errMsg };
    }
    const data = await response.json();
    return { success: true, results: data.results || [] };
  } catch (error) {
    return { success: false, error: "Companies House API service is currently unavailable." };
  }
}
