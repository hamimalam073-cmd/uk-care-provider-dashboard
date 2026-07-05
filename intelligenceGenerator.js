// Intelligence generator module for UK Care Provider Intelligence Dashboard.
// Complies with no em dash, no double/triple hyphen rules.
// Contains deterministic parsing of notes and templates for SDR outreach.

export function parseMessyNotes(notes) {
  if (!notes) return {};
  const extracted = {};
  const notesLower = notes.toLowerCase();

  // Extract email address
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = notes.match(emailRegex);
  if (emails && emails.length > 0) {
    extracted.emailAddress = emails[0];
  }

  // Extract phone number (UK formatting check)
  const phoneRegex = /(?:\+44|0)[\d\s-]{9,13}\d/g;
  const phones = notes.match(phoneRegex);
  if (phones && phones.length > 0) {
    extracted.phoneNumber = phones[0].trim();
  }

  // Extract current systems
  const systems = [
    { name: "Birdie", key: "birdie" },
    { name: "LogMyCare", key: "logmycare" },
    { name: "LogMyCare", key: "log my care" },
    { name: "CarePlanner", key: "careplanner" },
    { name: "CarePlanner", key: "care planner" },
    { name: "Person Centred Software", key: "pcs" },
    { name: "Person Centred Software", key: "person centred software" },
    { name: "PASS", key: "pass" },
    { name: "CareDocs", key: "caredocs" },
    { name: "Access", key: "access" }
  ];
  for (const sys of systems) {
    if (notesLower.includes(sys.key)) {
      extracted.currentCarePlanning = sys.name;
      break;
    }
  }

  // Extract CQC Rating keywords
  const ratings = ["outstanding", "good", "requires improvement", "inadequate"];
  for (const r of ratings) {
    if (notesLower.includes(r)) {
      extracted.cqcRating = r.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      break;
    }
  }

  // Extract staff count
  const staffMatch = notesLower.match(/(\d+)\s*(?:staff|employees|carers|workers|people)/);
  if (staffMatch) {
    extracted.numberOfStaff = parseInt(staffMatch[1], 10);
  }

  // Extract residents/clients count
  const residentsMatch = notesLower.match(/(\d+)\s*(?:residents|clients|beds|service users|users)/);
  if (residentsMatch) {
    extracted.numberOfResidents = parseInt(residentsMatch[1], 10);
  }

  return extracted;
}

