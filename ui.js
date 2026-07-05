// UI Manager and Renderer for UK Care Provider Intelligence Dashboard.
// Complies with no em dash, no double/triple hyphen rules.

import { getApiMode, setApiMode, fetchCqcData, fetchCompaniesHouseData } from "./api.js";
import { parseCqcRecord } from "./cqc.js";
import { parseCompaniesHouseRecord, matchCqcToCompaniesHouse } from "./companiesHouse.js";
import { calculateQualificationScore, evaluateComplianceRisks } from "./scoring.js";
import { parseMessyNotes, generateIntelligence, getObjectionResponse, getLocalAuthorityInsight } from "./intelligenceGenerator.js";
import { performQualityCheck } from "./qualityCheck.js";
import { getSavedAccounts, saveAccount, deleteAccount, getSdrStats, incrementCallsMade, incrementDemosBooked } from "./storage.js";
import { exportSingleAccountBrief, exportAccountsToCsv } from "./export.js";
import { SAMPLE_ACCOUNTS, MOCK_COMPANIES_HOUSE_RECORDS } from "./mockData.js";

// State
let activeAccount = null;
let activeIntelligence = null;
let lastApiData = null; // To check if manual overrides exist

// DOM Element cache
const elements = {
  // Navigation Links
  linkSearch: document.getElementById("link-search"),
  linkSaved: document.getElementById("link-saved"),
  linkDaily: document.getElementById("link-daily"),
  linkSettings: document.getElementById("link-settings"),
  brandLogoBtn: document.getElementById("brand-logo-btn"),

  // Status badge
  apiStatusBadge: document.getElementById("api-status-badge"),

  // Panes
  paneSearch: document.getElementById("pane-search"),
  paneResults: document.getElementById("pane-results"),
  paneProfile: document.getElementById("pane-profile"),
  paneSaved: document.getElementById("pane-saved"),
  paneDaily: document.getElementById("pane-daily"),
  paneSettings: document.getElementById("pane-settings"),

  // SearchHero View
  mainSearchInput: document.getElementById("main-search-input"),
  btnSearchTrigger: document.getElementById("btn-search-trigger"),
  btnUseSample: document.getElementById("btn-use-sample"),
  sampleCardsContainer: document.getElementById("sample-cards-container"),
  sampleProfilesList: document.getElementById("sample-profiles-list"),
  searchErrorAlert: document.getElementById("search-error-alert"),

  // Search Results View
  searchResultsList: document.getElementById("search-results-list"),
  resultsCountTitle: document.getElementById("results-count-title"),
  btnBackToSearch: document.getElementById("btn-back-to-search"),

  // Profile View Header
  btnBackToResults: document.getElementById("btn-back-to-results"),
  profileProviderName: document.getElementById("profile-provider-name"),
  profileServiceBadge: document.getElementById("profile-service-badge"),
  profileLocation: document.getElementById("profile-location"),
  btnSaveAccountProfile: document.getElementById("btn-save-account-profile"),
  profileScoreNum: document.getElementById("profile-score-num"),
  manualOverrideWarning: document.getElementById("manual-override-warning"),

  // Profile metadata fields
  profProviderName: document.getElementById("prof-provider-name"),
  profLocationName: document.getElementById("prof-location-name"),
  profFullAddress: document.getElementById("prof-full-address"),
  profPostcode: document.getElementById("prof-postcode"),
  profPhone: document.getElementById("prof-phone"),
  profWebsite: document.getElementById("prof-website"),
  profEmail: document.getElementById("prof-email"),
  profCqcProvId: document.getElementById("prof-cqc-prov-id"),
  profCqcLocId: document.getElementById("prof-cqc-loc-id"),
  profCqcRating: document.getElementById("prof-cqc-rating"),
  profCqcDate: document.getElementById("prof-cqc-date"),
  profManager: document.getElementById("prof-manager"),
  profNominated: document.getElementById("prof-nominated"),
  profStatus: document.getElementById("prof-status"),

  profChName: document.getElementById("prof-ch-name"),
  profChNumber: document.getElementById("prof-ch-number"),
  profChStatus: document.getElementById("prof-ch-status"),
  profChAddress: document.getElementById("prof-ch-address"),
  profChIncDate: document.getElementById("prof-ch-inc-date"),
  profChFiling: document.getElementById("prof-ch-filing"),
  chMatchConfidence: document.getElementById("ch-match-confidence"),
  chMatchRationale: document.getElementById("ch-match-rationale"),
  chMatchBadgeBox: document.getElementById("ch-match-badge-box"),

  // Profile Tab buttons
  btnTabOverview: document.getElementById("btn-tab-overview"),
  btnTabPeople: document.getElementById("btn-tab-people"),
  btnTabCompliance: document.getElementById("btn-tab-compliance"),
  btnTabSalesnotes: document.getElementById("btn-tab-salesnotes"),
  btnTabOutreach: document.getElementById("btn-tab-outreach"),
  btnTabBdm: document.getElementById("btn-tab-bdm"),

  // Profile Tab Panes
  tabPaneOverview: document.getElementById("tab-pane-overview"),
  tabPanePeople: document.getElementById("tab-pane-people"),
  tabPaneCompliance: document.getElementById("tab-pane-compliance"),
  tabPaneSalesnotes: document.getElementById("tab-pane-salesnotes"),
  tabPaneOutreach: document.getElementById("tab-pane-outreach"),
  tabPaneBdm: document.getElementById("tab-pane-bdm"),

  // Overview Tab Fields
  overSummary: document.getElementById("over-summary"),
  overFitDesc: document.getElementById("over-fit-desc"),
  overNextAction: document.getElementById("over-next-action"),
  overNextReason: document.getElementById("over-next-reason"),
  overMissingChecklist: document.getElementById("over-missing-checklist"),
  overAssumptionsList: document.getElementById("over-assumptions-list"),

  // People Tab Fields
  peopleManager: document.getElementById("people-manager"),
  peopleNominated: document.getElementById("people-nominated"),
  peopleDirectors: document.getElementById("people-directors"),
  peoplePsc: document.getElementById("people-psc"),
  peopleSuggested: document.getElementById("people-suggested"),

  // Compliance Tab Fields
  compRating: document.getElementById("comp-rating"),
  compDate: document.getElementById("comp-date"),
  compActivities: document.getElementById("comp-activities"),
  riskMedication: document.getElementById("risk-medication"),
  riskCarePlanning: document.getElementById("risk-care-planning"),
  riskRecordKeeping: document.getElementById("risk-record-keeping"),
  riskSafeguarding: document.getElementById("risk-safeguarding"),

  // Sales Notes input fields
  inputCurrentCarePlanning: document.getElementById("input-currentCarePlanning"),
  inputCurrentRostering: document.getElementById("input-currentRostering"),
  inputCurrentPainPoints: document.getElementById("input-currentPainPoints"),
  inputTimeline: document.getElementById("input-timeline"),
  inputCampaignType: document.getElementById("input-campaignType"),
  inputLocalAuthority: document.getElementById("input-localAuthority"),
  inputCqcRating: document.getElementById("input-cqcRating"),
  inputManualNotes: document.getElementById("input-manualNotes"),
  btnSaveNotesChanges: document.getElementById("btn-save-notes-changes"),
  btnQualityCheck: document.getElementById("btn-quality-check"),

  // Outreach tab fields
  outOpener: document.getElementById("out-opener"),
  outEmailSubject: document.getElementById("out-email-subject"),
  outEmailOpening: document.getElementById("out-email-opening"),
  outEmailFirstLine: document.getElementById("out-email-first-line"),
  outEmailValue: document.getElementById("out-email-value"),
  outEmailCta: document.getElementById("out-email-cta"),
  outDiscovery: document.getElementById("out-discovery"),
  outreachObjectionSelector: document.getElementById("outreach-objection-selector"),
  outObjWeak: document.getElementById("out-obj-weak"),
  outObjBetter: document.getElementById("out-obj-better"),
  outObjBest: document.getElementById("out-obj-best"),

  // BDM Brief tab fields
  bdmBriefContent: document.getElementById("bdm-brief-content"),
  btnCopyBdmBrief: document.getElementById("btn-copy-bdm-brief"),
  btnExportBriefFile: document.getElementById("btn-export-brief-file"),

  // Saved Accounts View
  btnExportCsvAll: document.getElementById("btn-export-csv-all"),
  savedSearchInput: document.getElementById("saved-search-input"),
  filterRating: document.getElementById("filter-rating"),
  filterOpportunity: document.getElementById("filter-opportunity"),
  savedAccountsTbody: document.getElementById("saved-accounts-tbody"),

  // Daily View Stats
  statResearched: document.getElementById("stat-researched"),
  statCalls: document.getElementById("stat-calls"),
  statDemos: document.getElementById("stat-demos"),
  btnIncCalls: document.getElementById("btn-inc-calls"),
  btnIncDemos: document.getElementById("btn-inc-demos"),
  dailyOutreachTbody: document.getElementById("daily-outreach-tbody"),

  // Settings
  selectSystemMode: document.getElementById("select-system-mode"),
  statusCqcKey: document.getElementById("status-cqc-key"),
  statusChKey: document.getElementById("status-ch-key"),
  liveApiErrorAlert: document.getElementById("live-api-error-alert"),
  btnRunApiTests: document.getElementById("btn-run-api-tests"),
  diagnosticTestsContainer: document.getElementById("diagnostic-tests-container"),

  // QA Modal
  qaModal: document.getElementById("qa-modal"),
  btnCloseQaModal: document.getElementById("btn-close-qa-modal"),
  btnConfirmQaPass: document.getElementById("btn-confirm-qa-pass"),
  qaChecklistResultsList: document.getElementById("qa-checklist-results-list")
};

