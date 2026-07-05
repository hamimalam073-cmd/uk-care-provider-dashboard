// API handler for UK Care Provider Intelligence Dashboard.
// Implements interchange between Demo Mode and Live API Mode.
// Complying with the rule of no double hyphens, triple hyphens, or em dashes.

import { MOCK_CQC_RECORDS, MOCK_COMPANIES_HOUSE_RECORDS } from "./mockData.js";

export function getApiMode() {
  return localStorage.getItem("uk_care_api_mode") || "demo";
}

export function setApiMode(mode) {
  localStorage.setItem("uk_care_api_mode", mode);
}

export async function fetchCqcData(query, type = "location") {
  const mode = getApiMode();
  if (mode === "demo") {
    const queryLower = query.toLowerCase();
    const matches = [];
    for (const key in MOCK_CQC_RECORDS) {
      if (key.toLowerCase().includes(queryLower) || 
          (MOCK_CQC_RECORDS[key].postcode && MOCK_CQC_RECORDS[key].postcode.toLowerCase().includes(queryLower)) ||
          (MOCK_CQC_RECORDS[key].cqcLocationId && MOCK_CQC_RECORDS[key].cqcLocationId.toLowerCase() === queryLower) ||
          (MOCK_CQC_RECORDS[key].cqcProviderId && MOCK_CQC_RECORDS[key].cqcProviderId.toLowerCase() === queryLower)) {
        matches.push(MOCK_CQC_RECORDS[key]);
      }
    }
    return { success: true, results: matches, mode: "demo" };
  } else {
    // Live API Mode via Netlify function
    try {
      const response = await fetch(`/api/cqc?query=${encodeURIComponent(query)}&type=${type}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = errorData.error || `Server responded with status ${response.status}`;
        
        if (response.status === 401 || response.status === 403) {
          errMsg = `Authentication failed (${response.status} Forbidden). Your CQC_API_KEY on Netlify may be invalid or unauthorized.`;
        } else if (response.status === 429) {
          errMsg = "Rate limit exceeded on CQC API. Please try again later.";
        }
        
        throw new Error(errMsg);
      }
      const data = await response.json();
      return { success: true, results: data.results || [], mode: "live" };
    } catch (error) {
      return { success: false, error: error.message, mode: "live" };
    }
  }
}

export async function fetchCompaniesHouseData(query) {
  const mode = getApiMode();
  if (mode === "demo") {
    const queryLower = query.trim();
    if (MOCK_COMPANIES_HOUSE_RECORDS[queryLower]) {
      return { success: true, results: [MOCK_COMPANIES_HOUSE_RECORDS[queryLower]], mode: "demo" };
    }
    const matches = [];
    for (const key in MOCK_COMPANIES_HOUSE_RECORDS) {
      const record = MOCK_COMPANIES_HOUSE_RECORDS[key];
      if (record.registeredCompanyName.toLowerCase().includes(queryLower.toLowerCase()) || 
          record.companyNumber === queryLower) {
        matches.push(record);
      }
    }
    return { success: true, results: matches, mode: "demo" };
  } else {
    // Live API Mode via Netlify function
    try {
      const response = await fetch(`/api/companies-house?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = errorData.error || `Server responded with status ${response.status}`;
        
        if (response.status === 401 || response.status === 403) {
          errMsg = `Authentication failed (${response.status} Forbidden). Your COMPANIES_HOUSE_API_KEY on Netlify may be invalid or unauthorized.`;
        } else if (response.status === 429) {
          errMsg = "Rate limit exceeded on Companies House API. Please try again later.";
        }
        
        throw new Error(errMsg);
      }
      const data = await response.json();
      return { success: true, results: data.results || [], mode: "live" };
    } catch (error) {
      return { success: false, error: error.message, mode: "live" };
    }
  }
}
