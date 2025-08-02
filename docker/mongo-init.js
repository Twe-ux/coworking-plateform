// MongoDB initialization script
db = db.getSiblingDB('coworking-platform');

// Create collections
db.createCollection('users');
db.createCollection('spaces');
db.createCollection('bookings');
db.createCollection('payments');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "createdAt": 1 });

db.spaces.createIndex({ "ownerId": 1 });
db.spaces.createIndex({ "location": "2dsphere" });
db.spaces.createIndex({ "category": 1 });
db.spaces.createIndex({ "isActive": 1 });

db.bookings.createIndex({ "userId": 1 });
db.bookings.createIndex({ "spaceId": 1 });
db.bookings.createIndex({ "startDate": 1, "endDate": 1 });
db.bookings.createIndex({ "status": 1 });

db.payments.createIndex({ "bookingId": 1 });
db.payments.createIndex({ "userId": 1 });
db.payments.createIndex({ "status": 1 });
db.payments.createIndex({ "createdAt": 1 });

print('Database initialized successfully with collections and indexes');