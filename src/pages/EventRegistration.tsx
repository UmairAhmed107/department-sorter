import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveEvent, type EventData } from "@/lib/store";
import { toast } from "sonner";

const EventRegistration = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", date: "", venue: "", time_from: "", time_to: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.venue || !form.time_from || !form.time_to) {
      toast.error("Please fill all fields");
      return;
    }

    const event: EventData = {
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date().toISOString(),
    };
    saveEvent(event);
    toast.success("Event registered successfully!");
    setForm({ name: "", date: "", venue: "", time_from: "", time_to: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <CalendarPlus className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-display font-bold text-foreground">Event Registration</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-lg">
        <div className="bg-card border rounded-xl p-8">
          <h2 className="text-2xl font-display font-bold text-card-foreground mb-6">Register New Event</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                placeholder="e.g. Tech Fest 2025"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                placeholder="e.g. Main Auditorium"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time_from">From</Label>
                <Input
                  id="time_from"
                  type="time"
                  value={form.time_from}
                  onChange={(e) => setForm({ ...form, time_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_to">To</Label>
                <Input
                  id="time_to"
                  type="time"
                  value={form.time_to}
                  onChange={(e) => setForm({ ...form, time_to: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Register Event
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EventRegistration;
