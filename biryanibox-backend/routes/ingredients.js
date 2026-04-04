const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Ingredient = require('../models/Ingredient');
const { protect, authorize } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

// GET /api/ingredients/reorder-forecast
router.get('/reorder-forecast', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find();
    const forecast = ingredients.map(ing => ({
      ...ing.toObject(),
      needsReorder: ing.stock < ing.min_stock,
    }));
    res.json({ success: true, data: forecast });
  } catch (err) { next(err); }
});

// GET /api/ingredients/export
router.get('/export', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find();
    const header = 'id,name,unit,stock,min_stock,unit_cost\n';
    const rows = ingredients.map(i => `${i._id},${i.name},${i.unit},${i.stock},${i.min_stock},${i.unit_cost}`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=ingredients.csv');
    res.send(header + rows);
  } catch (err) { next(err); }
});

// GET /api/ingredients
router.get('/', protect, async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find().sort({ name: 1 });
    res.json({ success: true, count: ingredients.length, data: ingredients });
  } catch (err) { next(err); }
});

// GET /api/ingredients/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const ing = await Ingredient.findById(req.params.id);
    if (!ing) return res.status(404).json({ success: false, message: 'Ingredient not found' });
    res.json({ success: true, data: ing });
  } catch (err) { next(err); }
});

// POST /api/ingredients
router.post('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const ing = await Ingredient.create(req.body);
    res.status(201).json({ success: true, data: ing });
  } catch (err) { next(err); }
});

// PUT /api/ingredients/:id
router.put('/:id', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    // Remove reorder_lead_days if present in body (deprecated)
    const { reorder_lead_days, ...updateData } = req.body;
    const ing = await Ingredient.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!ing) return res.status(404).json({ success: false, message: 'Ingredient not found' });
    res.json({ success: true, data: ing });
  } catch (err) { next(err); }
});

// PATCH /api/ingredients/:id/stock
router.patch('/:id/stock', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const ing = await Ingredient.findByIdAndUpdate(req.params.id, { stock: req.body.stock }, { new: true });
    if (!ing) return res.status(404).json({ success: false, message: 'Ingredient not found' });
    res.json({ success: true, data: ing });
  } catch (err) { next(err); }
});

// DELETE /api/ingredients/:id
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    const ing = await Ingredient.findByIdAndDelete(req.params.id);
    if (!ing) return res.status(404).json({ success: false, message: 'Ingredient not found' });
    res.json({ success: true, message: 'Ingredient deleted' });
  } catch (err) { next(err); }
});

// POST /api/ingredients/import
router.post('/import', protect, authorize('owner', 'manager'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        fs.unlinkSync(req.file.path);
        let imported = 0;
        for (const row of results) {
          await Ingredient.findOneAndUpdate(
            { name: row.name },
            { name: row.name, unit: row.unit || 'kg', stock: Number(row.stock) || 0, min_stock: Number(row.min_stock) || 0, unit_cost: Number(row.unit_cost) || 0 },
            { upsert: true, new: true }
          );
          imported++;
        }
        res.json({ success: true, message: `${imported} ingredients imported` });
      });
  } catch (err) { next(err); }
});

module.exports = router;