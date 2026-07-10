import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from "typeorm";

export enum AuthTokenPurpose {
  VERIFY_EMAIL = "VERIFY_EMAIL",
  RESET_PASSWORD = "RESET_PASSWORD",
}

@Entity("auth_tokens")
@Unique(["userId", "purpose"])
export class AuthToken {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "uuid" }) userId!: string;
  @Index({ unique: true }) @Column({ type: "char", length: 64 }) tokenHash!: string;
  @Column({ type: "enum", enum: AuthTokenPurpose }) purpose!: AuthTokenPurpose;
  @Column({ type: "timestamptz" }) expiresAt!: Date;
  @CreateDateColumn({ type: "timestamptz" }) createdAt!: Date;
}
