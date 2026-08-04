const mongoose = require('mongoose');

/**
 * Persisted hotel configuration — allows admins to update hotel info
 * without redeploying. Falls back to config/hotelData.js if empty.
 */
const roomSchema = new mongoose.Schema({
  type: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  capacity: Number,
  amenities: [String],
});

const hotelDataSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tagline: String,
    location: {
      address: String,
      city: String,
      country: String,
    },
    contact: {
      phone: String,
      email: String,
      website: String,
    },
    checkIn: String,
    checkOut: String,
    rooms: [roomSchema],
    amenities: {
      dining: [
        {
          name: String,
          cuisine: String,
          hours: String,
        },
      ],
      recreation: [String],
      business: [String],
      services: [String],
    },
    policies: {
      cancellation: String,
      pets: String,
      smoking: String,
      extraBed: String,
      parking: String,
    },
    nearbyAttractions: [
      {
        name: String,
        distance: String,
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HotelData', hotelDataSchema);
