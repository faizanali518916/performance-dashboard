import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import type { Role } from "./Role";
import type { UserKpiPerformance } from "./UserKpiPerformance";
import type { Journal } from "./Journal";
import type { Session } from "./Session";

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}
export enum AccessLevel {
  EMPLOYEE = "EMPLOYEE",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 120 }) name!: string;
  @Column({ type: "varchar", length: 320, unique: true }) email!: string;
  @Column({ type: "varchar", length: 100, select: false }) password!: string;
  @Column({ type: "boolean", default: false }) emailVerified!: boolean;
  @Column({ type: "uuid", nullable: true }) managerId!: string | null;
  @ManyToOne("User", "directReports", { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "managerId" })
  manager!: Relation<User> | null;
  @OneToMany("User", "manager") directReports!: Relation<User[]>;
  @Column({ type: "uuid" }) roleId!: string;
  @ManyToOne("Role", "users", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "roleId" })
  role!: Relation<Role>;
  @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE }) status!: UserStatus;
  @Column({ type: "enum", enum: AccessLevel, default: AccessLevel.EMPLOYEE }) accessLevel!: AccessLevel;
  @CreateDateColumn({ type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt!: Date;
  @OneToMany("UserKpiPerformance", "user") performances!: Relation<UserKpiPerformance[]>;
  @OneToMany("Journal", "user") journals!: Relation<Journal[]>;
  @OneToMany("Session", "user") sessions!: Relation<Session[]>;
}
