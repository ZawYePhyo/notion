import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import QRCode from 'qrcode'
import {
  addMinutes,
  differenceInMinutes,
  startOfWeek,
  endOfWeek,
  isBefore,
  parseISO,
  differenceInHours
} from 'date-fns'

admin.initializeApp()

const db = admin.firestore()

// Types
interface CreateJobData {
  siteId: string
  title: string
  taskDescription: string
  date: string // YYYY-MM-DD
  startTime: string
  endTime: string
  hourlyWage: number
  requiredHeadcount: number
  applicationDeadlineHours: number
}

interface ApplyForJobData {
  jobId: string
}

interface CheckInData {
  jobId: string
  token: string
}

interface CheckOutData {
  jobId: string
  token: string
}

// Minimum wage table
const MINIMUM_WAGES: { [key: string]: number } = {
  tokyo: 1113,
  osaka: 1064,
  kyoto: 1008,
  hokkaido: 960,
  okinawa: 896,
}

// Helper: Generate random secret for QR codes
function generateSecret(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15)
}

// Helper: Calculate minutes between two time strings
function calculateMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  return endMinutes - startMinutes
}

// Helper: Send notification
async function sendNotification(
  userId: string,
  title: string,
  message: string
): Promise<void> {
  await db.collection('notifications').add({
    userId,
    title,
    message,
    read: false,
    createdAt: Timestamp.now(),
  })

  // TODO: Send email notification via SendGrid
  // For now, just log
  console.log(`Notification sent to ${userId}: ${title}`)
}

// Cloud Function: Create Job
export const createJob = functions.https.onCall(async (data: CreateJobData, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  // Verify user is manager or admin
  const userDoc = await db.collection('employees').doc(context.auth.uid).get()
  const userData = userDoc.data()

  if (!userData || !['manager', 'admin'].includes(userData.role)) {
    throw new functions.https.HttpsError('permission-denied', 'User must be a manager or admin')
  }

  // Calculate planned minutes
  const plannedMinutes = calculateMinutes(data.startTime, data.endTime)

  // Calculate application deadline
  const applicationDeadline = Timestamp.fromDate(
    addMinutes(new Date(), -data.applicationDeadlineHours * 60)
  )

  // Generate QR secrets
  const checkInQrSecret = generateSecret()
  const checkOutQrSecret = generateSecret()

  // Create job document
  const jobRef = await db.collection('jobs').add({
    siteId: data.siteId,
    managerId: context.auth.uid,
    title: data.title,
    taskDescription: data.taskDescription,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    plannedMinutes,
    hourlyWage: data.hourlyWage,
    requiredHeadcount: data.requiredHeadcount,
    currentApprovedCount: 0,
    applicationDeadline,
    status: 'open',
    checkInQrSecret,
    checkOutQrSecret,
    createdAt: Timestamp.now(),
  })

  return {
    success: true,
    jobId: jobRef.id,
    message: 'Job created successfully',
  }
})

