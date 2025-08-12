import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const pointSchema = v.object({
	x: v.number(),
	y: v.number(),
});

const pathSchema = v.object({
	points: v.array(pointSchema),
	color: v.string(),
	width: v.number(),
});

export const getPaths = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("paths").collect();
	},
});

export const addPath = mutation({
	args: {
		points: v.array(pointSchema),
		color: v.string(),
		width: v.number(),
	},
	handler: async (ctx, args) => {
		const clampedWidth = Math.max(0.0000001, Math.min(50, args.width));

		return await ctx.db.insert("paths", {
			points: args.points,
			color: args.color,
			width: clampedWidth,
			createdAt: Date.now(),
		});
	},
});

// export const clearPaths = mutation({
//   args: {},
//   handler: async (ctx) => {
//     const paths = await ctx.db.query("paths").collect();
//     for (const path of paths) {
//       await ctx.db.delete(path._id);
//     }
//   },
// });