// Initialisation
export function initDashboardUI() {
  setupNavigation();
  setupSearchFlow();
  setupProfileTabNavigation();
  setupSettingsAndMode();
  setupObjectionSelector();
  setupBDMBriefActions();
  setupSavedAccountsPage();
  setupDailySdrPage();
  setupDiagnosticsAndQA();

  // Load initial mode and daily stats
  updateModeBadge();
  loadDailySdrStats();
}

// Navigation Pane Router
function showPane(paneId) {
  const panes = [
    elements.paneSearch,
    elements.paneResults,
    elements.paneProfile,
    elements.paneSaved,
    elements.paneDaily,
    elements.paneSettings
  ];
  panes.forEach(pane => {
    if (pane) pane.classList.remove("active");
  });

  const targetPane = document.getElementById(paneId);
  if (targetPane) {
    targetPane.classList.add("active");
  }

  // Update header links active status
  const links = [
    { el: elements.linkSearch, hash: "#search" },
    { el: elements.linkSaved, hash: "#saved" },
    { el: elements.linkDaily, hash: "#daily" },
    { el: elements.linkSettings, hash: "#settings" }
  ];
  links.forEach(item => {
    if (item.el) {
      if (paneId === "pane-search" || paneId === "pane-results" || paneId === "pane-profile") {
        if (item.hash === "#search") item.el.classList.add("active");
        else item.el.classList.remove("active");
      } else if (paneId === "pane-saved" && item.hash === "#saved") {
        item.el.classList.add("active");
      } else if (paneId === "pane-daily" && item.hash === "#daily") {
        item.el.classList.add("active");
      } else if (paneId === "pane-settings" && item.hash === "#settings") {
        item.el.classList.add("active");
      } else {
        item.el.classList.remove("active");
      }
    }
  });

  // Refresh saved accounts if viewing saved pane
  if (paneId === "pane-saved") {
    renderSavedAccounts();
  }
  // Refresh daily priority targets if viewing daily pane
  if (paneId === "pane-daily") {
    renderDailyPriorityTargets();
  }
}

