import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
	...authTables,
	users: defineTable({
		name: v.optional(v.string()),
		image: v.optional(v.string()),
		email: v.optional(v.string()),
		emailVerificationTime: v.optional(v.number()),
		phone: v.optional(v.string()),
		phoneVerificationTime: v.optional(v.number()),
		isAnonymous: v.optional(v.boolean()),
		favoriteColor: v.optional(v.string()),
	})
		.index("email", ["email"])
		.index("phone", ["phone"]),
	paths: defineTable({
		points: v.array(
			v.object({
				x: v.number(),
				y: v.number(),
			}),
		),
		color: v.string(),
		width: v.number(),
		createdAt: v.number(),
	}),
});
