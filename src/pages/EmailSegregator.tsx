import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileSpreadsheet, Upload, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getEvents, DEPARTMENTS, addAdminLog, type EventData } from "@/lib/store";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const EmailSegregator = () => {
  const navigate = useNavigate();
  const events = getEvents();
  const [selectedDate, setSelectedDate] = useState("");
  const [numEvents, setNumEvents] = useState(1);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const filteredEvents = events.filter((e) => e.date === selectedDate);

  const toggleEvent = (id: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < numEvents ? [...prev, id] : prev
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const detectDepartment = (courseOrId: string): { school: string; course: string } | null => {
    const val = courseOrId.toUpperCase().trim();
    for (const [school, courses] of Object.entries(DEPARTMENTS)) {
      for (const course of courses) {
        const code = course.toUpperCase();
        if (val === code || new RegExp(`\\b${code}\\b`).test(val) || new RegExp(`\\d{2}${code}\\d+`).test(val)) {
          return { school, course };
        }
      }
    }
    return null;
  };

  const processFile = useCallback(async () => {
    if (!file || selectedEventIds.length === 0) {
      toast.error("Please select events and upload a file");
      return;
    }

    setProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rows.length === 0) {
        toast.error("The spreadsheet is empty");
        setProcessing(false);
        return;
      }

      // Build a lookup of selected events by name (lowercase)
      const selectedEvents = events.filter((e) => selectedEventIds.includes(e.id));

      // Group rows by department
      const deptData: Record<string, { course: string; studentId: string; eventName: string; eventTiming: string }[]> = {};

      for (const row of rows) {
        const cols = Object.values(row).map(String);
        const keys = Object.keys(row).map((k) => k.toLowerCase());

        let studentId = "";
        let courseStr = "";

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const val = cols[i];
          if (key.includes("id") || key.includes("roll") || key.includes("reg")) studentId = val;
          if (key.includes("course") || key.includes("department") || key.includes("dept") || key.includes("branch") || key.includes("program")) {
            courseStr = val;
          }
        }

        if (!studentId && cols.length > 0) studentId = cols[0];
        if (!courseStr && cols.length > 1) courseStr = cols[1];

        const dept = detectDepartment(courseStr) || detectDepartment(studentId);

        // For each selected event, add a row with event name and timing
        for (const event of selectedEvents) {
          const timing = `${event.time_from} - ${event.time_to}`;

          if (dept) {
            if (!deptData[dept.school]) deptData[dept.school] = [];
            deptData[dept.school].push({
              course: dept.course,
              studentId,
              eventName: event.name,
              eventTiming: timing,
            });
          } else {
            const key = "Other";
            if (!deptData[key]) deptData[key] = [];
            deptData[key].push({
              course: courseStr || "Unknown",
              studentId,
              eventName: event.name,
              eventTiming: timing,
            });
          }
        }
      }

      if (Object.keys(deptData).length === 0) {
        toast.error("No matching department data found in the spreadsheet");
        setProcessing(false);
        return;
      }

      const zip = new JSZip();
      const dateStr = selectedDate.replace(/-/g, "_");

      for (const [school, students] of Object.entries(deptData)) {
        const wb = XLSX.utils.book_new();

        const byCourse: Record<string, typeof students> = {};
        students.forEach((s) => {
          if (!byCourse[s.course]) byCourse[s.course] = [];
          byCourse[s.course].push(s);
        });

        for (const [course, courseStudents] of Object.entries(byCourse)) {
          const wsData = [
            [`School: ${school}`, `Date: ${selectedDate}`],
            [],
            ["Student ID", "Event Name", "Event Timing"],
            ...courseStudents.map((s) => [s.studentId, s.eventName, s.eventTiming]),
          ];
          const ws = XLSX.utils.aoa_to_sheet(wsData);
          ws["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 20 }];
          const safeName = course.replace(/[\\\/\?\*\[\]]/g, "").substring(0, 31);
          XLSX.utils.book_append_sheet(wb, ws, safeName);
        }

        const fileName = `${school.replace(/\s+/g, "_")}_${dateStr}.xlsx`;
        const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        zip.file(fileName, wbOut);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `Segregated_Sheets_${dateStr}.zip`);

      addAdminLog("Spreadsheet Segregated", `Processed ${rows.length} rows into ${Object.keys(deptData).length} department files`);
      toast.success(`Generated ${Object.keys(deptData).length} department files!`);
    } catch (err) {
      console.error(err);
      toast.error("Error processing file. Please check the format.");
    }
    setProcessing(false);
  }, [file, selectedEventIds, selectedDate, events]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
            <FileSpreadsheet className="h-4 w-4 text-accent-foreground" />
          </div>
          <h1 className="text-lg font-display font-bold text-foreground">Email Segregator</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-2xl space-y-6">
        {/* Step 1: Select Date */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-display font-semibold text-card-foreground mb-4">1. Select Date</h3>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedEventIds([]);
              setFile(null);
            }}
          />
        </div>

        {/* Step 2: Number of Events */}
        {selectedDate && (
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-display font-semibold text-card-foreground mb-4">2. Number of Events</h3>
            <Input
              type="number"
              min={1}
              max={filteredEvents.length || 10}
              value={numEvents}
              onChange={(e) => {
                setNumEvents(parseInt(e.target.value) || 1);
                setSelectedEventIds([]);
                setFile(null);
              }}
            />
          </div>
        )}

        {/* Step 3: Select Events */}
        {selectedDate && filteredEvents.length > 0 && (
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-display font-semibold text-card-foreground mb-4">
              3. Select Events ({selectedEventIds.length}/{numEvents})
            </h3>
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <label
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={selectedEventIds.includes(event.id)}
                    onCheckedChange={() => toggleEvent(event.id)}
                    disabled={!selectedEventIds.includes(event.id) && selectedEventIds.length >= numEvents}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-card-foreground">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.venue} • {event.time_from} - {event.time_to}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {selectedDate && filteredEvents.length === 0 && (
          <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground">
            No events registered for this date. Please register events first.
          </div>
        )}

        {/* Step 4: Upload File */}
        {selectedEventIds.length > 0 && (
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-display font-semibold text-card-foreground mb-4">4. Upload Unsorted Spreadsheet</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Expected columns: Student ID, Course/Department
            </p>
            <div className="relative">
              {file ? (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{file.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload .xlsx or .xls</span>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </Label>
              )}
            </div>
          </div>
        )}

        {/* Process Button */}
        {file && selectedEventIds.length > 0 && (
          <Button
            className="w-full"
            size="lg"
            onClick={processFile}
            disabled={processing}
          >
            <Download className="h-4 w-4 mr-2" />
            {processing ? "Processing..." : "Segregate & Download"}
          </Button>
        )}
      </main>
    </div>
  );
};

export default EmailSegregator;