function setupNavigation() {
  elements.linkSearch.addEventListener("click", (e) => { e.preventDefault(); showPane("pane-search"); });
  elements.linkSaved.addEventListener("click", (e) => { e.preventDefault(); showPane("pane-saved"); });
  elements.linkDaily.addEventListener("click", (e) => { e.preventDefault(); showPane("pane-daily"); });
  elements.linkSettings.addEventListener("click", (e) => { e.preventDefault(); showPane("pane-settings"); });
  elements.brandLogoBtn.addEventListener("click", () => showPane("pane-search"));

  elements.btnBackToSearch.addEventListener("click", () => showPane("pane-search"));
  elements.btnBackToResults.addEventListener("click", () => {
    if (elements.searchResultsList.children.length > 0) {
      showPane("pane-results");
    } else {
      showPane("pane-search");
    }
  });
}

// Search and API Coordination
function setupSearchFlow() {
  const triggerSearch = async () => {
    const query = elements.mainSearchInput.value.trim();
    if (!query) {
      alert("Please enter a provider name, postcode, CQC ID, or company name.");
      return;
    }

    elements.searchErrorAlert.classList.add("hidden");
    elements.searchErrorAlert.textContent = "";

    // Live API mode credentials validation check
    const mode = getApiMode();
    if (mode === "live") {
      const cqcKey = elements.statusCqcKey.textContent.trim();
      const chKey = elements.statusChKey.textContent.trim();
      if (cqcKey === "Not Configured" || chKey === "Not Configured") {
        elements.searchErrorAlert.classList.remove("hidden");
        elements.searchErrorAlert.innerHTML = "Live API keys are missing. Add CQC_API_KEY and COMPANIES_HOUSE_API_KEY in Netlify environment variables.";
        return;
      }
    }

    // Call API proxy
    elements.searchResultsList.innerHTML = `<div class="loading-state card">Searching care registers, please wait...</div>`;
    showPane("pane-results");

    const res = await fetchCqcData(query);
    if (!res.success) {
      if (res.error && res.error.toLowerCase().includes("key is missing")) {
        elements.searchErrorAlert.classList.remove("hidden");
        elements.searchErrorAlert.innerHTML = "Live API keys are missing. Add CQC_API_KEY and COMPANIES_HOUSE_API_KEY in Netlify environment variables.";
        showPane("pane-search");
      } else {
        elements.searchResultsList.innerHTML = `<div class="card"><p class="text-danger">Search failed: ${res.error || "Unknown network error."}</p></div>`;
      }
      return;
    }

    renderSearchResults(res.results);
  };

  elements.btnSearchTrigger.addEventListener("click", triggerSearch);
  elements.mainSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      triggerSearch();
    }
  });

  // Sample data button toggle
  elements.btnUseSample.addEventListener("click", () => {
    elements.sampleCardsContainer.classList.toggle("hidden");
    if (!elements.sampleCardsContainer.classList.contains("hidden")) {
      renderSampleProfiles();
    }
  });
}

function renderSearchResults(results) {
  elements.searchResultsList.innerHTML = "";
  
  const mode = getApiMode();
  const fictionalFlag = mode === "demo" ? " [Fictional Demo Result]" : "";

  if (!results || results.length === 0) {
    elements.resultsCountTitle.textContent = "Search Results (0 found)";
    elements.searchResultsList.innerHTML = `
      <div class="card text-center">
        <h3>No verified provider found.</h3>
        <p class="form-tip">Try provider name, postcode, CQC location ID, or company name.</p>
      </div>
    `;
    return;
  }

  elements.resultsCountTitle.textContent = `Search Results (${results.length} found)`;

  results.forEach(loc => {
    const card = document.createElement("div");
    card.className = "result-item-card";
    
    // Normalise rating/postcode display
    const parsed = parseCqcRecord(loc);
    const ratingLabel = parsed.latestCqcRating || "Not found in verified source";
    const ratingClass = ratingLabel.toLowerCase().replace(/\s+/g, "-");
    
    card.innerHTML = `
      <div class="result-details">
        <h3>${parsed.locationName}${fictionalFlag}</h3>
        <p class="result-meta">
          <span><strong>Service Type:</strong> ${parsed.serviceType}</span>
          <span><strong>Address:</strong> ${parsed.address}</span>
          <span><strong>Postcode:</strong> ${parsed.postcode}</span>
        </p>
        <p class="result-meta">
          <span><strong>CQC Provider ID:</strong> ${parsed.cqcProviderId}</span>
          <span><strong>CQC Location ID:</strong> ${parsed.cqcLocationId}</span>
          <span><strong>Registration:</strong> ${parsed.locationRegistrationStatus}</span>
        </p>
        <p class="margin-top-sm">
          <span class="badge ${ratingClass}">${ratingLabel}</span>
          <span class="form-tip" style="display:inline; margin-left:12px;">Source: CQC (England only)</span>
        </p>
      </div>
      <div>
        <button class="btn btn-primary btn-sm btn-open-provider" data-loc-id="${parsed.cqcLocationId}" data-prov-name="${parsed.providerName}">Open Provider</button>
      </div>
    `;

    card.querySelector(".btn-open-provider").addEventListener("click", () => {
      loadProviderProfile(parsed);
    });

    elements.searchResultsList.appendChild(card);
  });
}

