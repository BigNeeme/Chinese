import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Calendar, ClipboardCheck, TrendingUp, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { DashboardStats } from "@shared/schema";
import { format } from "date-fns";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle,
  loading = false 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  subtitle?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{title}</span>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {value}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AttendanceBreakdown({ stats, loading }: { stats?: DashboardStats; loading: boolean }) {
  const items = [
    { label: "Present", value: stats?.todayAttendance.present ?? 0, color: "bg-green-500" },
    { label: "Absent", value: stats?.todayAttendance.absent ?? 0, color: "bg-red-500" },
    { label: "Late", value: stats?.todayAttendance.late ?? 0, color: "bg-yellow-500" },
    { label: "Excused", value: stats?.todayAttendance.excused ?? 0, color: "bg-blue-500" },
  ];

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="text-lg font-medium">Today's Attendance</CardTitle>
        <Link href="/attendance">
          <Button variant="ghost" size="sm" data-testid="link-take-attendance">
            Take Attendance
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : total === 0 ? (
          <div className="py-8 text-center">
            <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">No attendance recorded today</p>
            <Link href="/attendance">
              <Button className="mt-4" data-testid="button-start-attendance">
                Start Taking Attendance
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              {items.map((item) => (
                item.value > 0 && (
                  <div
                    key={item.label}
                    className={`${item.color} transition-all`}
                    style={{ width: `${(item.value / total) * 100}%` }}
                  />
                )
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {items.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="ml-auto text-sm font-medium" data-testid={`today-${item.label.toLowerCase()}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RecentSessions({ sessions, loading }: { sessions?: DashboardStats['recentSessions']; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="text-lg font-medium">Recent Sessions</CardTitle>
        <Link href="/history">
          <Button variant="ghost" size="sm" data-testid="link-view-history">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">No sessions yet</p>
            <Link href="/attendance">
              <Button className="mt-4" variant="outline" data-testid="button-create-session">
                Create First Session
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 rounded-md p-2 hover-elevate"
                data-testid={`session-${session.id}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(session.date), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge variant="secondary" size="sm">
                  Completed
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your attendance records.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          title="Total Sessions"
          value={stats?.totalSessions ?? 0}
          icon={Calendar}
          loading={isLoading}
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats?.overallAttendanceRate ?? 0}%`}
          icon={TrendingUp}
          subtitle="Overall average"
          loading={isLoading}
        />
        <StatCard
          title="Today's Records"
          value={
            (stats?.todayAttendance.present ?? 0) +
            (stats?.todayAttendance.absent ?? 0) +
            (stats?.todayAttendance.late ?? 0) +
            (stats?.todayAttendance.excused ?? 0)
          }
          icon={ClipboardCheck}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AttendanceBreakdown stats={stats} loading={isLoading} />
        <RecentSessions sessions={stats?.recentSessions} loading={isLoading} />
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-8 sm:flex-row">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-medium">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Start managing attendance now</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 sm:ml-auto">
            <Link href="/students">
              <Button variant="outline" data-testid="button-manage-students">
                <Users className="mr-2 h-4 w-4" />
                Manage Students
              </Button>
            </Link>
            <Link href="/attendance">
              <Button data-testid="button-take-attendance-main">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Take Attendance
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
