// CSV and text exporting services.
// Complies with no em dash, no double/triple hyphen rules.

function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSingleAccountBrief(account, intel) {
  const lines = [
    `UK Care Provider Intelligence Brief: ${account.providerName || "Unnamed Provider"}`,
    `Generated on: ${new Date().toISOString().split("T")[0]}`,
    `Service Type: ${account.serviceType || "Unknown"}`,
    `Location: ${account.location || "Unknown"}`,
    `CQC Rating: ${account.cqcRating || "Not found"}`,
    `Companies House Status: ${account.companiesHouseName || "Not connected"}`,
    "",
    "Account Overview Summary:",
    intel.summary,
    "",
    "Sales Angles:",
    `Primary Outreach Angle: ${intel.angles.primary}`,
    `Secondary Outreach Angle: ${intel.angles.secondary}`,
    `Commercial Trigger: ${intel.angles.trigger}`,
    `Why Now: ${intel.angles.whyNow}`,
    `Problem Statement: ${intel.angles.problemStatement}`,
    `Value Message: ${intel.angles.valueMessage}`,
    `Soft CTA: ${intel.angles.softCta}`,
    "",
    "CRM Handover Note:",
    intel.crmNote,
    "",
    "BDM Handover Brief:",
    intel.bdmHandover
  ];

  const content = lines.join("\n");
  const filename = `${(account.providerName || "provider").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_brief.txt`;
  downloadFile(content, filename, "text/plain;charset=utf-8;");
}

export function exportBdmNotes(account, intel) {
  const content = intel.bdmHandover;
  const filename = `${(account.providerName || "provider").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_bdm_notes.txt`;
  downloadFile(content, filename, "text/plain;charset=utf-8;");
}

export function exportCrmNote(account, intel) {
  const content = intel.crmNote;
  const filename = `${(account.providerName || "provider").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_crm_note.txt`;
  downloadFile(content, filename, "text/plain;charset=utf-8;");
}

export function exportEmailHook(account, intel) {
  const lines = [
    `Provider: ${account.providerName}`,
    `Contact: ${account.registeredManagerName || "Registered Manager"}`,
    "",
    "LinkedIn outreach message:",
    `Hi ${account.registeredManagerName || "there"}, noticed you coordinate care in ${account.location || "your area"}. ${intel.angles.softCta}`,
    "",
    "Cold Email Pitch:",
    `Subject: Streamlining compliance for ${account.providerName}`,
    `Hi ${account.registeredManagerName || "there"},`,
    `I saw that ${account.providerName} is rated ${account.cqcRating || "Good"} by CQC.`,
    `We know that managing shifts and audits using ${account.currentCarePlanning || "paper logs"} takes hours away from care.`,
    `${intel.angles.valueMessage}`,
    `Would you be open to a brief walkthrough next week?`,
    "Kind regards,",
    "Sales Development Representative"
  ];

  const content = lines.join("\n");
  const filename = `${(account.providerName || "provider").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_email_hooks.txt`;
  downloadFile(content, filename, "text/plain;charset=utf-8;");
}

export function exportAccountsToCsv(accounts) {
  if (accounts.length === 0) return;
  
  const headers = ["Provider Name", "Service Type", "Location", "Current System", "CQC Rating", "Opportunity Score", "Last Updated"];
  const rows = accounts.map(a => [
    `"${(a.providerName || "").replace(/"/g, '""')}"`,
    `"${(a.serviceType || "").replace(/"/g, '""')}"`,
    `"${(a.location || "").replace(/"/g, '""')}"`,
    `"${(a.currentCarePlanning || "").replace(/"/g, '""')}"`,
    `"${(a.cqcRating || "").replace(/"/g, '""')}"`,
    `"${a.qualificationScore || 0}"`,
    `"${(a.lastUpdated || "").replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  downloadFile(csvContent, "uk_care_saved_accounts.csv", "text/csv;charset=utf-8;");
}
