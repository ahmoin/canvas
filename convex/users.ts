import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const viewer = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		return userId !== null ? ctx.db.get(userId) : null;
	},
});

export const updateUniqueName = mutation({
	args: { uniqueName: v.string() },
	handler: async (ctx, { uniqueName }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_uniqueName", (q) => q.eq("uniqueName", uniqueName))
			.first();

		if (existingUser && existingUser._id !== userId) {
			throw new Error("Username is already taken");
		}

		await ctx.db.patch(userId, { uniqueName });
		return { success: true };
	},
});
