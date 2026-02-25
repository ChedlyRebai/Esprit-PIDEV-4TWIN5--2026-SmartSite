import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private jwtService: JwtService,
  ) {}

  async validateUser(cin: string, password: string): Promise<any> {
    if (!cin || !password) {
      return null;
    }

    const user = await this.usersService.findByCin(cin);
    if (!user || !user.motDePasse) {
      return null;
    }

    if (await bcrypt.compare(password, user.motDePasse)) {
      const { motDePasse, ...result } = user.toObject ? user.toObject() : user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    console.log("user::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::",user)
    const payload = {
      cin: user.cin,
      sub: user._id,
      roles: user.roles || [],
    };
    return {
      access_token: this.jwtService.sign(payload),
      
        id: user._id,
        cin: user.cin,
        lastname: user.lastname,
        firstname: user.firstname,
        role: user.role,
      
    };
  }

  async register(cin: string, password: string, firstname: string, lastname: string, role: string) {
    const existingUser = await this.usersService.findByCin(cin);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Look up the role by name to get the ObjectId
    let roleId;
    if (role) {
      const roleEntity = await this.rolesService.findByName(role);
      if (roleEntity) {
        roleId = roleEntity._id;
      } else {
        // If role not found, use a default role or throw error
        throw new Error(`Role "${role}" not found`);
      }
    } else {
      throw new Error('Role is required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersService.create({
      cin,
      motDePasse: hashedPassword,
      lastname,
      firstname,
      role: roleId
    });
  }
}
