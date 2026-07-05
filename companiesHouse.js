// Companies House data formatter and risk analyzer.
// Complies with no em dash, no double/triple hyphen rules.

export function parseCompaniesHouseRecord(raw) {
  if (!raw) return null;

  const name = raw.registeredCompanyName || raw.company_name || "Not found in Companies House data";
  const number = raw.companyNumber || raw.company_number || "Not found in Companies House data";
  const status = raw.companyStatus || raw.company_status || "Not found in Companies House data";
  const incDate = raw.incorporationDate || raw.date_of_creation || "Not found in Companies House data";
  const address = raw.registeredOfficeAddress || (raw.registered_office_address ? 
    `${raw.registered_office_address.address_line_1 || ""}, ${raw.registered_office_address.locality || ""}, ${raw.registered_office_address.postal_code || ""}` : 
    "Not found in Companies House data");
  
  const sicCodes = raw.sicCodes || raw.sic_codes || [];
  const directors = raw.directors || [];
  const psc = raw.personsWithSignificantControl || raw.psc || [];
  const filingSummary = raw.filingHistorySummary || "Not found in Companies House data";
  const accountsStatus = raw.accountsStatus || (raw.accounts && raw.accounts.next_due ? 
    (new Date(raw.accounts.next_due) < new Date() ? "overdue" : "up to date") : "Not found in Companies House data");
  const confStatus = raw.confirmationStatementStatus || (raw.confirmation_statement && raw.confirmation_statement.next_due ? 
    (new Date(raw.confirmation_statement.next_due) < new Date() ? "overdue" : "up to date") : "Not found in Companies House data");

  // Determine potential commercial risk signals
  const riskSignals = [];
  if (status.toLowerCase() !== "active") {
    riskSignals.push(`Company status is "${status}" (high risk)`);
  }
  if (accountsStatus === "overdue") {
    riskSignals.push("Financial accounts filing is overdue (medium risk)");
  }
  if (confStatus === "overdue") {
    riskSignals.push("Confirmation statement filing is overdue (medium risk)");
  }

  return {
    registeredCompanyName: name,
    companyNumber: number,
    companyStatus: status,
    incorporationDate: incDate,
    registeredOfficeAddress: address,
    sicCodes: sicCodes.length > 0 ? sicCodes : ["Not found in Companies House data"],
    directors: directors.length > 0 ? directors : ["Not found in Companies House data"],
    personsWithSignificantControl: psc.length > 0 ? psc : ["Not found in Companies House data"],
    filingHistorySummary: filingSummary,
    accountsStatus: accountsStatus,
    confirmationStatementStatus: confStatus,
    riskSignals: riskSignals,
    source: "Companies House"
  };
}
