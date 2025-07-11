import React, { useState, useRef, useEffect } from 'react'
import './ColorPicker.css'

interface ColorPickerProps {
  selectedColor: string
  onColorChange: (color: string) => void
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorChange }) => {
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(100)
  const [lightness, setLightness] = useState(50)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDragging = useRef(false)

  useEffect(() => {
    parseColorToHSL(selectedColor)
  }, [selectedColor])

  useEffect(() => {
    drawColorWheel()
  }, [hue, saturation, lightness])

  const parseColorToHSL = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    setHue(Math.round(h * 360))
    setSaturation(Math.round(s * 100))
    setLightness(Math.round(l * 100))
  }

  const hslToHex = (h: number, s: number, l: number) => {
    h /= 360
    s /= 100
    l /= 100

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    let r, g, b

    if (s === 0) {
      r = g = b = l
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  const drawColorWheel = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 160
    const center = size / 2
    const radius = size / 2 - 10

    canvas.width = size
    canvas.height = size

    ctx.clearRect(0, 0, size, size)

    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * Math.PI / 180
      const endAngle = angle * Math.PI / 180

      ctx.beginPath()
      ctx.arc(center, center, radius, startAngle, endAngle)
      ctx.lineWidth = 20
      ctx.strokeStyle = `hsl(${angle}, 100%, 50%)`
      ctx.stroke()
    }

    const selectedAngle = hue * Math.PI / 180
    const indicatorX = center + Math.cos(selectedAngle) * (radius - 10)
    const indicatorY = center + Math.sin(selectedAngle) * (radius - 10)

    ctx.beginPath()
    ctx.arc(indicatorX, indicatorY, 8, 0, 2 * Math.PI)
    ctx.fillStyle = 'white'
    ctx.fill()
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - canvas.width / 2
    const y = e.clientY - rect.top - canvas.height / 2

    const angle = Math.atan2(y, x) * 180 / Math.PI
    const normalizedAngle = angle < 0 ? angle + 360 : angle

    setHue(Math.round(normalizedAngle))
    updateColor(Math.round(normalizedAngle), saturation, lightness)
  }

  const updateColor = (h: number, s: number, l: number) => {
    const newColor = hslToHex(h, s, l)
    onColorChange(newColor)
  }

  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSaturation = parseInt(e.target.value)
    setSaturation(newSaturation)
    updateColor(hue, newSaturation, lightness)
  }

  const handleLightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLightness = parseInt(e.target.value)
    setLightness(newLightness)
    updateColor(hue, saturation, newLightness)
  }

  return (
    <div className="color-picker">
      <div className="color-wheel-container">
        <canvas
          ref={canvasRef}
          className="color-wheel"
          onClick={handleCanvasClick}
        />
      </div>

      <div className="color-sliders">
        <div className="slider-group">
          <label className="slider-label">Saturation</label>
          <input
            type="range"
            min="0"
            max="100"
            value={saturation}
            onChange={handleSaturationChange}
            className="color-slider saturation-slider"
            style={{
              background: `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`
            }}
          />
          <span className="slider-value">{saturation}%</span>
        </div>

        <div className="slider-group">
          <label className="slider-label">Lightness</label>
          <input
            type="range"
            min="0"
            max="100"
            value={lightness}
            onChange={handleLightnessChange}
            className="color-slider lightness-slider"
            style={{
              background: `linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 50%), hsl(${hue}, ${saturation}%, 100%))`
            }}
          />
          <span className="slider-value">{lightness}%</span>
        </div>
      </div>

      <div className="color-preview">
        <div 
          className="color-preview-swatch"
          style={{ backgroundColor: selectedColor }}
        />
        <div className="color-preview-info">
          <span className="color-hex">{selectedColor.toUpperCase()}</span>
          <span className="color-hsl">HSL({hue}, {saturation}%, {lightness}%)</span>
        </div>
      </div>
    </div>
  )
}

export default ColorPicker