import { NextResponse } from "next/server"
import { getAllImages } from "@/lib/storage"

export async function GET() {
  console.log("[v0] Gallery API called")
  try {
    const images = getAllImages()
    console.log(`[v0] Total images found: ${images.length}`)

    return NextResponse.json({ images })
  } catch (error) {
    console.error("[v0] Error reading gallery:", error)
    return NextResponse.json({ error: "Failed to load gallery", details: String(error) }, { status: 500 })
  }
}
