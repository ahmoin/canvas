"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import { ModeSwitcher } from "@/components/mode-switcher";
import { Toolbar } from "@/components/toolbar";

interface SiteHeaderProps {
	onToolChange?: (newActiveId: string | null) => void;
}

export function SiteHeader({ onToolChange }: SiteHeaderProps = {}) {
	return (
		<header className="sticky top-0 z-10 bg-background p-4 border-b-2 flex flex-row justify-between items-center">
			<div className="flex items-center justify-between w-full gap-8">
				<Link href="/">
					<div className="flex flex-row items-center gap-2">
						<div className="text-primary-foreground flex size-8 items-center justify-center rounded-md">
							<Icons.logo className="size-8" />
						</div>
						<span className="text-xl font-bold text-primary">Canvas</span>
					</div>
				</Link>

				<Toolbar onValueChange={onToolChange} />

				<ModeSwitcher />
			</div>
		</header>
	);
}
