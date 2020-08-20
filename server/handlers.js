"use strict";
const { MongoClient } = require("mongodb");
const assert = require("assert");

require("dotenv").config();
const { MONGO_URI } = process.env;

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const NUM_OF_ROWS = 8;
const SEATS_PER_ROW = 12;

let state;
let lastBookingAttemptSucceeded = false;

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
// ----------------------------------
//Handlers
const getSeats = async (req, res) => {
  const client = await MongoClient(MONGO_URI, options);
  await client.connect();
  const db = client.db("mongo-workshop");

  if (!state) {
    state = {
      bookedSeats: randomlyBookSeats(30),
    };
  }

  try {
    const response = await db.collection("seats").find().toArray();
    console.log(response);
    const seats = {};
    response.forEach((seat) => {
      seats[`${seat._id}`] = seat;
    });
    res.status(200).json({
      seats,
      numOfRows: 8,
      seatsPerRow: 12,
      bookedSeats: state.bookedSeats,
    });
  } catch (err) {
    console.log(err.stack);
  }
};

const bookSeat = async (req, res) => {
  const { seatId, creditCard, expiration } = req.body;
  const isAlreadyBooked = !!state.bookedSeats[seatId];

  const client = await MongoClient(MONGO_URI, options);
  await client.connect();
  const db = client.db("mongo-workshop");

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

  try {
    const result = await db
      .collection("seats")
      .updateOne(
        { _id: seatId },
        { $set: { isBooked: true, creditCard, expiration } }
      );
    console.log(result);
    res.status(201).json({ status: 201, success: true });
  } catch (err) {
    console.log(err.stack);
  }
  client.close();
};

module.exports = { getSeats, bookSeat };
