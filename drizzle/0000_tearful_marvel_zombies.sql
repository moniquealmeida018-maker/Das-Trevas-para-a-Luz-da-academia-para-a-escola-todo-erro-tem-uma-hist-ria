CREATE TABLE `answers` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`question_index` integer NOT NULL,
	`question` text NOT NULL,
	`selected_answer` text NOT NULL,
	`correct_answer` text NOT NULL,
	`is_correct` integer NOT NULL,
	`answered_at` integer NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `answer_attempt_question_idx` ON `answers` (`attempt_id`,`question_index`);--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`grade` text NOT NULL,
	`game` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`total_questions` integer NOT NULL,
	`correct_answers` integer DEFAULT 0 NOT NULL,
	`wrong_answers` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'started' NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attempt_student_game_number_idx` ON `attempts` (`student_id`,`game`,`attempt_number`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`class_name` text NOT NULL,
	`grade` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
