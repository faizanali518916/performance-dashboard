import {
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { User } from "./User";
import { Sop } from "./Sop";

@Entity("departments")
export class Department {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 120, unique: true }) name!: string;
  @OneToMany(() => User, (user) => user.department) members!: Relation<User[]>;
  @ManyToMany(() => User, (user) => user.managedDepartments)
  @JoinTable({
    name: "department_managers",
    joinColumn: { name: "departmentId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "managerId", referencedColumnName: "id" },
  })
  managers!: Relation<User[]>;
  @OneToMany(() => Sop, (sop) => sop.department) sops!: Relation<Sop[]>;
  @CreateDateColumn({ type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt!: Date;
}
