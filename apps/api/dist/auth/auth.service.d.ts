import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly db;
    private readonly activityLogsService;
    constructor(usersService: UsersService, jwtService: JwtService, db: DatabaseService, activityLogsService: ActivityLogsService);
    private hashToken;
    private generateRefreshToken;
    private issueTokens;
    login(identifier: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<{
        success: boolean;
    }>;
}
