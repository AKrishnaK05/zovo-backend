const mongoose = require('mongoose');
const ServiceCategory = require('../models/ServiceCategory');
const PricingRule = require('../models/PricingRule');
const ServiceArea = require('../models/ServiceArea');
const path = require('path');
const dotenv = require('dotenv');
const { connectToDatabase } = require('../../shared/mongo');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedData = async () => {
  try {
    await connectToDatabase();

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('🌱 Seeding Services...');

    // Clear existing data
    await ServiceCategory.deleteMany({});
    await PricingRule.deleteMany({});
    await ServiceArea.deleteMany({});

    // Seed service categories
    const categories = await ServiceCategory.insertMany([
      {
        name: 'Plumbing',
        slug: 'plumbing',
        description: 'Professional plumbing services for your home',
        icon: '🔧',
        basePrice: 49,
        hourlyRate: 35,
        minDuration: 60,
        includes: [
          'Inspection of the issue',
          'Basic tools and equipment',
          '30-day service guarantee'
        ],
        subServices: [
          { name: 'Leak Repair', price: 29, duration: 30 },
          { name: 'Drain Cleaning', price: 49, duration: 45 },
          { name: 'Faucet Installation', price: 39, duration: 30 },
          { name: 'Toilet Repair', price: 59, duration: 45 },
          { name: 'Pipe Installation', price: 99, duration: 90 },
          { name: 'Water Heater Service', price: 79, duration: 60 }
        ],
        sortOrder: 1
      },
      {
        name: 'Electrical',
        slug: 'electrical',
        description: 'Safe and certified electrical work',
        icon: '⚡',
        basePrice: 59,
        hourlyRate: 45,
        minDuration: 60,
        includes: [
          'Safety inspection',
          'Licensed electrician',
          '30-day service guarantee'
        ],
        subServices: [
          { name: 'Switch/Outlet Repair', price: 25, duration: 20 },
          { name: 'Light Fixture Installation', price: 45, duration: 30 },
          { name: 'Ceiling Fan Installation', price: 65, duration: 45 },
          { name: 'Circuit Breaker Service', price: 89, duration: 60 },
          { name: 'Wiring Inspection', price: 79, duration: 45 },
          { name: 'Panel Upgrade', price: 299, duration: 180 }
        ],
        sortOrder: 2
      },
      {
        name: 'Cleaning',
        slug: 'cleaning',
        description: 'Professional home and office cleaning',
        icon: '🧹',
        basePrice: 39,
        hourlyRate: 25,
        minDuration: 120,
        includes: [
          'All cleaning supplies',
          'Trained professionals',
          'Satisfaction guarantee'
        ],
        subServices: [
          { name: 'Regular Cleaning (per room)', price: 25, duration: 30 },
          { name: 'Deep Cleaning (per room)', price: 45, duration: 45 },
          { name: 'Bathroom Cleaning', price: 35, duration: 30 },
          { name: 'Kitchen Cleaning', price: 45, duration: 45 },
          { name: 'Carpet Cleaning', price: 59, duration: 60 },
          { name: 'Window Cleaning', price: 15, duration: 15 }
        ],
        sortOrder: 3
      },
      {
        name: 'Painting',
        slug: 'painting',
        description: 'Interior and exterior painting services',
        icon: '🎨',
        basePrice: 199,
        hourlyRate: 40,
        minDuration: 240,
        includes: [
          'Color consultation',
          'Surface preparation',
          'Premium paints available'
        ],
        subServices: [
          { name: 'Wall Painting (per wall)', price: 79, duration: 60 },
          { name: 'Ceiling Painting', price: 99, duration: 90 },
          { name: 'Door Painting', price: 49, duration: 45 },
          { name: 'Cabinet Painting', price: 149, duration: 120 },
          { name: 'Exterior Painting (per 100 sqft)', price: 199, duration: 180 }
        ],
        sortOrder: 4
      },
      {
        name: 'Carpentry',
        slug: 'carpentry',
        description: 'Custom woodwork and repairs',
        icon: '🪚',
        basePrice: 69,
        hourlyRate: 50,
        minDuration: 60,
        includes: [
          'Quality materials',
          'Skilled craftsmen',
          'Custom solutions'
        ],
        subServices: [
          { name: 'Door Repair', price: 49, duration: 45 },
          { name: 'Furniture Assembly', price: 39, duration: 60 },
          { name: 'Shelf Installation', price: 59, duration: 45 },
          { name: 'Cabinet Repair', price: 79, duration: 60 },
          { name: 'Custom Furniture', price: 299, duration: 480 }
        ],
        sortOrder: 5
      },
      {
        name: 'Appliance Repair',
        slug: 'appliance',
        description: 'Repair for all home appliances',
        icon: '🔌',
        basePrice: 59,
        hourlyRate: 40,
        minDuration: 60,
        includes: [
          'Diagnostic check',
          'Genuine parts',
          '90-day repair warranty'
        ],
        subServices: [
          { name: 'Washing Machine Repair', price: 69, duration: 60 },
          { name: 'Refrigerator Repair', price: 79, duration: 90 },
          { name: 'AC Service', price: 49, duration: 45 },
          { name: 'Microwave Repair', price: 39, duration: 30 },
          { name: 'Dishwasher Repair', price: 69, duration: 60 }
        ],
        sortOrder: 6
      }
    ]);

    // Seed pricing rules
    await PricingRule.insertMany([
      {
        name: 'Weekend Surge',
        description: 'Higher prices on weekends',
        ruleType: 'multiplier',
        value: 1.2, // 20% higher
        conditions: {
          daysOfWeek: [0, 6] // Sunday, Saturday
        },
        priority: 10
      },
      {
        name: 'Early Morning Premium',
        description: 'Premium for early slots',
        ruleType: 'fixed_add',
        value: 10,
        conditions: {
          timeRange: { start: '08:00', end: '09:00' }
        },
        priority: 5
      },
      {
        name: 'Evening Premium',
        description: 'Premium for evening slots',
        ruleType: 'fixed_add',
        value: 15,
        conditions: {
          timeRange: { start: '17:00', end: '18:00' }
        },
        priority: 5
      },
      {
        name: 'High Demand Surge',
        description: 'Surge pricing when demand is high',
        ruleType: 'percentage_add',
        value: 15, // 15% extra
        conditions: {
          demandThreshold: 10 // When more than 10 pending jobs
        },
        priority: 20
      }
    ]);

    // Seed service areas (example for a city)
    await ServiceArea.insertMany([
      {
        name: 'Downtown',
        city: 'New York',
        center: {
          type: 'Point',
          coordinates: [-73.9857, 40.7484] // NYC coordinates
        },
        boundary: {
          type: 'Polygon',
          coordinates: [[
            [-74.0060, 40.7128],
            [-73.9654, 40.7128],
            [-73.9654, 40.7580],
            [-74.0060, 40.7580],
            [-74.0060, 40.7128]
          ]]
        },
        radius: 5,
        availableCategories: ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'appliance'],
        priceModifier: 1.1, // 10% higher in downtown
        travelFee: 5
      },
      {
        name: 'Suburbs',
        city: 'New York',
        center: {
          type: 'Point',
          coordinates: [-73.9442, 40.6782]
        },
        boundary: {
          type: 'Polygon',
          coordinates: [[
            [-74.0500, 40.6500],
            [-73.8500, 40.6500],
            [-73.8500, 40.7500],
            [-74.0500, 40.7500],
            [-74.0500, 40.6500]
          ]]
        },
        radius: 15,
        availableCategories: ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'appliance'],
        priceModifier: 1.0,
        travelFee: 10
      }
    ]);

    console.log('✅ Seed data inserted successfully!');
    console.log(`   - ${categories.length} service categories`);
    console.log(`   - 4 pricing rules`);
    console.log(`   - 2 service areas`);
    process.exit();

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;