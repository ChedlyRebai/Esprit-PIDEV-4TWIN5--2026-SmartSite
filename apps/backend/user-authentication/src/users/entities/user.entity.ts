import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../../roles/entities/role.entity';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, trim: true })
  cin: string;

  @Prop({ required: false })
  password: string;

  @Prop()
  profilePicture?: string;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  role: Types.ObjectId;

  @Prop()
  email: string;

  @Prop()
  connected: boolean;

  @Prop()
  preferredLanguage?: string;

  @Prop()
  projectsCount?: number;

  @Prop()
  address: string;

  @Prop({ default: true })
  isActif: boolean;

  @Prop()
  phoneNumber?: string;

  @Prop()
  departement?: string;

  @Prop()
  status?: string;

  @Prop()
  approvedBy?: string;

  @Prop()
  approvedAt?: Date;

  @Prop()
  rejectedAt?: Date;

  @Prop()
  rejectReason?: string;

  @Prop()
  motDePasse?: string;

  @Prop([String])
  certifications?: string[];

  @Prop()
  companyName?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVerificationOtp?: string;

  @Prop()
  otpExpiresAt?: Date;

  @Prop({ default: false })
  passwordChnage: boolean;

  @Prop({ default: true })
  firstLogin: boolean;

  @Prop()
  passwordResetCode?: string;

  @Prop()
  passwordResetCodeExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  // Inscription en attente d'approbation : pas de mot de passe encore
  if (this.password == null || this.password === '') {
    return;
  }

  if (this.password.startsWith('$2')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
