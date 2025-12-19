import fs from "fs"
import path from "path"

type ImageData = {
  filename: string
  label: string
  quality: string // perfect, medium, or irregular
  image: string // base64 data URL
  timestamp: number
  filePath: string // path to saved file
}

declare global {
  var imageStore: ImageData[] | undefined
}

// Initialize global store if it doesn't exist
if (!globalThis.imageStore) {
  globalThis.imageStore = []
  // Load existing images from filesystem on startup
  loadImagesFromFilesystem()
}

/**
 * Maps label to folder name (singular to plural)
 */
function getFolderName(label: string): string {
  const labelToFolder: Record<string, string> = {
    circle: "circles",
    square: "squares",
    triangle: "triangles",
  }
  return labelToFolder[label] || label
}

/**
 * Loads all existing images from the filesystem into memory
 * This ensures persistence across server restarts
 */
function loadImagesFromFilesystem() {
  try {
    const validLabels = ["circle", "square", "triangle"]
    const validQualities = ["perfect", "medium", "irregular"]
    const publicShapesDir = path.join(process.cwd(), "public", "shapes")

    if (!fs.existsSync(publicShapesDir)) {
      console.log("[v0] Shapes directory does not exist yet")
      return
    }

    validLabels.forEach((label) => {
      const folderName = getFolderName(label)
      const labelDir = path.join(publicShapesDir, folderName)
      
      if (fs.existsSync(labelDir)) {
        // Check if it's a directory with quality subdirectories or flat structure
        const stats = fs.statSync(labelDir)
        
        if (stats.isDirectory()) {
          // Check for quality subdirectories
          validQualities.forEach((quality) => {
            const qualityDir = path.join(labelDir, quality)
            if (fs.existsSync(qualityDir)) {
              const files = fs.readdirSync(qualityDir)
              files.forEach((file) => {
                // Only process PNG and JPG files
                if (file.match(/\.(png|jpg|jpeg)$/i)) {
                  const filePath = path.join(qualityDir, file)
                  const fileStats = fs.statSync(filePath)
                  
                  // Extract timestamp from filename (format: label_timestamp.png)
                  const match = file.match(/^(.+)_(\d+)\.(png|jpg|jpeg)$/i)
                  const timestamp = match ? parseInt(match[2], 10) : fileStats.mtimeMs

                  // Create ImageData entry
                  const imageData: ImageData = {
                    filename: file,
                    label,
                    quality,
                    image: "",
                    timestamp,
                    filePath: `/shapes/${folderName}/${quality}/${file}`,
                  }

                  // Check if already in store (avoid duplicates)
                  const exists = globalThis.imageStore!.some(
                    (img) => img.filename === file && img.label === label && img.quality === quality
                  )
                  if (!exists) {
                    globalThis.imageStore!.push(imageData)
                  }
                }
              })
            }
          })
          
          // Also check for files directly in the label directory (backward compatibility)
          const files = fs.readdirSync(labelDir)
          files.forEach((file) => {
            const filePath = path.join(labelDir, file)
            const fileStats = fs.statSync(filePath)
            
            // Only process files (not directories) and PNG/JPG files
            if (fileStats.isFile() && file.match(/\.(png|jpg|jpeg)$/i)) {
              // Assume "perfect" quality for old files without quality classification
              const match = file.match(/^(.+)_(\d+)\.(png|jpg|jpeg)$/i)
              const timestamp = match ? parseInt(match[2], 10) : fileStats.mtimeMs

              const imageData: ImageData = {
                filename: file,
                label,
                quality: "perfect", // Default for old files
                image: "",
                timestamp,
                filePath: `/shapes/${folderName}/${file}`,
              }

              const exists = globalThis.imageStore!.some(
                (img) => img.filename === file && img.label === label && img.quality === "perfect"
              )
              if (!exists) {
                globalThis.imageStore!.push(imageData)
              }
            }
          })
        }
      }
    })

    console.log(`[v0] Loaded ${globalThis.imageStore!.length} images from filesystem`)
  } catch (error) {
    console.error("[v0] Error loading images from filesystem:", error)
  }
}

/**
 * Saves an image to the filesystem in the appropriate shape and quality folder
 * @param label - The shape label (circle, square, or triangle)
 * @param quality - The quality classification (perfect, medium, or irregular)
 * @param image - Base64 data URL of the image
 * @returns ImageData object with file information
 */
