/**
 * Static hotel data used to seed the database and as fallback context
 * for the AI chatbot when answering guest questions.
 */
const hotelData = {
  name: 'Haile Resort Hawassa',
  tagline: 'Where Luxury Meets Comfort',
  location: {
    address: 'A8, Hawassa',
    city: 'Hawassa',
    country: 'Ethiopia',
    coordinates: { lat: 7.0622, lng: 38.4762 },
  },
  contact: {
    phone: '096 331 3131',
    email: 'info@haileresorthawassa.com',
    website: 'https://www.haileresorthawassa.com',
  },
  checkIn: '3:00 PM',
  checkOut: '11:00 AM',
  rooms: [
    {
      type: 'Standard Room',
      description: 'Cozy room with city view, queen bed, and modern amenities.',
      price: 150,
      currency: 'USD',
      capacity: 2,
      amenities: ['Free Wi-Fi', 'AC', 'Flat-screen TV', 'Mini-fridge', 'Safe'],
    },
    {
      type: 'Deluxe Ocean View',
      description: 'Spacious room with stunning ocean panorama and king bed.',
      price: 250,
      currency: 'USD',
      capacity: 2,
      amenities: ['Free Wi-Fi', 'AC', 'Flat-screen TV', 'Mini-bar', 'Balcony', 'Safe'],
    },
    {
      type: 'Junior Suite',
      description: 'Elegant suite with separate living area and ocean view.',
      price: 380,
      currency: 'USD',
      capacity: 3,
      amenities: ['Free Wi-Fi', 'AC', '2× Flat-screen TV', 'Mini-bar', 'Jacuzzi', 'Balcony', 'Lounge access'],
    },
    {
      type: 'Presidential Suite',
      description: 'Ultimate luxury with panoramic views, butler service, and private terrace.',
      price: 800,
      currency: 'USD',
      capacity: 4,
      amenities: ['Free Wi-Fi', 'AC', '4× Flat-screen TV', 'Full bar', 'Private Jacuzzi', 'Terrace', 'Butler', 'Lounge access'],
    },
  ],
  amenities: {
    dining: [
      { name: 'Haile Restaurant', cuisine: 'Fine Dining / International & Ethiopian', hours: '7:00 AM – 11:00 PM' },
      { name: 'Lakeside Bar & Grill', cuisine: 'Casual / Grill', hours: '10:00 AM – 10:00 PM' },
      { name: 'The Lobby Café', cuisine: 'Café / Light Bites', hours: '6:00 AM – 12:00 AM' },
    ],
    recreation: ['Outdoor infinity pool', 'Fitness center (24/7)', 'Full-service spa', 'Tennis courts', 'Beach access', 'Yoga classes'],
    business: ['Business center', 'Conference rooms (capacity up to 200)', 'High-speed internet throughout'],
    services: ['24-hour concierge', 'Valet parking', 'Airport shuttle', 'Laundry & dry cleaning', 'Room service (24/7)', 'Pet-friendly (fees apply)'],
  },
  policies: {
    cancellation: 'Free cancellation up to 48 hours before check-in. Late cancellations incur a one-night charge.',
    pets: 'Pets allowed with a $50/night fee. Maximum 2 pets per room.',
    smoking: 'Non-smoking property. Smoking permitted in designated outdoor areas only.',
    extraBed: 'Rollaway beds available for $30/night.',
    parking: 'Valet parking available at $35/night. Self-parking garage adjacent to hotel at $20/night.',
  },
  nearbyAttractions: [
    { name: 'Lake Hawassa', distance: '0.5 km' },
    { name: 'Hawassa Fish Market', distance: '1 km' },
    { name: 'Hawassa University', distance: '3 km' },
    { name: 'Sidama Cultural Village', distance: '5 km' },
    { name: 'Hawassa Millennium Park', distance: '2 km' },
  ],
};

module.exports = hotelData;
