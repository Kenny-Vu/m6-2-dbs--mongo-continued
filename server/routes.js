const router = require("express").Router();
const { MongoClient } = require("mongodb");
const assert = require("assert");
require("dotenv").config();

const { getSeats } = require("./handlers");

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

let state;

router.get("/api/seat-availability", getSeats);

let lastBookingAttemptSucceeded = false;

router.post("/api/book-seat", async (req, res) => {
  const { seatId, creditCard, expiration } = req.body;

  if (!state) {
    state = {
      bookedSeats: randomlyBookSeats(30),
    };
  }

  const isAlreadyBooked = !!state.bookedSeats[seatId];
  if (isAlreadyBooked) {
    return res.status(400).json({
      message: "This seat has already been booked!",
    });
  }

  if (!creditCard || !expiration) {
    return res.status(400).json({
      status: 400,
      message: "Please provide credit card information!",
    });
  }

  if (lastBookingAttemptSucceeded) {
    lastBookingAttemptSucceeded = !lastBookingAttemptSucceeded;

    return res.status(500).json({
      message: "An unknown error has occurred. Please try your request again.",
    });
  }

  lastBookingAttemptSucceeded = !lastBookingAttemptSucceeded;

  state.bookedSeats[seatId] = true;

  return res.status(200).json({
    status: 200,
    success: true,
  });
});

module.exports = router;
