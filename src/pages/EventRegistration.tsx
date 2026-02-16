import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveEvent, type EventData } from "@/lib/store";
import { toast } from "sonner";

const EventRegistration = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", date: "", venue: "",
    hour_from: "", min_from: "00", period_from: "AM",
    hour_to: "", min_to: "00", period_to: "AM",
  });

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  const parseTime12 = (t: string) => {
    const [time, period] = t.split(" ");
    if (!time || !period) return null;
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };

  const formatTime12 = (hour: string, minute: string, period: string) =>
    `${hour}:${minute} ${period}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeFrom = formatTime12(form.hour_from, form.min_from, form.period_from);
    const timeTo = formatTime12(form.hour_to, form.min_to, form.period_to);

    if (!form.name || !form.date || !form.venue || !form.hour_from || !form.min_from || !form.hour_to || !form.min_to) {
      toast.error("Please fill all fields");
      return;
    }

    const fromMins = parseTime12(timeFrom);
    const toMins = parseTime12(timeTo);
    if (fromMins !== null && toMins !== null && fromMins >= toMins) {
      toast.error("'From' time must be before 'To' time");
      return;
    }

    const event: EventData = {
      id: crypto.randomUUID(),
      name: form.name,
      date: form.date,
      venue: form.venue,
      time_from: timeFrom,
      time_to: timeTo,
      createdAt: new Date().toISOString(),
    };
    saveEvent(event);
    toast.success("Event registered successfully!");
    setForm({
      name: "", date: "", venue: "",
      hour_from: "", min_from: "00", period_from: "AM",
      hour_to: "", min_to: "00", period_to: "AM",
    });
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
            <div className="space-y-2">
              <Label>From</Label>
              <div className="flex gap-2">
                <Select value={form.hour_from} onValueChange={(v) => setForm({ ...form, hour_from: v })}>
                  <SelectTrigger className="w-20"><SelectValue placeholder="HH" /></SelectTrigger>
                  <SelectContent>{hours.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.min_from} onValueChange={(v) => setForm({ ...form, min_from: v })}>
                  <SelectTrigger className="w-20"><SelectValue placeholder="MM" /></SelectTrigger>
                  <SelectContent>{minutes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.period_from} onValueChange={(v) => setForm({ ...form, period_from: v })}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <div className="flex gap-2">
                <Select value={form.hour_to} onValueChange={(v) => setForm({ ...form, hour_to: v })}>
                  <SelectTrigger className="w-20"><SelectValue placeholder="HH" /></SelectTrigger>
                  <SelectContent>{hours.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.min_to} onValueChange={(v) => setForm({ ...form, min_to: v })}>
                  <SelectTrigger className="w-20"><SelectValue placeholder="MM" /></SelectTrigger>
                  <SelectContent>{minutes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.period_to} onValueChange={(v) => setForm({ ...form, period_to: v })}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
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
