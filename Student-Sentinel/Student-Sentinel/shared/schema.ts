import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Students table
export const students = pgTable("students", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: varchar("student_id", { length: 50 }).notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  photoUrl: text("photo_url"),
});

// Attendance status enum
export const attendanceStatusValues = ["present", "absent", "late", "excused"] as const;
export type AttendanceStatus = typeof attendanceStatusValues[number];

// Class sessions table
export const sessions = pgTable("sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Attendance records table
export const attendanceRecords = pgTable("attendance_records", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  sessionId: integer("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  status: text("status", { enum: attendanceStatusValues }).notNull(),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Relations
export const studentsRelations = relations(students, ({ many }) => ({
  attendanceRecords: many(attendanceRecords),
}));

export const sessionsRelations = relations(sessions, ({ many }) => ({
  attendanceRecords: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  student: one(students, {
    fields: [attendanceRecords.studentId],
    references: [students.id],
  }),
  session: one(sessions, {
    fields: [attendanceRecords.sessionId],
    references: [sessions.id],
  }),
}));

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true });
export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({ id: true, recordedAt: true });

// Extended validation schemas
export const createStudentSchema = insertStudentSchema.extend({
  email: z.string().email("Invalid email address"),
  studentId: z.string().min(1, "Student ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const updateStudentSchema = createStudentSchema.partial();

export const createSessionSchema = insertSessionSchema.extend({
  name: z.string().min(1, "Session name is required"),
  date: z.string().min(1, "Date is required"),
});

export const createAttendanceSchema = insertAttendanceRecordSchema.extend({
  status: z.enum(attendanceStatusValues),
});

// Types
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;

// Extended types with relations
export type AttendanceRecordWithStudent = AttendanceRecord & {
  student: Student;
  session: Session;
};

export type StudentWithStats = Student & {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
};

// Dashboard stats type
export type DashboardStats = {
  totalStudents: number;
  totalSessions: number;
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  overallAttendanceRate: number;
  recentSessions: Session[];
};
