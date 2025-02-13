import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @CreateDateColumn()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  //@ManyToOne(() => User, user => user.id)
  @Column('uuid')
  userId: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ default: false })
  isRevoked: boolean;

  @CreateDateColumn()
  revokedAt: Date;

  @Column({ default: 0 })
  reusedCount: number;

  @Column({ nullable: true })
  revokedReason: string;
}
