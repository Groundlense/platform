import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserStatus } from '@prisma/client';
export declare class UsersService {
    private readonly db;
    constructor(db: DatabaseService);
    private isSuperAdmin;
    private assertSameOrganization;
    findByIdentifier(identifier: string): Promise<any>;
    findAll(actor: any): Promise<any>;
    createUser(dto: CreateUserDto, actor: any): Promise<{
        user: any;
        oneTimePassword: string;
    }>;
    updateStatus(userId: string, status: UserStatus, actor: any): Promise<any>;
    findOne(userId: string, actor: any): Promise<any>;
    resetPin(userId: string, pin: string, actor: any): Promise<any>;
    updateProfile(userId: string, dto: UpdateProfileDto, actor: any): Promise<any>;
}
