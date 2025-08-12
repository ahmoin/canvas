"use client";

import { useMutation, useQuery } from "convex/react";
import * as React from "react";
import { CanvasSettings } from "@/components/canvas-settings";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

interface Point {
	x: number;
	y: number;
}

export default function Home() {
	const [selectedTool, setSelectedTool] = React.useState<string | null>("Drag");
	const [isMouseDown, setIsMouseDown] = React.useState(false);
	const [isGrabbing, setIsGrabbing] = React.useState(false);
	const [isDrawing, setIsDrawing] = React.useState(false);
	const [centerX, setCenterX] = React.useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("canvas-centerX");
			return saved ? parseFloat(saved) : 0;
		}
		return 0;
	});
	const [centerY, setCenterY] = React.useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("canvas-centerY");
			return saved ? parseFloat(saved) : 0;
		}
		return 0;
	});
	const [zoom, setZoom] = React.useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("canvas-zoom");
			return saved ? parseFloat(saved) : 1;
		}
		return 1;
	});
	const [lastMousePos, setLastMousePos] = React.useState<Point>({ x: 0, y: 0 });
	const convexPaths = useQuery(api.myFunctions.getPaths) || [];
	const addPath = useMutation(api.myFunctions.addPath);
	const [currentPath, setCurrentPath] = React.useState<Point[]>([]);
	const [brushColor, setBrushColor] = React.useState("#000000");
	const [brushSize, setBrushSize] = React.useState(2.0);
	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	const getCanvasPoint = React.useCallback(
		(clientX: number, clientY: number): Point => {
			const canvas = canvasRef.current;
			if (!canvas) return { x: 0, y: 0 };

			const rect = canvas.getBoundingClientRect();
			const screenX = clientX - rect.left;
			const screenY = clientY - rect.top;
			const worldX = centerX + (screenX - canvas.width / 2) / zoom;
			const worldY = centerY + (screenY - canvas.height / 2) / zoom;

			return { x: worldX, y: worldY };
		},
		[centerX, centerY, zoom],
	);

	const drawPaths = React.useCallback(
		(ctx: CanvasRenderingContext2D) => {
			convexPaths.forEach((path) => {
				if (path.points.length < 2) return;

				ctx.save();
				ctx.strokeStyle = path.color;
				ctx.lineWidth = Math.max(0.0000001, Math.min(50, path.width));
				ctx.lineCap = "round";
				ctx.lineJoin = "round";

				ctx.beginPath();
				ctx.moveTo(path.points[0].x, path.points[0].y);
				for (let i = 1; i < path.points.length; i++) {
					ctx.lineTo(path.points[i].x, path.points[i].y);
				}
				ctx.stroke();
				ctx.restore();
			});

			if (currentPath.length > 1) {
				ctx.save();
				ctx.strokeStyle = brushColor;
				ctx.lineWidth = Math.max(0.0000001, Math.min(50, brushSize));
				ctx.lineCap = "round";
				ctx.lineJoin = "round";

				ctx.beginPath();
				ctx.moveTo(currentPath[0].x, currentPath[0].y);
				for (let i = 1; i < currentPath.length; i++) {
					ctx.lineTo(currentPath[i].x, currentPath[i].y);
				}
				ctx.stroke();
				ctx.restore();
			}
		},
		[convexPaths, currentPath, brushColor, brushSize],
	);

	const redraw = React.useCallback(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.scale(zoom, zoom);
		ctx.translate(-centerX, -centerY);

		drawPaths(ctx);

		ctx.restore();
	}, [centerX, centerY, zoom, drawPaths]);

	const resizeCanvas = React.useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const container = canvas.parentElement;
		if (!container) return;

		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;
		redraw();
	}, [redraw]);

	React.useEffect(() => {
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);
		return () => window.removeEventListener("resize", resizeCanvas);
	}, [resizeCanvas]);

	React.useEffect(() => {
		redraw();
	}, [redraw]);

	React.useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("canvas-centerX", centerX.toString());
		}
	}, [centerX]);

	React.useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("canvas-centerY", centerY.toString());
		}
	}, [centerY]);

	React.useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("canvas-zoom", zoom.toString());
		}
	}, [zoom]);

	React.useEffect(() => {
		const preventDefaultZoom = (e: WheelEvent) => {
			if (e.ctrlKey) {
				e.preventDefault();
			}
		};

		document.addEventListener("wheel", preventDefaultZoom, { passive: false });
		return () => document.removeEventListener("wheel", preventDefaultZoom);
	}, []);

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsMouseDown(true);
		const point = getCanvasPoint(e.clientX, e.clientY);

		if (selectedTool === "Drag") {
			setIsGrabbing(true);
			setLastMousePos({ x: e.clientX, y: e.clientY });
		} else if (selectedTool === "Draw") {
			setIsDrawing(true);
			setCurrentPath([point]);
		}
	};

	const handleMouseUp = () => {
		if (isDrawing && currentPath.length > 1) {
			addPath({
				points: currentPath,
				color: brushColor,
				width: brushSize,
			});
			setCurrentPath([]);
		}

		setIsMouseDown(false);
		setIsGrabbing(false);
		setIsDrawing(false);
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (selectedTool === "Drag" && isGrabbing) {
			const deltaX = e.clientX - lastMousePos.x;
			const deltaY = e.clientY - lastMousePos.y;

			setCenterX((prev) => prev - deltaX / zoom);
			setCenterY((prev) => prev - deltaY / zoom);

			setLastMousePos({ x: e.clientX, y: e.clientY });
		} else if (selectedTool === "Draw" && isDrawing) {
			const point = getCanvasPoint(e.clientX, e.clientY);
			setCurrentPath((prev) => [...prev, point]);
		}
	};

	const handleWheel = (e: React.WheelEvent) => {
		e.preventDefault();

		if (e.ctrlKey) {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
			const newZoom = zoom * zoomFactor;

			const worldX = centerX + (mouseX - canvas.width / 2) / zoom;
			const worldY = centerY + (mouseY - canvas.height / 2) / zoom;

			setCenterX(worldX - (mouseX - canvas.width / 2) / newZoom);
			setCenterY(worldY - (mouseY - canvas.height / 2) / newZoom);

			setZoom(newZoom);
		} else if (e.shiftKey) {
			const panSpeed = 50;
			const deltaX = e.deltaY > 0 ? panSpeed : -panSpeed;

			setCenterX((prev) => prev + deltaX / zoom);
		} else {
			const panSpeed = 50;
			const deltaY = e.deltaY > 0 ? panSpeed : -panSpeed;

			setCenterY((prev) => prev + deltaY / zoom);
		}
	};

	const getCursorClass = () => {
		if (selectedTool === "Drag") {
			return isMouseDown ? "cursor-grabbing" : "cursor-grab";
		}
		return "";
	};

	return (
		<div className="min-h-screen bg-background">
			<SiteHeader onToolChange={setSelectedTool} />

			<main className="flex flex-col h-[calc(100vh-8rem)]">
				<div className="flex-1 relative overflow-hidden">
					<canvas
						ref={canvasRef}
						className={cn("size-full", getCursorClass())}
						onMouseDown={handleMouseDown}
						onMouseUp={handleMouseUp}
						onMouseMove={handleMouseMove}
						onMouseLeave={handleMouseUp}
						onWheel={handleWheel}
					/>

					<CanvasSettings
						selectedTool={selectedTool}
						brushColor={brushColor}
						onBrushColorChange={setBrushColor}
						brushSize={brushSize}
						onBrushSizeChange={setBrushSize}
						zoom={zoom}
						onZoomChange={setZoom}
						offsetX={centerX}
						offsetY={centerY}
						onOffsetXChange={setCenterX}
						onOffsetYChange={setCenterY}
					/>
				</div>
			</main>
		</div>
	);
}
