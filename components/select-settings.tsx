"use client";

import { X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { DragNumberInput } from "@/components/drag-number-input";

interface SelectSettingsProps {
	selectedPath: {
		_id: string;
		color: string;
		width: number;
		authorName: string;
	};
	onColorChange: (color: string) => void;
	onWidthChange: (width: number) => void;
	onClose?: () => void;
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
	const c = v * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = v - c;

	let r = 0,
		g = 0,
		b = 0;

	if (0 <= h && h < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (60 <= h && h < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (120 <= h && h < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (180 <= h && h < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (240 <= h && h < 300) {
		r = x;
		g = 0;
		b = c;
	} else if (300 <= h && h < 360) {
		r = c;
		g = 0;
		b = x;
	}

	return [
		Math.round((r + m) * 255),
		Math.round((g + m) * 255),
		Math.round((b + m) * 255),
	];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const diff = max - min;

	let h = 0;
	if (diff !== 0) {
		if (max === r) {
			h = ((g - b) / diff) % 6;
		} else if (max === g) {
			h = (b - r) / diff + 2;
		} else {
			h = (r - g) / diff + 4;
		}
	}
	h = Math.round(h * 60);
	if (h < 0) h += 360;

	const s = max === 0 ? 0 : diff / max;
	const v = max;

	return [h, s, v];
}

function hexToRgb(hex: string): [number, number, number] {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? [
				parseInt(result[1], 16),
				parseInt(result[2], 16),
				parseInt(result[3], 16),
			]
		: [0, 0, 0];
}

function rgbToHex(r: number, g: number, b: number): string {
	return (
		"#" +
		[r, g, b]
			.map((x) => {
				const hex = x.toString(16);
				return hex.length === 1 ? `0${hex}` : hex;
			})
			.join("")
	);
}

export function SelectSettings({
	selectedPath,
	onColorChange,
	onWidthChange,
	onClose,
}: SelectSettingsProps) {
	const [rgb] = React.useState(() => hexToRgb(selectedPath.color));
	const [hsv, setHsv] = React.useState(() => rgbToHsv(rgb[0], rgb[1], rgb[2]));
	const [isDraggingSV, setIsDraggingSV] = React.useState(false);
	const [isDraggingHue, setIsDraggingHue] = React.useState(false);
	const svRef = React.useRef<HTMLButtonElement>(null);
	const hueRef = React.useRef<HTMLButtonElement>(null);

	const updateColor = React.useCallback(
		(newHsv: [number, number, number]) => {
			const [r, g, b] = hsvToRgb(newHsv[0], newHsv[1], newHsv[2]);
			const hex = rgbToHex(r, g, b);
			onColorChange(hex);
			setHsv(newHsv);
		},
		[onColorChange],
	);

	const handleSVMouseDown = (e: React.MouseEvent) => {
		setIsDraggingSV(true);
		handleSVMove(e);
	};

	const handleSVMove = (e: React.MouseEvent | MouseEvent) => {
		if (!svRef.current) return;

		const rect = svRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		const y = Math.max(
			0,
			Math.min(1, 1 - (e.clientY - rect.top) / rect.height),
		);

		updateColor([hsv[0], x, y]);
	};

	const handleHueMouseDown = (e: React.MouseEvent) => {
		setIsDraggingHue(true);
		handleHueMove(e);
	};

	const handleHueMove = (e: React.MouseEvent | MouseEvent) => {
		if (!hueRef.current) return;

		const rect = hueRef.current.getBoundingClientRect();
		const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
		const hue = y * 360;

		updateColor([hue, hsv[1], hsv[2]]);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: handle color change dependencies change on every re-render and should not be used as hook dependencies
	React.useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (isDraggingSV) {
				handleSVMove(e);
			} else if (isDraggingHue) {
				handleHueMove(e);
			}
		};

		const handleMouseUp = () => {
			setIsDraggingSV(false);
			setIsDraggingHue(false);
		};

		if (isDraggingSV || isDraggingHue) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDraggingSV, isDraggingHue]);

	const svStyle = {
		background: `linear-gradient(to bottom, transparent 0%, black 100%), linear-gradient(to right, white 0%, transparent 100%)`,
		backgroundColor: `hsl(${hsv[0]}, 100%, 50%)`,
		backgroundSize: "100% 100%",
		backgroundRepeat: "no-repeat",
		backgroundPosition: "0 0",
	};

	const hueBackground =
		"linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)";

	return (
		<div className="absolute left-4 top-1/2 -translate-y-1/2 bg-background border border-border rounded-lg p-4 shadow-lg">
			<div className="flex items-center justify-between mb-3">
				<div>
					<h3 className="text-sm font-medium">Edit Path</h3>
					<p className="text-xs text-muted-foreground">
						by {selectedPath.authorName}
					</p>
				</div>
				{onClose && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent"
						aria-label="Close path editor"
					>
						<X />
					</Button>
				)}
			</div>

			<div className="flex gap-3 mb-4">
				<div className="relative">
					<button
						ref={svRef}
						type="button"
						className="size-32 cursor-crosshair rounded relative overflow-hidden"
						style={svStyle}
						onMouseDown={handleSVMouseDown}
						aria-label="Select saturation and brightness"
					>
						<div
							className="absolute w-3 h-3 border-2 border-white rounded-full shadow-md pointer-events-none"
							style={{
								left: `${hsv[1] * 100}%`,
								top: `${(1 - hsv[2]) * 100}%`,
								transform: "translate(-50%, -50%)",
							}}
						/>
					</button>
				</div>
				<div className="relative">
					<button
						ref={hueRef}
						type="button"
						className="w-6 h-32 cursor-crosshair border border-border rounded p-0 relative"
						style={{ background: hueBackground }}
						onMouseDown={handleHueMouseDown}
						aria-label="Select hue"
					>
						<div
							className="absolute w-full h-1 border border-white shadow-md pointer-events-none"
							style={{
								top: `${(hsv[0] / 360) * 100}%`,
								transform: "translateY(-50%)",
							}}
						/>
					</button>
				</div>
			</div>

			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<div
						className="w-6 h-6 border border-border rounded"
						style={{ backgroundColor: selectedPath.color }}
					/>
					<span className="text-xs font-mono">
						{selectedPath.color.toUpperCase()}
					</span>
				</div>

				<div className="space-y-2">
					<span className="text-xs font-medium">Stroke Width</span>
					<DragNumberInput
						value={selectedPath.width}
						onChange={onWidthChange}
						min={0.5}
						max={20}
						step={0.1}
						precision={1}
						className="w-full"
					/>
				</div>
			</div>
		</div>
	);
}
