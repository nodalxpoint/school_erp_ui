// core/services/endpoints.ts — Centralized API route constants

export const ENDPOINTS = {
  auth: {
    login: '/login',
    register: '/register',
    logout: '/logout',
    me: '/me',
    refreshToken: '/refresh-token',
  },
  students: {
    list: '/students',
    detail: (id: string) => `/students/${id}`,
    create: '/students',
    update: (id: string) => `/students/${id}`,
    delete: (id: string) => `/students/${id}`,
  },
  teachers: {
    list: '/teachers',
    detail: (id: string) => `/teachers/${id}`,
    create: '/teachers',
    update: (id: string) => `/teachers/${id}`,
    delete: (id: string) => `/teachers/${id}`,
  },
  fees: {
    list: '/fees',
    detail: (id: string) => `/fees/${id}`,
    create: '/fees',
    update: (id: string) => `/fees/${id}`,
    studentFees: (studentId: string) => `/fees/student/${studentId}`,
  },
  attendance: {
    list: '/attendance',
    mark: '/attendance',
    studentAttendance: (studentId: string) => `/attendance/student/${studentId}`,
    classAttendance: (classId: string, date: string) => `/attendance/class/${classId}?date=${date}`,
  },
  dashboard: {
    stats: '/dashboard/stats',
    recentActivity: '/dashboard/activity',
  },
  classes: {
    list: '/classes',
    detail: (id: string) => `/classes/${id}`,
  },
  sections: {
    list: '/sections',
    byClass: (classId: string) => `/sections?classId=${classId}`,
  },
  reports: {
    summary: '/reports/summary',
    attendance: '/reports/attendance',
    fees: '/reports/fees',
  },
} as const;