// Local Storage manager for UK Care Provider Intelligence Dashboard.
// Complies with no em dash, no double/triple hyphen rules.

const STORAGE_KEY = "uk_care_saved_accounts";
const STATS_KEY = "uk_care_sdr_daily_stats";

export function getSavedAccounts() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function saveAccount(account) {
  const accounts = getSavedAccounts();
  // Ensure we don't save duplicates
  const index = accounts.findIndex(a => a.id === account.id || (account.providerName && a.providerName === account.providerName));
  const newAccount = { ...account };
  
  if (!newAccount.id) {
    newAccount.id = "acc_" + Date.now();
  }
  newAccount.lastUpdated = new Date().toISOString().split("T")[0];

  if (index !== -1) {
    accounts[index] = newAccount;
  } else {
    accounts.push(newAccount);
    // Log as researched today in stats
    incrementResearchedToday();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  return newAccount;
}

export function deleteAccount(id) {
  let accounts = getSavedAccounts();
  accounts = accounts.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function getSdrStats() {
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultStats = {
    date: todayStr,
    researchedToday: 0,
    callsMade: 0,
    followUpsDue: 0,
    demosBooked: 0
  };

  const data = localStorage.getItem(STATS_KEY);
  if (!data) return defaultStats;
  try {
    const stats = JSON.parse(data);
    if (stats.date !== todayStr) {
      // Reset for new day
      localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats));
      return defaultStats;
    }
    return stats;
  } catch (e) {
    return defaultStats;
  }
}

export function saveSdrStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function incrementResearchedToday() {
  const stats = getSdrStats();
  stats.researchedToday += 1;
  saveSdrStats(stats);
}

export function incrementCallsMade() {
  const stats = getSdrStats();
  stats.callsMade += 1;
  saveSdrStats(stats);
}

export function incrementDemosBooked() {
  const stats = getSdrStats();
  stats.demosBooked += 1;
  saveSdrStats(stats);
}