// Cloud Function: Apply for Job
export const applyForJob = functions.https.onCall(async (data: ApplyForJobData, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const employeeId = context.auth.uid
  const { jobId } = data

  // Get employee data
  const employeeDoc = await db.collection('employees').doc(employeeId).get()
  const employee = employeeDoc.data()

  if (!employee) {
    throw new functions.https.HttpsError('not-found', 'Employee not found')
  }

  // Get job data
  const jobDoc = await db.collection('jobs').doc(jobId).get()
  const job = jobDoc.data()

  if (!job) {
    throw new functions.https.HttpsError('not-found', 'Job not found')
  }

  // Check if job is still open
  if (job.status !== 'open') {
    throw new functions.https.HttpsError('failed-precondition', 'Job is not open')
  }

  // Check if job is full
  if (job.currentApprovedCount >= job.requiredHeadcount) {
    throw new functions.https.HttpsError('failed-precondition', 'Job is full')
  }

  // Check if deadline has passed
  if (isBefore(job.applicationDeadline.toDate(), new Date())) {
    throw new functions.https.HttpsError('failed-precondition', 'Application deadline has passed')
  }

  // Check if employee already applied for a job on this date
  const existingApplications = await db.collection('applications')
    .where('employeeId', '==', employeeId)
    .get()

  for (const doc of existingApplications.docs) {
    const app = doc.data()
    const appJobDoc = await db.collection('jobs').doc(app.jobId).get()
    const appJob = appJobDoc.data()

    if (appJob && appJob.date === job.date && app.status === 'approved') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'You have already applied for a job on this date'
      )
    }
  }

  // Compliance checks
  const complianceMessages: string[] = []

  // 1. Check weekly hours (40h max)
  const jobDate = parseISO(job.date)
  const weekStart = startOfWeek(jobDate, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(jobDate, { weekStartsOn: 1 })

  const weekWorks = await db.collection('works')
    .where('employeeId', '==', employeeId)
    .get()

  let weeklyMinutes = 0
  for (const workDoc of weekWorks.docs) {
    const work = workDoc.data()
    if (work.workedMinutes) {
      const workJobDoc = await db.collection('jobs').doc(work.jobId).get()
      const workJob = workJobDoc.data()
      if (workJob) {
        const workDate = parseISO(workJob.date)
        if (workDate >= weekStart && workDate <= weekEnd) {
          weeklyMinutes += work.workedMinutes
        }
      }
    }
  }

  const totalWeekMinutes = weeklyMinutes + job.plannedMinutes
  const totalWeekHours = totalWeekMinutes / 60

  if (totalWeekHours > 40) {
    complianceMessages.push(`Exceeds 40h per week limit (would be ${totalWeekHours.toFixed(1)}h)`)
  }

  // 2. Check contract hours
  if (employee.contractHoursPerWeek && totalWeekHours > employee.contractHoursPerWeek) {
    complianceMessages.push(
      `Exceeds contracted weekly hours of ${employee.contractHoursPerWeek}h`
    )
  }

  // 3. Check minimum wage
  const siteDoc = await db.collection('sites').doc(job.siteId).get()
  const site = siteDoc.data()

  if (site) {
    const minWage = MINIMUM_WAGES[site.region.toLowerCase()] || 0
    if (job.hourlyWage < minWage) {
      complianceMessages.push(
        `Below minimum wage for ${site.region} (¥${minWage}/h)`
      )
    }
  }

  // 4. Check rest interval (8h minimum between shifts)
  const recentWorks = await db.collection('works')
    .where('employeeId', '==', employeeId)
    .where('status', '==', 'completed')
    .get()

  for (const workDoc of recentWorks.docs) {
    const work = workDoc.data()
    if (work.checkOutAt) {
      const hoursSinceLastShift = differenceInHours(
        parseISO(job.date + 'T' + job.startTime),
        work.checkOutAt.toDate()
      )

      if (hoursSinceLastShift < 8) {
        complianceMessages.push('Not enough rest interval (minimum 8h required)')
        break
      }
    }
  }

  // Determine application status
  const applicationStatus = complianceMessages.length > 0 ? 'blocked' : 'approved'

  // Create application
  const applicationRef = await db.collection('applications').add({
    jobId,
    employeeId,
    appliedAt: Timestamp.now(),
    status: applicationStatus,
    compliance: {
      result: applicationStatus === 'approved' ? 'ok' : 'blocked',
      messages: complianceMessages,
    },
  })

  // If approved, increment job counter and create work record
  if (applicationStatus === 'approved') {
    await db.collection('jobs').doc(jobId).update({
      currentApprovedCount: admin.firestore.FieldValue.increment(1),
    })

    // Create work record
    await db.collection('works').add({
      jobId,
      employeeId,
      hourlyWage: job.hourlyWage,
      status: 'not_started',
    })

    // Check if job is now full
    if (job.currentApprovedCount + 1 >= job.requiredHeadcount) {
      await db.collection('jobs').doc(jobId).update({
        status: 'closed',
      })
    }

    // Send notification
    await sendNotification(
      employeeId,
      'Application Approved',
      `Your application for "${job.title}" has been automatically approved.`
    )
  }

  return {
    success: applicationStatus === 'approved',
    applicationId: applicationRef.id,
    status: applicationStatus,
    messages: complianceMessages,
  }
})

// Cloud Function: Check In
export const checkIn = functions.https.onCall(async (data: CheckInData, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const employeeId = context.auth.uid
  const { jobId, token } = data

  // Get job
  const jobDoc = await db.collection('jobs').doc(jobId).get()
  const job = jobDoc.data()

  if (!job) {
    throw new functions.https.HttpsError('not-found', 'Job not found')
  }

  // Verify QR token
  if (token !== job.checkInQrSecret) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid QR code')
  }

  // Find work record
  const worksSnapshot = await db.collection('works')
    .where('jobId', '==', jobId)
    .where('employeeId', '==', employeeId)
    .get()

  if (worksSnapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'Work record not found')
  }

  const workDoc = worksSnapshot.docs[0]
  const work = workDoc.data()

  if (work.checkInAt) {
    throw new functions.https.HttpsError('failed-precondition', 'Already checked in')
  }

  // Update work record
  await workDoc.ref.update({
    checkInAt: Timestamp.now(),
    status: 'in_progress',
  })

  return {
    success: true,
    message: 'Checked in successfully',
  }
})

