import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    avatar_url: text("avatar_url"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
})

// video for replay & streaming 
export const videos = pgTable("videos", {
    id: uuid("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url").notNull(),
    status: text("status").default("processing"),
    isLive: boolean("is_live").default(false),
    thumbnail_url: text("thumbnail_url"),
    userId: uuid("user_id").references(() => profiles.id),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
})
