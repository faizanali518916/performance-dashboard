import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

export enum GoalStatus {
  BACKLOG = "BACKLOG",
  IN_PROGRESS = "IN_PROGRESS",
  BLOCKED = "BLOCKED",
  UNDER_REVIEW = "UNDER_REVIEW",
  FINISHED = "FINISHED",
}

@Entity("goals")
@Index(["userId", "deadline"])
export class Goal {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "uuid" }) userId!: string;
  @ManyToOne(() => User, (user) => user.goals, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: Relation<User>;
  @Column({ type: "text" }) description!: string;
  @Column({ type: "timestamptz" }) deadline!: Date;
  @Column({ type: "enum", enum: GoalStatus, default: GoalStatus.BACKLOG }) status!: GoalStatus;
  @Column({ type: "text", default: "" }) remarks!: string;
  @CreateDateColumn({ type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt!: Date;
}
