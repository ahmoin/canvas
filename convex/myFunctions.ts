import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const pointSchema = v.object({
	x: v.number(),
	y: v.number(),
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
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const user = await ctx.db.get(userId);
		if (!user?.uniqueName) throw new Error("User must have a unique name set");

		const clampedWidth = Math.max(0.0000001, Math.min(50, args.width));

		return await ctx.db.insert("paths", {
			points: args.points,
			color: args.color,
			width: clampedWidth,
			createdAt: Date.now(),
			authorId: userId,
			authorName: user.uniqueName,
		});
	},
});

export const updatePath = mutation({
	args: {
		pathId: v.id("paths"),
		color: v.optional(v.string()),
		width: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const path = await ctx.db.get(args.pathId);
		if (!path) throw new Error("Path not found");

		if (path.authorId !== userId)
			throw new Error("Not authorized to edit this path");

		const updates: Partial<{ color: string; width: number }> = {};
		if (args.color !== undefined) updates.color = args.color;
		if (args.width !== undefined)
			updates.width = Math.max(0.0000001, Math.min(50, args.width));

		await ctx.db.patch(args.pathId, updates);
		return { success: true };
	},
});

export const clearInvalidPaths = mutation({
	args: {},
	handler: async (ctx) => {
		const paths = await ctx.db.query("paths").collect();
		let deletedCount = 0;

		for (const path of paths) {
			if (!path.authorId || !path.authorName) {
				await ctx.db.delete(path._id);
				deletedCount++;
			}
		}

		return { deletedCount };
	},
});

export const clearAllPaths = mutation({
	args: {},
	handler: async (ctx) => {
		const paths = await ctx.db.query("paths").collect();
		for (const path of paths) {
			await ctx.db.delete(path._id);
		}
		return { deletedCount: paths.length };
	},
});
