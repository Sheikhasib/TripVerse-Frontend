import { apiClientFull } from "./client"

export type TDashboardRole = "user" | "agent" | "admin"

export type TUsersByRole = { role: string; count: number }
export type TBookingsByStatus = { status: string; count: number }
export type TPackagesByCategory = { category: string; count: number }
export type TRevenuePoint = { date: string; revenue: number }

export type TUpcomingBooking = {
  id: string
  travelDate: string
  travelers: number
  totalPrice: number
  status: string
  package: { id: string; title: string; slug: string }
}

export type TAdminOverview = {
  totalUsers: number
  totalPackages: number
  totalBookings: number
  totalRevenue: number
  usersByRole: TUsersByRole[]
  bookingsByStatus: TBookingsByStatus[]
  packagesByCategory: TPackagesByCategory[]
  revenueOverTime: TRevenuePoint[]
}

export type TAgentOverview = {
  totalPackages: number
  totalBookings: number
  totalRevenue: number
  averageRating: number
  bookingsByStatus: TBookingsByStatus[]
  revenueOverTime: TRevenuePoint[]
}

export type TUserOverview = {
  totalBookings: number
  totalSpend: number
  upcomingCount: number
  upcoming: TUpcomingBooking[]
  bookingsByStatus: TBookingsByStatus[]
  revenueOverTime: TRevenuePoint[]
}

export type TDashboardOverview = TAdminOverview | TAgentOverview | TUserOverview

export type TDashboardView = {
  users?: number
  packages?: number
  bookings?: number
  revenue?: number
  averageRating?: number
  totalSpend?: number
  upcomingCount?: number
  upcoming?: TUpcomingBooking[]
  usersByRole?: TUsersByRole[]
  bookingsByStatus?: TBookingsByStatus[]
  packagesByCategory?: TPackagesByCategory[]
  revenueOverTime?: TRevenuePoint[]
}

const toView = (raw: TDashboardOverview, role: TDashboardRole): TDashboardView => {
  if (role === "user") {
    const r = raw as TUserOverview
    return {
      bookings: r.totalBookings,
      totalSpend: r.totalSpend,
      upcomingCount: r.upcomingCount,
      upcoming: r.upcoming,
      bookingsByStatus: r.bookingsByStatus,
      revenueOverTime: r.revenueOverTime,
    }
  }

  if (role === "agent") {
    const r = raw as TAgentOverview
    return {
      packages: r.totalPackages,
      bookings: r.totalBookings,
      revenue: r.totalRevenue,
      averageRating: r.averageRating,
      bookingsByStatus: r.bookingsByStatus,
      revenueOverTime: r.revenueOverTime,
    }
  }

  const r = raw as TAdminOverview
  return {
    users: r.totalUsers,
    packages: r.totalPackages,
    bookings: r.totalBookings,
    revenue: r.totalRevenue,
    usersByRole: r.usersByRole,
    bookingsByStatus: r.bookingsByStatus,
    packagesByCategory: r.packagesByCategory,
    revenueOverTime: r.revenueOverTime,
  }
}

const getOverview = async (
  role: TDashboardRole,
  days = 30,
): Promise<TDashboardView> => {
  const envelope = await apiClientFull<TDashboardOverview>(
    `/api/dashboard/${role}?days=${days}`,
  )
  return toView(envelope.data, role)
}

export const dashboardApi = {
  getOverview,
}