function renderSampleProfiles() {
  elements.sampleProfilesList.innerHTML = "";
  SAMPLE_ACCOUNTS.forEach(acc => {
    const card = document.createElement("div");
    card.className = "sample-profile-btn";
    card.innerHTML = `
      <h5>${acc.providerName} [Fictional]</h5>
      <p>${acc.serviceType} &middot; ${acc.location || "England"}</p>
    `;
    card.addEventListener("click", () => {
      loadProviderProfile(parseCqcRecord(acc), acc);
    });
    elements.sampleProfilesList.appendChild(card);
  });
}

// Profile Page and Tab details loading
async function loadProviderProfile(cqcRecord, optionalFullMock = null) {
  activeAccount = { ...cqcRecord };
  lastApiData = { ...cqcRecord };

  // 1. Resolve Companies House connection
  let chRecord = null;
  let chMatch = { confidence: "None", reason: "No matching record queried.", warn: true };

  const mode = getApiMode();
  
  if (optionalFullMock) {
    // If loading mock sample account, extract CH details directly
    activeAccount = { ...optionalFullMock };
    if (optionalFullMock.companiesHouseNumber) {
      const chMock = MOCK_COMPANIES_HOUSE_RECORDS[optionalFullMock.companiesHouseNumber];
      if (chMock) {
        chRecord = parseCompaniesHouseRecord(chMock);
        chMatch = { 
          confidence: "High", 
          reason: "Matched via direct mock database relationship linkage.",
          warn: false
        };
      }
    }
  } else {
    // Try to resolve matching record from active registry data
    const queryTerm = activeAccount.companiesHouseNumber || activeAccount.providerName || activeAccount.locationName;
    const chRes = await fetchCompaniesHouseData(queryTerm);
    if (chRes.success && chRes.results.length > 0) {
      const matchResult = matchCqcToCompaniesHouse(activeAccount, chRes.results);
      chRecord = parseCompaniesHouseRecord(matchResult.match);
      chMatch = matchResult;
    }
  }

  // Bind CH parsed properties to activeAccount
  if (chRecord) {
    activeAccount.companiesHouseName = chRecord.registeredCompanyName;
    activeAccount.companiesHouseNumber = chRecord.companyNumber;
    activeAccount.companyStatus = chRecord.companyStatus;
    activeAccount.directors = chRecord.directors;
    activeAccount.personsWithSignificantControl = chRecord.personsWithSignificantControl;
    activeAccount.incorporationDate = chRecord.incorporationDate;
    activeAccount.accountsStatus = chRecord.accountsStatus;
    activeAccount.registeredOfficeAddress = chRecord.registeredOfficeAddress;
  } else {
    activeAccount.companiesHouseName = "Not found in verified source";
    activeAccount.companiesHouseNumber = "Not found in verified source";
    activeAccount.companyStatus = "Not found in verified source";
    activeAccount.directors = ["Not found in verified source"];
    activeAccount.personsWithSignificantControl = ["Not found in verified source"];
    activeAccount.incorporationDate = "Not found in verified source";
    activeAccount.accountsStatus = "Not found in verified source";
    activeAccount.registeredOfficeAddress = "Not found in verified source";
  }

  // Reset override alerts
  elements.manualOverrideWarning.classList.add("hidden");

  // Render header values
  elements.profileProviderName.textContent = activeAccount.providerName;
  elements.profileServiceBadge.textContent = activeAccount.serviceType;
  elements.profileServiceBadge.className = `badge ${activeAccount.serviceType.toLowerCase().replace(/\s+/g, "-")}`;
  elements.profileLocation.textContent = activeAccount.location || "England";

  // CQC Render
  elements.profProviderName.textContent = activeAccount.providerName;
  elements.profLocationName.textContent = activeAccount.locationName;
  elements.profFullAddress.textContent = activeAccount.address;
  elements.profPostcode.textContent = activeAccount.postcode;
  elements.profPhone.textContent = activeAccount.phoneNumber || "Not found in verified source";
  elements.profWebsite.textContent = activeAccount.website || "Not found in verified source";
  elements.profEmail.textContent = activeAccount.emailAddress || "Not found in verified source";
  elements.profCqcProvId.textContent = activeAccount.cqcProviderId;
  elements.profCqcLocId.textContent = activeAccount.cqcLocationId;
  elements.profCqcRating.textContent = activeAccount.latestCqcRating;
  elements.profCqcDate.textContent = activeAccount.latestInspectionDate;
  elements.profManager.textContent = activeAccount.registeredManagerName;
  elements.profNominated.textContent = activeAccount.nominatedIndividualName;
  elements.profStatus.textContent = activeAccount.registrationStatus;

  // CH Render
  elements.profChName.textContent = activeAccount.companiesHouseName;
  elements.profChNumber.textContent = activeAccount.companiesHouseNumber;
  elements.profChStatus.textContent = activeAccount.companyStatus;
  elements.profChAddress.textContent = activeAccount.registeredOfficeAddress;
  elements.profChIncDate.textContent = activeAccount.incorporationDate;
  elements.profChFiling.textContent = chRecord ? chRecord.filingHistorySummary : "Not found in verified source";

  // CH Match Rating Render
  elements.chMatchConfidence.textContent = chMatch.confidence;
  elements.chMatchRationale.textContent = chMatch.reason;
  elements.chMatchBadgeBox.className = `match-validation-alert ${chMatch.confidence.toLowerCase()}`;

  // Populate Sales Note form fields default values
  elements.inputCurrentCarePlanning.value = activeAccount.currentCarePlanning || "Paper records";
  elements.inputCurrentRostering.value = activeAccount.currentRostering || "Spreadsheets";
  elements.inputCurrentPainPoints.value = activeAccount.currentPainPoints || "";
  elements.inputTimeline.value = activeAccount.timeline || "";
  elements.inputCampaignType.value = activeAccount.campaignType || "Cold call";
  elements.inputLocalAuthority.value = activeAccount.localAuthority || "";
  elements.inputCqcRating.value = activeAccount.latestCqcRating || "Not found";
  elements.inputManualNotes.value = activeAccount.manualNotes || "";

  // Perform scoring logic & build outreach copy
  recalculateAccountScoresAndOutreach();

  // Show overview tab by default
  selectProfileTab("btn-tab-overview");
  showPane("pane-profile");
}

