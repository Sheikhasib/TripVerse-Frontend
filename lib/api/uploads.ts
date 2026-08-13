import { apiClient } from "./client"

export type TUploadResult = {
  url: string
  publicId: string
}

// Uploads a single image to the backend (multer accepts jpg/png/webp ≤5MB,
// field name "image"). Returns the Cloudinary URL to store in a package's
// images array.
const uploadImage = (file: File) => {
  const formData = new FormData()
  formData.append("image", file)
  return apiClient<TUploadResult>("/api/uploads/image", {
    method: "POST",
    body: formData,
  })
}

export const uploadsApi = {
  uploadImage,
}
