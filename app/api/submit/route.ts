import { NextResponse } from "next/server"
import { addImage } from "@/lib/storage"

export async function POST(request: Request) {
  console.log("[v0] Submit API called")
  try {
    const { image, label, quality } = await request.json()
    console.log("[v0] Received submission:", { label, quality, imageLength: image?.length })

    if (!image || !label) {
      console.log("[v0] Missing image or label")
      return NextResponse.json({ error: "Missing image or label" }, { status: 400 })
    }

    // Default to "perfect" if quality is not provided (for backward compatibility)
    const imageQuality = quality || "perfect"

    const imageData = addImage(label, imageQuality, image)
    console.log("[v0] Image stored successfully:", imageData.filename)

    return NextResponse.json({
      success: true,
      filename: imageData.filename,
      path: imageData.filePath,
      label: imageData.label,
      quality: imageData.quality,
      timestamp: imageData.timestamp,
    })
  } catch (error) {
    console.error("[v0] Error saving image:", error)
    return NextResponse.json({ error: "Failed to save image", details: String(error) }, { status: 500 })
  }
}
