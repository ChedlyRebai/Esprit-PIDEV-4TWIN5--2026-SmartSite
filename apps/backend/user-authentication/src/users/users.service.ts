import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  async create(createUserDto: any) {
    console.log(' DEBUG: createUserDto:', createUserDto);

    // Gérer le rôle correctement
    if (createUserDto.role) {
      if (typeof createUserDto.role === 'string') {
        // Si c'est une chaîne, chercher l'ObjectId correspondant
        const roleMap: { [key: string]: Types.ObjectId } = {
          'super_admin': new Types.ObjectId('699e1c79ccc723bcf4a61cad'),
          'director': new Types.ObjectId('699e1c79ccc723bcf4a61cae'),
          'project_manager': new Types.ObjectId('699e1c79ccc723bcf4a61caf'),
          'site_manager': new Types.ObjectId('699e1c79ccc723bcf4a61cb0'),
          'works_manager': new Types.ObjectId('699e1c79ccc723bcf4a61cb1'),
          'accountant': new Types.ObjectId('699e1c79ccc723bcf4a61cb2'),
          'procurement_manager': new Types.ObjectId('699e1c79ccc723bcf4a61cb3'),
          'qhse_manager': new Types.ObjectId('699e1c79ccc723bcf4a61cb4'),
          'client': new Types.ObjectId('699e1c79ccc723bcf4a61cb5'),
          'subcontractor': new Types.ObjectId('699e1c79ccc723bcf4a61cb6'),
          'user': new Types.ObjectId('699e1c79ccc723bcf4a61cb7'),
        };

        createUserDto.role = roleMap[createUserDto.role] || createUserDto.role;
        console.log(' DEBUG: Role mappé (chaîne -> ObjectId):', createUserDto.role, '->', roleMap[createUserDto.role]);
      } else if (createUserDto.role instanceof Types.ObjectId) {
        // Si c'est déjà un ObjectId, le garder tel quel
        console.log(' DEBUG: Role déjà ObjectId:', createUserDto.role);
      }
    }

    try {
      const createdUser = new this.userModel(createUserDto);
      console.log(' DEBUG: createdUser avant save:', createdUser);

      const result = await createdUser.save();
      console.log(' DEBUG: Utilisateur créé:', result);
      console.log(' DEBUG: Utilisateur sauvegardé avec ID:', result._id);
      return result;
    } catch (error: any) {
      console.error('❌ ERREUR SAVE:', error.message);
      console.error('❌ ERREUR DETAILS:', error);
      throw error;
    }
  }

  async mypermission(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'role',
        populate: {
          path: 'permissions',
          match: { access: true },
        },
      })
      .sort({ name: 1 })
      .exec();

    if (!user) {
      return { error: 'User not found' };
    }

    if (!user.role) {
      return { error: 'Role not found' };
    }

    const role = user.role as any;
    return { permissions: role.permissions || [] };
  }

  async findByCin(cin: string) {
    console.log('🔍 DEBUG: findByCin appelé pour:', cin);
    try {
      const result = await this.userModel.findOne({ cin }).populate('role').exec();
      console.log('🔍 DEBUG: findByCin résultat:', result ? 'trouvé' : 'non trouvé');
      if (result) {
        console.log('🔍 DEBUG: Utilisateur trouvé:', {
          cin: result.cin,
          role: result.role,
          roleType: typeof result.role,
          roleName: (result.role as any)?.name
        });
      }
      return result;
    } catch (error) {
      console.error('❌ Erreur dans findByCin:', error);
      throw error;
    }
  }

  async findById(id: string) {
    return this.userModel.findById(id).populate('role').exec();
  }

  async findAll() {
    console.log('🔍 DEBUG: findAll appelé');
    try {
      const result = await this.userModel.find().populate('role').exec();
      console.log('🔍 DEBUG: findAll résultat:', result.length, 'utilisateurs');
      if (result.length > 0) {
        console.log('🔍 DEBUG: Premier utilisateur:', {
          cin: result[0].cin,
          role: result[0].role,
          roleType: typeof result[0].role,
          roleName: (result[0].role as any)?.name
        });
      }
      return result;
    } catch (error) {
      console.error('❌ Erreur dans findAll:', error);
      throw error;
    }
  }

  async findPending() {
    console.log('🔍 DEBUG: findPending appelé');
    const result = await this.userModel.find({ status: 'pending' }).populate({
      path: 'role',
      model: 'Role',
      select: 'name description'
    }).exec();
    console.log('🔍 DEBUG: findPending résultat:', result.length, 'utilisateurs');
    if (result.length > 0) {
      console.log('🔍 DEBUG: Premier utilisateur:', {
        cin: result[0].cin,
        role: result[0].role,
        roleType: typeof result[0].role,
        roleName: (result[0].role as any)?.name
      });
    }
    return result;
  }

  async update(id: string, updateUserDto: any) {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async handleBan(id: string) {
    const bannedUser = await this.userModel.findById(id).exec();
    if (!bannedUser) {
      throw new NotFoundException(`Usser with id ${id} not exist`);
    }
    bannedUser.estActif = !bannedUser.estActif;

    const user = await bannedUser.save();

    return user;
  }
}

