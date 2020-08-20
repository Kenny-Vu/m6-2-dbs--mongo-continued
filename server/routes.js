const router = require("express").Router();
const { MongoClient } = require("mongodb");
const assert = require("assert");
require("dotenv").config();

const { getSeats, bookSeat } = require("./handlers");

const { MONGO_URI } = process.env;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Code that is generating the seats.
// ----------------------------------
const seats = {};
const row = ["A", "B", "C", "D", "E", "F", "G", "H"];
for (let r = 0; r < row.length; r++) {
  for (let s = 1; s < 13; s++) {
    seats[`${row[r]}-${s}`] = {
      _id: `${row[r]}-${s}`,
      price: 225,
      isBooked: false,
    };
  }
}
//function to send seats into MongoDb
const storeSeatsInDatabase = async (seats) => {
  const client = await MongoClient(MONGO_URI, options);
  await client.connect();
  const db = client.db("mongo-workshop");
  const seatsToAdd = Object.values(seats);
  try {
    const response = await db.collection("seats").insertMany(seatsToAdd);
    assert.equal(96, response.insertedCount);
    console.log("success!");
  } catch (err) {
    console.log(err.stack);
  }
};
storeSeatsInDatabase(seats);
// ----------------------------------
//////// HELPERS
const getRowName = (rowIndex) => {
  return String.fromCharCode(65 + rowIndex);
};

const randomlyBookSeats = (num) => {
  const bookedSeats = {};

  while (num > 0) {
    const row = Math.floor(Math.random() * NUM_OF_ROWS);
    const seat = Math.floor(Math.random() * SEATS_PER_ROW);

    const seatId = `${getRowName(row)}-${seat + 1}`;

    bookedSeats[seatId] = true;

    num--;
  }

  return bookedSeats;
};

router.get("/api/seat-availability", getSeats);

let lastBookingAttemptSucceeded = false;

router.post("/api/book-seat", bookSeat);

module.exports = router;
