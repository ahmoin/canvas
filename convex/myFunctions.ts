import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 300;
const MAX_PATHS_PER_BATCH = 50;

async function checkRateLimit(
	ctx: MutationCtx,
	userId: Id<"users">,
	uniqueName: string,
	requestCost: number = 1,
) {
	const now = Date.now();
	const windowStart =
		Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;

	const existingLimit = await ctx.db
		.query("rateLimits")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.first();

	if (existingLimit) {
		if (existingLimit.windowStart === windowStart) {
			if (existingLimit.requestCount + requestCost > MAX_REQUESTS_PER_WINDOW) {
				const resetTime = windowStart + RATE_LIMIT_WINDOW_MS;
				const waitTime = Math.ceil((resetTime - now) / 1000);
				throw new Error(
					`Rate limit exceeded for user ${uniqueName}. Try again in ${waitTime} seconds.`,
				);
			}

			await ctx.db.patch(existingLimit._id, {
				requestCount: existingLimit.requestCount + requestCost,
				lastRequest: now,
			});
		} else {
			await ctx.db.patch(existingLimit._id, {
				windowStart,
				requestCount: requestCost,
				lastRequest: now,
			});
		}
	} else {
		await ctx.db.insert("rateLimits", {
			userId,
			uniqueName,
			windowStart,
			requestCount: requestCost,
			lastRequest: now,
		});
	}
}

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

		await checkRateLimit(ctx, userId, user.uniqueName, 1);

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

export const addPaths = mutation({
	args: {
		paths: v.array(
			v.object({
				points: v.array(pointSchema),
				color: v.string(),
				width: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const user = await ctx.db.get(userId);
		if (!user?.uniqueName) throw new Error("User must have a unique name set");

		if (args.paths.length > MAX_PATHS_PER_BATCH) {
			throw new Error(
				`Batch size too large. Maximum ${MAX_PATHS_PER_BATCH} paths allowed per request.`,
			);
		}

		await checkRateLimit(ctx, userId, user.uniqueName, args.paths.length);

		const createdAt = Date.now();
		const insertedIds = [];

		for (const path of args.paths) {
			const clampedWidth = Math.max(0.0000001, Math.min(50, path.width));

			const id = await ctx.db.insert("paths", {
				points: path.points,
				color: path.color,
				width: clampedWidth,
				createdAt,
				authorId: userId,
				authorName: user.uniqueName,
			});

			insertedIds.push(id);
		}

		return { insertedIds, count: insertedIds.length };
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

		const user = await ctx.db.get(userId);
		if (!user?.uniqueName) throw new Error("User must have a unique name set");

		const path = await ctx.db.get(args.pathId);
		if (!path) throw new Error("Path not found");

		if (path.authorId !== userId)
			throw new Error("Not authorized to edit this path");

		await checkRateLimit(ctx, userId, user.uniqueName, 0.5);

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

export const getRateLimitStatus = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const now = Date.now();
		const windowStart =
			Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;

		const rateLimit = await ctx.db
			.query("rateLimits")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (!rateLimit || rateLimit.windowStart !== windowStart) {
			return {
				requestsUsed: 0,
				requestsRemaining: MAX_REQUESTS_PER_WINDOW,
				windowResetTime: windowStart + RATE_LIMIT_WINDOW_MS,
				isLimited: false,
			};
		}

		return {
			requestsUsed: rateLimit.requestCount,
			requestsRemaining: Math.max(
				0,
				MAX_REQUESTS_PER_WINDOW - rateLimit.requestCount,
			),
			windowResetTime: windowStart + RATE_LIMIT_WINDOW_MS,
			isLimited: rateLimit.requestCount >= MAX_REQUESTS_PER_WINDOW,
		};
	},
});
