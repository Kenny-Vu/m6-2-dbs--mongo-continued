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

module.exports = { getSeats };
