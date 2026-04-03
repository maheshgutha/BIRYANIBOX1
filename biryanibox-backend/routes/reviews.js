const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/auth');

// GET /api/reviews
router.get('/', async (req, res, next) => {
  try {
    const { featured, menu_item_id } = req.query;
    const filter = {};
    if (featured === 'true') filter.is_featured = true;
    if (menu_item_id) filter.menu_item_id = menu_item_id;
    const reviews = await Review.find(filter)
      .populate('user_id', 'name avatar_url')
      .populate('menu_item_id', 'name category')
      .sort({ created_at: -1 });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (err) { next(err); }
});

// POST /api/reviews
router.post('/', protect, async (req, res, next) => {
  try {
    const reviewData = {
      ...req.body,
      user_id: req.user._id,
      reviewer_name: req.body.reviewer_name || req.user.name
    };
    const review = await Review.create(reviewData);

    // Update menu item rating average
    if (req.body.menu_item_id) {
      const allReviews = await Review.find({ menu_item_id: req.body.menu_item_id });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await MenuItem.findByIdAndUpdate(req.body.menu_item_id, { rating: +avgRating.toFixed(1) });
    }

    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

// PATCH /api/reviews/:id/featured
router.patch('/:id/featured', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    review.is_featured = !review.is_featured;
    await review.save();
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
});

// DELETE /api/reviews/:id
router.delete('/:id', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review removed' });
  } catch (err) { next(err); }
});

module.exports = router;
