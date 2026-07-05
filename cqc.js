// CQC API data formatter.
// Complies with no em dash, no double/triple hyphen rules.
// Adds CQC Open Government Licence acknowledgement.

export const CQC_LICENCE_ACKNOWLEDGEMENT = "Uses CQC information under the Open Government Licence.";

export function parseCqcRecord(raw) {
  if (!raw) return null;

  // Safe checks for fields. If missing, show "Not found in API data".
  const registeredManager = raw.registeredManagerName || raw.manager || "Not found in API data";
  const nominatedIndividual = raw.nominatedIndividualName || raw.nominatedIndividual || "Not found in API data";
  const bedCount = raw.bedsCount || raw.numberOfBeds || "Not found in API data";
  
  return {
    providerName: raw.providerName || "Not found in API data",
    locationName: raw.locationName || "Not found in API data",
    cqcProviderId: raw.cqcProviderId || "Not found in API data",
    cqcLocationId: raw.cqcLocationId || "Not found in API data",
    serviceType: raw.serviceType || "Other",
    address: raw.address || "Not found in API data",
    postcode: raw.postcode || "Not found in API data",
    registeredManagerName: registeredManager,
    nominatedIndividualName: nominatedIndividual,
    latestCqcRating: raw.latestCqcRating || "Not found in API data",
    latestInspectionDate: raw.latestInspectionDate || "Not found in API data",
    regulatedActivities: raw.regulatedActivities || [],
    specialisms: raw.specialisms || [],
    serviceUserBands: raw.serviceUserBands || [],
    providerRegistrationStatus: raw.providerRegistrationStatus || "Not found in API data",
    locationRegistrationStatus: raw.locationRegistrationStatus || "Not found in API data",
    bedCount: bedCount,
    licence: CQC_LICENCE_ACKNOWLEDGEMENT,
    v2DirectoryFallback: "CQC Care Directory Files mapping is prepared for V2 implementation"
  };
}
