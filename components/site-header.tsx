"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Icons } from "@/components/icons";
import { ModeSwitcher } from "@/components/mode-switcher";
import { Toolbar } from "@/components/toolbar";
import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
	onToolChange?: (newActiveId: string | null) => void;
	onSignUpClick?: () => void;
}

export function SiteHeader({
	onToolChange,
	onSignUpClick,
}: SiteHeaderProps = {}) {
	const router = useRouter();
	const { isAuthenticated } = useConvexAuth();
	const { signOut } = useAuthActions();

	return (
		<header className="sticky top-0 z-10 bg-background p-4 border-b-2 flex flex-row justify-between items-center">
			<div className="flex items-center justify-between w-full gap-8">
				<Link href="/">
					<div className="flex flex-row items-center gap-2">
						<div className="text-primary-foreground flex size-8 items-center justify-center rounded-md">
							<Icons.logo className="size-8" />
						</div>
						<span className="text-xl font-bold text-primary hidden sm:block">
							Canvas
						</span>
					</div>
				</Link>

				<Toolbar onValueChange={onToolChange} />

				<div className="flex items-center gap-4">
					{isAuthenticated ? (
						<Button
							variant="outline"
							onClick={() =>
								void signOut().then(() => {
									router.push("/");
								})
							}
						>
							Logout
						</Button>
					) : (
						<Button variant="default" onClick={onSignUpClick}>
							Sign Up
						</Button>
					)}
					<ModeSwitcher />
				</div>
			</div>
		</header>
	);
}
