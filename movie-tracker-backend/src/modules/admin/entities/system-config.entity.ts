// src/modules/admin/entities/system-config.entity.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum ConfigCategory {
  GENERAL = 'GENERAL',
  CONTENT = 'CONTENT',
  USERS = 'USERS',
  SOCIAL = 'SOCIAL',
  EMAIL = 'EMAIL',
  SECURITY = 'SECURITY',
  MODERATION = 'MODERATION',
  ANALYTICS = 'ANALYTICS',
  PERFORMANCE = 'PERFORMANCE'
}

registerEnumType(ConfigCategory, {
  name: '_config_category',
  description: 'Configuration categories',
});

export enum ConfigDataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  EMAIL = 'email',
  URL = 'url',
  INTEGER = 'integer'
}

registerEnumType(ConfigDataType, {
  name: '_config_data_type',
  description: 'Configuration data types',
});

@ObjectType()
@Entity('system_configs')
export class SystemConfig {
  @Field(() => ID)
  @PrimaryColumn()
  key: string;

  @Field()
  @Column({ type: 'text' })
  value: string;

  @Field(() => ConfigCategory)
  @Column({ 
    type: 'varchar',
    default: ConfigCategory.GENERAL,
    name: 'category' 
  }) 
  category: ConfigCategory;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false , name: 'is_encrypted' }) isEncrypted: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false , name: 'is_system' }) isSystem: boolean;

  @Field(() => ConfigDataType, { nullable: true })
  @Column({ nullable: true })
  dataType?: ConfigDataType;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}