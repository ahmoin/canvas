"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import * as React from "react";
import { toast } from "sonner";
import { CanvasSettings } from "@/components/canvas-settings";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

interface Point {
	x: number;
	y: number;
}

export default function Home() {
	const { isAuthenticated } = useConvexAuth();
	const { signIn } = useAuthActions();
	const [selectedTool, setSelectedTool] = React.useState<string | null>("Drag");
	const [showAuthModal, setShowAuthModal] = React.useState(false);
	const [authFlow, setAuthFlow] = React.useState<"signIn" | "signUp">("signUp");
	const [showNameModal, setShowNameModal] = React.useState(false);
	const [nameInput, setNameInput] = React.useState("");
	const [isMouseDown, setIsMouseDown] = React.useState(false);
	const [isGrabbing, setIsGrabbing] = React.useState(false);
	const [isDrawing, setIsDrawing] = React.useState(false);
	const [centerX, setCenterX] = React.useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("canvas-centerX");
			return saved ? parseFloat(saved) : 0;
		}
		return 0;
	});
	const [centerY, setCenterY] = React.useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("canvas-centerY");
			return saved ? parseFloat(saved) : 0;
		}
		return 0;
	});
	const [zoom, setZoom] = React.useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("canvas-zoom");
			return saved ? parseFloat(saved) : 1;
		}
		return 1;
	});
	const [lastMousePos, setLastMousePos] = React.useState<Point>({ x: 0, y: 0 });
	const convexPathsQuery = useQuery(api.myFunctions.getPaths);
	const convexPaths = React.useMemo(
		() => convexPathsQuery || [],
		[convexPathsQuery],
	);
	const addPath = useMutation(api.myFunctions.addPath);
	const currentUser = useQuery(api.users.viewer);
	const updateUniqueName = useMutation(api.users.updateUniqueName);
	const [currentPath, setCurrentPath] = React.useState<Point[]>([]);
	const [brushColor, setBrushColor] = React.useState("#000000");
	const [brushSize, setBrushSize] = React.useState(2.0);
	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	const getCanvasPoint = React.useCallback(
		(clientX: number, clientY: number): Point => {
			const canvas = canvasRef.current;
			if (!canvas) return { x: 0, y: 0 };

			const rect = canvas.getBoundingClientRect();
			const screenX = clientX - rect.left;
			const screenY = clientY - rect.top;
			const worldX = centerX + (screenX - canvas.width / 2) / zoom;
			const worldY = centerY + (screenY - canvas.height / 2) / zoom;

			return { x: worldX, y: worldY };
		},
		[centerX, centerY, zoom],
	);

	const drawPaths = React.useCallback(
		(ctx: CanvasRenderingContext2D) => {
			convexPaths.forEach((path) => {
				if (path.points.length < 2) return;

				ctx.save();
				ctx.strokeStyle = path.color;
				ctx.lineWidth = Math.max(0.0000001, Math.min(50, path.width));
				ctx.lineCap = "round";
				ctx.lineJoin = "round";

				ctx.beginPath();
				ctx.moveTo(path.points[0].x, path.points[0].y);
				for (let i = 1; i < path.points.length; i++) {
					ctx.lineTo(path.points[i].x, path.points[i].y);
				}
				ctx.stroke();
				ctx.restore();
			});

			if (currentPath.length > 1) {
				ctx.save();
				ctx.strokeStyle = brushColor;
				ctx.lineWidth = Math.max(0.0000001, Math.min(50, brushSize));
				ctx.lineCap = "round";
				ctx.lineJoin = "round";

				ctx.beginPath();
				ctx.moveTo(currentPath[0].x, currentPath[0].y);
				for (let i = 1; i < currentPath.length; i++) {
					ctx.lineTo(currentPath[i].x, currentPath[i].y);
				}
				ctx.stroke();
				ctx.restore();
			}
		},
		[convexPaths, currentPath, brushColor, brushSize],
	);

	const redraw = React.useCallback(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.scale(zoom, zoom);
		ctx.translate(-centerX, -centerY);

		drawPaths(ctx);

		ctx.restore();
	}, [centerX, centerY, zoom, drawPaths]);

	const resizeCanvas = React.useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const container = canvas.parentElement;
		if (!container) return;

		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;
		redraw();
	}, [redraw]);

	React.useEffect(() => {
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);
		return () => window.removeEventListener("resize", resizeCanvas);
	}, [resizeCanvas]);

	React.useEffect(() => {
		redraw();
	}, [redraw]);

	React.useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("canvas-centerX", centerX.toString());
		}
	}, [centerX]);

	React.useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("canvas-centerY", centerY.toString());
		}
	}, [centerY]);

	React.useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("canvas-zoom", zoom.toString());
		}
	}, [zoom]);

	React.useEffect(() => {
		const preventDefaultZoom = (e: WheelEvent) => {
			if (e.ctrlKey) {
				e.preventDefault();
			}
		};

		document.addEventListener("wheel", preventDefaultZoom, { passive: false });
		return () => document.removeEventListener("wheel", preventDefaultZoom);
	}, []);

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsMouseDown(true);
		const point = getCanvasPoint(e.clientX, e.clientY);

		if (selectedTool === "Drag") {
			setIsGrabbing(true);
			setLastMousePos({ x: e.clientX, y: e.clientY });
		} else if (selectedTool === "Draw") {
			if (!isAuthenticated) {
				setShowAuthModal(true);
				return;
			}
			if (!currentUser?.uniqueName) {
				setShowNameModal(true);
				return;
			}
			setIsDrawing(true);
			setCurrentPath([point]);
		}
	};

	const handleMouseUp = () => {
		if (isDrawing && currentPath.length > 1) {
			addPath({
				points: currentPath,
				color: brushColor,
				width: brushSize,
			});
			setCurrentPath([]);
		}

		setIsMouseDown(false);
		setIsGrabbing(false);
		setIsDrawing(false);
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (selectedTool === "Drag" && isGrabbing) {
			const deltaX = e.clientX - lastMousePos.x;
			const deltaY = e.clientY - lastMousePos.y;

			setCenterX((prev) => prev - deltaX / zoom);
			setCenterY((prev) => prev - deltaY / zoom);

			setLastMousePos({ x: e.clientX, y: e.clientY });
		} else if (selectedTool === "Draw" && isDrawing) {
			const point = getCanvasPoint(e.clientX, e.clientY);
			setCurrentPath((prev) => [...prev, point]);
		}
	};

	const handleWheel = (e: React.WheelEvent) => {
		e.preventDefault();

		if (e.ctrlKey) {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
			const newZoom = zoom * zoomFactor;

			const worldX = centerX + (mouseX - canvas.width / 2) / zoom;
			const worldY = centerY + (mouseY - canvas.height / 2) / zoom;

			setCenterX(worldX - (mouseX - canvas.width / 2) / newZoom);
			setCenterY(worldY - (mouseY - canvas.height / 2) / newZoom);

			setZoom(newZoom);
		} else if (e.shiftKey) {
			const panSpeed = 50;
			const deltaX = e.deltaY > 0 ? panSpeed : -panSpeed;

			setCenterX((prev) => prev + deltaX / zoom);
		} else {
			const panSpeed = 50;
			const deltaY = e.deltaY > 0 ? panSpeed : -panSpeed;

			setCenterY((prev) => prev + deltaY / zoom);
		}
	};

	const getCursorClass = () => {
		if (selectedTool === "Drag") {
			return isMouseDown ? "cursor-grabbing" : "cursor-grab";
		}
		return "";
	};

	return (
		<div className="min-h-screen bg-background">
			<SiteHeader
				onToolChange={setSelectedTool}
				onSignUpClick={() => setShowAuthModal(true)}
			/>

			<main className="flex flex-col h-[calc(100vh-8rem)]">
				<div className="flex-1 relative overflow-hidden">
					<canvas
						ref={canvasRef}
						className={cn("size-full", getCursorClass())}
						onMouseDown={handleMouseDown}
						onMouseUp={handleMouseUp}
						onMouseMove={handleMouseMove}
						onMouseLeave={handleMouseUp}
						onWheel={handleWheel}
					/>

					<CanvasSettings
						selectedTool={selectedTool}
						brushColor={brushColor}
						onBrushColorChange={setBrushColor}
						brushSize={brushSize}
						onBrushSizeChange={setBrushSize}
						zoom={zoom}
						onZoomChange={setZoom}
						offsetX={centerX}
						offsetY={centerY}
						onOffsetXChange={setCenterX}
						onOffsetYChange={setCenterY}
					/>

					<Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									{authFlow === "signIn" ? "Login" : "Sign up"} to draw
								</DialogTitle>
								<DialogDescription>
									Please {authFlow === "signIn" ? "login" : "sign up"} to start
									drawing and save your work. You can explore the canvas without{" "}
									{authFlow === "signIn" ? "logging in" : "signing up"}.
								</DialogDescription>
							</DialogHeader>
							<div className="flex flex-col gap-4">
								<Button
									onClick={async () => {
										try {
											await signIn("google");
											setShowAuthModal(false);
										} catch (error) {
											console.error("Sign in failed:", error);
										}
									}}
									variant="outline"
									className="w-full"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										className="w-4 h-4 mr-2"
									>
										<title>Google</title>
										<path
											d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
											fill="currentColor"
										/>
									</svg>
									Login with Google
								</Button>
								<div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
									<span className="relative z-10 bg-background px-2 text-muted-foreground">
										Or continue with
									</span>
								</div>

								<form
									onSubmit={async (e) => {
										e.preventDefault();
										const formData = new FormData(e.target as HTMLFormElement);
										formData.set("flow", authFlow);

										try {
											await signIn("password", formData);
											toast.success("Signed in successfully!");
											setShowAuthModal(false);
										} catch (error) {
											console.warn(error);
											toast.error(
												authFlow === "signIn"
													? "Could not login, did you mean to sign up?"
													: "Could not sign up, try making a stronger password or signing if you already have an account.",
											);
										}
									}}
								>
									<div className="grid gap-4">
										<div className="grid gap-2">
											<Label htmlFor="email">Email</Label>
											<Input
												id="email"
												type="email"
												name="email"
												placeholder="m@example.com"
												required
											/>
										</div>
										<div className="grid gap-2">
											<Label htmlFor="password">Password</Label>
											<Input
												id="password"
												type="password"
												name="password"
												required
											/>
										</div>
										<Button type="submit" className="w-full">
											{authFlow === "signIn" ? "Login" : "Sign Up"}
										</Button>
									</div>
								</form>

								<div className="text-center text-sm">
									{authFlow === "signIn"
										? "Don't have an account? "
										: "Already have an account? "}
									<button
										type="button"
										onClick={() =>
											setAuthFlow(authFlow === "signIn" ? "signUp" : "signIn")
										}
										className="underline underline-offset-4 hover:text-primary"
									>
										{authFlow === "signIn"
											? "Sign up instead"
											: "Login instead"}
									</button>
								</div>
							</div>
						</DialogContent>
					</Dialog>

					<Dialog open={showNameModal} onOpenChange={setShowNameModal}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Set your username to start drawing</DialogTitle>
								<DialogDescription>
									Please choose an username to identify your drawings. This name
									will be visible to other users.
								</DialogDescription>
							</DialogHeader>
							<form
								onSubmit={async (e) => {
									e.preventDefault();
									if (!nameInput.trim()) {
										toast.error("Name cannot be empty");
										return;
									}

									try {
										await updateUniqueName({ uniqueName: nameInput.trim() });
										setShowNameModal(false);
										setNameInput("");
										toast.success("Name set successfully!");
									} catch (error) {
										const errorMessage =
											error instanceof Error
												? error.message
														.split("Uncaught Error: ")[1]
														?.split(" at handler")[0] || error.message
												: "Failed to set name";
										toast.error(errorMessage);
									}
								}}
							>
								<div className="grid gap-4">
									<div className="grid gap-2">
										<Label htmlFor="uniqueName">Your username</Label>
										<Input
											id="uniqueName"
											type="text"
											value={nameInput}
											onChange={(e) => {
												setNameInput(e.target.value);
											}}
											placeholder="Enter your username"
											required
										/>
									</div>
									<Button type="submit" className="w-full">
										Set username
									</Button>
								</div>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</main>
		</div>
	);
}
