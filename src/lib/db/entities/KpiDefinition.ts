import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import type { RoleKpiAssignment } from "./RoleKpiAssignment";
import type { UserKpiPerformance } from "./UserKpiPerformance";

@Entity("kpi_definitions")
export class KpiDefinition {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 160 }) name!: string;
  @Column({ type: "text", nullable: true }) description!: string | null;
  @Column({ type: "varchar", length: 40, nullable: true }) unit!: string | null;
  @CreateDateColumn({ type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt!: Date;
  @OneToMany("RoleKpiAssignment", "kpi") roleAssignments!: Relation<RoleKpiAssignment[]>;
  @OneToMany("UserKpiPerformance", "kpi") performances!: Relation<UserKpiPerformance[]>;
}
