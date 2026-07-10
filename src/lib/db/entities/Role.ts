import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import type { User } from "./User";
import type { RoleKpiAssignment } from "./RoleKpiAssignment";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 120, unique: true }) title!: string;
  @CreateDateColumn({ type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt!: Date;
  @OneToMany("User", "role") users!: Relation<User[]>;
  @OneToMany("RoleKpiAssignment", "role") kpiAssignments!: Relation<RoleKpiAssignment[]>;
}
