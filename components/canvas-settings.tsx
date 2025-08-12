"use client";

import * as React from "react";
import { DragNumberInput } from "@/components/drag-number-input";
import { DrawSettings } from "@/components/draw-settings";

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

	const handleColorSelectionComplete = () => {
		setShowColorPicker(false);
	};
	return (
		<div className="absolute left-4 top-1/2 -translate-y-1/2 bg-background border border-border rounded-lg p-4 shadow-lg space-y-4">
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
									onColorSelectionComplete={handleColorSelectionComplete}
									onClose={() => setShowColorPicker(false)}
								/>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
