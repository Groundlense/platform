import { OrganizationType } from '@prisma/client';
export declare class CreateOrganizationDto {
    name: string;
    type: OrganizationType;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    gstin?: string;
    pan?: string;
    registeredAddress?: string;
    pincode?: string;
    logoUrl?: string;
    website?: string;
}
