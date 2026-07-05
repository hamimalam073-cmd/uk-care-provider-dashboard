// Qualification and compliance scoring engine.
// Complies with no em dash, no double/triple hyphen rules.

export function calculateQualificationScore(data) {
  // Safe defaults
  let fit = 50;
  let need = 50;
  let urgency = 30;
  let authority = 30;
  let budget = 30;
  let timing = 30;
  let compliancePressure = 30;
  let complexity = 50;
  let dissatisfaction = 50;
  let demoReadiness = 30;

  const notesText = (data.currentPainPoints || "" + " " + data.manualProcesses || "" + " " + data.messyNotes || "").toLowerCase();
  const cqcRating = (data.cqcRating || "").toLowerCase();
  const currentSystem = (data.currentCarePlanning || data.currentRostering || "").toLowerCase();

  // Adjust scores based on inputs
  if (data.serviceType) {
    fit = 80; // High fit sector
  }

  if (cqcRating.includes("requires improvement") || cqcRating.includes("inadequate")) {
    compliancePressure = 85;
    need = 80;
  } else if (cqcRating.includes("good") || cqcRating.includes("outstanding")) {
    compliancePressure = 40;
  }

  if (currentSystem.includes("paper") || currentSystem.includes("spreadsheet")) {
    dissatisfaction = 80;
    need = 85;
  } else if (currentSystem.trim() !== "" && currentSystem !== "not found") {
    dissatisfaction = 50; // Competitor replacement potential
  }

  if (notesText.includes("budget") || notesText.includes("cost") || data.budgetNotes) {
    budget = 70;
  }
  if (notesText.includes("now") || notesText.includes("immediate") || notesText.includes("soon")) {
    urgency = 80;
    demoReadiness = 80;
  }
  if (data.timeline && data.timeline.toLowerCase().includes("quarter")) {
    timing = 80;
    urgency = 75;
  }
  if (data.registeredManagerName && data.registeredManagerName !== "Not found in API data") {
    authority = 60;
  }
  if (data.directorName || data.nominatedIndividualName) {
    authority = 80;
  }

  const scores = {
    fit,
    need,
    urgency,
    authority,
    budget,
    timing,
    compliancePressure,
    complexity,
    systemDissatisfaction: dissatisfaction,
    demoReadiness
  };

  // Calculate average
  const total = Math.round(
    (fit + need + urgency + authority + budget + timing + compliancePressure + complexity + dissatisfaction + demoReadiness) / 10
  );

  let rating = "Unknown";
  let reason = "Insufficient data to establish rating";

  if (total >= 75) {
    rating = "Hot";
    reason = "Strong combination of paper-based operational paint points, compliance issues, and active review timeline.";
  } else if (total >= 50) {
    rating = "Warm";
    reason = "Target fits vertical criteria with moderate operational friction, but exact timeline or budget needs verification.";
  } else if (total >= 25) {
    rating = "Nurture";
    reason = "Incumbent software provider in place, or lower urgency. Maintain contact for future contract renewal dates.";
  } else {
    rating = "Low fit";
    reason = "Does not match sector requirements or has extremely low need indicators.";
  }

  // Determine risks
  const risks = [];
  if (cqcRating.includes("inadequate")) {
    risks.push("CQC regulatory action could freeze operational software transitions.");
  }
  if (currentSystem.includes("logmycare") || currentSystem.includes("birdie") || currentSystem.includes("pcs")) {
    risks.push("Established digital system in place, displacement barrier is high.");
  }
  if (!data.nominatedIndividualName && !data.directorName) {
    risks.push("No identified C-level or nominated individual to drive authority.");
  }

  // Determine missing information
  const missingInfo = [];
  if (!data.registeredManagerName || data.registeredManagerName === "Not found in API data") {
    missingInfo.push("Registered Manager name");
  }
  if (!data.phone) {
    missingInfo.push("Phone number");
  }
  if (!data.email) {
    missingInfo.push("Email address");
  }
  if (!data.currentCarePlanning || data.currentCarePlanning === "Unknown") {
    missingInfo.push("Incumbent systems");
  }
  if (!data.budgetNotes) {
    missingInfo.push("Budget confirmation");
  }

  return {
    total,
    rating,
    reason,
    scores,
    risks,
    missingInfo
  };
}

export function evaluateComplianceRisks(data) {
  const notesText = (data.currentPainPoints || "" + " " + data.manualProcesses || "" + " " + data.messyNotes || "" + " " + data.cqcRatingDetails || "").toLowerCase();
  const cqcRating = (data.cqcRating || "").toLowerCase();

  const risks = {
    medication: "Unknown, needs manual verification",
    carePlanning: "Unknown, needs manual verification",
    recordKeeping: "Unknown, needs manual verification",
    safeguarding: "Unknown, needs manual verification",
    auditReadiness: "Unknown, needs manual verification",
    manualPaperwork: "Unknown, needs manual verification"
  };

  // Inspect medication risk keywords
  if (notesText.includes("medication") || notesText.includes("emar") || notesText.includes("mar sheet") || notesText.includes("dosage")) {
    risks.medication = "High";
  } else if (cqcRating.includes("requires improvement") || cqcRating.includes("inadequate")) {
    risks.medication = "General compliance pressure";
  }

  // Inspect care planning risk keywords
  if (notesText.includes("care plan") || notesText.includes("assessment") || notesText.includes("care note")) {
    risks.carePlanning = "High";
  } else if (cqcRating.includes("requires improvement") || cqcRating.includes("inadequate")) {
    risks.carePlanning = "General compliance pressure";
  }

  // Inspect safeguarding risk keywords
  if (notesText.includes("safeguarding") || notesText.includes("incident") || notesText.includes("whistleblow") || notesText.includes("injury")) {
    risks.safeguarding = "High";
  } else if (cqcRating.includes("requires improvement") || cqcRating.includes("inadequate")) {
    risks.safeguarding = "General compliance pressure";
  }

  // Inspect record keeping risk keywords
  if (notesText.includes("record keeping") || notesText.includes("documentation") || notesText.includes("missing notes")) {
    risks.recordKeeping = "High";
  } else if (cqcRating.includes("requires improvement") || cqcRating.includes("inadequate")) {
    risks.recordKeeping = "General compliance pressure";
  }

  // Inspect audit readiness risk keywords
  if (notesText.includes("audit") || notesText.includes("inspect") || notesText.includes("compliance check")) {
    risks.auditReadiness = "High";
  } else if (cqcRating.includes("requires improvement") || cqcRating.includes("inadequate")) {
    risks.auditReadiness = "General compliance pressure";
  }

  // Inspect manual paperwork risk keywords
  if (notesText.includes("paper") || notesText.includes("manual") || notesText.includes("spreadsheet") || notesText.includes("handwritten")) {
    risks.manualPaperwork = "High";
  } else if (cqcRating.includes("requires improvement") || cqcRating.includes("inadequate")) {
    risks.manualPaperwork = "General compliance pressure";
  }

  return risks;
}
