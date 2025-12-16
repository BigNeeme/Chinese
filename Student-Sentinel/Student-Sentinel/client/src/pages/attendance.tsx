import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, X, Clock, FileText, ChevronDown, Users, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Student, Session, AttendanceStatus } from "@shared/schema";

const sessionFormSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  date: z.date({ required_error: "Date is required" }),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

type AttendanceState = {
  [studentId: number]: {
    status: AttendanceStatus;
    notes: string;
  };
};

const statusConfig: Record<AttendanceStatus, { label: string; color: string; icon: React.ElementType }> = {
  present: { label: "Present", color: "bg-green-500", icon: Check },
  absent: { label: "Absent", color: "bg-red-500", icon: X },
  late: { label: "Late", color: "bg-yellow-500", icon: Clock },
  excused: { label: "Excused", color: "bg-blue-500", icon: FileText },
};

function NewSessionDialog({
  open,
  onOpenChange,
  onSessionCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated: (session: Session) => void;
}) {
  const { toast } = useToast();
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      name: "",
      date: new Date(),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SessionFormValues) => {
      const response = await apiRequest("POST", "/api/sessions", {
        name: data.name,
        date: format(data.date, "yyyy-MM-dd"),
      });
      return response.json();
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Session created successfully" });
      onSessionCreated(session);
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create session", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Lecture, Lab Session..." {...field} data-testid="input-session-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-select-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-session">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-session">
                {createMutation.isPending ? "Creating..." : "Create Session"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function StudentAttendanceRow({
  student,
  attendance,
  onStatusChange,
  onNotesChange,
}: {
  student: Student;
  attendance: { status: AttendanceStatus; notes: string };
  onStatusChange: (status: AttendanceStatus) => void;
  onNotesChange: (notes: string) => void;
}) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  return (
    <Card className="overflow-visible" data-testid={`attendance-row-${student.id}`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={student.photoUrl ? `/objects/${student.photoUrl.replace('/objects/', '')}` : undefined} />
              <AvatarFallback>
                {student.firstName[0]?.toUpperCase()}
                {student.lastName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{student.firstName} {student.lastName}</p>
              <p className="text-sm text-muted-foreground">{student.studentId}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((status) => {
              const config = statusConfig[status];
              const isSelected = attendance.status === status;
              const Icon = config.icon;
              
              return (
                <Button
                  key={status}
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "gap-1.5 min-w-[90px]",
                    isSelected && status === "present" && "bg-green-600 hover:bg-green-700",
                    isSelected && status === "absent" && "bg-red-600 hover:bg-red-700",
                    isSelected && status === "late" && "bg-yellow-600 hover:bg-yellow-700",
                    isSelected && status === "excused" && "bg-blue-600 hover:bg-blue-700"
                  )}
                  onClick={() => onStatusChange(status)}
                  data-testid={`button-status-${status}-${student.id}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>

        <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-3 w-full justify-between"
              data-testid={`button-toggle-notes-${student.id}`}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {attendance.notes ? "Edit Notes" : "Add Notes (Optional)"}
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isNotesOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Textarea
              placeholder="Add notes about this attendance record..."
              value={attendance.notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="min-h-[80px]"
              data-testid={`input-notes-${student.id}`}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export default function AttendancePage() {
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendanceState, setAttendanceState] = useState<AttendanceState>({});
  const { toast } = useToast();

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: sessions } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSession) throw new Error("No session selected");
      
      const records = Object.entries(attendanceState).map(([studentId, data]) => ({
        studentId: parseInt(studentId),
        sessionId: selectedSession.id,
        status: data.status,
        notes: data.notes || null,
      }));

      return apiRequest("POST", "/api/attendance/bulk", { records });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Attendance saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save attendance", description: error.message, variant: "destructive" });
    },
  });

  const handleSessionCreated = (session: Session) => {
    setSelectedSession(session);
    if (students) {
      const initialState: AttendanceState = {};
      students.forEach((student) => {
        initialState[student.id] = { status: "present", notes: "" };
      });
      setAttendanceState(initialState);
    }
  };

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleNotesChange = (studentId: number, notes: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes },
    }));
  };

  const handleMarkAllPresent = () => {
    if (!students) return;
    const newState: AttendanceState = {};
    students.forEach((student) => {
      newState[student.id] = { 
        status: "present", 
        notes: attendanceState[student.id]?.notes ?? "" 
      };
    });
    setAttendanceState(newState);
    toast({ title: "All students marked as present" });
  };

  const todaySessions = sessions?.filter(
    (s) => s.date === format(new Date(), "yyyy-MM-dd")
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Take Attendance</h1>
          <p className="text-muted-foreground">
            {selectedSession 
              ? `Recording for: ${selectedSession.name} (${format(new Date(selectedSession.date), "MMM d, yyyy")})`
              : "Create or select a session to start"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedSession && (
            <Button variant="outline" onClick={handleMarkAllPresent} data-testid="button-mark-all-present">
              <Check className="mr-2 h-4 w-4" />
              Mark All Present
            </Button>
          )}
          <Button onClick={() => setIsNewSessionOpen(true)} data-testid="button-new-session">
            <CalendarIcon className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </div>
      </div>

      {!selectedSession && todaySessions && todaySessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaySessions.map((session) => (
              <Button
                key={session.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleSessionCreated(session)}
                data-testid={`button-select-session-${session.id}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {session.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {!selectedSession && (!todaySessions || todaySessions.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarIcon className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No session selected</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground max-w-md">
              Create a new session to start taking attendance. Each session represents a class meeting or lecture.
            </p>
            <Button className="mt-4" onClick={() => setIsNewSessionOpen(true)} data-testid="button-create-first-session">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Create New Session
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedSession && (
        <>
          {studentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !students || students.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No students found</h3>
                <p className="mt-1 text-sm text-muted-foreground">Add students first to take attendance</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" size="sm">
                  {students.length} student{students.length !== 1 ? "s" : ""}
                </Badge>
                <div className="flex gap-2">
                  {Object.keys(attendanceState).length > 0 && (
                    <Badge variant="outline" size="sm">
                      {Object.values(attendanceState).filter((a) => a.status === "present").length} Present
                    </Badge>
                  )}
                </div>
              </div>

              {students.map((student) => (
                <StudentAttendanceRow
                  key={student.id}
                  student={student}
                  attendance={attendanceState[student.id] ?? { status: "present", notes: "" }}
                  onStatusChange={(status) => handleStatusChange(student.id, status)}
                  onNotesChange={(notes) => handleNotesChange(student.id, notes)}
                />
              ))}

              <div className="sticky bottom-4 flex justify-end">
                <Button 
                  size="lg" 
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || Object.keys(attendanceState).length === 0}
                  className="shadow-lg"
                  data-testid="button-save-attendance"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <NewSessionDialog
        open={isNewSessionOpen}
        onOpenChange={setIsNewSessionOpen}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  );
}
