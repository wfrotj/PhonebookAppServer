import mongoose from "mongoose";

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  number1: {
    type: String,
  },
  number2: { type: String },
  address: {
    type: String,
    required: true,
  },
  user: String,
  photoInfo: {
    url: String,
    filename: String,
  },
});

personSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id;
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Person = mongoose.model("Person", personSchema);

export default Person;
