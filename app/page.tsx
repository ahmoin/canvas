"use client";

import * as React from "react";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

interface Point {
	x: number;
	y: number;
}

export default function Home() {
	const [selectedTool, setSelectedTool] = React.useState<string | null>("Drag");
	const [isMouseDown, setIsMouseDown] = React.useState(false);
	const [isGrabbing, setIsGrabbing] = React.useState(false);
	const [offset, setOffset] = React.useState<Point>({ x: 0, y: 0 });
	const [zoom, setZoom] = React.useState(1);
	const [lastMousePos, setLastMousePos] = React.useState<Point>({ x: 0, y: 0 });
	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	const drawGrid = React.useCallback(
		(ctx: CanvasRenderingContext2D) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			ctx.save();
			ctx.strokeStyle = "#e5e7eb";
			ctx.lineWidth = 1 / zoom;

			const gridSize = 50;
			const startX = Math.floor(-offset.x / zoom / gridSize) * gridSize;
			const startY = Math.floor(-offset.y / zoom / gridSize) * gridSize;
			const endX = startX + canvas.width / zoom + gridSize;
			const endY = startY + canvas.height / zoom + gridSize;

			for (let x = startX; x <= endX; x += gridSize) {
				ctx.beginPath();
				ctx.moveTo(x, startY);
				ctx.lineTo(x, endY);
				ctx.stroke();
			}

			for (let y = startY; y <= endY; y += gridSize) {
				ctx.beginPath();
				ctx.moveTo(startX, y);
				ctx.lineTo(endX, y);
				ctx.stroke();
			}

			ctx.restore();
		},
		[offset, zoom],
	);

	const redraw = React.useCallback(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		ctx.translate(offset.x, offset.y);
		ctx.scale(zoom, zoom);

		drawGrid(ctx);

		ctx.restore();
	}, [offset, zoom, drawGrid]);

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

		if (selectedTool === "Drag") {
			setIsGrabbing(true);
			setLastMousePos({ x: e.clientX, y: e.clientY });
		}
	};

	const handleMouseUp = () => {
		setIsMouseDown(false);
		setIsGrabbing(false);
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
			const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));

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
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/40">
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
				</div>
			</main>
		</div>
	);
}
