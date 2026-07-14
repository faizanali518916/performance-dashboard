import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { Department } from "./Department";

@Entity("sops")
@Unique(["departmentId", "name"])
export class Sop {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 160 }) name!: string;
  @Column({ type: "text" }) description!: string;
  @Column({ type: "uuid" }) departmentId!: string;
  @ManyToOne(() => Department, (department) => department.sops, { onDelete: "CASCADE" })
  @JoinColumn({ name: "departmentId" })
  department!: Relation<Department>;
  @CreateDateColumn({ type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt!: Date;
}
