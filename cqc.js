// CQC API data formatter.
// Complies with no em dash, no double/triple hyphen rules.
// Adds CQC Open Government Licence acknowledgement.

export const CQC_LICENCE_ACKNOWLEDGEMENT = "Uses CQC information under the Open Government Licence.";

export function parseCqcRecord(raw) {
  if (!raw) return null;

  const registeredManager = raw.registeredManagerName || raw.manager || "Not found in verified source";
  const nominatedIndividual = raw.nominatedIndividualName || raw.nominatedIndividual || "Not found in verified source";
  const bedCount = raw.bedsCount || raw.numberOfBeds || "Not found in verified source";
  
  return {
    providerName: raw.providerName || "Not found in verified source",
    locationName: raw.locationName || "Not found in verified source",
    cqcProviderId: raw.cqcProviderId || "Not found in verified source",
    cqcLocationId: raw.cqcLocationId || "Not found in verified source",
    serviceType: raw.serviceType || "Other",
    address: raw.address || "Not found in verified source",
    postcode: raw.postcode || "Not found in verified source",
    phoneNumber: raw.phoneNumber || raw.phone || "Not found in verified source",
    website: raw.website || "Not found in verified source",
    emailAddress: raw.emailAddress || raw.email || "Not found in verified source",
    registeredManagerName: registeredManager,
    nominatedIndividualName: nominatedIndividual,
    latestCqcRating: raw.latestCqcRating || raw.cqcRating || "Not found in verified source",
    latestInspectionDate: raw.latestInspectionDate || raw.cqcInspectionDate || "Not found in verified source",
    regulatedActivities: raw.regulatedActivities || [],
    specialisms: raw.specialisms || [],
    serviceUserBands: raw.serviceUserBands || [],
    providerRegistrationStatus: raw.providerRegistrationStatus || "Not found in verified source",
    locationRegistrationStatus: raw.locationRegistrationStatus || "Not found in verified source",
    registrationStatus: raw.registrationStatus || raw.locationRegistrationStatus || "Not found in verified source",
    bedCount: bedCount,
    licence: CQC_LICENCE_ACKNOWLEDGEMENT,
    v2DirectoryFallback: "CQC Care Directory Files mapping is prepared for V2 implementation"
  };
}
