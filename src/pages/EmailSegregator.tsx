import { useState, useCallback, useRef } from "react";
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
  const [eventFiles, setEventFiles] = useState<Record<string, File>>({});
  const [processing, setProcessing] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const schoolFilesRef = useRef<{ name: string; data: ArrayBuffer }[]>([]);
  const zipBlobRef = useRef<Blob | null>(null);

  const filteredEvents = events.filter((e) => e.date === selectedDate);

  const toggleEvent = (id: string) => {
    setSelectedEventIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < numEvents ? [...prev, id] : prev;
      // Remove file for deselected events
      if (prev.includes(id)) {
        setEventFiles((files) => {
          const copy = { ...files };
          delete copy[id];
          return copy;
        });
      }
      return next;
    });
  };

  const handleFileChange = (eventId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setEventFiles((prev) => ({ ...prev, [eventId]: f }));
  };

  const removeFile = (eventId: string) => {
    setEventFiles((prev) => {
      const copy = { ...prev };
      delete copy[eventId];
      return copy;
    });
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

  const allFilesUploaded = selectedEventIds.length > 0 && selectedEventIds.every((id) => eventFiles[id]);

  const processFiles = useCallback(async () => {
    if (!allFilesUploaded) {
      toast.error("Please upload files for all selected events");
      return;
    }

    setProcessing(true);
    try {
      const selectedEvents = events.filter((e) => selectedEventIds.includes(e.id));
      const deptData: Record<string, { course: string; studentId: string; eventName: string; eventTiming: string }[]> = {};
      let totalRows = 0;

      for (const event of selectedEvents) {
        const file = eventFiles[event.id];
        if (!file) continue;

        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        totalRows += rows.length;

        const timing = `${event.time_from} - ${event.time_to}`;

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

          if (dept) {
            if (!deptData[dept.school]) deptData[dept.school] = [];
            deptData[dept.school].push({ course: dept.course, studentId, eventName: event.name, eventTiming: timing });
          } else {
            const key = "Other";
            if (!deptData[key]) deptData[key] = [];
            deptData[key].push({ course: courseStr || "Unknown", studentId, eventName: event.name, eventTiming: timing });
          }
        }
      }

      if (Object.keys(deptData).length === 0) {
        toast.error("No matching department data found");
        setProcessing(false);
        return;
      }

      const zip = new JSZip();
      const dateStr = selectedDate.replace(/-/g, "_");
      const schoolFiles: { name: string; data: ArrayBuffer }[] = [];

      for (const [school, students] of Object.entries(deptData)) {
        const wb = XLSX.utils.book_new();
        const byCourse: Record<string, typeof students> = {};
        students.forEach((s) => {
          if (!byCourse[s.course]) byCourse[s.course] = [];
          byCourse[s.course].push(s);
        });

        // Build horizontal layout: courses side by side, 4 columns per course (3 data + 1 gap)
        const courses = Object.entries(byCourse);
        const colsPerCourse = 4; // ID, Event, Time, gap
        const maxRows = Math.max(...courses.map(([, s]) => s.length));

        // Row 0: School header
        const headerRow: string[] = [`School: ${school}`, `Date: ${selectedDate}`];
        // Row 1: blank
        // Row 2: course names
        const courseNameRow: string[] = [];
        // Row 3: column headers
        const colHeaderRow: string[] = [];

        courses.forEach(([course], idx) => {
          const startCol = idx * colsPerCourse;
          courseNameRow[startCol] = `Course: ${course}`;
          colHeaderRow[startCol] = "Student ID";
          colHeaderRow[startCol + 1] = "Event Name";
          colHeaderRow[startCol + 2] = "Event Timing";
        });

        const wsData: string[][] = [headerRow, [], courseNameRow, colHeaderRow];

        for (let r = 0; r < maxRows; r++) {
          const row: string[] = [];
          courses.forEach(([, courseStudents], idx) => {
            const startCol = idx * colsPerCourse;
            const s = courseStudents[r];
            row[startCol] = s ? s.studentId : "";
            row[startCol + 1] = s ? s.eventName : "";
            row[startCol + 2] = s ? s.eventTiming : "";
          });
          wsData.push(row);
        }

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        // Set column widths
        const colWidths: { wch: number }[] = [];
        courses.forEach((_, idx) => {
          colWidths[idx * colsPerCourse] = { wch: 20 };
          colWidths[idx * colsPerCourse + 1] = { wch: 25 };
          colWidths[idx * colsPerCourse + 2] = { wch: 18 };
          colWidths[idx * colsPerCourse + 3] = { wch: 3 };
        });
        ws["!cols"] = colWidths;
        XLSX.utils.book_append_sheet(wb, ws, "All Courses");

        const fileName = `${school.replace(/\s+/g, "_")}_${dateStr}.xlsx`;
        const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        zip.file(fileName, wbOut);
        schoolFiles.push({ name: fileName, data: wbOut });
      }

      // Store for individual download
      schoolFilesRef.current = schoolFiles;

      const blob = await zip.generateAsync({ type: "blob" });
      zipBlobRef.current = blob;
      setShowDownloads(true);

      addAdminLog("Spreadsheet Segregated", `Processed ${totalRows} rows into ${Object.keys(deptData).length} department files`);
      toast.success(`Generated ${Object.keys(deptData).length} department files!`);
    } catch (err) {
      console.error(err);
      toast.error("Error processing files. Please check the format.");
    }
    setProcessing(false);
  }, [eventFiles, selectedEventIds, selectedDate, events, allFilesUploaded]);

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
              setEventFiles({});
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
                setEventFiles({});
              }}
            />
          </div>
        )}

        {/* Step 3: Select Events with per-event file upload */}
        {selectedDate && filteredEvents.length > 0 && (
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-display font-semibold text-card-foreground mb-4">
              3. Select Events & Upload Sheets ({selectedEventIds.length}/{numEvents})
            </h3>
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const isSelected = selectedEventIds.includes(event.id);
                const file = eventFiles[event.id];
                return (
                  <div key={event.id} className="rounded-lg border p-3 space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleEvent(event.id)}
                        disabled={!isSelected && selectedEventIds.length >= numEvents}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-card-foreground">{event.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.venue} • {event.time_from} - {event.time_to}
                        </p>
                      </div>
                    </label>

                    {isSelected && (
                      <div className="ml-7">
                        {file ? (
                          <div className="flex items-center justify-between p-2 rounded-lg border bg-muted">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-medium text-foreground truncate max-w-[200px]">{file.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(event.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Label className="flex items-center gap-2 border border-dashed rounded-lg p-2 cursor-pointer hover:border-primary transition-colors">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Upload .xlsx / .xls</span>
                            <Input
                              type="file"
                              accept=".xlsx,.xls,.csv"
                              className="hidden"
                              onChange={(e) => handleFileChange(event.id, e)}
                            />
                          </Label>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedDate && filteredEvents.length === 0 && (
          <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground">
            No events registered for this date. Please register events first.
          </div>
        )}

        {/* Process Button */}
        {allFilesUploaded && !showDownloads && (
          <Button className="w-full" size="lg" onClick={processFiles} disabled={processing}>
            <Download className="h-4 w-4 mr-2" />
            {processing ? "Processing..." : "Segregate & Process"}
          </Button>
        )}

        {/* Download Options */}
        {showDownloads && (
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h3 className="font-display font-semibold text-card-foreground">Download Options</h3>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (zipBlobRef.current) saveAs(zipBlobRef.current, `Segregated_Sheets_${selectedDate.replace(/-/g, "_")}.zip`);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download All as ZIP
            </Button>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Or download individual school files:</p>
              {schoolFilesRef.current.map((f) => (
                <Button
                  key={f.name}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const blob = new Blob([f.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                    saveAs(blob, f.name);
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {f.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmailSegregator;
