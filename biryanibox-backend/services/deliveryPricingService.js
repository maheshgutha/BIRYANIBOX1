/**
 * deliveryPricingService.js
 * ─────────────────────────
 * Core engine for dynamic delivery fee calculation.
 * Uses Google Distance Matrix API when GOOGLE_MAPS_API_KEY is set;
 * falls back to Haversine straight-line + 25 % road factor otherwise.
 *
 * Exports:
 *   calculateDeliveryPrice(destination, orderValue, timeOverride?) → PricingResult
 *   getPricingConfig() → DeliveryPricing document
 */

const https           = require('https');
const DeliveryPricing = require('../models/DeliveryPricing');

// ── Restaurant anchor (Trenset Mall, Benz Circle, Vijayawada) ────────────────
const RESTAURANT_LAT = parseFloat(process.env.RESTAURANT_LAT || '16.5077');
const RESTAURANT_LNG = parseFloat(process.env.RESTAURANT_LNG || '80.6356');

// ── Haversine straight-line distance (km) ────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Tiny promise-based https GET ─────────────────────────────────────────────
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('JSON parse error')); }
      });
    }).on('error', reject)
      .setTimeout(6000, function () { this.abort(); reject(new Error('Google API timeout')); });
  });
}

// ── Google Distance Matrix API call ──────────────────────────────────────────
async function getDistanceFromGoogle(destStr) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const origin = `${RESTAURANT_LAT},${RESTAURANT_LNG}`;
  const url    = `https://maps.googleapis.com/maps/api/distancematrix/json`
    + `?origins=${encodeURIComponent(origin)}`
    + `&destinations=${encodeURIComponent(destStr)}`
    + `&mode=driving&units=metric&key=${apiKey}`;

  try {
    const data    = await httpsGet(url);
    const element = data?.rows?.[0]?.elements?.[0];
    if (element?.status === 'OK') {
      return {
        distanceKm:   element.distance.value / 1000,
        durationMins: Math.ceil(element.duration.value / 60),
        distanceText: element.distance.text,
        durationText: element.duration.text,
      };
    }
    console.warn('[DeliveryPricing] Google returned status:', element?.status);
  } catch (e) {
    console.warn('[DeliveryPricing] Google API error:', e.message);
  }
  return null;
}

// ── Load (or seed) pricing config ────────────────────────────────────────────
async function getPricingConfig() {
  let config = await DeliveryPricing.findOne({ is_active: true });
  if (!config) {
    console.log('[DeliveryPricing] Seeding default pricing config...');
    config = await DeliveryPricing.create({ name: 'default' });
  }
  return config;
}

// ── Time-condition helpers ────────────────────────────────────────────────────
function isPeakHour(config, hour) {
  return (config.peak_hours || []).some(p => hour >= p.start && hour < p.end);
}

function isLateNight(config, hour) {
  const s = config.late_night_start ?? 22;
  const e = config.late_night_end   ??  6;
  return s > e
    ? (hour >= s || hour < e)  // crosses midnight (22-06)
    : (hour >= s && hour < e);
}

// ── Main exported function ────────────────────────────────────────────────────
/**
 * @param {string|{lat:number,lng:number}} destination  Address string or lat/lng object
 * @param {number}  orderValue   Cart subtotal in ₹ (used for small-order / free-delivery logic)
 * @param {Date|string|null} timeOverride  Override current time (useful for testing)
 *
 * @returns {object} PricingResult
 *   { distance, distanceKm, duration, durationMins,
 *     deliveryFee, freeDelivery, source, breakdown }
 *   OR
 *   { error, distanceKm } — when distance exceeds max
 */
async function calculateDeliveryPrice(destination, orderValue = 0, timeOverride = null) {
  const config = await getPricingConfig();

  // ── Build destination string ────────────────────────────────────────────────
  let destStr;
  let destLatLng = null;
  if (destination && typeof destination === 'object' && destination.lat && destination.lng) {
    destStr    = `${destination.lat},${destination.lng}`;
    destLatLng = destination;
  } else {
    destStr = String(destination || '').trim();
  }

  if (!destStr) {
    return { error: 'Destination is required.' };
  }

  // ── Distance resolution ─────────────────────────────────────────────────────
  let distanceKm, durationMins, distanceText, durationText, source;

  const googleResult = await getDistanceFromGoogle(destStr);
  if (googleResult) {
    ({ distanceKm, durationMins, distanceText, durationText } = googleResult);
    source = 'google';
  } else if (destLatLng) {
    // Haversine + 25 % road factor
    const straight = haversineKm(RESTAURANT_LAT, RESTAURANT_LNG, destLatLng.lat, destLatLng.lng);
    distanceKm  = +(straight * 1.25).toFixed(2);
    durationMins = Math.ceil(distanceKm * 3 + 8); // ~3 min/km + 8 min prep
    distanceText = `${distanceKm.toFixed(1)} km`;
    durationText = `${durationMins} mins`;
    source = 'estimated';
  } else {
    // Address string but no Google key — use a conservative default
    distanceKm  = 5;
    durationMins = 25;
    distanceText = '~5 km (estimated)';
    durationText = '~25 mins (estimated)';
    source = 'estimated';
  }

  // ── Hard distance cap ───────────────────────────────────────────────────────
  if (distanceKm > config.max_delivery_km) {
    return {
      error: `Delivery not available beyond ${config.max_delivery_km} km. Your location is ${distanceText} away.`,
      distanceKm: +distanceKm.toFixed(2),
    };
  }

  // ── Base + distance charge ──────────────────────────────────────────────────
  const base           = config.base_price;
  const distanceCharge = distanceKm > config.base_km
    ? Math.ceil((distanceKm - config.base_km) * config.per_km_rate)
    : 0;

  // ── Time charge ─────────────────────────────────────────────────────────────
  const now    = timeOverride ? new Date(timeOverride) : new Date();
  const hour   = now.getHours();
  let timeCharge = 0;
  let timeLabel  = null;

  if (isPeakHour(config, hour)) {
    timeCharge = config.peak_hour_charge;
    timeLabel  = 'Peak hour surcharge';
  } else if (isLateNight(config, hour)) {
    timeCharge = config.late_night_charge;
    timeLabel  = 'Late night surcharge';
  }

  // ── Surge multiplier ────────────────────────────────────────────────────────
  let rawFee = base + distanceCharge + timeCharge;
  const surgeActive = config.surge_active && config.surge_multiplier > 1;
  if (surgeActive) {
    rawFee = Math.ceil(rawFee * config.surge_multiplier);
  }

  // ── Small-order fee ─────────────────────────────────────────────────────────
  const orderVal     = parseFloat(orderValue) || 0;
  const smallOrderFee = (orderVal > 0 && orderVal < config.small_order_threshold)
    ? config.small_order_fee
    : 0;

  // ── Free delivery check ─────────────────────────────────────────────────────
  const freeDelivery = orderVal >= config.free_delivery_threshold;
  const deliveryFee  = freeDelivery ? 0 : Math.round(rawFee + smallOrderFee);

  return {
    distance:    distanceText,
    distanceKm:  +distanceKm.toFixed(2),
    duration:    durationText,
    durationMins,
    deliveryFee,
    freeDelivery,
    source,        // 'google' | 'estimated'
    breakdown: {
      base,
      distanceCharge,
      timeCharge,
      timeLabel,
      smallOrderFee,
      surgeActive,
      surgeMultiplier: surgeActive ? config.surge_multiplier : 1,
    },
  };
}

module.exports = { calculateDeliveryPrice, getPricingConfig };