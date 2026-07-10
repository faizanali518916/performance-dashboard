import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("auth_rate_limits")
export class AuthRateLimit {
  @PrimaryColumn({ type: "varchar", length: 320 }) key!: string;
  @Column({ type: "integer", default: 0 }) attempts!: number;
  @Column({ type: "timestamptz" }) windowStartedAt!: Date;
  @Column({ type: "timestamptz", nullable: true }) blockedUntil!: Date | null;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt!: Date;
}
