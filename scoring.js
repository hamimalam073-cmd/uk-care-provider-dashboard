// Qualification and compliance scoring engine.
// Complies with no em dash, no double/triple hyphen rules.

export function calculateQualificationScore(data) {
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

  const notesText = (
    (data.currentPainPoints || "") + " " + 
    (data.manualNotes || "") + " " + 
    (data.messyNotes || "")
  ).toLowerCase();
  
  const cqcRating = (data.cqcRating || "").toLowerCase();
  const currentSystem = (data.currentCarePlanning || data.currentRostering || "").toLowerCase();

  if (data.serviceType) {
    fit = 80;
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
    dissatisfaction = 50;
  }

  if (notesText.includes("budget") || notesText.includes("cost")) {
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
  
  if (data.registeredManagerName && data.registeredManagerName !== "Not found in verified source") {
    authority = 60;
  }
  if (data.nominatedIndividualName && data.nominatedIndividualName !== "Not found in verified source") {
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

  const total = Math.round(
    (fit + need + urgency + authority + budget + timing + compliancePressure + complexity + dissatisfaction + demoReadiness) / 10
  );

  let rating = "Unknown";
  let reason = "Insufficient data to establish rating";

  if (total >= 75) {
    rating = "Hot";
    reason = "Strong combination of paper-based operational pain points, compliance issues, and active review timeline.";
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

  const risks = [];
  if (cqcRating.includes("inadequate")) {
    risks.push("CQC regulatory action could freeze operational software transitions.");
  }
  if (currentSystem.includes("logmycare") || currentSystem.includes("birdie") || currentSystem.includes("pcs")) {
    risks.push("Established digital system in place, displacement barrier is high.");
  }
  if (!data.nominatedIndividualName && !data.directors) {
    risks.push("No identified C-level or nominated individual to drive authority.");
  }

  const missingInfo = [];
  if (!data.registeredManagerName || data.registeredManagerName === "Not found in verified source") {
    missingInfo.push("Registered Manager name");
  }
  if (!data.phoneNumber || data.phoneNumber === "Not found in verified source") {
    missingInfo.push("Phone number");
  }
  if (!data.emailAddress || data.emailAddress === "Not found in verified source") {
    missingInfo.push("Email address");
  }
  if (!data.currentCarePlanning || data.currentCarePlanning === "Paper records") {
    missingInfo.push("Incumbent digital systems");
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
  const notesText = (
    (data.currentPainPoints || "") + " " + 
    (data.manualNotes || "") + " " + 
    (data.messyNotes || "") + " " +
    (data.specialisms ? data.specialisms.join(" ") : "") + " " + 
    (data.regulatedActivities ? data.regulatedActivities.join(" ") : "")
  ).toLowerCase();

  const risks = {
    medication: "Not found in verified source or notes",
    carePlanning: "Not found in verified source or notes",
    recordKeeping: "Not found in verified source or notes",
    safeguarding: "Not found in verified source or notes"
  };

  if (notesText.includes("medication") || notesText.includes("emar") || notesText.includes("mar sheet") || notesText.includes("dosage") || notesText.includes("drug")) {
    risks.medication = "High";
  }

  if (notesText.includes("care plan") || notesText.includes("assessment") || notesText.includes("care note")) {
    risks.carePlanning = "High";
  }

  if (notesText.includes("safeguarding") || notesText.includes("incident") || notesText.includes("whistleblow") || notesText.includes("injury")) {
    risks.safeguarding = "High";
  }

  if (notesText.includes("record keeping") || notesText.includes("documentation") || notesText.includes("missing notes") || notesText.includes("paper log")) {
    risks.recordKeeping = "High";
  }

  return risks;
}
