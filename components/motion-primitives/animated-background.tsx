"use client";
import { AnimatePresence, motion, type Transition } from "motion/react";
import * as React from "react";
import { cn } from "@/lib/utils";

export type AnimatedBackgroundProps = {
	children:
		| React.ReactElement<{ "data-id": string }>[]
		| React.ReactElement<{ "data-id": string }>;
	defaultValue?: string;
	onValueChange?: (newActiveId: string | null) => void;
	className?: string;
	transition?: Transition;
	enableHover?: boolean;
};

export function AnimatedBackground({
	children,
	defaultValue,
	onValueChange,
	className,
	transition,
	enableHover = false,
}: AnimatedBackgroundProps) {
	const [activeId, setActiveId] = React.useState<string | null>(null);
	const uniqueId = React.useId();

	const handleSetActiveId = (id: string | null) => {
		setActiveId(id);

		if (onValueChange) {
			onValueChange(id);
		}
	};

	React.useEffect(() => {
		if (defaultValue !== undefined) {
			setActiveId(defaultValue);
		}
	}, [defaultValue]);

	// biome-ignore lint/suspicious/noExplicitAny: needed for motion
	return React.Children.map(children, (child: any, index) => {
		const id = child.props["data-id"];

		const interactionProps = enableHover
			? {
					onMouseEnter: () => handleSetActiveId(id),
					onMouseLeave: () => handleSetActiveId(null),
				}
			: {
					onClick: () => handleSetActiveId(id),
				};

		return React.cloneElement(
			child,
			{
				// biome-ignore lint/suspicious/noArrayIndexKey: needed for motion
				key: index,
				className: cn("relative inline-flex", child.props.className),
				"data-checked": activeId === id ? "true" : "false",
				...interactionProps,
			},
			<>
				<AnimatePresence initial={false}>
					{activeId === id && (
						<motion.div
							layoutId={`background-${uniqueId}`}
							className={cn("absolute inset-0", className)}
							transition={transition}
							initial={{ opacity: defaultValue ? 1 : 0 }}
							animate={{
								opacity: 1,
							}}
							exit={{
								opacity: 0,
							}}
						/>
					)}
				</AnimatePresence>
				<div className="z-10">{child.props.children}</div>
			</>,
		);
	});
}
