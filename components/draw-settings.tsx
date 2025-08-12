"use client";

import * as React from "react";

interface DrawSettingsProps {
	brushColor: string;
	onBrushColorChange: (color: string) => void;
	brushSize: number;
	onBrushSizeChange: (size: number) => void;
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

export function DrawSettings({
	brushColor,
	onBrushColorChange,
	brushSize,
	onBrushSizeChange,
}: DrawSettingsProps) {
	const [rgb] = React.useState(() => hexToRgb(brushColor));
	const [hsv, setHsv] = React.useState(() => rgbToHsv(rgb[0], rgb[1], rgb[2]));
	const [isDraggingSV, setIsDraggingSV] = React.useState(false);
	const [isDraggingHue, setIsDraggingHue] = React.useState(false);
	const [isDraggingSize, setIsDraggingSize] = React.useState(false);
	const [dragStartPos, setDragStartPos] = React.useState({ x: 0, y: 0 });
	const [dragStartValue, setDragStartValue] = React.useState(0);
	const [mouseDownOnInput, setMouseDownOnInput] = React.useState(false);
	const svRef = React.useRef<HTMLButtonElement>(null);
	const hueRef = React.useRef<HTMLButtonElement>(null);
	const sizeInputRef = React.useRef<HTMLInputElement>(null);

	const updateColor = React.useCallback(
		(newHsv: [number, number, number]) => {
			const [r, g, b] = hsvToRgb(newHsv[0], newHsv[1], newHsv[2]);
			const hex = rgbToHex(r, g, b);
			onBrushColorChange(hex);
			setHsv(newHsv);
		},
		[onBrushColorChange],
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

	const handleSizeMouseDown = (e: React.MouseEvent) => {
		setMouseDownOnInput(true);
		setDragStartPos({ x: e.clientX, y: e.clientY });
		setDragStartValue(brushSize);

		e.preventDefault();
	};

	const handleSizeDrag = React.useCallback(
		(e: MouseEvent) => {
			if (!mouseDownOnInput) return;

			const deltaX = e.clientX - dragStartPos.x;
			const deltaY = dragStartPos.y - e.clientY;
			const totalMovement = Math.abs(deltaX) + Math.abs(deltaY);

			if (totalMovement > 3 && !isDraggingSize) {
				setIsDraggingSize(true);
				if (sizeInputRef.current) {
					sizeInputRef.current.blur();
				}
				document.getSelection()?.removeAllRanges();
			}

			if (isDraggingSize) {
				const delta = deltaX + deltaY;

				// value = startValue * (2 ^ (delta / pixelsPerDoubling))
				const pixelsPerDoubling = 20;
				const exponentialMultiplier = Math.pow(2, delta / pixelsPerDoubling);
				const exponentialValue = dragStartValue * exponentialMultiplier;

				const newValue = Math.max(0.0000001, Math.min(50, exponentialValue));

				const roundedValue = Math.round(newValue * 10000000) / 10000000;
				onBrushSizeChange(roundedValue);
			}
		},
		[
			mouseDownOnInput,
			dragStartPos.x,
			dragStartPos.y,
			isDraggingSize,
			dragStartValue,
			onBrushSizeChange,
		],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: handle color change dependencies change on every re-render and should not be used as hook dependencies
	React.useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (isDraggingSV) {
				handleSVMove(e);
			} else if (isDraggingHue) {
				handleHueMove(e);
			} else if (mouseDownOnInput) {
				handleSizeDrag(e);
			}
		};

		const handleMouseUp = () => {
			if (mouseDownOnInput && !isDraggingSize && sizeInputRef.current) {
				sizeInputRef.current.focus();
				sizeInputRef.current.select();
			}

			setIsDraggingSV(false);
			setIsDraggingHue(false);
			setIsDraggingSize(false);
			setMouseDownOnInput(false);
		};

		if (isDraggingSV || isDraggingHue || mouseDownOnInput) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [
		isDraggingSV,
		isDraggingHue,
		isDraggingSize,
		mouseDownOnInput,
		dragStartPos,
		dragStartValue,
		brushSize,
		onBrushSizeChange,
	]);

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
			<h3 className="text-sm font-medium mb-3">Stroke Color</h3>

			<div className="flex gap-3">
				<div className="relative">
					<button
						ref={svRef}
						type="button"
						className="size-48 cursor-crosshair rounded relative overflow-hidden"
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
						className="w-6 h-48 cursor-crosshair border border-border rounded p-0 relative"
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

			<div className="mt-3 flex items-center gap-2">
				<div
					className="w-8 h-8 border border-border rounded"
					style={{ backgroundColor: brushColor }}
				/>
				<span className="text-xs font-mono">{brushColor.toUpperCase()}</span>
			</div>

			<div className="mt-3">
				<label
					htmlFor="stroke-width"
					className="text-sm font-medium mb-2 block"
				>
					Stroke Width
				</label>
				<input
					ref={sizeInputRef}
					id="stroke-width"
					type="number"
					min="0.0000001"
					max="50"
					step="0.1"
					value={brushSize}
					onChange={(e) => {
						const value = Math.max(
							0.0000001,
							Math.min(50, parseFloat(e.target.value) || 0.0000001),
						);
						onBrushSizeChange(value);
					}}
					onMouseDown={handleSizeMouseDown}
					className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-ns-resize select-none"
				/>
			</div>
		</div>
	);
}
