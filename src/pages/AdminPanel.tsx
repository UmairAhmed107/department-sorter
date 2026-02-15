import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminLogs, getAdminEmail, setAdminEmail } from "@/lib/store";
import { toast } from "sonner";

const AdminPanel = () => {
  const navigate = useNavigate();
  const logs = getAdminLogs();
  const [email, setEmail] = useState(getAdminEmail());

  const handleEmailSave = () => {
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setAdminEmail(email);
    toast.success("Admin email updated");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-9 w-9 rounded-lg bg-foreground flex items-center justify-center">
            <Shield className="h-4 w-4 text-background" />
          </div>
          <h1 className="text-lg font-display font-bold text-foreground">Admin Panel</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-2xl space-y-6">
        {/* Admin Email */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4" /> Admin Email
          </h3>
          <div className="flex gap-3">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@university.edu"
              className="flex-1"
            />
            <Button onClick={handleEmailSave}>Save</Button>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-display font-semibold text-card-foreground mb-4">Activity Log</h3>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-card-foreground">{log.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{log.details}</p>
                  <p className="text-xs text-muted-foreground mt-1">By: {log.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
