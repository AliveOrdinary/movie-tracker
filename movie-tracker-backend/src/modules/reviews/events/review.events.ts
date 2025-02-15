// src/modules/reviews/events/review.events.ts
export enum ReviewEventType {
    REVIEW_CREATED = 'review.created',
    REVIEW_UPDATED = 'review.updated',
    REVIEW_DELETED = 'review.deleted',
    REACTION_ADDED = 'review.reaction.added',
    REACTION_REMOVED = 'review.reaction.removed',
    REVIEW_REPORTED = 'review.reported',
    REVIEW_MODERATED = 'review.moderated'
  }
  