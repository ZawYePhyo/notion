import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      // Common
      login: 'Login',
      logout: 'Logout',
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',

      // Auth
      email: 'Email',
      password: 'Password',
      signInWithEmail: 'Sign in with Email',
      signInWithGoogle: 'Sign in with Google',

      // Navigation
      dashboard: 'Dashboard',
      myJobs: 'My Jobs',
      checkIn: 'Check In/Out',
      history: 'History',
      notifications: 'Notifications',
      createJob: 'Create Job',
      exports: 'Exports',
      settings: 'Settings',

      // Job
      jobTitle: 'Job Title',
      date: 'Date',
      time: 'Time',
      wage: 'Wage',
      slots: 'Slots',
      apply: 'Apply',
      applied: 'Applied',

      // Status
      open: 'Open',
      closed: 'Closed',
      approved: 'Approved',
      blocked: 'Blocked',
      pending: 'Pending',
      completed: 'Completed',
    },
  },
  ja: {
    translation: {
      // Common
      login: 'ログイン',
      logout: 'ログアウト',
      save: '保存',
      cancel: 'キャンセル',
      submit: '送信',
      delete: '削除',
      edit: '編集',
      loading: '読み込み中...',

      // Auth
      email: 'メールアドレス',
      password: 'パスワード',
      signInWithEmail: 'メールでログイン',
      signInWithGoogle: 'Googleでログイン',

      // Navigation
      dashboard: 'ダッシュボード',
      myJobs: 'マイジョブ',
      checkIn: 'チェックイン/アウト',
      history: '履歴',
      notifications: '通知',
      createJob: '求人作成',
      exports: 'エクスポート',
      settings: '設定',

      // Job
      jobTitle: '求人タイトル',
      date: '日付',
      time: '時間',
      wage: '時給',
      slots: '募集人数',
      apply: '応募',
      applied: '応募済み',

      // Status
      open: '募集中',
      closed: '終了',
      approved: '承認済み',
      blocked: 'ブロック',
      pending: '保留中',
      completed: '完了',
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ja', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
