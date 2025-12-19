"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type ShapeImage = {
  filename: string
  label: string
  quality?: string
  image: string
  timestamp: number
  filePath?: string
}

export default function GalleryPage() {
  const [images, setImages] = useState<ShapeImage[]>([])
  const [loading, setLoading] = useState(true)
  const [shapeFilter, setShapeFilter] = useState<"all" | "circle" | "square" | "triangle">("all")
  const [qualityFilter, setQualityFilter] = useState<"all" | "perfect" | "medium" | "irregular">("all")

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    console.log("[v0] Fetching images from API")
    try {
      const response = await fetch("/api/gallery")
      if (!response.ok) {
        throw new Error("Failed to fetch images")
      }
      const data = await response.json()
      console.log("[v0] Loaded images:", data.images?.length || 0)
      setImages(data.images || [])
    } catch (error) {
      console.error("[v0] Error loading from API:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (image: ShapeImage) => {
    if (!confirm(`Are you sure you want to delete this ${image.label} (${image.quality || "perfect"})?`)) {
      return
    }

    try {
      const response = await fetch("/api/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: image.filename,
          label: image.label,
          quality: image.quality || "perfect",
          filePath: image.filePath,
        }),
      })

      const data = await response.json()
      
      // Remove from local state if deletion was successful or if it was a warning
      if (response.ok || data.warning) {
        setImages((prevImages) => prevImages.filter((img) => 
          !(img.filename === image.filename && img.label === image.label && (img.quality || "perfect") === (image.quality || "perfect"))
        ))
        
        if (data.warning) {
          console.log("[v0] Image removed from store (file may have been manually deleted):", image.filename)
        } else {
          console.log("[v0] Image deleted successfully:", image.filename)
        }
      } else {
        throw new Error(data.error || "Failed to delete image")
      }
    } catch (error) {
      console.error("[v0] Error deleting image:", error)
      alert(`Failed to delete image: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const filteredImages = images.filter((img) => {
    const shapeMatch = shapeFilter === "all" || img.label === shapeFilter
    const qualityMatch = qualityFilter === "all" || img.quality === qualityFilter
    return shapeMatch && qualityMatch
  })

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">Shape Gallery</h1>
          <Link href="/">
            <Button variant="outline">Back to Drawing</Button>
          </Link>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm font-medium mb-2">Filter by Shape:</p>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => setShapeFilter("all")} variant={shapeFilter === "all" ? "default" : "outline"}>
                All Shapes ({images.length})
              </Button>
              <Button onClick={() => setShapeFilter("circle")} variant={shapeFilter === "circle" ? "default" : "outline"}>
                Circles ({images.filter((img) => img.label === "circle").length})
              </Button>
              <Button onClick={() => setShapeFilter("square")} variant={shapeFilter === "square" ? "default" : "outline"}>
                Squares ({images.filter((img) => img.label === "square").length})
              </Button>
              <Button onClick={() => setShapeFilter("triangle")} variant={shapeFilter === "triangle" ? "default" : "outline"}>
                Triangles ({images.filter((img) => img.label === "triangle").length})
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Filter by Quality:</p>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => setQualityFilter("all")} variant={qualityFilter === "all" ? "default" : "outline"}>
                All Quality ({images.length})
              </Button>
              <Button onClick={() => setQualityFilter("perfect")} variant={qualityFilter === "perfect" ? "default" : "outline"}>
                Perfect ({images.filter((img) => img.quality === "perfect").length})
              </Button>
              <Button onClick={() => setQualityFilter("medium")} variant={qualityFilter === "medium" ? "default" : "outline"}>
                Medium ({images.filter((img) => img.quality === "medium").length})
              </Button>
              <Button onClick={() => setQualityFilter("irregular")} variant={qualityFilter === "irregular" ? "default" : "outline"}>
                Irregular ({images.filter((img) => img.quality === "irregular").length})
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading images...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No shapes submitted yet. Start drawing!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredImages.map((image, index) => (
              <div key={index} className="bg-card rounded-lg p-3 shadow relative group">
                <img
                  src={image.filePath || image.image || "/placeholder.svg"}
                  alt={image.label}
                  className="w-full h-auto border border-border rounded"
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground text-center capitalize font-medium">{image.label}</p>
                  {image.quality && (
                    <p className="text-xs text-muted-foreground text-center capitalize">
                      <span className={`inline-block px-2 py-0.5 rounded ${
                        image.quality === "perfect" ? "bg-green-100 text-green-800" :
                        image.quality === "medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {image.quality}
                      </span>
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleDelete(image)}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete image"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
