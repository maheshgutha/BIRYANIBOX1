const express = require('express');
const router = express.Router();
const MenuRecipe = require('../models/MenuRecipe');
const { protect, authorize } = require('../middleware/auth');

// GET /api/recipes
router.get('/', protect, async (req, res, next) => {
  try {
    const recipes = await MenuRecipe.find().populate('menu_item_id', 'name').populate('ingredient_id', 'name unit');
    res.json({ success: true, data: recipes });
  } catch (err) { next(err); }
});

// GET /api/recipes/:menuItemId
router.get('/:menuItemId', protect, async (req, res, next) => {
  try {
    const recipes = await MenuRecipe.find({ menu_item_id: req.params.menuItemId }).populate('ingredient_id', 'name unit unit_cost');
    res.json({ success: true, data: recipes });
  } catch (err) { next(err); }
});

// POST /api/recipes/:menuItemId
router.post('/:menuItemId', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { ingredients } = req.body; // [{ ingredient_id, qty_per_serving }]
    const docs = ingredients.map(i => ({ menu_item_id: req.params.menuItemId, ingredient_id: i.ingredient_id, qty_per_serving: i.qty_per_serving }));
    const created = await MenuRecipe.insertMany(docs, { ordered: false });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

// PUT /api/recipes/:menuItemId
router.put('/:menuItemId', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    await MenuRecipe.deleteMany({ menu_item_id: req.params.menuItemId });
    const { ingredients } = req.body;
    const docs = ingredients.map(i => ({ menu_item_id: req.params.menuItemId, ingredient_id: i.ingredient_id, qty_per_serving: i.qty_per_serving }));
    const created = await MenuRecipe.insertMany(docs);
    res.json({ success: true, data: created });
  } catch (err) { next(err); }
});

// DELETE /api/recipes/:menuItemId
router.delete('/:menuItemId', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    await MenuRecipe.deleteMany({ menu_item_id: req.params.menuItemId });
    res.json({ success: true, message: 'Recipe deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
