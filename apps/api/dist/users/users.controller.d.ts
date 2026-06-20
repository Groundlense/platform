import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ResetPinDto } from './dto/reset-pin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(user: any): Promise<any>;
    createUser(dto: CreateUserDto, user: any): Promise<{
        user: any;
        oneTimePassword: string;
    }>;
    updateStatus(userId: string, dto: UpdateUserStatusDto, user: any): Promise<any>;
    findOne(userId: string, user: any): Promise<any>;
    resetPin(userId: string, dto: ResetPinDto, user: any): Promise<any>;
    updateProfile(userId: string, dto: UpdateProfileDto, user: any): Promise<any>;
}
