const User = require("./user.model");
const bcrypt = require("bcrypt");
const { createToken } = require("../../helpers/token-action");
const { setError } = require("../../helpers/errors");
const { deleteFile } = require("../../middlewares/delete-file");

const getAll = async (req, res, next) => {
  try {
    const user = await User.find()
    return res.json({
      status: 200,
      message: "Recovered all user",
      data: { user },
    });
  } catch (error) {
    return next(setError(500, "Failed all User"));
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return next(setError(404, "User not found"));
    return res.json({
      status: 200,
      message: "Recovered user by id",
      data: { user },
    });
  } catch (error) {
    return next(setError(500, "Failed user by id"));
  }
};

const getByUserName = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.find({ username: username }).populate("favoriteExperience");
    if (!user) return next(setError(404, "User not found"));
    return res.json({
      status: 200,
      message: "Recovered user by username",
      data: { user },
    });
  } catch (error) {
    return next(setError(500, "Failed user by username"));
  }
};

const register = async (req, res, next) => {
  try {
    const newUser = new User(req.body);
    const userExist = await User.findOne({ username: newUser.username });
    if (userExist) { return next(setError(409, "this user already exist")) };
    if (req.file) { newUser.avatar = req.file.path };
    const userInDb = await newUser.save();
    res.status(201).json(userInDb);
  } catch (error) {
    return next(setError(500, error.message || "Failed register user"));
  }
};

const login = async (req, res, next) => {
  try {
    const userInDb = await User.findOne({ username: req.body.username });
    if (!userInDb) return next(setError(404, "User no found "));
    if (bcrypt.compareSync(req.body.password, userInDb.password)) {
      const token = createToken(userInDb._id, userInDb.username);
      return res.status(200).json({ userInDb, token });
    } else {
      return next(setError(401, " invalid password "));
    }
  } catch (error) {
    return next(setError(500, error.message || "Unexpected error login"));
  }
};
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userDB = await User.findById(id);
    if (!userDB) {
      return next("User not found");
    }
  if (userDB && req.file) {
    deleteFile(userDB.avatar);
  }
    const patchUserDB = new User(req.body);

    patchUserDB._id = id;

    if (req.file) {
      patchUserDB.image = req.file.path;
    }
    const UserDB = await User.findByIdAndUpdate(id, patchUserDB);
    return res.status(200).json({ new: patchUserDB, old: UserDB });
  } catch (error) {
    return next("Error to modify user", error);
  }
};
 const remove = async (req, res, next) => {
   try {
     const { id } = req.params;
     const userDB = await User.findByIdAndDelete(id);
     if (!userDB) {
       return next("User not found");
     }
     if (userDB) {
       deleteFile(userDB.avatar);
     }

     return res.status(200).json(userDB);
   } catch (error) {
     return next("This user can't delete ", error);
   }
 };


module.exports = {
  getAll,
  getById,
  getByUserName,
  register,
  login,
  update,
  remove
};
