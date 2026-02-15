export interface EventData {
  id: string;
  name: string;
  date: string;
  venue: string;
  time_from: string;
  time_to: string;
  createdAt: string;
}

export interface AdminLog {
  id: string;
  email: string;
  action: string;
  details: string;
  timestamp: string;
}

// Department mapping based on ID prefix or patterns
export const DEPARTMENTS: Record<string, string[]> = {
  "V-SPARC": ["BAR"],
  "VAIAL": ["BAG"],
  "SCHEME": ["BCM"],
  "SMEC": ["BME", "MMT", "BMM", "BMV", "BMA"],
  "V-SIGN": ["BID"],
  "SELECT": ["BEE", "BEL", "BEI"],
  "SCE": ["BCL"],
  "SBST": ["BBT", "MSI"],
  "SSL": ["BCC", "BBP", "BBC", "BFN"],
  "SCOPE": ["BCE", "BBS", "BDS", "BCT", "BKT", "BAI", "BCI", "BCB", "MID", "MIC"],
  "SCORE": ["BIT", "BCA", "BCS", "BDE", "BYB", "MIS", "MCA", "MAG"],
  "VIT-BS": ["BBA"],
  "VSmart": ["BAM", "BVC"],
  "HOT": ["BHA"],
  "SENSE": ["BEC", "BML", "BVD"],
};

export function getEvents(): EventData[] {
  const data = localStorage.getItem("events");
  return data ? JSON.parse(data) : [];
}

export function saveEvent(event: EventData): void {
  const events = getEvents();
  events.push(event);
  localStorage.setItem("events", JSON.stringify(events));
  addAdminLog("Event Registered", `Registered event: ${event.name} on ${event.date}`);
}

export function getAdminLogs(): AdminLog[] {
  const data = localStorage.getItem("adminLogs");
  return data ? JSON.parse(data) : [];
}

export function addAdminLog(action: string, details: string): void {
  const logs = getAdminLogs();
  const email = localStorage.getItem("adminEmail") || "admin@university.edu";
  logs.unshift({
    id: crypto.randomUUID(),
    email,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem("adminLogs", JSON.stringify(logs));
}

export function setAdminEmail(email: string): void {
  localStorage.setItem("adminEmail", email);
}

export function getAdminEmail(): string {
  return localStorage.getItem("adminEmail") || "admin@university.edu";
}