export function generateIntelligence(data) {
  const name = data.providerName || "Care Provider";
  const location = data.location || "the UK";
  const serviceType = data.serviceType || "Care home";
  const cqcRating = data.cqcRating || "Not found";
  const currentSystem = data.currentCarePlanning || "Paper records";
  const registeredManager = data.registeredManagerName || "Not found in API data";
  const nominatedIndividual = data.nominatedIndividualName || "Not found in API data";
  
  // 1. Account Summary (3 to 5 lines)
  const serviceText = serviceType === "Care home" ? "care residential services" : "home care support";
  const systemText = currentSystem === "Paper records" ? "manual paper documentation" : `incumbent software ${currentSystem}`;
  const ratingText = cqcRating !== "Not found" ? `registered with a CQC rating of ${cqcRating}` : "without verified CQC rating data online";
  
  const summary = `${name} is a ${location} based provider offering specialist ${serviceText}. They are currently operating with ${systemText} for their daily recording and audits. They are ${ratingText}, and their current operational focus is on streamlining staff admin. This profile identifies key areas of potential improvement across their workflows.`;

  // 2. Sales Angles
  const angles = {
    primary: `Focus on moving away from ${currentSystem} to save staff time and improve data security.`,
    secondary: `Evidencing care quality easily for CQC inspections to secure the rating.`,
    trigger: cqcRating.includes("Improvement") ? "Recent Requires Improvement rating creates urgency to digitalise" : "General staff recruitment and admin overhead pressures",
    whyNow: cqcRating.includes("Improvement") ? "Inspectors are targeting record keeping and medication audits" : "Rising operational overhead in Care sector mandates efficiency",
    problemStatement: `${name} staff spend hours writing daily notes instead of focusing on direct resident contact.`,
    valueMessage: "Save up to forty percent of manager admin time with structured digital audits.",
    softCta: "Would you be open to a low pressure look at how nearby providers are managing this?"
  };

  // 3. Cold Call Openers ( natural UK style, under 20s )
  const openers = {
    coldCall: `Hi ${registeredManager !== "Not found in API data" ? registeredManager : "there"}, it is Antigravity here. I noticed your team in ${location} is managing care audits. Just wanted to see if you are still using ${currentSystem} or if you have moved to digital?`,
    directMailFollowUp: `Hi ${registeredManager !== "Not found in API data" ? registeredManager : "there"}, I sent a short package last week about saving time on daily care logs. Did that cross your desk?`,
    webinarFollowUp: `Hi, saw you registered for our session on CQC preparation. I wanted to see what digital systems you currently use to support your audits?`,
    reEngagement: `Hi, we spoke a few months ago about care planning. Just wanted to see if anything had changed with your contract renewal dates?`,
    competitorDisplacement: `Hi, I know you are currently using ${currentSystem}. Nearby teams have switched to us to improve mobile app usability. Are you review options?`,
    postEmailFollowUp: `Hi, I sent an email on Tuesday regarding your CQC rating. I wanted to see if care planning paperwork is currently a priority?`,
    lostOpportunityFollowUp: `Hi, we looked at this together last year. Just wanted to see if your operational processes are still paper based?`
  };

  // 4. Discovery Questions
  const discovery = {
    currentProcess: "How do care workers currently pass on records between shifts?",
    carePlanning: "How long does it take you to update a care plan when a resident needs change?",
    dailyNotes: "How do you ensure daily notes are completed by staff before going home?",
    medication: "What system is in place to catch missed medication doses in real time?",
    audits: "When the CQC inspector visits, how long does it take to compile care evidence?",
    rostering: "How do you match caregiver rosters with client care plan hours?",
    reporting: "How do managers review records across different locations?",
    staffAdoption: "What is your main concern regarding staff using a mobile app?",
    budget: "How are you currently allocating budget for regulatory software?",
    authority: "Who else in the management team gets involved in reviewing software?",
    need: "What is the biggest operational bottleneck you face today?",
    timeline: "When are you hoping to have a digital solution active?",
    meddicc: {
      metrics: "What is the cost of staff overtime spent on manual paperwork?",
      economicBuyer: "Who signs off on care system purchases at the board level?",
      decisionCriteria: "What are the top three requirements for any new software?",
      decisionProcess: "How long does the board evaluation process take?",
      identifyPain: "Is compliance pressure or staff time the primary issue?",
      champion: "Who inside the location is most keen on going digital?",
      competition: "Which other software providers are you reviewing?"
    }
  };

  // 5. CRM Handover Note
  const crmNote = `Provider: ${name}
Service type: ${serviceType}
Contact: ${registeredManager} / ${nominatedIndividual}
Current system: ${currentSystem}
Pain points: ${data.currentPainPoints || "Audit preparation and manual note errors"}
Timeline: ${data.timeline || "Needs verification"}
Budget: ${data.budgetNotes || "GBP 200 per month estimation"}
Decision maker: ${nominatedIndividual !== "Not found in API data" ? nominatedIndividual : registeredManager}
Next step: Call registered manager to establish timeline
SDR notes: Spoke briefly. Identified compliance pressure. Ready for BDM call.`;

  // 6. BDM Handover Brief
  const bdmHandover = `### Account Profile: ${name}
- Service Type: ${serviceType}
- Location: ${location}
- CQC Rating: ${cqcRating}
- Registered Manager: ${registeredManager}
- Current Setup: ${currentSystem}

### Core Sales Briefing
- Known Contacts: Manager ${registeredManager}, Nominated Person ${nominatedIndividual}
- Primary Pain: Manual tracking of medication records and audit preparation time
- Urgent Trigger: CQC audit preparation pressure
- Value Prop: Save administrative time, guarantee compliant care plan audits

### Recommended Demo Strategy
- Focus Areas: Digital care plans, real time audit logs, and simplified eMAR
- Urgency Level: Medium
- Immediate Next Action: Book custom demo focused on CQC preparation`;

  return {
    summary,
    angles,
    openers,
    discovery,
    crmNote,
    bdmHandover
  };
}

