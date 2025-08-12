import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
	...authTables,
	paths: defineTable({
		points: v.array(v.object({
			x: v.number(),
			y: v.number(),
		})),
		color: v.string(),
		width: v.number(),
		createdAt: v.number(),
	}),
});
