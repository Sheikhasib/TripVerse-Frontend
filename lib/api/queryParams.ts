import type { TPublicPackageQuery } from "./packages"

// Converts a URLSearchParams object into the typed public package query,
// dropping empty values. Shared by the /packages listing and the home
// TripFinder deep-link so both stay in sync with the API contract.
export const parsePackageQuery = (
  params: URLSearchParams,
): TPublicPackageQuery => {
  const query: TPublicPackageQuery = {}

  const search = params.get("search")
  if (search) query.search = search

  const category = params.get("category")
  if (category) query.category = category

  const location = params.get("location")
  if (location) query.location = location

  const minPrice = params.get("minPrice")
  if (minPrice) query.minPrice = Number(minPrice)

  const maxPrice = params.get("maxPrice")
  if (maxPrice) query.maxPrice = Number(maxPrice)

  const minRating = params.get("minRating")
  if (minRating) query.minRating = Number(minRating)

  const maxDuration = params.get("maxDuration")
  if (maxDuration) query.maxDuration = Number(maxDuration)

  const sortBy = params.get("sortBy")
  if (sortBy === "newest" || sortBy === "price" || sortBy === "rating" || sortBy === "title") {
    query.sortBy = sortBy
  }

  const sortOrder = params.get("sortOrder")
  if (sortOrder === "asc" || sortOrder === "desc") query.sortOrder = sortOrder

  const page = Number(params.get("page"))
  if (Number.isInteger(page) && page > 0) query.page = page

  return query
}