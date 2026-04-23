import Medicine from '../models/Inventrymodels.js';

function toCsvValue(value) {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function toIsoDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString();
}

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

// Download inventory report (CSV by default)
export const downloadInventoryReport = async (req, res) => {
    try {
        const format = String(req.query.format || 'csv').toLowerCase();

        const meds = await Medicine.find().sort({ name: 1 }).lean();

        if (format === 'json') {
            const totalItems = meds.length;
            const totalQuantity = meds.reduce((sum, m) => sum + Number(m?.quantity || 0), 0);
            const totalStockValue = meds.reduce(
                (sum, m) => sum + Number(m?.price || 0) * Number(m?.quantity || 0),
                0
            );

            return res.json({
                generatedAt: new Date().toISOString(),
                summary: { totalItems, totalQuantity, totalStockValue },
                medicines: meds,
            });
        }

        // CSV (Excel-friendly UTF-8 BOM)
        const headers = [
            'name',
            'manufacturer',
            'price',
            'quantity',
            'expiryDate',
            'description',
            'createdAt',
            'updatedAt',
        ];

        const lines = [];
        lines.push(headers.join(','));

        for (const m of meds) {
            const row = [
                m?.name,
                m?.manufacturer,
                m?.price,
                m?.quantity,
                toIsoDate(m?.expiryDate),
                m?.description,
                toIsoDate(m?.createdAt),
                toIsoDate(m?.updatedAt),
            ].map(toCsvValue);
            lines.push(row.join(','));
        }

        const now = new Date();
        const yyyy = String(now.getFullYear());
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const filename = `inventory-report-${yyyy}${mm}${dd}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        return res.status(200).send(`\uFEFF${lines.join('\n')}`);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
