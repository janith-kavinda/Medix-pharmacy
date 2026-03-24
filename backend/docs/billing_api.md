# Billing API

Base path: /api/billings

Endpoints

- POST /api/billings
  - Description: Create a new billing record.
  - Request JSON:
    {
      "patientId": "60f7c2e9b1d4c12a34567890",
      "items": [
        { "name": "Paracetamol", "quantity": 2, "price": 5.0 },
        { "name": "Ibuprofen", "quantity": 1, "price": 8.0 }
      ],
      "tax": 0.05, // optional tax rate (5%)
      "paymentMethod": "cash",
      "notes": "Take with food",
      "paid": false
    }
  - Success response: 201 Created with created billing object.

- GET /api/billings
  - Description: List all billing records.
  - Success response: 200 OK with array of billing objects.

- GET /api/billings/:id
  - Description: Retrieve a single billing by id.
  - Success response: 200 OK with billing object.

- PUT /api/billings/:id
  - Description: Update billing fields (items, paid, paymentMethod, notes).
  - Request JSON example (update items):
    {
      "items": [
        { "name": "Paracetamol", "quantity": 3, "price": 5.0 }
      ],
      "tax": 0.05
    }
  - Success response: 200 OK with updated billing object.

- DELETE /api/billings/:id
  - Description: Delete a billing record.
  - Success response: 200 OK with { "success": true }.

- POST /api/billings/:id/mark-paid
  - Description: Mark the billing as paid.
  - Success response: 200 OK with updated billing object (paid: true).

Curl examples

Create:
curl -X POST http://localhost:3000/api/billings -H "Content-Type: application/json" -d '{"patientId":"60f7c2e9b1d4c12a34567890","items":[{"name":"Paracetamol","quantity":2,"price":5}],"tax":0.05}'

List:
curl http://localhost:3000/api/billings

Get one:
curl http://localhost:3000/api/billings/60f7c3a1b1d4c12a34567891

Update:
curl -X PUT http://localhost:3000/api/billings/60f7c3a1b1d4c12a34567891 -H "Content-Type: application/json" -d '{"paid":true}'

Mark paid:
curl -X POST http://localhost:3000/api/billings/60f7c3a1b1d4c12a34567891/mark-paid