function recalculateAccountScoresAndOutreach() {
  const scoresResult = calculateQualificationScore(activeAccount);
  const risksResult = evaluateComplianceRisks(activeAccount);
  activeIntelligence = generateIntelligence(activeAccount);

  // Update Score Badge
  elements.profileScoreNum.textContent = scoresResult.total;

  // Tab 1: Overview Tab Updates
  elements.overSummary.textContent = activeIntelligence.summary;
  elements.overFitDesc.textContent = `${scoresResult.rating} fit (Average Score: ${scoresResult.total}/100) \u2013 ${scoresResult.reason}`;
  elements.overNextAction.textContent = `Primary Outreach Angle: ${activeIntelligence.angles.primary}`;
  elements.overNextReason.textContent = `Next Step Action: ${scoresResult.risks[0] || "Schedule intro brief call."}`;

  // Checklist of missing info
  elements.overMissingChecklist.innerHTML = "";
  if (scoresResult.missingInfo.length === 0) {
    elements.overMissingChecklist.innerHTML = "<li>&nbsp;No missing core contact identifiers</li>";
  } else {
    scoresResult.missingInfo.forEach(info => {
      const li = document.createElement("li");
      li.innerHTML = `<span>❌</span> <span>Missing ${info}</span>`;
      elements.overMissingChecklist.appendChild(li);
    });
  }

  // Assumptions
  elements.overAssumptionsList.innerHTML = "";
  const assumptions = [
    `Assumed key operational decision maker is ${activeAccount.registeredManagerName || "Registered Manager"}.`,
    activeAccount.currentCarePlanning === "Paper records" ? "Assuming paper log auditing processes create major CQC readiness friction." : "Assuming integration difficulties with current software systems."
  ];
  assumptions.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    elements.overAssumptionsList.appendChild(li);
  });

  // Tab 2: People Tab Updates
  elements.peopleManager.textContent = activeAccount.registeredManagerName;
  elements.peopleNominated.textContent = activeAccount.nominatedIndividualName;
  elements.peopleDirectors.textContent = activeAccount.directors ? activeAccount.directors.join(", ") : "Not found in verified source";
  elements.peoplePsc.textContent = activeAccount.personsWithSignificantControl ? activeAccount.personsWithSignificantControl.join(", ") : "Not found in verified source";
  
  const suggestedDms = [
    activeAccount.registeredManagerName !== "Not found in verified source" ? `${activeAccount.registeredManagerName} (Registered Manager)` : "",
    activeAccount.nominatedIndividualName !== "Not found in verified source" ? `${activeAccount.nominatedIndividualName} (Nominated Person)` : "",
    activeAccount.directors && activeAccount.directors[0] !== "Not found in verified source" ? `${activeAccount.directors[0]} (Director)` : ""
  ].filter(Boolean);
  elements.peopleSuggested.textContent = suggestedDms.length > 0 ? suggestedDms.join(", ") : "Not found in verified source";

  // Tab 3: Compliance Tab Updates
  elements.compRating.textContent = activeAccount.latestCqcRating;
  elements.compDate.textContent = activeAccount.latestInspectionDate;
  elements.compActivities.textContent = activeAccount.regulatedActivities && activeAccount.regulatedActivities.length > 0 ? 
    activeAccount.regulatedActivities.join(", ") : "Not found in verified source";

  // Specific Compliance Risks (strictly isolation checks)
  const updateRiskField = (el, val) => {
    el.textContent = val;
    el.className = "badge";
    if (val === "High") {
      el.classList.add("inadequate");
    } else {
      el.classList.add("good");
    }
  };
  updateRiskField(elements.riskMedication, risksResult.medication);
  updateRiskField(elements.riskCarePlanning, risksResult.carePlanning);
  updateRiskField(elements.riskRecordKeeping, risksResult.recordKeeping);
  updateRiskField(elements.riskSafeguarding, risksResult.safeguarding);

  // Tab 5: Outreach Tab Updates
  elements.outOpener.textContent = activeIntelligence.openers[activeAccount.campaignType.replace(/\s+/g, "")] || activeIntelligence.openers.coldCall;
  elements.outEmailSubject.textContent = `Compliance and daily log timesaver for ${activeAccount.providerName}`;
  elements.outEmailOpening.textContent = `Hi ${activeAccount.registeredManagerName || "Care Manager"},`;
  elements.outEmailFirstLine.textContent = `I was reviewing care listings in ${activeAccount.location || "your region"} and wanted to verify details for ${activeAccount.providerName}.`;
  elements.outEmailValue.textContent = `We support UK care organizations moving away from ${activeAccount.currentCarePlanning || "manual records"} to save managers up to forty hours per month on auditing logs.`;
  elements.outEmailCta.textContent = `Are you open to a brief ten minute chat next Tuesday morning to compare approaches?`;

  elements.outDiscovery.innerHTML = `
    <li>${activeIntelligence.discovery.currentProcess}</li>
    <li>${activeIntelligence.discovery.medication}</li>
    <li>${activeIntelligence.discovery.audits}</li>
    <li>${activeIntelligence.discovery.meddicc.economicBuyer}</li>
  `;
  triggerObjectionContent();

  // Tab 6: BDM Handover Brief updates
  elements.bdmBriefContent.textContent = activeIntelligence.bdmHandover;
}

