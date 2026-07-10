import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import type { User } from "./User";

@Entity("sessions")
export class Session {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index({ unique: true }) @Column({ type: "char", length: 64 }) tokenHash!: string;
  @Column({ type: "uuid" }) userId!: string;
  @ManyToOne("User", "sessions", { onDelete: "CASCADE" }) @JoinColumn({ name: "userId" }) user!: Relation<User>;
  @Index() @Column({ type: "timestamptz" }) expiresAt!: Date;
  @Column({ type: "varchar", length: 500, nullable: true }) userAgent!: string | null;
  @CreateDateColumn({ type: "timestamptz" }) createdAt!: Date;
}
