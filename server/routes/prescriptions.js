const express = require('express');
const Prescription = require('../models/Prescription');
const { protect, doctorOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'patient' ? { patient: req.user._id } : { doctor: req.user._id };
    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name avatar bloodGroup')
      .populate('doctor', 'name specialization licenseNumber')
      .sort('-createdAt');
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, doctorOnly, async (req, res) => {
  try {
    const prescription = await Prescription.create({ ...req.body, doctor: req.user._id });
    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, doctorOnly, async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