// Tabs bindings
function setupProfileTabNavigation() {
  const tabs = [
    { btn: elements.btnTabOverview, pane: elements.tabPaneOverview },
    { btn: elements.btnTabPeople, pane: elements.tabPanePeople },
    { btn: elements.btnTabCompliance, pane: elements.tabPaneCompliance },
    { btn: elements.btnTabSalesnotes, pane: elements.tabPaneSalesnotes },
    { btn: elements.btnTabOutreach, pane: elements.tabPaneOutreach },
    { btn: elements.btnTabBdm, pane: elements.tabPaneBdm }
  ];

  tabs.forEach(tab => {
    if (tab.btn) {
      tab.btn.addEventListener("click", () => {
        selectProfileTab(tab.btn.id);
      });
    }
  });
}

function selectProfileTab(buttonId) {
  const tabs = [
    { btn: elements.btnTabOverview, pane: elements.tabPaneOverview },
    { btn: elements.btnTabPeople, pane: elements.tabPanePeople },
    { btn: elements.btnTabCompliance, pane: elements.tabPaneCompliance },
    { btn: elements.btnTabSalesnotes, pane: elements.tabPaneSalesnotes },
    { btn: elements.btnTabOutreach, pane: elements.tabPaneOutreach },
    { btn: elements.btnTabBdm, pane: elements.tabPaneBdm }
  ];

  tabs.forEach(tab => {
    if (tab.btn && tab.pane) {
      if (tab.btn.id === buttonId) {
        tab.btn.classList.add("active");
        tab.pane.classList.add("active");
      } else {
        tab.btn.classList.remove("active");
        tab.pane.classList.remove("active");
      }
    }
  });
}

// Settings configuration
function setupSettingsAndMode() {
  const activeMode = getApiMode();
  elements.selectSystemMode.value = activeMode;

  elements.selectSystemMode.addEventListener("change", (e) => {
    const val = e.target.value;
    setApiMode(val);
    updateModeBadge();
    checkEnvironmentKeys();
  });

  // Verify inputs save button inside Sales Notes Tab
  elements.btnSaveNotesChanges.addEventListener("click", (e) => {
    e.preventDefault();
    if (!activeAccount) return;

    // Capture notes input values
    activeAccount.currentCarePlanning = elements.inputCurrentCarePlanning.value;
    activeAccount.currentRostering = elements.inputCurrentRostering.value;
    activeAccount.currentPainPoints = elements.inputCurrentPainPoints.value;
    activeAccount.timeline = elements.inputTimeline.value;
    activeAccount.campaignType = elements.inputCampaignType.value;
    activeAccount.localAuthority = elements.inputLocalAuthority.value;
    activeAccount.cqcRating = elements.inputCqcRating.value;
    activeAccount.manualNotes = elements.inputManualNotes.value;

    // Trigger mismatch visual alert flag if overrides are saved
    if (lastApiData) {
      const isMismatch = (activeAccount.currentCarePlanning !== (lastApiData.currentCarePlanning || "Paper records") ||
                          activeAccount.cqcRating !== lastApiData.latestCqcRating);
      if (isMismatch) {
        elements.manualOverrideWarning.classList.remove("hidden");
      } else {
        elements.manualOverrideWarning.classList.add("hidden");
      }
    }

    recalculateAccountScoresAndOutreach();
    alert("Sales notes changes applied. Qualification scores and outreach collateral updated.");
  });

  // Save Account Profile button in header
  elements.btnSaveAccountProfile.addEventListener("click", () => {
    if (!activeAccount) return;
    saveAccount(activeAccount);
    alert(`${activeAccount.providerName} has been saved successfully.`);
  });

  // Check Netlify environment keys values
  checkEnvironmentKeys();
}

