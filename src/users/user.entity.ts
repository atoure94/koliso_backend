import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'John' })
  @Column()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Column()
  lastName: string;

  @ApiProperty({ example: '3361234' })
  @Column({ unique: true })
  phone: string;

  @ApiProperty({ example: 'hashedpassword' })
  @Column()
  password: string;

  @ApiProperty({ example: '2024-08-06T12:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;
}
