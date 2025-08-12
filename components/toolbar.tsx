import { Hand, MousePointer2, Pencil, TypeOutline } from "lucide-react";
import * as React from "react";
import { AnimatedBackground } from "@/components/motion-primitives/animated-background";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolbarProps {
	onValueChange?: (newActiveId: string | null) => void;
}

export function Toolbar({ onValueChange }: ToolbarProps = {}) {
	const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

	const TABS = [
		{
			label: "Drag",
			icon: <Hand className="size-5" />,
		},
		{
			label: "Selection",
			icon: <MousePointer2 className="size-5" />,
		},
		{
			label: "Draw",
			icon: <Pencil className="size-5" />,
		},
		{
			label: "Text",
			icon: <TypeOutline className="size-5" />,
		},
	];

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.contentEditable === "true"
			) {
				return;
			}

			const key = event.key;
			const keyNumber = parseInt(key);

			if (keyNumber >= 1 && keyNumber <= TABS.length) {
				event.preventDefault();
				const buttonIndex = keyNumber - 1;
				buttonRefs.current[buttonIndex]?.click();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<div className="bottom-8">
			<div className="flex w-full space-x-2 rounded-xl border border-primary/10 bg-primary/10 p-2">
				<AnimatedBackground
					defaultValue={TABS[0].label}
					className="rounded-lg bg-accent"
					transition={{
						type: "spring",
						bounce: 0.2,
						duration: 0.3,
					}}
					onValueChange={onValueChange}
				>
					{TABS.map((tab, index) => (
						<div
							key={tab.label}
							data-id={tab.label}
							className="data-[checked=true]:[&_button]:text-primary data-[checked=true]:[&_span]:text-primary relative"
						>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										ref={(el) => {
											buttonRefs.current[index] = el;
										}}
										variant="ghost"
										size="icon"
										className="inline-flex size-10 items-center justify-center text-primary/50 transition-colors duration-100 focus-visible:outline-2"
									>
										{tab.icon}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>{tab.label}</p>
								</TooltipContent>
							</Tooltip>
							<span className="absolute bottom-0 right-0 flex size-4 items-center justify-center text-mono text-xs text-primary/50">
								{index + 1}
							</span>
						</div>
					))}
				</AnimatedBackground>
			</div>
		</div>
	);
}
