const TimeSlot = require('../models/TimeSlot');
const Job = require('../models/Job');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// Default time slots
const DEFAULT_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

/**
 * Get available time slots for a date
 * @route GET /api/availability/:date
 * @access Public
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { category, coordinates } = req.query;

    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Can't book in the past
    if (bookingDate < today) {
      return res.status(200).json({
        success: true,
        data: {
          date,
          slots: [],
          message: 'Cannot book for past dates'
        }
      });
    }

    // Get booked jobs for this date
    const bookedJobs = await Job.find({
      scheduledDate: {
        $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
        $lte: new Date(bookingDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ['pending', 'accepted', 'in_progress'] },
      ...(category && { category })
    }).select('timeSlot');

    const bookedTimes = bookedJobs.map(j => j.timeSlot?.time);

    // Get workers available for this category
    let availableWorkersCount = 0;
    if (category) {
      availableWorkersCount = await User.countDocuments({
        role: 'worker',
        isActive: true,
        isAvailable: true,
        serviceCategories: category
      });
    }

    // Generate slots with availability
    const slots = DEFAULT_SLOTS.map(time => {
      // Count how many jobs are booked for this time
      const bookingsAtTime = bookedTimes.filter(t => t === time).length;
      
      // Check if it's past time for today
      let isPast = false;
      const now = new Date();
      if (bookingDate.toDateString() === now.toDateString()) {
        const [hours] = time.split(':').map(Number);
        isPast = hours <= now.getHours();
      }

      // Slot is available if:
      // 1. Not in the past
      // 2. Fewer bookings than available workers (or if no category specified)
      const isAvailable = !isPast && 
        (availableWorkersCount === 0 || bookingsAtTime < availableWorkersCount);

      // Peak hours pricing indicator
      const isPeakHour = ['08:00', '09:00', '18:00'].includes(time);

      return {
        time,
        displayTime: formatTime(time),
        isAvailable,
        isPeakHour,
        remainingSlots: Math.max(0, availableWorkersCount - bookingsAtTime)
      };
    });

    res.status(200).json({
      success: true,
      data: {
        date,
        dayOfWeek: bookingDate.toLocaleDateString('en-US', { weekday: 'long' }),
        slots,
        totalWorkers: availableWorkersCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available dates for next N days
 * @route GET /api/availability/dates
 * @access Public
 */
const getAvailableDates = async (req, res, next) => {
  try {
    const { days = 30, category } = req.query;

    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Count bookings for this date
      const bookingsCount = await Job.countDocuments({
        scheduledDate: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999))
        },
        status: { $in: ['pending', 'accepted', 'in_progress'] },
        ...(category && { category })
      });

      // Get worker count for capacity
      let capacity = 100; // Default max
      if (category) {
        const workers = await User.countDocuments({
          role: 'worker',
          isActive: true,
          isAvailable: true,
          serviceCategories: category
        });
        capacity = workers * DEFAULT_SLOTS.length;
      }

      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      dates.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isAvailable: bookingsCount < capacity,
        isWeekend,
        bookingsCount,
        availableSlots: Math.max(0, capacity - bookingsCount)
      });
    }

    res.status(200).json({
      success: true,
      data: dates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set worker availability (for workers)
 * @route PUT /api/availability/worker
 * @access Private (Worker)
 */
const setWorkerAvailability = async (req, res, next) => {
  try {
    const { dates, slots } = req.body;
    // dates: array of date strings
    // slots: array of time strings that are available

    const results = [];

    for (const dateStr of dates) {
      let timeSlot = await TimeSlot.findOne({
        worker: req.user.id,
        date: new Date(dateStr)
      });

      if (!timeSlot) {
        timeSlot = new TimeSlot({
          worker: req.user.id,
          date: new Date(dateStr),
          slots: DEFAULT_SLOTS.map(time => ({
            time,
            isAvailable: slots.includes(time)
          }))
        });
      } else {
        timeSlot.slots = DEFAULT_SLOTS.map(time => ({
          time,
          isAvailable: slots.includes(time),
          bookedJob: timeSlot.slots.find(s => s.time === time)?.bookedJob
        }));
      }

      await timeSlot.save();
      results.push(timeSlot);
    }

    res.status(200).json({
      success: true,
      message: 'Availability updated',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Helper function
function formatTime(time24) {
  const [hours, minutes] = time24.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

module.exports = {
  getAvailableSlots,
  getAvailableDates,
  setWorkerAvailability
};