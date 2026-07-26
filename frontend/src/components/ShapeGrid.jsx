import { useEffect, useRef } from "react";

const ShapeGrid = ({
  direction = "right",
  speed = 1,
  borderColor = "#999",
  squareSize = 40,
  size,
  hoverFillColor = "#222",
  hoverColor,
  shape = "square",
  hoverTrailAmount = 0,
  className = "",
}) => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const gridOffset = useRef({ x: 0, y: 0 });
  const hoveredSquare = useRef(null);
  const trailCells = useRef([]);
  const cellOpacities = useRef(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const cellSize = size || squareSize;
    const activeHoverColor = hoverColor || hoverFillColor;

    const isHex = shape === "hexagon";
    const isTri = shape === "triangle";
    const hexHoriz = cellSize * 1.5;
    const hexVert = cellSize * Math.sqrt(3);

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const drawHex = (cx, cy, shapeSize) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const vx = cx + shapeSize * Math.cos(angle);
        const vy = cy + shapeSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
    };

    const drawCircle = (cx, cy, shapeSize) => {
      ctx.beginPath();
      ctx.arc(cx, cy, shapeSize / 2, 0, Math.PI * 2);
      ctx.closePath();
    };

    const drawTriangle = (cx, cy, shapeSize, flip) => {
      ctx.beginPath();
      if (flip) {
        ctx.moveTo(cx, cy + shapeSize / 2);
        ctx.lineTo(cx + shapeSize / 2, cy - shapeSize / 2);
        ctx.lineTo(cx - shapeSize / 2, cy - shapeSize / 2);
      } else {
        ctx.moveTo(cx, cy - shapeSize / 2);
        ctx.lineTo(cx + shapeSize / 2, cy + shapeSize / 2);
        ctx.lineTo(cx - shapeSize / 2, cy + shapeSize / 2);
      }
      ctx.closePath();
    };

    const updateCellOpacities = () => {
      const targets = new Map();

      if (hoveredSquare.current) {
        targets.set(`${hoveredSquare.current.x},${hoveredSquare.current.y}`, 1);
      }

      if (hoverTrailAmount > 0) {
        for (let i = 0; i < trailCells.current.length; i++) {
          const trailCell = trailCells.current[i];
          const key = `${trailCell.x},${trailCell.y}`;
          if (!targets.has(key)) {
            targets.set(key, (trailCells.current.length - i) / (trailCells.current.length + 1));
          }
        }
      }

      for (const [key] of targets) {
        if (!cellOpacities.current.has(key)) cellOpacities.current.set(key, 0);
      }

      for (const [key, opacity] of cellOpacities.current) {
        const target = targets.get(key) || 0;
        const next = opacity + (target - opacity) * 0.15;
        if (next < 0.005) cellOpacities.current.delete(key);
        else cellOpacities.current.set(key, next);
      }
    };

    const drawGrid = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);

      if (isHex) {
        const colShift = Math.floor(gridOffset.current.x / hexHoriz);
        const offsetX = ((gridOffset.current.x % hexHoriz) + hexHoriz) % hexHoriz;
        const offsetY = ((gridOffset.current.y % hexVert) + hexVert) % hexVert;
        const cols = Math.ceil(width / hexHoriz) + 3;
        const rows = Math.ceil(height / hexVert) + 3;

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const cx = col * hexHoriz + offsetX;
            const cy = row * hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) + offsetY;
            const cellKey = `${col},${row}`;
            const alpha = cellOpacities.current.get(cellKey);

            if (alpha) {
              ctx.globalAlpha = alpha;
              drawHex(cx, cy, cellSize);
              ctx.fillStyle = activeHoverColor;
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            drawHex(cx, cy, cellSize);
            ctx.strokeStyle = borderColor;
            ctx.stroke();
          }
        }
      } else if (isTri) {
        const halfW = cellSize / 2;
        const colShift = Math.floor(gridOffset.current.x / halfW);
        const rowShift = Math.floor(gridOffset.current.y / cellSize);
        const offsetX = ((gridOffset.current.x % halfW) + halfW) % halfW;
        const offsetY = ((gridOffset.current.y % cellSize) + cellSize) % cellSize;
        const cols = Math.ceil(width / halfW) + 4;
        const rows = Math.ceil(height / cellSize) + 4;

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const cx = col * halfW + offsetX;
            const cy = row * cellSize + cellSize / 2 + offsetY;
            const flip = ((col + colShift + row + rowShift) % 2 + 2) % 2 !== 0;
            const cellKey = `${col},${row}`;
            const alpha = cellOpacities.current.get(cellKey);

            if (alpha) {
              ctx.globalAlpha = alpha;
              drawTriangle(cx, cy, cellSize, flip);
              ctx.fillStyle = activeHoverColor;
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            drawTriangle(cx, cy, cellSize, flip);
            ctx.strokeStyle = borderColor;
            ctx.stroke();
          }
        }
      } else if (shape === "circle") {
        const offsetX = ((gridOffset.current.x % cellSize) + cellSize) % cellSize;
        const offsetY = ((gridOffset.current.y % cellSize) + cellSize) % cellSize;
        const cols = Math.ceil(width / cellSize) + 3;
        const rows = Math.ceil(height / cellSize) + 3;

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const cx = col * cellSize + cellSize / 2 + offsetX;
            const cy = row * cellSize + cellSize / 2 + offsetY;
            const cellKey = `${col},${row}`;
            const alpha = cellOpacities.current.get(cellKey);

            if (alpha) {
              ctx.globalAlpha = alpha;
              drawCircle(cx, cy, cellSize);
              ctx.fillStyle = activeHoverColor;
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            drawCircle(cx, cy, cellSize);
            ctx.strokeStyle = borderColor;
            ctx.stroke();
          }
        }
      } else {
        const offsetX = ((gridOffset.current.x % cellSize) + cellSize) % cellSize;
        const offsetY = ((gridOffset.current.y % cellSize) + cellSize) % cellSize;
        const cols = Math.ceil(width / cellSize) + 3;
        const rows = Math.ceil(height / cellSize) + 3;

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const sx = col * cellSize + offsetX;
            const sy = row * cellSize + offsetY;
            const cellKey = `${col},${row}`;
            const alpha = cellOpacities.current.get(cellKey);

            if (alpha) {
              ctx.globalAlpha = alpha;
              ctx.fillStyle = activeHoverColor;
              ctx.fillRect(sx, sy, cellSize, cellSize);
              ctx.globalAlpha = 1;
            }

            ctx.strokeStyle = borderColor;
            ctx.strokeRect(sx, sy, cellSize, cellSize);
          }
        }
      }
    };

    const updateAnimation = () => {
      const effectiveSpeed = Math.max(speed, 0.1);
      const wrapX = isHex ? hexHoriz * 2 : cellSize;
      const wrapY = isHex ? hexVert : isTri ? cellSize * 2 : cellSize;

      switch (direction) {
        case "right":
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + wrapX) % wrapX;
          break;
        case "left":
          gridOffset.current.x = (gridOffset.current.x + effectiveSpeed + wrapX) % wrapX;
          break;
        case "up":
          gridOffset.current.y = (gridOffset.current.y + effectiveSpeed + wrapY) % wrapY;
          break;
        case "down":
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + wrapY) % wrapY;
          break;
        case "diagonal":
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + wrapX) % wrapX;
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + wrapY) % wrapY;
          break;
        default:
          break;
      }

      updateCellOpacities();
      drawGrid();
      requestRef.current = requestAnimationFrame(updateAnimation);
    };

    const addTrailCell = () => {
      if (hoveredSquare.current && hoverTrailAmount > 0) {
        trailCells.current.unshift({ ...hoveredSquare.current });
        if (trailCells.current.length > hoverTrailAmount) trailCells.current.length = hoverTrailAmount;
      }
    };

    const updateHoveredCell = (nextCell) => {
      if (
        !hoveredSquare.current
        || hoveredSquare.current.x !== nextCell.x
        || hoveredSquare.current.y !== nextCell.y
      ) {
        addTrailCell();
        hoveredSquare.current = nextCell;
      }
    };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      if (isHex) {
        const colShift = Math.floor(gridOffset.current.x / hexHoriz);
        const offsetX = ((gridOffset.current.x % hexHoriz) + hexHoriz) % hexHoriz;
        const offsetY = ((gridOffset.current.y % hexVert) + hexVert) % hexVert;
        const adjustedX = mouseX - offsetX;
        const adjustedY = mouseY - offsetY;
        const col = Math.round(adjustedX / hexHoriz);
        const rowOffset = (col + colShift) % 2 !== 0 ? hexVert / 2 : 0;
        const row = Math.round((adjustedY - rowOffset) / hexVert);
        updateHoveredCell({ x: col, y: row });
      } else if (isTri) {
        const halfW = cellSize / 2;
        const offsetX = ((gridOffset.current.x % halfW) + halfW) % halfW;
        const offsetY = ((gridOffset.current.y % cellSize) + cellSize) % cellSize;
        const adjustedX = mouseX - offsetX;
        const adjustedY = mouseY - offsetY;
        updateHoveredCell({ x: Math.round(adjustedX / halfW), y: Math.floor(adjustedY / cellSize) });
      } else if (shape === "circle") {
        const offsetX = ((gridOffset.current.x % cellSize) + cellSize) % cellSize;
        const offsetY = ((gridOffset.current.y % cellSize) + cellSize) % cellSize;
        const adjustedX = mouseX - offsetX;
        const adjustedY = mouseY - offsetY;
        updateHoveredCell({ x: Math.round(adjustedX / cellSize), y: Math.round(adjustedY / cellSize) });
      } else {
        const offsetX = ((gridOffset.current.x % cellSize) + cellSize) % cellSize;
        const offsetY = ((gridOffset.current.y % cellSize) + cellSize) % cellSize;
        const adjustedX = mouseX - offsetX;
        const adjustedY = mouseY - offsetY;
        updateHoveredCell({ x: Math.floor(adjustedX / cellSize), y: Math.floor(adjustedY / cellSize) });
      }
    };

    const handleMouseLeave = () => {
      addTrailCell();
      hoveredSquare.current = null;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    requestRef.current = requestAnimationFrame(updateAnimation);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(requestRef.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [direction, speed, borderColor, hoverFillColor, hoverColor, squareSize, size, shape, hoverTrailAmount]);

  return <canvas ref={canvasRef} className={`shapegrid-canvas ${className}`} />;
};

export default ShapeGrid;
