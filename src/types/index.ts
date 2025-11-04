import { Timestamp } from 'firebase/firestore'

export type UserRole = 'employee' | 'manager' | 'admin'
export type EmploymentType = 'flex' | 'contract' | 'full_time'
export type DependentCategory = 'under_103' | 'under_106' | 'under_130' | 'none'
export type JobStatus = 'open' | 'closed' | 'cancelled'
export type ApplicationStatus = 'approved' | 'blocked'
export type WorkStatus = 'not_started' | 'in_progress' | 'completed'
export type PaymentStatus = 'pending' | 'exported'
export type ComplianceResult = 'ok' | 'blocked'

export interface Employee {
  id: string
  uid: string
  name: {
    first: string
    last: string
  }
  email: string
  phone?: string
  role: UserRole
  employmentType: EmploymentType
  department?: string
  siteId?: string
  contractHoursPerWeek?: number
  dependentCategory?: DependentCategory
  baseHourlyWage?: number
  createdAt: Timestamp
}

export interface Site {
  id: string
  name: string
  address: string
  region: string
}

export interface Job {
  id: string
  siteId: string
  managerId: string
  title: string
  taskDescription: string
  date: string // YYYY-MM-DD
  startTime: string
  endTime: string
  plannedMinutes: number
  hourlyWage: number
  requiredHeadcount: number
  currentApprovedCount: number
  applicationDeadline: Timestamp
  status: JobStatus
  checkInQrSecret: string
  checkOutQrSecret: string
  createdAt: Timestamp
}

export interface ComplianceCheck {
  result: ComplianceResult
  messages: string[]
}

export interface Application {
  id: string
  jobId: string
  employeeId: string
  appliedAt: Timestamp
  status: ApplicationStatus
  compliance: ComplianceCheck
}

export interface Work {
  id: string
  jobId: string
  employeeId: string
  checkInAt?: Timestamp
  checkOutAt?: Timestamp
  workedMinutes?: number
  hourlyWage: number
  totalPay?: number
  status: WorkStatus
}

export interface Payment {
  id: string
  workId: string
  employeeId: string
  jobId: string
  amount: number
  period: {
    year: number
    month: number
  }
  status: PaymentStatus
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  createdAt: Timestamp
}

// Request/Response types for Cloud Functions
export interface CreateJobRequest {
  siteId: string
  title: string
  taskDescription: string
  date: string
  startTime: string
  endTime: string
  hourlyWage: number
  requiredHeadcount: number
  applicationDeadlineHours: number
}

export interface ApplyForJobRequest {
  jobId: string
}

export interface CheckInRequest {
  jobId: string
  token: string
}

export interface CheckOutRequest {
  jobId: string
  token: string
}

export interface ExportRequest {
  year: number
  month: number
}

// Regional minimum wage table (static data)
export interface MinimumWageTable {
  [region: string]: number
}

export const MINIMUM_WAGES: MinimumWageTable = {
  tokyo: 1113,
  osaka: 1064,
  kyoto: 1008,
  hokkaido: 960,
  okinawa: 896,
  // Add more regions as needed
}
