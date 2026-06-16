// ==========================================
// TYPES — Mirrors Prisma schema
// ==========================================

// Enums
export type OrganizationType = 'EPC_CONTRACTOR' | 'GEOTECH_CONTRACTOR' | 'SYSTEM_OWNER' | 'CLIENT' | 'NABL_LAB' | 'IE_FIRM' | 'STRUCTURAL_CONSULTANT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type BoreholeStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
export type BoringMethod = 'WASH_BORING' | 'ROTARY_DRILLING' | 'PERCUSSION_DRILLING' | 'AUGER_BORING';
export type SampleType = 'DISTURBED' | 'UNDISTURBED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type ScopeType = 'SYSTEM' | 'ORGANIZATION' | 'PROJECT';
export type ProjectCompanyRole = 'INITIATOR' | 'CONTRACTOR' | 'SUBCONTRACTOR' | 'CONSULTANT';

// Core Identity
export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  pan?: string;
  registeredAddress?: string;
  pincode?: string;
  logoUrl?: string;
  website?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  organization?: Organization;
  employeeCode?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  status: UserStatus;
  userType?: string;
  designation?: string;
  profilePhotoUrl?: string;
  preferredLanguage?: string;
  lastLoginAt?: string;
  createdAt: string;
}

// RBAC
export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  scope: ScopeType;
  isSystemRole: boolean;
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description?: string;
}

// Project
export interface Project {
  id: string;
  projectCode: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  epcOrganizationId: string;
  geotechOrganizationId: string;
  createdByUserId: string;
  startDate?: string;
  endDate?: string;
  projectType?: string;
  state?: string;
  district?: string;
  chainageFrom?: number;
  chainageTo?: number;
  totalBoringsPlanned?: number;
  targetCompletionDate?: string;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
  epcOrganization?: Organization;
  geotechOrganization?: Organization;
  boreholes?: Borehole[];
}

export interface Team {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  projectId?: string;
  teamPrefix?: string;
  supervisorUserId?: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

// Field Data
export interface Borehole {
  id: string;
  projectId: string;
  siteId?: string;
  boreholeCode: string;
  name?: string;
  teamId?: string;
  latitude?: number;
  longitude?: number;
  groundLevelRL?: number;
  plannedDepth?: number;
  finalDepth?: number;
  status: BoreholeStatus;
  startedAt?: string;
  completedAt?: string;
  createdByUserId: string;
  assignedWorkerId?: string;
  method?: BoringMethod;
  rigType?: string;
  startDepth?: number;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
  intervals?: BoreholeInterval[];
  team?: Team;
  assignedWorker?: User;
}

export interface BoreholeInterval {
  id: string;
  boreholeId: string;
  intervalNo: number;
  fromDepth: number;
  toDepth: number;
  soilDescription?: string;
  nValue?: number;
  remarks?: string;
  isCompleted: boolean;
  blow1?: number;
  blow2?: number;
  blow3?: number;
  nCorrected?: number;
  isRefusal: boolean;
  penetrationMm?: number;
  dilatancyApplied: boolean;
  gpsLat?: number;
  gpsLng?: number;
  observedAt?: string;
  prevHash?: string;
  sha256Hash?: string;
  samples?: Sample[];
  soilDescriptions?: SoilDescriptionRecord;
}

export interface SoilDescriptionRecord {
  id: string;
  sptRecordId: string;
  soilType: string;
  uscsCode?: string;
  color?: string;
  consistency?: string;
  description: string;
  remarks?: string;
  enteredByUserId: string;
}

export interface Sample {
  id: string;
  intervalId: string;
  sampleNumber: string;
  sampleType: SampleType;
  sampleDepth: number;
  remarks?: string;
  depthFrom?: number;
  depthTo?: number;
  collectedByUserId?: string;
  collectedAt?: string;
  sampleCondition?: string;
  dispatchedToLabId?: string;
  dispatchDate?: string;
  assignedLabId?: string;
  status?: string;
  labResult?: LabResult;
}

export interface LabResult {
  id: string;
  sampleId: string;
  nablLabId: string;
  testType: string;
  testValues: Record<string, unknown>;
  resultValues: Record<string, unknown>;
  reportNumber: string;
  reportPdfUrl: string;
  testedOn: string;
  sha256Hash?: string;
}

export interface NablLab {
  id: string;
  companyId: string;
  nablCertNumber: string;
  labName: string;
  accreditedTests: unknown;
  certValidFrom: string;
  certValidUntil: string;
  isVerified: boolean;
}

export interface ProjectSite {
  id: string;
  projectId: string;
  code: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface WaterTableObservation {
  id: string;
  boreholeId: string;
  depth: number;
  observedAt: string;
  remarks?: string;
  readingType?: string;
  sha256Hash?: string;
}

export interface BoringSession {
  id: string;
  boreholeId: string;
  workerId: string;
  startDepth: number;
  endDepth: number;
  status: string;
  terminationReason?: string;
  startedAt: string;
  endedAt?: string;
  worker?: User;
}

export interface Payment {
  id: string;
  projectId: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway?: string;
  transactionId?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  organizationId?: string;
  entityType: string;
  entityId: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  user?: User;
}

// Dashboard
export interface DashboardSummary {
  activeProjects: number;
  totalBorings: number;
  completedBorings: number;
  activeBorings: number;
  pendingBorings: number;
  reportsGenerated: number;
}

// Auth
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthUser extends User {
  permissions: string[];
  roles: Role[];
}
