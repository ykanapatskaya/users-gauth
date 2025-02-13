import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  googleId: string;

  @Column({ nullable: true })
  pictureUrl: string;

  @Column({ default: false })
  @Exclude()
  isBlocked: boolean;

  @Column({ default: 0 })
  @Exclude()
  failedRefreshAttempts: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @UpdateDateColumn({ default: null })
  lastLoginAt: Date;
}