async function checkEnvironmentKeys() {
  const mode = getApiMode();
  if (mode === "demo") {
    elements.statusCqcKey.textContent = "Fictional Demo Environment";
    elements.statusCqcKey.className = "cred-value active";
    elements.statusChKey.textContent = "Fictional Demo Environment";
    elements.statusChKey.className = "cred-value active";
    elements.liveApiErrorAlert.classList.add("hidden");
    elements.searchErrorAlert.classList.add("hidden");
  } else {
    // Live mode key availability checks via test ping requests
    elements.statusCqcKey.textContent = "Checking...";
    elements.statusCqcKey.className = "cred-value";
    elements.statusChKey.textContent = "Checking...";
    elements.statusChKey.className = "cred-value";

    const cqcTest = await fetch(`/api/cqc?query=test`);
    const chTest = await fetch(`/api/companies-house?query=test`);

    if (cqcTest.status === 401) {
      elements.statusCqcKey.textContent = "Not Configured";
      elements.statusCqcKey.className = "cred-value";
    } else {
      elements.statusCqcKey.textContent = "Active on Server";
      elements.statusCqcKey.className = "cred-value active";
    }

    if (chTest.status === 401) {
      elements.statusChKey.textContent = "Not Configured";
      elements.statusChKey.className = "cred-value";
    } else {
      elements.statusChKey.textContent = "Active on Server";
      elements.statusChKey.className = "cred-value active";
    }

    if (cqcTest.status === 401 || chTest.status === 401) {
      elements.liveApiErrorAlert.classList.remove("hidden");
    } else {
      elements.liveApiErrorAlert.classList.add("hidden");
    }
  }
}

function updateModeBadge() {
  const mode = getApiMode();
  elements.apiStatusBadge.textContent = mode === "demo" ? "Demo Mode" : "Live API Mode";
  elements.apiStatusBadge.className = `api-mode-badge ${mode === "live" ? "live" : ""}`;
}

// Objections triggers
function setupObjectionSelector() {
  elements.outreachObjectionSelector.addEventListener("change", triggerObjectionContent);
}

function triggerObjectionContent() {
  const key = elements.outreachObjectionSelector.value;
  const obj = getObjectionResponse(key);
  
  elements.outObjWeak.textContent = obj.weak;
  elements.outObjBetter.textContent = obj.better;
  elements.outObjBest.textContent = `${obj.best} ${obj.followUp} ${obj.close}`;
}

// Handover actions
function setupBDMBriefActions() {
  elements.btnCopyBdmBrief.addEventListener("click", () => {
    if (!activeIntelligence) return;
    navigator.clipboard.writeText(activeIntelligence.bdmHandover).then(() => {
      alert("BDM Notes copied to clipboard.");
    });
  });

  elements.btnExportBriefFile.addEventListener("click", () => {
    if (!activeAccount || !activeIntelligence) return;
    exportSingleAccountBrief(activeAccount, activeIntelligence);
  });
}

// Saved Accounts Page List
function setupSavedAccountsPage() {
  elements.btnExportCsvAll.addEventListener("click", () => {
    const list = getSavedAccounts();
    exportAccountsToCsv(list);
  });

  elements.savedSearchInput.addEventListener("input", renderSavedAccounts);
  elements.filterRating.addEventListener("change", renderSavedAccounts);
  elements.filterOpportunity.addEventListener("change", renderSavedAccounts);
}

