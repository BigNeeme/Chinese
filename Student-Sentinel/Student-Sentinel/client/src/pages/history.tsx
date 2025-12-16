import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, Search, Filter, Check, X, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { AttendanceRecordWithStudent, AttendanceStatus, Session } from "@shared/schema";

const statusConfig: Record<AttendanceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  present: { label: "Present", variant: "default", icon: Check },
  absent: { label: "Absent", variant: "destructive", icon: X },
  late: { label: "Late", variant: "secondary", icon: Clock },
  excused: { label: "Excused", variant: "outline", icon: FileText },
};

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(
        "gap-1",
        status === "present" && "bg-green-600",
        status === "late" && "bg-yellow-600",
        status === "excused" && "bg-blue-600 text-blue-50"
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const { toast } = useToast();

  const { data: records, isLoading: recordsLoading } = useQuery<AttendanceRecordWithStudent[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: sessions } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const filteredRecords = records?.filter((record) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      record.student.firstName.toLowerCase().includes(query) ||
      record.student.lastName.toLowerCase().includes(query) ||
      record.student.studentId.toLowerCase().includes(query);
    
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesSession = sessionFilter === "all" || record.sessionId.toString() === sessionFilter;
    
    let matchesDate = true;
    if (dateRange.from) {
      const recordDate = new Date(record.session.date);
      matchesDate = recordDate >= dateRange.from;
      if (dateRange.to) {
        matchesDate = matchesDate && recordDate <= dateRange.to;
      }
    }

    return matchesSearch && matchesStatus && matchesSession && matchesDate;
  });

  const handleExport = () => {
    if (!filteredRecords || filteredRecords.length === 0) {
      toast({ title: "No records to export", variant: "destructive" });
      return;
    }

    const headers = ["Date", "Session", "Student ID", "First Name", "Last Name", "Status", "Notes"];
    const rows = filteredRecords.map((record) => [
      format(new Date(record.session.date), "yyyy-MM-dd"),
      record.session.name,
      record.student.studentId,
      record.student.firstName,
      record.student.lastName,
      record.status,
      record.notes ?? "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast({ title: "Export completed", description: `Exported ${filteredRecords.length} records` });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSessionFilter("all");
    setDateRange({});
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || sessionFilter !== "all" || dateRange.from;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Attendance History</h1>
          <p className="text-muted-foreground">View and export attendance records</p>
        </div>
        <Button onClick={handleExport} variant="outline" data-testid="button-export">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-history"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sessionFilter} onValueChange={setSessionFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-session-filter">
                  <SelectValue placeholder="Session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions?.map((session) => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2" data-testid="button-date-filter">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      "Date Range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters} data-testid="button-clear-filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : !records || records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No attendance records yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Start taking attendance to see records here</p>
            </div>
          ) : filteredRecords?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Filter className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No matching records</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters} data-testid="button-clear-all-filters">
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Badge variant="secondary" size="sm">
                  {filteredRecords?.length} record{filteredRecords?.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Student</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords?.map((record) => (
                      <TableRow key={record.id} data-testid={`record-row-${record.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={record.student.photoUrl ? `/objects/${record.student.photoUrl.replace('/objects/', '')}` : undefined} />
                              <AvatarFallback className="text-xs">
                                {record.student.firstName[0]?.toUpperCase()}
                                {record.student.lastName[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {record.student.firstName} {record.student.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{record.student.studentId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{record.session.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(record.session.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={record.status as AttendanceStatus} />
                        </TableCell>
                        <TableCell>
                          {record.notes ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm text-muted-foreground cursor-help truncate max-w-[200px] block">
                                  {record.notes}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{record.notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
