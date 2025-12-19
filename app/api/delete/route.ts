import { NextResponse } from "next/server"
import { deleteImage } from "@/lib/storage"

export async function DELETE(request: Request) {
  console.log("[v0] Delete API called")
  try {
    const { filename, label, quality, filePath } = await request.json()
    console.log("[v0] Received delete request:", { filename, label, quality, filePath })

    if (!filename || !label) {
      console.log("[v0] Missing filename or label")
      return NextResponse.json({ error: "Missing filename or label" }, { status: 400 })
    }

    // Default to "perfect" if quality is not provided (for backward compatibility)
    const imageQuality = quality || "perfect"

    const deleted = deleteImage(filename, label, imageQuality)
    
    if (deleted) {
      console.log("[v0] Image deleted successfully:", filename)
      return NextResponse.json({
        success: true,
        message: "Image deleted successfully",
      })
    } else {
      console.log("[v0] Image not found or could not be deleted:", filename)
      // Still return success if we removed it from store (file might have been manually deleted)
      return NextResponse.json({ 
        error: "Image file not found on filesystem, but removed from store",
        warning: true 
      }, { status: 200 })
    }
  } catch (error) {
    console.error("[v0] Error deleting image:", error)
    return NextResponse.json({ error: "Failed to delete image", details: String(error) }, { status: 500 })
  }
}

