"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ShapeDrawingApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedShape, setSelectedShape] = useState<"circle" | "square" | "triangle">("circle")
  const [selectedQuality, setSelectedQuality] = useState<"perfect" | "medium" | "irregular">("perfect")
  const [submitStatus, setSubmitStatus] = useState<string>("")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, 256, 256)

    // Set drawing style
    ctx.strokeStyle = "black"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)

    const rect = canvas.getBoundingClientRect()
    let x: number, y: number

    if ("touches" in e) {
      e.preventDefault()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let x: number, y: number

    if ("touches" in e) {
      e.preventDefault()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, 256, 256)
    setSubmitStatus("")
  }

  const isCanvasEmpty = (): boolean => {
    const canvas = canvasRef.current
    if (!canvas) return true

    const ctx = canvas.getContext("2d")
    if (!ctx) return true

    // Get image data from canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Check if canvas is all white (empty)
    // A white pixel has RGB values of 255, 255, 255, 255 (with alpha)
    for (let i = 0; i < data.length; i += 4) {
      // Check if pixel is not white (allowing for slight variations)
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
        return false // Found a non-white pixel, canvas is not empty
      }
    }
    return true // All pixels are white, canvas is empty
  }

  const submitDrawing = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Check if canvas is empty
    if (isCanvasEmpty()) {
      alert("Please draw something before submitting!")
      setSubmitStatus("✗ Canvas is empty. Please draw a shape first.")
      setTimeout(() => setSubmitStatus(""), 3000)
      return
    }

    console.log("[v0] Starting submission for:", selectedShape, "quality:", selectedQuality)

    // Convert canvas to base64 PNG
    const imageData = canvas.toDataURL("image/png")
    console.log("[v0] Image data length:", imageData.length)

    try {
      // Send to API route to save to filesystem
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageData,
          label: selectedShape,
          quality: selectedQuality,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save image")
      }

      const result = await response.json()
      console.log("[v0] Image saved successfully:", result.filename)
      setSubmitStatus(`✓ Saved as ${result.filename}`)
      clearCanvas()
      setTimeout(() => setSubmitStatus(""), 3000)
    } catch (error) {
      console.error("[v0] Error saving image:", error)
      setSubmitStatus(`✗ Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="bg-card p-8 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Shape Drawing </h1>
          <a 
            href="/gallery" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md font-medium text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
            View Gallery
          </a>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label htmlFor="shape-select" className="font-medium">
                Shape:
              </label>
              <select
                id="shape-select"
                value={selectedShape}
                onChange={(e) => setSelectedShape(e.target.value as "circle" | "square" | "triangle")}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="circle">Circle</option>
                <option value="square">Square</option>
                <option value="triangle">Triangle</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="quality-select" className="font-medium">
                Quality:
              </label>
              <select
                id="quality-select"
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value as "perfect" | "medium" | "irregular")}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="perfect">Perfect</option>
                <option value="medium">Medium</option>
                <option value="irregular">Irregular</option>
              </select>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={256}
            height={256}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="border-2 border-border cursor-crosshair touch-none"
            style={{ backgroundColor: "white" }}
          />

          <div className="flex gap-3">
            <Button onClick={clearCanvas} variant="outline" className="flex-1 bg-transparent">
              Clear
            </Button>
            <Button onClick={submitDrawing} className="flex-1">
              Submit
            </Button>
          </div>

          {submitStatus && (
            <p className={`text-center text-sm ${submitStatus.includes("✓") ? "text-green-600" : "text-red-600"}`}>
              {submitStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
