import {
	Geist_Mono as FontMono,
	Merriweather as FontSans,
	Inter,
} from "next/font/google";

import { cn } from "@/lib/utils";

const fontSans = FontSans({
	subsets: ["latin"],
	weight: ["300", "400", "700", "900"],
});

const fontMono = FontMono({
	subsets: ["latin"],
	variable: "--font-mono",
	weight: ["400"],
});

const fontInter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const fontVariables = cn(
	fontSans,
	fontMono.variable,
	fontInter.variable,
);
