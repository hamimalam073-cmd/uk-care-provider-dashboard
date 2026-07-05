// Companies House data formatter and risk analyzer.
// Complies with no em dash, no double/triple hyphen rules.

export function parseCompaniesHouseRecord(raw) {
  if (!raw) return null;

  const name = raw.registeredCompanyName || raw.company_name || "Not found in verified source";
  const number = raw.companyNumber || raw.company_number || "Not found in verified source";
  const status = raw.companyStatus || raw.company_status || "Not found in verified source";
  const incDate = raw.incorporationDate || raw.date_of_creation || "Not found in verified source";
  const address = raw.registeredOfficeAddress || (raw.registered_office_address ? 
    `${raw.registered_office_address.address_line_1 || ""}, ${raw.registered_office_address.locality || ""}, ${raw.registered_office_address.postal_code || ""}` : 
    "Not found in verified source");
  
  const sicCodes = raw.sicCodes || raw.sic_codes || [];
  const directors = raw.directors || [];
  const psc = raw.personsWithSignificantControl || raw.persons_with_significant_control || raw.psc || [];
  const filingSummary = raw.filingHistorySummary || "Not found in verified source";
  const accountsStatus = raw.accountsStatus || (raw.accounts && raw.accounts.next_due ? 
    (new Date(raw.accounts.next_due) < new Date() ? "overdue" : "up to date") : "Not found in verified source");
  const confStatus = raw.confirmationStatementStatus || (raw.confirmation_statement && raw.confirmation_statement.next_due ? 
    (new Date(raw.confirmation_statement.next_due) < new Date() ? "overdue" : "up to date") : "Not found in verified source");

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
    sicCodes: sicCodes.length > 0 ? sicCodes : ["Not found in verified source"],
    directors: directors.length > 0 ? directors : ["Not found in verified source"],
    personsWithSignificantControl: psc.length > 0 ? psc : ["Not found in verified source"],
    filingHistorySummary: filingSummary,
    accountsStatus: accountsStatus,
    confirmationStatementStatus: confStatus,
    riskSignals: riskSignals,
    source: "Companies House"
  };
}

export function matchCqcToCompaniesHouse(cqcProvider, chRecords) {
  if (!cqcProvider || !chRecords) {
    return {
      match: null,
      confidence: "None",
      reason: "No matched company resolved from Companies House records.",
      warn: true
    };
  }

  const clean = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  const cqcName = clean(cqcProvider.providerName);
  const cqcLocationName = clean(cqcProvider.locationName);
  const cqcPostcode = clean(cqcProvider.postcode);
  const cqcAddress = clean(cqcProvider.address);
  const cqcNumber = clean(cqcProvider.companiesHouseNumber);

  let bestMatch = null;
  let maxScore = 0;
  let reason = "No strong match criteria met.";

  for (const key in chRecords) {
    const rec = chRecords[key];
    const chName = clean(rec.registeredCompanyName || rec.company_name);
    const chNumber = clean(rec.companyNumber || rec.company_number);
    const chAddressText = clean(rec.registeredOfficeAddress || "");

    let score = 0;
    let localReason = "";

    if (cqcNumber && chNumber && cqcNumber === chNumber) {
      score += 100;
      localReason = `Matched exactly by Company Number: ${rec.companyNumber}.`;
    }

    if (cqcName === chName || cqcLocationName === chName) {
      score += 90;
      localReason = `Exact match identified on provider/location name.`;
    }

    if (cqcPostcode && chAddressText.includes(cqcPostcode)) {
      score += 40;
      localReason = localReason ? `${localReason} Postcode ${cqcProvider.postcode} verified in address.` : `Matched by shared postcode: ${cqcPostcode}.`;
    }

    if (score < 90) {
      if (chName.includes(cqcName) || cqcName.includes(chName) || chName.includes(cqcLocationName)) {
        score += 50;
        localReason = localReason ? `${localReason} Fuzzy partial name match identified.` : `Fuzzy partial name match identified.`;
      }
    }

    if (cqcAddress && chAddressText && (chAddressText.includes(cqcAddress) || cqcAddress.includes(chAddressText))) {
      score += 30;
      localReason = localReason ? `${localReason} Shared street address matched.` : `Shared street address matched.`;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = rec;
      reason = localReason;
    }
  }

  if (!bestMatch || maxScore < 30) {
    return {
      match: null,
      confidence: "None",
      reason: "No matched company resolved from Companies House records.",
      warn: true
    };
  }

  let confidence = "Low";
  if (maxScore >= 90) {
    confidence = "High";
  } else if (maxScore >= 50) {
    confidence = "Medium";
  }

  return {
    match: bestMatch,
    confidence,
    reason,
    warn: confidence === "Low"
  };
}
