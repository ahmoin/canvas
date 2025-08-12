"use client";

import Image from "next/image";
import Link from "next/link";
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
							<Image
								className="size-8"
								src="/canvas.svg"
								alt="Canvas logo"
								width={48}
								height={48}
							/>
						</div>
						<span className="text-xl font-bold text-primary">Canvas</span>
					</div>
				</Link>

				<Toolbar onValueChange={onToolChange} />

				<div className="w-28"></div>
			</div>
		</header>
	);
}
