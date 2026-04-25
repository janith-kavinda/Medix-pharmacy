import Medicine from "../models/Inventrymodels.js";

const defaultMedicines = [
  {
    name: "Paracetamol 500mg",
    manufacturer: "GSK",
    price: 45,
    quantity: 120,
    description: "Pain and fever relief tablets",
  },
  {
    name: "Amoxicillin 250mg",
    manufacturer: "Cipla",
    price: 120,
    quantity: 80,
    description: "Antibiotic capsules",
  },
  {
    name: "Cetirizine 10mg",
    manufacturer: "Sun Pharma",
    price: 60,
    quantity: 95,
    description: "Anti-allergy tablets",
  },
  {
    name: "Omeprazole 20mg",
    manufacturer: "Dr. Reddy's",
    price: 85,
    quantity: 75,
    description: "Acid reflux relief capsules",
  },
  {
    name: "Vitamin C 500mg",
    manufacturer: "Abbott",
    price: 150,
    quantity: 110,
    description: "Immunity support tablets",
  },
  {
    name: "Metformin 500mg",
    manufacturer: "Lupin",
    price: 95,
    quantity: 90,
    description: "Diabetes management tablets",
  },
  {
    name: "ORS Powder",
    manufacturer: "Dabur",
    price: 30,
    quantity: 140,
    description: "Oral rehydration salts",
  },
  {
    name: "Cough Syrup",
    manufacturer: "Himalaya",
    price: 110,
    quantity: 65,
    description: "Soothing cough relief syrup",
  },
];

export async function seedMedicinesIfEmpty() {
  const count = await Medicine.countDocuments();
  if (count > 0) return;

  await Medicine.insertMany(defaultMedicines);
  console.log("Seeded default medicines for customer inventory");
}
