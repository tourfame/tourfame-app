import { relations } from "drizzle-orm/relations";
import { tours, affiliateClicks, users, affiliateConversions, questions, answers, priceHistory, priceWatches, reviews, agencies, scrapeJobs, tourTags, tags, viewHistory } from "./schema";

export const affiliateClicksRelations = relations(affiliateClicks, ({one, many}) => ({
	tour: one(tours, {
		fields: [affiliateClicks.tourId],
		references: [tours.id]
	}),
	user: one(users, {
		fields: [affiliateClicks.userId],
		references: [users.id]
	}),
	affiliateConversions: many(affiliateConversions),
}));

export const toursRelations = relations(tours, ({one, many}) => ({
	affiliateClicks: many(affiliateClicks),
	affiliateConversions: many(affiliateConversions),
	priceHistories: many(priceHistory),
	priceWatches: many(priceWatches),
	questions: many(questions),
	reviews: many(reviews),
	tourTags: many(tourTags),
	agency: one(agencies, {
		fields: [tours.agencyId],
		references: [agencies.id]
	}),
	viewHistories: many(viewHistory),
}));

export const usersRelations = relations(users, ({many}) => ({
	affiliateClicks: many(affiliateClicks),
	affiliateConversions: many(affiliateConversions),
	answers: many(answers),
	priceWatches: many(priceWatches),
	questions: many(questions),
	reviews: many(reviews),
	scrapeJobs: many(scrapeJobs),
	viewHistories: many(viewHistory),
}));

export const affiliateConversionsRelations = relations(affiliateConversions, ({one}) => ({
	affiliateClick: one(affiliateClicks, {
		fields: [affiliateConversions.clickId],
		references: [affiliateClicks.id]
	}),
	tour: one(tours, {
		fields: [affiliateConversions.tourId],
		references: [tours.id]
	}),
	user: one(users, {
		fields: [affiliateConversions.userId],
		references: [users.id]
	}),
}));

export const answersRelations = relations(answers, ({one}) => ({
	question: one(questions, {
		fields: [answers.questionId],
		references: [questions.id]
	}),
	user: one(users, {
		fields: [answers.userId],
		references: [users.id]
	}),
}));

export const questionsRelations = relations(questions, ({one, many}) => ({
	answers: many(answers),
	user: one(users, {
		fields: [questions.userId],
		references: [users.id]
	}),
	tour: one(tours, {
		fields: [questions.tourId],
		references: [tours.id]
	}),
}));

export const priceHistoryRelations = relations(priceHistory, ({one}) => ({
	tour: one(tours, {
		fields: [priceHistory.tourId],
		references: [tours.id]
	}),
}));

export const priceWatchesRelations = relations(priceWatches, ({one}) => ({
	user: one(users, {
		fields: [priceWatches.userId],
		references: [users.id]
	}),
	tour: one(tours, {
		fields: [priceWatches.tourId],
		references: [tours.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	tour: one(tours, {
		fields: [reviews.tourId],
		references: [tours.id]
	}),
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
}));

export const scrapeJobsRelations = relations(scrapeJobs, ({one}) => ({
	agency: one(agencies, {
		fields: [scrapeJobs.agencyId],
		references: [agencies.id]
	}),
	user: one(users, {
		fields: [scrapeJobs.createdBy],
		references: [users.id]
	}),
}));

export const agenciesRelations = relations(agencies, ({many}) => ({
	scrapeJobs: many(scrapeJobs),
	tours: many(tours),
}));

export const tourTagsRelations = relations(tourTags, ({one}) => ({
	tour: one(tours, {
		fields: [tourTags.tourId],
		references: [tours.id]
	}),
	tag: one(tags, {
		fields: [tourTags.tagId],
		references: [tags.id]
	}),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	tourTags: many(tourTags),
}));

export const viewHistoryRelations = relations(viewHistory, ({one}) => ({
	user: one(users, {
		fields: [viewHistory.userId],
		references: [users.id]
	}),
	tour: one(tours, {
		fields: [viewHistory.tourId],
		references: [tours.id]
	}),
}));