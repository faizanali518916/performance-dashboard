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
import { User } from "./User";
import { RoleKpiAssignment } from "./RoleKpiAssignment";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 120, unique: true }) title!: string;
  @Column({ type: "uuid", nullable: true }) nextRoleId!: string | null;
  @ManyToOne(() => Role, (role) => role.previousRoles, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "nextRoleId" })
  nextRole!: Relation<Role> | null;
  @OneToMany(() => Role, (role) => role.nextRole) previousRoles!: Relation<Role[]>;
  @CreateDateColumn({ type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt!: Date;
  @OneToMany(() => User, (user) => user.role) users!: Relation<User[]>;
  @OneToMany(() => RoleKpiAssignment, (assignment) => assignment.role)
  kpiAssignments!: Relation<RoleKpiAssignment[]>;
}
