import { useNavigate } from "react-router-dom";
import { CalendarPlus, FileSpreadsheet, Shield } from "lucide-react";

const actions = [
  {
    title: "Event Registration",
    description: "Register new events with details like name, date, venue, and time.",
    icon: CalendarPlus,
    path: "/event-registration",
    accent: "bg-primary text-primary-foreground",
  },
  {
    title: "Email Segregator",
    description: "Upload an unsorted spreadsheet and download department-wise Excel files.",
    icon: FileSpreadsheet,
    path: "/email-segregator",
    accent: "bg-accent text-accent-foreground",
  },
  {
    title: "Admin Panel",
    description: "View activity logs and admin information.",
    icon: Shield,
    path: "/admin",
    accent: "bg-foreground text-background",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">SheetSort</h1>
            <p className="text-xs text-muted-foreground">University Spreadsheet Segregation Tool</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Organize. Segregate. <span className="text-primary">Simplify.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Register events, upload unsorted spreadsheets, and instantly generate department-wise Excel files for your university.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {actions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="group relative bg-card rounded-xl border p-6 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <div className={`h-12 w-12 rounded-lg ${action.accent} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-semibold text-lg text-card-foreground mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
