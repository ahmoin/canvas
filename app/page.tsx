"use client";

import { useMutation, useQuery } from "convex/react";
import * as React from "react";
import { DrawSettings } from "@/components/draw-settings";
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
	const [offset, setOffset] = React.useState<Point>({ x: 0, y: 0 });
	const [zoom, setZoom] = React.useState(1);
	const [lastMousePos, setLastMousePos] = React.useState<Point>({ x: 0, y: 0 });
	const convexPaths = useQuery(api.myFunctions.getPaths) || [];
	const addPath = useMutation(api.myFunctions.addPath);
	const [currentPath, setCurrentPath] = React.useState<Point[]>([]);
	const [brushColor, setBrushColor] = React.useState("#000000");
	const [brushSize, setBrushSize] = React.useState(2);
	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	const getCanvasPoint = React.useCallback(
		(clientX: number, clientY: number): Point => {
			const canvas = canvasRef.current;
			if (!canvas) return { x: 0, y: 0 };

			const rect = canvas.getBoundingClientRect();
			return {
				x: (clientX - rect.left - offset.x) / zoom,
				y: (clientY - rect.top - offset.y) / zoom,
			};
		},
		[offset, zoom],
	);

	const drawPaths = React.useCallback(
		(ctx: CanvasRenderingContext2D) => {
			convexPaths.forEach((path) => {
				if (path.points.length < 2) return;

				ctx.save();
				ctx.strokeStyle = path.color;
				ctx.lineWidth = Math.max(1, Math.min(50, path.width));
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
				ctx.lineWidth = Math.max(1, Math.min(50, brushSize));
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
		ctx.translate(offset.x, offset.y);
		ctx.scale(zoom, zoom);

		drawPaths(ctx);

		ctx.restore();
	}, [offset, zoom, drawPaths]);

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

			setOffset((prev) => ({
				x: prev.x + deltaX,
				y: prev.y + deltaY,
			}));

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

			const zoomRatio = newZoom / zoom;
			setOffset((prev) => ({
				x: mouseX - (mouseX - prev.x) * zoomRatio,
				y: mouseY - (mouseY - prev.y) * zoomRatio,
			}));

			setZoom(newZoom);
		} else if (e.shiftKey) {
			const panSpeed = 50;
			const deltaX = e.deltaY > 0 ? panSpeed : -panSpeed;

			setOffset((prev) => ({
				x: prev.x + deltaX,
				y: prev.y,
			}));
		} else {
			const panSpeed = 50;
			const deltaY = e.deltaY > 0 ? panSpeed : -panSpeed;

			setOffset((prev) => ({
				x: prev.x,
				y: prev.y + deltaY,
			}));
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

			<main className="flex flex-col h-[calc(100vh-8rem)] pt-8">
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

					{selectedTool === "Draw" && (
						<DrawSettings
							brushColor={brushColor}
							onBrushColorChange={setBrushColor}
							brushSize={brushSize}
							onBrushSizeChange={setBrushSize}
						/>
					)}
				</div>
			</main>
		</div>
	);
}
