import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductReviews } from '../src/data/reviews.ts';

async function loadReviewBehavior() {
  try {
    return await import('../src/components/ReviewsSection.behavior.ts');
  } catch {
    return {};
  }
}

test('static review dates use canonical metadata and render for the active locale', async () => {
  const { formatReviewDate } = await loadReviewBehavior();
  const reviews = getProductReviews('p1');

  assert.equal(typeof formatReviewDate, 'function');
  assert.ok(reviews.every(review => !Object.hasOwn(review, 'date')));
  assert.equal(formatReviewDate(reviews[0], 'en'), 'Aug 14, 2026');
  assert.equal(formatReviewDate(reviews[0], 'my'), '2026 ဩ 14');
  assert.equal(formatReviewDate(reviews.find(review => review.id === 'rev-p1-1'), 'en'), '3 days ago');
  assert.equal(formatReviewDate(reviews.find(review => review.id === 'rev-p1-1'), 'my'), 'ပြီးခဲ့သည့် 3 ရက်');
});

test('new review dates store one timestamp and present today in English and Myanmar', async () => {
  const { createReviewDateMetadata, formatReviewDate } = await loadReviewBehavior();
  const now = new Date('2026-08-20T09:30:00.000Z');

  assert.equal(typeof createReviewDateMetadata, 'function');
  assert.equal(typeof formatReviewDate, 'function');
  const metadata = createReviewDateMetadata(now);
  assert.deepEqual(metadata, { reviewedAt: '2026-08-20T09:30:00.000Z' });
  assert.equal(formatReviewDate(metadata, 'en', now), 'today');
  assert.equal(formatReviewDate(metadata, 'my', now), 'ယနေ့');
});
