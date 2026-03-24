import Medicine from '../models/Inventrymodels.js';

// Create a new medicine
export const createMedicine = async (req, res) => {
    try {
        const med = new Medicine(req.body);
        const saved = await med.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all medicines
export const getAllMedicines = async (req, res) => {
    try {
        const meds = await Medicine.find();
        res.json(meds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get single medicine by ID
export const getMedicineById = async (req, res) => {
    try {
        const med = await Medicine.findById(req.params.id);
        if (!med) return res.status(404).json({ error: 'Medicine not found' });
        res.json(med);
    } catch (err) {
        res.status(400).json({ error: 'Invalid medicine ID' });
    }
};

// Update medicine
export const updateMedicine = async (req, res) => {
    try {
        const updated = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ error: 'Medicine not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete medicine
export const deleteMedicine = async (req, res) => {
    try {
        const deleted = await Medicine.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Medicine not found' });
        res.json({ message: 'Medicine deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: 'Invalid medicine ID' });
    }
};
