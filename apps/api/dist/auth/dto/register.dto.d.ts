import { OrganizationType } from '@prisma/client';
export declare class RegisterOrganizationDto {
    name: string;
    type: OrganizationType;
    gstin?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
}
export declare class RegisterAdminDto {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    mobile?: string;
}
export declare class RegisterDto {
    organization: RegisterOrganizationDto;
    admin: RegisterAdminDto;
}