export function addImage(label: string, quality: string, image: string): ImageData {
  const timestamp = Date.now()
  const filename = `${label}_${timestamp}.png`
  
  // Ensure label is valid
  const validLabels = ["circle", "square", "triangle"]
  if (!validLabels.includes(label)) {
    throw new Error(`Invalid label: ${label}. Must be one of: ${validLabels.join(", ")}`)
  }

  // Ensure quality is valid
  const validQualities = ["perfect", "medium", "irregular"]
  if (!validQualities.includes(quality)) {
    throw new Error(`Invalid quality: ${quality}. Must be one of: ${validQualities.join(", ")}`)
  }

  // Convert base64 data URL to buffer
  // Format: data:image/png;base64,iVBORw0KGgoAAAANS...
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "")
  const buffer = Buffer.from(base64Data, "base64")

  // Map label to folder name (circle -> circles, square -> squares, etc.)
  const folderName = getFolderName(label)
  
  // Create directory path: public/shapes/{folderName}/{quality}/
  const publicDir = path.join(process.cwd(), "public", "shapes", folderName, quality)
  const filePath = path.join(publicDir, filename)

  // Ensure directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  // Write file to filesystem
  fs.writeFileSync(filePath, buffer)

  // Create relative path for web access
  const webPath = `/shapes/${folderName}/${quality}/${filename}`

  const imageData: ImageData = {
    filename,
    label,
    quality,
    image,
    timestamp,
    filePath: webPath,
  }

  // Also keep in memory store for quick access
  globalThis.imageStore!.push(imageData)
  console.log("[v0] Image saved to filesystem:", filePath)
  console.log("[v0] Total images in store:", globalThis.imageStore!.length)
  
  return imageData
}

export function getAllImages(): ImageData[] {
  console.log("[v0] Getting all images. Total:", globalThis.imageStore!.length)
  return [...globalThis.imageStore!].sort((a, b) => b.timestamp - a.timestamp)
}

export function getImagesByLabel(label: string): ImageData[] {
  return globalThis.imageStore!.filter((img) => img.label === label)
}

export function getImagesByQuality(quality: string): ImageData[] {
  return globalThis.imageStore!.filter((img) => img.quality === quality)
}

export function getImagesByLabelAndQuality(label: string, quality: string): ImageData[] {
  return globalThis.imageStore!.filter((img) => img.label === label && img.quality === quality)
}

/**
 * Finds an image in the store by filename, label, and quality
 */
function findImageInStore(filename: string, label: string, quality: string): ImageData | undefined {
  // Normalize quality (default to "perfect" if undefined)
  const normalizedQuality = quality || "perfect"
  
  return globalThis.imageStore!.find(
    (img) => {
      const imgQuality = img.quality || "perfect"
      return img.filename === filename && img.label === label && imgQuality === normalizedQuality
    }
  )
}

/**
 * Deletes an image from both filesystem and memory store
 * @param filename - The filename of the image to delete
 * @param label - The shape label (circle, square, or triangle)
 * @param quality - The quality classification (perfect, medium, or irregular)
 * @returns true if deletion was successful, false otherwise
 */
export function deleteImage(filename: string, label: string, quality: string): boolean {
  try {
    // First, try to find the image in the store to get its filePath
    const imageInStore = findImageInStore(filename, label, quality)
    
    let deleted = false
    const pathsToTry: string[] = []
    
    // If we found the image in store, use its filePath
    if (imageInStore && imageInStore.filePath) {
      // Convert web path to filesystem path
      // filePath is like: /shapes/circles/perfect/circle_123.png
      // We need: public/shapes/circles/perfect/circle_123.png
      const relativePath = imageInStore.filePath.startsWith("/") 
        ? imageInStore.filePath.substring(1) 
        : imageInStore.filePath
      const fullPath = path.join(process.cwd(), "public", relativePath)
      pathsToTry.push(fullPath)
    }
    
    // Map label to folder name
    const folderName = getFolderName(label)
    
    // Try quality subdirectory path
    const qualityDir = path.join(process.cwd(), "public", "shapes", folderName, quality)
    const qualityFilePath = path.join(qualityDir, filename)
    pathsToTry.push(qualityFilePath)
    
    // Try old format (without quality subdirectory)
    const oldDir = path.join(process.cwd(), "public", "shapes", folderName)
    const oldFilePath = path.join(oldDir, filename)
    pathsToTry.push(oldFilePath)
    
    // Try all possible paths
    for (const filePath of pathsToTry) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
          deleted = true
          console.log("[v0] Deleted image from filesystem:", filePath)
          break // Found and deleted, no need to try other paths
        } catch (err) {
          console.error("[v0] Error deleting file at:", filePath, err)
        }
      }
    }
    
    if (!deleted) {
      console.warn("[v0] Image file not found. Tried paths:", pathsToTry)
      console.warn("[v0] Looking for:", { filename, label, quality })
    }
    
    // Remove from memory store regardless of file deletion success
    const normalizedQuality = quality || "perfect"
    const initialLength = globalThis.imageStore!.length
    globalThis.imageStore! = globalThis.imageStore!.filter(
      (img) => {
        const imgQuality = img.quality || "perfect"
        return !(img.filename === filename && img.label === label && imgQuality === normalizedQuality)
      }
    )
    
    const removedFromStore = globalThis.imageStore!.length < initialLength
    console.log(`[v0] Image removed from store: ${removedFromStore}. Total images: ${globalThis.imageStore!.length}`)
    
    // Return true if either file was deleted OR it was removed from store (in case file was already deleted)
    return deleted || removedFromStore
  } catch (error) {
    console.error("[v0] Error deleting image:", error)
    return false
  }
}
