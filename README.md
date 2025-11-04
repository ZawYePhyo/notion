# DZN-Timme - Spot Work Platform MVP

An internal spot-work platform for managing one-day job postings, applications, attendance, and payments for contract/flex employees.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Firebase (Auth, Firestore, Functions, Storage, Hosting)
- **UI**: Custom CSS with responsive design
- **Internationalization**: i18next (Japanese/English)

## Features

### Employee Features
- Browse and apply for one-day jobs
- Horizontal date picker for easy job browsing
- QR code check-in/out at job sites
- View work history and earnings
- In-app notifications
- Automatic compliance checks before approval

### Manager Features
- Create and manage job postings
- Auto-generated QR codes for check-in/out
- View applicants and attendance status
- Real-time job monitoring

### Admin Features
- Dashboard with platform statistics
- Export work/payment data to CSV
- Manage sites and regional settings
- Compliance oversight

## Project Structure

```
dzn-timme/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── DatePicker.tsx
│   │   ├── JobCard.tsx
│   │   ├── QRScanner.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/          # Page components
│   │   ├── Login.tsx
│   │   ├── employee/   # Employee pages
│   │   ├── manager/    # Manager pages
│   │   └── admin/      # Admin pages
│   ├── contexts/       # React contexts
│   │   └── AuthContext.tsx
│   ├── services/       # Firebase services
│   │   └── firebase.ts
│   ├── types/          # TypeScript types
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── i18n.ts
│   └── index.css
├── functions/          # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### 2. Firebase Configuration

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - Authentication (Email/Password and Google providers)
   - Firestore Database
   - Cloud Functions
   - Storage
   - Hosting

#### Set Up Authentication

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable Email/Password provider
3. Enable Google provider
4. For Google Workspace SSO, configure the authorized domains

#### Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Under "Your apps", click the web icon to add a web app
3. Copy the Firebase configuration object
4. Create `.env` file in the root directory:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Deploy Firestore Rules and Indexes

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 4. Deploy Cloud Functions

```bash
# Build functions
cd functions
npm run build
cd ..

# Deploy functions
firebase deploy --only functions
```

### 5. Seed Initial Data

Create initial sites and test employee data in Firestore:

```javascript
// Sites collection
{
  name: "Tokyo Office",
  address: "1-1-1 Shibuya, Tokyo",
  region: "tokyo"
}

// Employees collection (use Firebase Auth UID)
{
  uid: "firebase_auth_uid",
  name: { first: "John", last: "Doe" },
  email: "john@example.com",
  role: "employee",
  employmentType: "flex",
  createdAt: Timestamp.now()
}
```

### 6. Run Development Server

```bash
# Start frontend dev server
npm run dev

# In another terminal, run Firebase emulators (optional)
firebase emulators:start
```

Visit `http://localhost:5173` to see the app.

### 7. Build and Deploy to Production

```bash
# Build frontend
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or deploy everything
firebase deploy
```

## User Roles

### Employee
- Access: `/employee/*` routes
- Can apply for jobs, check in/out, view history

### Manager
- Access: `/manager/*` routes
- Can create jobs, view applicants, monitor attendance

### Admin
- Access: `/admin/*` routes
- Full access to all data, exports, and settings

## Compliance Rules

The system automatically checks the following compliance rules before approving applications:

1. **Weekly Hours Limit**: Maximum 40 hours per week
2. **Contract Hours**: Cannot exceed contracted weekly hours
3. **Minimum Wage**: Must meet regional minimum wage
4. **Rest Interval**: Minimum 8 hours between shifts

## Key Cloud Functions

- `createJob`: Creates a new job posting with auto-generated QR codes
- `applyForJob`: Handles job applications with compliance checks
- `checkIn`: Records employee check-in via QR scan
- `checkOut`: Records check-out and calculates pay
- `autoCloseJobs`: Scheduled function to close expired jobs
- `exportToCSV`: Exports work/payment data for a given period

## Environment Variables

### Frontend (.env)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Functions (functions/.env)
```
SENDGRID_API_KEY (for email notifications)
GOOGLE_SERVICE_ACCOUNT (for Google Sheets sync)
```

## Security

- All routes are protected with Firebase Authentication
- Firestore security rules enforce role-based access control
- QR codes use random secrets for check-in/out verification
- Sensitive operations require proper authentication and authorization

## Future Enhancements (v2)

- Payme payment integration
- HR override for compliance rules
- Employee self-registration with approval workflow
- Push notifications
- Multi-language job descriptions
- Advanced analytics dashboard

## Support

For issues or questions, please contact the development team.

## License

Internal use only - All rights reserved