export function getObjectionResponse(objectionKey) {
  const objections = {
    system: {
      weak: "Our software is much better than theirs, you should switch to us.",
      better: "I understand. Many systems do a good job, but we focus on mobile staff adoption.",
      best: "That makes sense. If you have an active system, you are ahead of most. Many providers switch to us because they want real time manager dashboards across locations. How are you finding reporting currently?",
      followUp: "Are you able to see missed medication logs on your phone?",
      close: "Could I show you a five minute visual dashboard overview next Tuesday?"
    },
    happy: {
      weak: "Are you sure you are happy? Most managers tell me they are struggling.",
      better: "That is great. If it is working well, there is no need to change immediately.",
      best: "Brilliant, it is rare to find managers fully satisfied with their tech. If you ever review options in the future, we offer free trial setup. When does your current contract renew?",
      followUp: "How does your team handle CQC inspection evidence requests?",
      close: "I can email you a quick checklist to compare when your contract renewal approaches."
    },
    email: {
      weak: "No, if I send an email you will just delete it. Let us talk now.",
      better: "Sure, what is your email address and I will send a brochure.",
      best: "Of course. I will send a summary. So I do not clog your inbox, are you more interested in digital care plans or saving time on audits?",
      followUp: "I will tailor the email. Are you the best person to review it?",
      close: "I will send it over now. Let us check in next week once you have read it."
    },
    budget: {
      weak: "Our system is very cheap, you do not need a big budget.",
      better: "We can look at discount pricing options if budget is tight.",
      best: "I hear you, every care home is watching budgets in GBP closely. Most users find our system pays for itself by reducing carer overtime. How much time do carers spend typing notes after shifts?",
      followUp: "Do care workers spend overtime on administration?",
      close: "I can show you a quick cost comparison calculator on a brief call."
    },
    busy: {
      weak: "It will only take a minute, just listen to me.",
      better: "I will call back later when you have more time.",
      best: "I completely understand, care management is busy. I will keep this to thirty seconds. We help local homes save admin time. When is a better day to catch you for two minutes?",
      followUp: "Is morning or afternoon usually better for you?",
      close: "Let us pencil in a two minute call for Thursday at ten."
    },
    paper: {
      weak: "Paper is terrible and illegal, you must go digital now.",
      better: "Digital is much faster and helps with your CQC audits.",
      best: "Many care locations we speak with prefer paper because staff find tablets hard to use. We built our app to look like a simple text message. How comfortable are your staff with mobile apps?",
      followUp: "What is your main worry about moving away from paper?",
      close: "Could we do a quick video call to show you how easy the app is for staff?"
    },
    birdie: {
      weak: "Birdie is expensive and does not have good support.",
      better: "We are similar to Birdie but we have better care plans.",
      best: "Birdie is a widely used system. Typically, teams look at us because they want deeper customisation of audit reports or simplified invoicing. How is your finance team finding the billing interface?",
      followUp: "When does your contract with Birdie renew?",
      close: "I can show you a quick comparison of our custom billing layout next week."
    },
    pcs: {
      weak: "PCS is old and hard to use on phones.",
      better: "We are more modern than Person Centred Software.",
      best: "PCS is the market leader for care home record keeping. Care managers review us when they want a system that works on cheap mobile handsets without lag. How is the speed of your current devices?",
      followUp: "Do carers find the devices easy to carry on shifts?",
      close: "I can show you a quick look at our lightweight Android app."
    }
  };

  return objections[objectionKey] || objections.system;
}

export function getLocalAuthorityInsight(laName) {
  if (!laName) {
    return {
      name: "Unknown Local Authority",
      commissionerType: "Needs manual verification",
      fundingContext: "Needs manual verification",
      careHomeFee: "Needs manual verification",
      homecareFee: "Needs manual verification",
      supportedLivingFee: "Needs manual verification",
      commercialRelevance: "Local funding pressure impacts system budget availability. Ensure ROI is demonstrated in GBP value."
    };
  }

  // Simplified deterministic lookup for common local authorities
  const laLower = laName.toLowerCase();
  if (laLower.includes("bristol")) {
    return {
      name: "Bristol City Council",
      commissionerType: "Integrated Care Board (ICB) and Local Authority",
      fundingContext: "High reliance on local authority funding with strict budget reviews.",
      careHomeFee: "Needs manual verification",
      homecareFee: "Needs manual verification",
      supportedLivingFee: "Needs manual verification",
      commercialRelevance: "Bristol area ICB prioritises digital record keeping for hospital discharge pathways."
    };
  } else if (laLower.includes("birmingham")) {
    return {
      name: "Birmingham City Council",
      commissionerType: "Local Authority Framework Agreement",
      fundingContext: "One of the largest local authority budgets, historically under strict saving targets.",
      careHomeFee: "Needs manual verification",
      homecareFee: "Needs manual verification",
      supportedLivingFee: "Needs manual verification",
      commercialRelevance: "Providers must evince compliance to stay on the preferred commissioner framework list."
    };
  } else if (laLower.includes("manchester")) {
    return {
      name: "Manchester City Council",
      commissionerType: "Greater Manchester Integrated Care Partnership",
      fundingContext: "Unified health and social care budget context.",
      careHomeFee: "Needs manual verification",
      homecareFee: "Needs manual verification",
      supportedLivingFee: "Needs manual verification",
      commercialRelevance: "High focus on integrated care records sharing across NHS and social care providers."
    };
  }

  return {
    name: laName,
    commissionerType: "Local Authority Social Services",
    fundingContext: "Standard UK council budget constraints. High ratio of state funded residents.",
    careHomeFee: "Needs manual verification",
    homecareFee: "Needs manual verification",
    supportedLivingFee: "Needs manual verification",
    commercialRelevance: "Requires clear proof of administrative hours saved to justify system spend."
  };
}