// Cloud Function: Check Out
export const checkOut = functions.https.onCall(async (data: CheckOutData, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const employeeId = context.auth.uid
  const { jobId, token } = data

  // Get job
  const jobDoc = await db.collection('jobs').doc(jobId).get()
  const job = jobDoc.data()

  if (!job) {
    throw new functions.https.HttpsError('not-found', 'Job not found')
  }

  // Verify QR token
  if (token !== job.checkOutQrSecret) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid QR code')
  }

  // Find work record
  const worksSnapshot = await db.collection('works')
    .where('jobId', '==', jobId)
    .where('employeeId', '==', employeeId)
    .get()

  if (worksSnapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'Work record not found')
  }

  const workDoc = worksSnapshot.docs[0]
  const work = workDoc.data()

  if (!work.checkInAt) {
    throw new functions.https.HttpsError('failed-precondition', 'Not checked in yet')
  }

  if (work.checkOutAt) {
    throw new functions.https.HttpsError('failed-precondition', 'Already checked out')
  }

  const checkOutAt = Timestamp.now()

  // Calculate worked minutes and total pay
  const workedMinutes = differenceInMinutes(
    checkOutAt.toDate(),
    work.checkInAt.toDate()
  )

  const totalPay = (workedMinutes / 60) * work.hourlyWage

  // Update work record
  await workDoc.ref.update({
    checkOutAt,
    workedMinutes,
    totalPay,
    status: 'completed',
  })

  // Create payment record
  const checkOutDate = checkOutAt.toDate()
  await db.collection('payments').add({
    workId: workDoc.id,
    employeeId,
    jobId,
    amount: totalPay,
    period: {
      year: checkOutDate.getFullYear(),
      month: checkOutDate.getMonth() + 1,
    },
    status: 'pending',
  })

  // Send notification
  await sendNotification(
    employeeId,
    'Shift Completed',
    `You've completed your shift. Total pay: ¥${Math.round(totalPay)}`
  )

  return {
    success: true,
    workedMinutes,
    totalPay,
    message: 'Checked out successfully',
  }
})

// Scheduled function: Auto-close expired jobs
export const autoCloseJobs = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = Timestamp.now()

    const expiredJobs = await db.collection('jobs')
      .where('status', '==', 'open')
      .where('applicationDeadline', '<', now)
      .get()

    const batch = db.batch()

    expiredJobs.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'closed' })
    })

    await batch.commit()

    console.log(`Closed ${expiredJobs.size} expired jobs`)
    return null
  })

// Cloud Function: Export to CSV
export const exportToCSV = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  // Verify user is admin
  const userDoc = await db.collection('employees').doc(context.auth.uid).get()
  const userData = userDoc.data()

  if (!userData || userData.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin')
  }

  const { year, month } = data

  // Get all payments for the period
  const paymentsSnapshot = await db.collection('payments')
    .where('period.year', '==', year)
    .where('period.month', '==', month)
    .get()

  const csvRows: string[] = [
    'employeeId,name,site,jobDate,start,end,hoursWorked,hourlyWage,totalPay,status'
  ]

  for (const paymentDoc of paymentsSnapshot.docs) {
    const payment = paymentDoc.data()

    // Get related data
    const employeeDoc = await db.collection('employees').doc(payment.employeeId).get()
    const employee = employeeDoc.data()

    const workDoc = await db.collection('works').doc(payment.workId).get()
    const work = workDoc.data()

    const jobDoc = await db.collection('jobs').doc(payment.jobId).get()
    const job = jobDoc.data()

    const siteDoc = await db.collection('sites').doc(job.siteId).get()
    const site = siteDoc.data()

    if (employee && work && job && site) {
      const hoursWorked = work.workedMinutes ? (work.workedMinutes / 60).toFixed(2) : '0'
      const name = `${employee.name.first} ${employee.name.last}`

      csvRows.push([
        payment.employeeId,
        name,
        site.name,
        job.date,
        job.startTime,
        job.endTime,
        hoursWorked,
        work.hourlyWage.toString(),
        Math.round(payment.amount).toString(),
        payment.status,
      ].join(','))
    }
  }

  const csvContent = csvRows.join('\n')

  // TODO: Upload to Firebase Storage
  // TODO: Sync to Google Sheets

  return {
    success: true,
    csv: csvContent,
    rowCount: csvRows.length - 1,
  }
})