function renderSavedAccounts() {
  const accounts = getSavedAccounts();
  elements.savedAccountsTbody.innerHTML = "";

  const query = elements.savedSearchInput.value.toLowerCase();
  const ratingFilter = elements.filterRating.value;
  const oppFilter = elements.filterOpportunity.value;

  const filtered = accounts.filter(acc => {
    const nameMatch = acc.providerName.toLowerCase().includes(query) || (acc.location && acc.location.toLowerCase().includes(query));
    const ratingMatch = ratingFilter ? (acc.cqcRating === ratingFilter) : true;
    
    let oppMatch = true;
    if (oppFilter) {
      const score = acc.qualificationScore || 0;
      if (oppFilter === "Hot") oppMatch = score >= 75;
      else if (oppFilter === "Warm") oppMatch = score >= 50 && score < 75;
      else if (oppFilter === "Nurture") oppMatch = score < 50;
    }

    return nameMatch && ratingMatch && oppMatch;
  });

  if (filtered.length === 0) {
    elements.savedAccountsTbody.innerHTML = `<tr><td colspan="7" class="text-center">No saved accounts matching filters found.</td></tr>`;
    return;
  }

  filtered.forEach(acc => {
    const tr = document.createElement("tr");
    
    // Opp score badge label
    const score = acc.qualificationScore || 0;
    let badgeText = "Nurture";
    let badgeClass = "nurture";
    if (score >= 75) {
      badgeText = "Hot";
      badgeClass = "hot";
    } else if (score >= 50) {
      badgeText = "Warm";
      badgeClass = "warm";
    }

    const ratingClass = (acc.cqcRating || "not-found").toLowerCase().replace(/\s+/g, "-");

    tr.innerHTML = `
      <td><strong>${acc.providerName}</strong></td>
      <td>${acc.serviceType}</td>
      <td>${acc.location || "England"}</td>
      <td><span class="badge ${ratingClass}">${acc.cqcRating || "Not found"}</span></td>
      <td><span class="badge ${badgeClass}">${badgeText} (${score})</span></td>
      <td>${acc.lastUpdated || "Today"}</td>
      <td>
        <button class="btn btn-outline btn-sm btn-view-saved" data-id="${acc.id}">Open</button>
        <button class="btn btn-outline btn-sm btn-delete-saved" data-id="${acc.id}" style="color:red; border-color:#fee2e2;">Delete</button>
      </td>
    `;

    tr.querySelector(".btn-view-saved").addEventListener("click", () => {
      loadProviderProfile(acc, acc);
    });

    tr.querySelector(".btn-delete-saved").addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete ${acc.providerName}?`)) {
        deleteAccount(acc.id);
        renderSavedAccounts();
      }
    });

    elements.savedAccountsTbody.appendChild(tr);
  });
}

// Daily SDR View Page
function setupDailySdrPage() {
  elements.btnIncCalls.addEventListener("click", () => {
    incrementCallsMade();
    loadDailySdrStats();
  });

  elements.btnIncDemos.addEventListener("click", () => {
    incrementDemosBooked();
    loadDailySdrStats();
  });
}

function loadDailySdrStats() {
  const stats = getSdrStats();
  elements.statResearched.textContent = stats.researchedToday;
  elements.statCalls.textContent = stats.callsMade;
  elements.statDemos.textContent = stats.demosBooked;
}

function renderDailyPriorityTargets() {
  elements.dailyOutreachTbody.innerHTML = "";
  const accounts = getSavedAccounts();

  // Sort by opportunity score desc (hot targets first)
  const targets = accounts.sort((a,b) => (b.qualificationScore || 0) - (a.qualificationScore || 0)).slice(0, 5);

  if (targets.length === 0) {
    elements.dailyOutreachTbody.innerHTML = `<tr><td colspan="6" class="text-center">No saved accounts found. Search and save accounts to populate priority daily views.</td></tr>`;
    return;
  }

  targets.forEach(acc => {
    const tr = document.createElement("tr");
    
    const score = acc.qualificationScore || 0;
    const isRequiresImprovement = (acc.cqcRating || "").toLowerCase().includes("improvement");
    const trigger = isRequiresImprovement ? "CQC Requires Improvement audit timing" : "Moving away from paper processes";
    const nextAction = isRequiresImprovement ? "Pitch CQC compliance preparation templates" : "Show mobile timesheet tools";

    tr.innerHTML = `
      <td><strong>${acc.providerName}</strong></td>
      <td>${acc.serviceType}</td>
      <td>${acc.location || "England"}</td>
      <td>${trigger}</td>
      <td><strong>${nextAction}</strong></td>
      <td>
        <button class="btn btn-primary btn-sm btn-launch-outreach" data-id="${acc.id}">Outreach Workspace</button>
      </td>
    `;

    tr.querySelector(".btn-launch-outreach").addEventListener("click", () => {
      loadProviderProfile(acc, acc);
    });

    elements.dailyOutreachTbody.appendChild(tr);
  });
}

// Diagnostics and Quality Control (QA)
function setupDiagnosticsAndQA() {
  // Quality Check QA button in Sales Notes Tab
  elements.btnQualityCheck.addEventListener("click", (e) => {
    e.preventDefault();
    if (!activeAccount || !activeIntelligence) {
      alert("No active provider loaded. Research an account before verifying copy.");
      return;
    }

    const report = performQualityCheck(activeAccount, activeIntelligence);
    renderQaReport(report);
  });

  elements.btnCloseQaModal.addEventListener("click", () => {
    elements.qaModal.classList.add("hidden");
  });
  elements.btnConfirmQaPass.addEventListener("click", () => {
    elements.qaModal.classList.add("hidden");
  });

  // Settings Diagnostics Run
  elements.btnRunApiTests.addEventListener("click", async () => {
    elements.diagnosticTestsContainer.innerHTML = `<div class="loading-state">Running tests...</div>`;
    
    const diagnostics = [
      { name: "CQC Proxy Connection", endpoint: "/api/cqc?query=test" },
      { name: "Companies House Connection", endpoint: "/api/companies-house?query=test" }
    ];

    let html = "";
    for (const test of diagnostics) {
      try {
        const response = await fetch(test.endpoint);
        const statusClass = response.ok || response.status === 401 ? "pass" : "warning";
        const statusText = response.ok || response.status === 401 ? "PASS" : "FAIL";
        html += `
          <div class="diagnostic-item">
            <span class="diagnostic-label">${test.name}</span>
            <span class="diagnostic-status ${statusClass}">${statusText} (Status: ${response.status})</span>
          </div>
        `;
      } catch (err) {
        html += `
          <div class="diagnostic-item">
            <span class="diagnostic-label">${test.name}</span>
            <span class="diagnostic-status warning">FAILED (Network Error)</span>
          </div>
        `;
      }
    }
    elements.diagnosticTestsContainer.innerHTML = html;
  });
}

function renderQaReport(report) {
  elements.qaChecklistResultsList.innerHTML = "";
  
  report.forEach(check => {
    const li = document.createElement("li");
    const statusText = check.passed ? "PASS" : "FAIL";
    const statusClass = check.passed ? "pass" : "warning";
    
    li.innerHTML = `
      <h4>
        <span>${check.ruleName}</span>
        <span class="diagnostic-status ${statusClass}">${statusText}</span>
      </h4>
      <p>${check.details}</p>
    `;
    elements.qaChecklistResultsList.appendChild(li);
  });

  elements.qaModal.classList.remove("hidden");
}
