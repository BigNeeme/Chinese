import { 
  students, 
  sessions, 
  attendanceRecords,
  type Student, 
  type InsertStudent,
  type Session,
  type InsertSession,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type AttendanceRecordWithStudent,
  type StudentWithStats,
  type DashboardStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;

  // Sessions
  getSessions(): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;

  // Attendance
  getAttendanceRecords(): Promise<AttendanceRecordWithStudent[]>;
  getAttendanceBySession(sessionId: number): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  createBulkAttendance(records: InsertAttendanceRecord[]): Promise<AttendanceRecord[]>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
}

export class DatabaseStorage implements IStorage {
  // Students
  async getStudents(): Promise<Student[]> {
    return db.select().from(students).orderBy(students.lastName, students.firstName);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updated] = await db
      .update(students)
      .set(student)
      .where(eq(students.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    return result.length > 0;
  }

  // Sessions
  async getSessions(): Promise<Session[]> {
    return db.select().from(sessions).orderBy(desc(sessions.date));
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }

  // Attendance
  async getAttendanceRecords(): Promise<AttendanceRecordWithStudent[]> {
    const records = await db
      .select({
        id: attendanceRecords.id,
        studentId: attendanceRecords.studentId,
        sessionId: attendanceRecords.sessionId,
        status: attendanceRecords.status,
        notes: attendanceRecords.notes,
        recordedAt: attendanceRecords.recordedAt,
        student: students,
        session: sessions,
      })
      .from(attendanceRecords)
      .innerJoin(students, eq(attendanceRecords.studentId, students.id))
      .innerJoin(sessions, eq(attendanceRecords.sessionId, sessions.id))
      .orderBy(desc(sessions.date), students.lastName);

    return records;
  }

  async getAttendanceBySession(sessionId: number): Promise<AttendanceRecord[]> {
    return db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, sessionId));
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [newRecord] = await db.insert(attendanceRecords).values(record).returning();
    return newRecord;
  }

  async createBulkAttendance(records: InsertAttendanceRecord[]): Promise<AttendanceRecord[]> {
    if (records.length === 0) return [];
    
    // Delete existing records for this session
    const sessionId = records[0].sessionId;
    await db.delete(attendanceRecords).where(eq(attendanceRecords.sessionId, sessionId));
    
    // Insert new records
    const newRecords = await db.insert(attendanceRecords).values(records).returning();
    return newRecords;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const [studentsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students);

    const [sessionsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions);

    const today = new Date().toISOString().split('T')[0];
    
    const todayRecords = await db
      .select({
        status: attendanceRecords.status,
        count: sql<number>`count(*)::int`,
      })
      .from(attendanceRecords)
      .innerJoin(sessions, eq(attendanceRecords.sessionId, sessions.id))
      .where(eq(sessions.date, today))
      .groupBy(attendanceRecords.status);

    const todayAttendance = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    todayRecords.forEach((record) => {
      if (record.status in todayAttendance) {
        todayAttendance[record.status as keyof typeof todayAttendance] = record.count;
      }
    });

    const [totalAttendance] = await db
      .select({
        total: sql<number>`count(*)::int`,
        present: sql<number>`sum(case when status = 'present' then 1 else 0 end)::int`,
      })
      .from(attendanceRecords);

    const overallRate = totalAttendance.total > 0 
      ? Math.round(((totalAttendance.present || 0) / totalAttendance.total) * 100)
      : 0;

    const recentSessions = await db
      .select()
      .from(sessions)
      .orderBy(desc(sessions.date))
      .limit(5);

    return {
      totalStudents: studentsCount.count,
      totalSessions: sessionsCount.count,
      todayAttendance,
      overallAttendanceRate: overallRate,
      recentSessions,
    };
  }
}

export const storage = new DatabaseStorage();
