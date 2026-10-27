import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  className: text("class_name").notNull(),
  grade: text("grade").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => students.id),
  grade: text("grade").notNull(),
  game: text("game").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull().default(0),
  wrongAnswers: integer("wrong_answers").notNull().default(0),
  status: text("status").notNull().default("started"),
  startedAt: integer("started_at").notNull(),
  completedAt: integer("completed_at"),
}, (table) => [
  uniqueIndex("attempt_student_game_number_idx").on(table.studentId, table.game, table.attemptNumber),
]);

export const answers = sqliteTable("answers", {
  id: text("id").primaryKey(),
  attemptId: text("attempt_id").notNull().references(() => attempts.id),
  questionIndex: integer("question_index").notNull(),
  question: text("question").notNull(),
  selectedAnswer: text("selected_answer").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  answeredAt: integer("answered_at").notNull(),
}, (table) => [
  uniqueIndex("answer_attempt_question_idx").on(table.attemptId, table.questionIndex),
]);
