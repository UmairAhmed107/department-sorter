export interface EventData {
  id: string;
  name: string;
  date: string;
  venue: string;
  time: string;
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
  "School of Computer Science": ["BSc CS", "BCA", "MCA", "MSc CS", "B.Tech CSE"],
  "School of Commerce": ["B.Com", "M.Com", "BBA", "MBA"],
  "School of Science": ["BSc Physics", "BSc Chemistry", "BSc Mathematics", "MSc Physics", "MSc Chemistry"],
  "School of Arts": ["BA English", "BA History", "BA Economics", "MA English", "MA History"],
  "School of Engineering": ["B.Tech ECE", "B.Tech ME", "B.Tech CE", "M.Tech"],
  "School of Law": ["BA LLB", "LLB", "LLM"],
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
