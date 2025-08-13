"use client";

import * as React from "react";
import { DragNumberInput } from "@/components/drag-number-input";
import { DrawSettings } from "@/components/draw-settings";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface CanvasSettingsProps {
	selectedTool: string | null;
	brushColor: string;
	onBrushColorChange: (color: string) => void;
	brushSize: number;
	onBrushSizeChange: (size: number) => void;
	zoom: number;
	onZoomChange: (zoom: number) => void;
	offsetX: number;
	offsetY: number;
	onOffsetXChange: (x: number) => void;
	onOffsetYChange: (y: number) => void;
}

export function CanvasSettings({
	selectedTool,
	brushColor,
	onBrushColorChange,
	brushSize,
	onBrushSizeChange,
	zoom,
	onZoomChange,
	offsetX,
	offsetY,
	onOffsetXChange,
	onOffsetYChange,
}: CanvasSettingsProps) {
	const [showColorPicker, setShowColorPicker] = React.useState(false);
	const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
	const isMobile = useIsMobile();

	const handleDragStart = (e: React.TouchEvent) => {
		const touch = e.touches[0];
		const startY = touch.clientY;

		const handleDragMove = (moveEvent: TouchEvent) => {
			const currentTouch = moveEvent.touches[0];
			const deltaY = startY - currentTouch.clientY;

			// If dragged up more than 50px, open the drawer
			if (deltaY > 50) {
				setIsDrawerOpen(true);
				document.removeEventListener("touchmove", handleDragMove);
				document.removeEventListener("touchend", handleDragEnd);
			}
		};

		const handleDragEnd = () => {
			document.removeEventListener("touchmove", handleDragMove);
			document.removeEventListener("touchend", handleDragEnd);
		};

		document.addEventListener("touchmove", handleDragMove, { passive: false });
		document.addEventListener("touchend", handleDragEnd);
	};

	const SettingsContent = () => (
		<div className="space-y-4">
			<div>
				<h3 className="text-sm font-medium mb-3">Canvas</h3>

				<div className="space-y-3">
					<div>
						<label
							htmlFor="zoom-level"
							className="text-xs font-medium mb-1 block"
						>
							Zoom
						</label>
						<DragNumberInput
							id="zoom-level"
							value={zoom}
							onChange={onZoomChange}
							min={0.0000001}
							max={Number.MAX_SAFE_INTEGER}
							step={0.1}
							precision={6}
							pixelsPerDoubling={30}
						/>
					</div>

					<div>
						<label
							htmlFor="offset-x"
							className="text-xs font-medium mb-1 block"
						>
							X
						</label>
						<DragNumberInput
							id="offset-x"
							value={offsetX}
							onChange={onOffsetXChange}
							min={-Number.MAX_SAFE_INTEGER}
							max={Number.MAX_SAFE_INTEGER}
							step={1}
							precision={1}
							pixelsPerDoubling={20}
						/>
					</div>

					<div>
						<label
							htmlFor="offset-y"
							className="text-xs font-medium mb-1 block"
						>
							Y
						</label>
						<DragNumberInput
							id="offset-y"
							value={offsetY}
							onChange={onOffsetYChange}
							min={-Number.MAX_SAFE_INTEGER}
							max={Number.MAX_SAFE_INTEGER}
							step={1}
							precision={1}
							pixelsPerDoubling={20}
						/>
					</div>
				</div>
			</div>

			{selectedTool === "Draw" && (
				<div className="border-t border-border pt-4">
					<h3 className="text-sm font-medium mb-3">Draw Tool</h3>

					<div className="space-y-3">
						<div>
							<label
								htmlFor="stroke-width"
								className="text-xs font-medium mb-1 block"
							>
								Stroke Width
							</label>
							<DragNumberInput
								id="stroke-width"
								value={brushSize}
								onChange={onBrushSizeChange}
								min={0.0000001}
								max={50}
								step={0.1}
								precision={7}
								pixelsPerDoubling={20}
							/>
						</div>

						<div>
							<span className="text-xs font-medium mb-2 block">
								Stroke Color
							</span>
							<button
								onClick={() => setShowColorPicker(!showColorPicker)}
								className="flex items-center gap-2 p-1 rounded hover:bg-accent transition-colors"
								type="button"
							>
								<div
									className="w-8 h-8 border border-border rounded"
									style={{ backgroundColor: brushColor }}
								/>
								<span className="text-xs font-mono">
									{brushColor.toUpperCase()}
								</span>
							</button>

							{showColorPicker && (
								<DrawSettings
									brushColor={brushColor}
									onBrushColorChange={onBrushColorChange}
									onClose={() => setShowColorPicker(false)}
								/>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
				<DrawerTrigger asChild>
					<div
						className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 cursor-pointer"
						onTouchStart={handleDragStart}
					>
						<div className="py-2 flex items-center gap-1 ">
							<div className="w-16 h-2 bg-muted rounded-full" />
							<span className="text-xs text-muted-foreground">Settings</span>
							<div className="w-16 h-2 bg-muted rounded-full" />
						</div>
					</div>
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Canvas Settings</DrawerTitle>
					</DrawerHeader>
					<div className="px-4 pb-4">
						<SettingsContent />
					</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<div className="absolute left-4 top-1/2 -translate-y-1/2 bg-background border border-border rounded-lg p-4 shadow-lg">
			<SettingsContent />
		</div>
	);
}
