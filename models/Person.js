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
  birthday: {
    type: Date,
  },
  age: {
    type: Number,
  },
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
    if (returnedObject.birthday) {
      returnedObject.birthday =
        returnedObject.birthday.toLocaleDateString("en-US");
    }
  },
});

const Person = mongoose.model("Person", personSchema);

export default Person;
