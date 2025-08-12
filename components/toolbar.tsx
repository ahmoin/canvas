import { Hand, MousePointer2, Pencil, TypeOutline } from "lucide-react";
import { AnimatedBackground } from "@/components/motion-primitives/animated-background";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export function Toolbar() {
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
				>
					{TABS.map((tab) => (
						<Tooltip key={tab.label}>
							<TooltipTrigger asChild>
								<Button
									data-id={tab.label}
									variant="ghost"
									size="icon"
									className="inline-flex size-10 items-center justify-center text-primary/50 transition-colors duration-100 focus-visible:outline-2 data-[checked=true]:text-primary-foreground"
								>
									{tab.icon}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{tab.label}</p>
							</TooltipContent>
						</Tooltip>
					))}
				</AnimatedBackground>
			</div>
		</div>
	);
}
