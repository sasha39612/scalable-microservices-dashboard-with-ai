import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";
import { Exclude } from "class-transformer";
import { BaseEntity } from "./base.entity";

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ unique: true })
  email!: string;

  @Exclude()
  @Column()
  passwordHash!: string;
}
