"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DragNumberInputProps {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	precision?: number;
	pixelsPerDoubling?: number;
	className?: string;
	id?: string;
	placeholder?: string;
	disabled?: boolean;
}

export function DragNumberInput({
	value,
	onChange,
	min = 0.0000001,
	max = 50,
	step = 0.1,
	precision = 7,
	pixelsPerDoubling = 20,
	className,
	id,
	placeholder,
	disabled = false,
}: DragNumberInputProps) {
	const [isDragging, setIsDragging] = React.useState(false);
	const [dragStartPos, setDragStartPos] = React.useState({ x: 0, y: 0 });
	const [dragStartValue, setDragStartValue] = React.useState(0);
	const [mouseDownOnInput, setMouseDownOnInput] = React.useState(false);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const handleMouseDown = (e: React.MouseEvent) => {
		if (disabled) return;

		setMouseDownOnInput(true);
		setDragStartPos({ x: e.clientX, y: e.clientY });
		setDragStartValue(value);

		e.preventDefault();
	};

	const handleDrag = React.useCallback(
		(e: MouseEvent) => {
			if (!mouseDownOnInput || disabled) return;

			const deltaX = e.clientX - dragStartPos.x;
			const deltaY = dragStartPos.y - e.clientY;
			const totalMovement = Math.abs(deltaX) + Math.abs(deltaY);

			if (totalMovement > 3 && !isDragging) {
				setIsDragging(true);
				if (inputRef.current) {
					inputRef.current.blur();
				}
				document.getSelection()?.removeAllRanges();
			}

			if (isDragging) {
				const delta = deltaX + deltaY;

				// value = startValue * (2 ^ (delta / pixelsPerDoubling))
				const exponentialMultiplier = Math.pow(2, delta / pixelsPerDoubling);
				const exponentialValue = dragStartValue * exponentialMultiplier;

				const newValue = Math.max(min, Math.min(max, exponentialValue));

				const multiplier = Math.pow(10, precision);
				const roundedValue = Math.round(newValue * multiplier) / multiplier;
				onChange(roundedValue);
			}
		},
		[
			mouseDownOnInput,
			dragStartPos.x,
			dragStartPos.y,
			isDragging,
			dragStartValue,
			pixelsPerDoubling,
			min,
			max,
			precision,
			onChange,
			disabled,
		],
	);

	React.useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (mouseDownOnInput) {
				handleDrag(e);
			}
		};

		const handleMouseUp = () => {
			if (mouseDownOnInput && !isDragging && inputRef.current && !disabled) {
				inputRef.current.focus();
				inputRef.current.select();
			}

			setIsDragging(false);
			setMouseDownOnInput(false);
		};

		if (mouseDownOnInput) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [mouseDownOnInput, isDragging, handleDrag, disabled]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (disabled) return;

		const inputValue = parseFloat(e.target.value);
		const clampedValue = Math.max(min, Math.min(max, inputValue || min));
		onChange(clampedValue);
	};

	return (
		<input
			ref={inputRef}
			id={id}
			type="number"
			min={min}
			max={max}
			step={step}
			value={value}
			onChange={handleInputChange}
			onMouseDown={handleMouseDown}
			placeholder={placeholder}
			disabled={disabled}
			className={cn(
				"w-full px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-ns-resize select-none",
				disabled && "opacity-50 cursor-not-allowed",
				className,
			)}
		/>
	);
}
