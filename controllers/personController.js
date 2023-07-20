import User from "../models/User.js";
import Person from "../models/Person.js";
import getTokenFrom from "../utils/getTokenFrom.js";
import jwt from "jsonwebtoken";
import config from "../utils/config.js";
import storage from "../utils/firebaseConfig.js";
import { ref, uploadBytes, deleteObject } from "firebase/storage";
import generateUniqueImageFileName from "../utils/generateUniqueImageFileName.js";
import uploadFile from "../utils/uploadFile.js";
import userService from "../services/userService.js";
import personService from "../services/personService.js";

async function getPersons(req, res) {
  const decodedToken = jwt.verify(getTokenFrom(req), config.SECRET);
  const persons = await Person.find({ user: decodedToken.id });

  return res.json(persons);
}

async function getPerson(req, res, next) {
  try {
    const { id } = req.params;
    const person = await Person.findById(id);

    if (person) return res.json(person);

    return res.status(404).json({ error: "Person not found" });
  } catch (error) {
    next(error);
  }
}

async function createPerson(req, res, next) {
  try {
    const { name, number, address } = req.body;
    const decodedToken = userService.verifyToken(req, config.SECRET);
    const user = await userService.getUser(decodedToken.id);
    const photoInfo = await uploadFile(req.file);

    const personExists = await Person.findOne({ name });
    if (personExists) {
      return res.status(400).json({ error: "Person already exists" });
    }
    const numberExists = await Person.findOne({ number });
    if (numberExists) {
      return res.status(400).json({ error: "Contact number already exists" });
    }
    const savedPerson = await personService.createPerson({
      name,
      number,
      address,
      user: user._id,
      photoInfo,
    });

    userService.savePerson(savedPerson._id, user);

    return res.status(201).json(savedPerson);
  } catch (error) {
    next(error);
  }
}

async function updatePerson(req, res, next) {
  const id = req.params.id;
  const { name, number } = req.body;
  const previousPerson = await Person.findById(id);
  let snapshot;
  let photoUrl = "";

  if (req.file) {
    const storageRef = ref(storage, generateUniqueImageFileName(req.file));
    const metadata = {
      contentType: "image/jpeg",
    };
    snapshot = await uploadBytes(storageRef, req.file.buffer, metadata);
    photoUrl = `https://firebasestorage.googleapis.com/v0/b/${snapshot.ref.bucket}/o/${snapshot.ref.fullPath}?alt=media`;

    const photoRef = ref(storage, previousPerson.photoInfo.filename);
    await deleteObject(photoRef);
  }

  const person = {
    name,
    number,
    photoInfo: req.file
      ? { url: photoUrl, filename: snapshot.ref.fullPath }
      : previousPerson.photoInfo,
  };

  try {
    const updatedPerson = await Person.findByIdAndUpdate(id, person, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (updatedPerson) {
      return res.json(updatedPerson);
    }

    return res.status(404).json({ error: "Person not found" });
  } catch (error) {
    next(error);
  }
}

async function deletePerson(req, res, next) {
  try {
    const { id } = req.params;
    const decodedToken = jwt.verify(getTokenFrom(req), config.SECRET);

    if (!decodedToken.id) {
      return res.status(401).json({ error: "Token missing or invalid" });
    }

    const user = await User.findById(decodedToken.id);
    const person = await Person.findByIdAndDelete(id);
    const photoRef = ref(storage, person.photoInfo.filename);

    await deleteObject(photoRef);
    user.persons = user.persons.filter(
      (personId) => personId.toString() !== person._id.toString()
    );
    await user.save();

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export default {
  getPersons,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
};
