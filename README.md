# Shape Drawing Dataset Collector

A simple web application for collecting hand-drawn geometric shapes for machine learning datasets.

## Features

- Draw shapes on a 256×256 canvas
- Select shape labels: circle, square, triangle
- Submit drawings automatically saved to organized folders
- Automatic dataset organization

## Setup Instructions

1. Install dependencies (if not already installed):
```bash
npm install
# or
pnpm install
```

2. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Select a shape label from the dropdown (circle, square, or triangle)
2. Draw the shape on the canvas using your mouse or touch input
3. Click "Submit" to save your drawing
4. The canvas will clear automatically after successful submission
5. Use "Clear" to reset the canvas without submitting

## Dataset Structure

Submitted drawings are automatically saved to:

```
dataset/
├── circle/
│   ├── circle_1737312625123.png
│   └── ...
├── square/
│   ├── square_1737312630456.png
│   └── ...
└── triangle/
    ├── triangle_1737312635789.png
    └── ...
```

Each image is 256×256 pixels with a white background and black strokes.

## Technical Details

- **Frontend**: React with Next.js, Canvas API for drawing
- **Backend**: Next.js API Route (app/api/submit/route.ts)
- **Image Format**: PNG (base64 encoded for transmission)
- **File Storage**: Local filesystem with organized folder structure
```

```py file="scripts/backend.py" isDeleted="true"
...deleted...
