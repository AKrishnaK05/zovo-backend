// backend/routes/availability.js (if needed)
const express = require('express');
const router = express.Router();

// GET /api/availability/slots
router.get('/slots', async (req, res) => {
  try {
    const { date, category } = req.query;
    
    // Generate default slots
    const slots = [
      { time: '09:00', displayTime: '09:00 AM', isAvailable: true, isPeakHour: true, remainingSlots: 5 },
      { time: '10:00', displayTime: '10:00 AM', isAvailable: true, isPeakHour: false, remainingSlots: 5 },
      { time: '11:00', displayTime: '11:00 AM', isAvailable: true, isPeakHour: false, remainingSlots: 5 },
      { time: '12:00', displayTime: '12:00 PM', isAvailable: true, isPeakHour: false, remainingSlots: 5 },
      { time: '13:00', displayTime: '01:00 PM', isAvailable: true, isPeakHour: false, remainingSlots: 5 },
      { time: '14:00', displayTime: '02:00 PM', isAvailable: true, isPeakHour: false, remainingSlots: 5 },
      { time: '15:00', displayTime: '03:00 PM', isAvailable: true, isPeakHour: false, remainingSlots: 5 },
      { time: '16:00', displayTime: '04:00 PM', isAvailable: true, isPeakHour: false, remainingSlots: 5 },
      { time: '17:00', displayTime: '05:00 PM', isAvailable: true, isPeakHour: false, remainingSlots: 5 },
      { time: '18:00', displayTime: '06:00 PM', isAvailable: true, isPeakHour: true, remainingSlots: 5 }
    ];
    
    res.json({ success: true, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/availability/dates
router.get('/dates', async (req, res) => {
  try {
    const { days = 14 } = req.query;
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= parseInt(days); i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en-IN', { month: 'short' }),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isAvailable: true
      });
    }
    
    res.json({ success: true, data: dates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;