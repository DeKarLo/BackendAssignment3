const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set("trust proxy", true);

app.set("view engine", "ejs");

app.get("/", async (req, res) => {
    const user = await getUserInstance(req.ip);

    res.render("home", { user: user, error: null });
});

app.get("/admin", async (req, res) => {
    const user = await getUserInstance(req.ip);
    const users = await User.find({});

    if (!user || !user.isAdmin) {
        return res.render("home", { user, error: "Access restricted" });
    }

    res.render("admin", { user, users, error: null });
});

app.post("/admin/create-user", async (req, res) => {
    const user = await getUserInstance(req.ip);

    if (!user || !user.isAdmin) {
        return res.render("home", { user, error: "Access restricted" });
    }

    const { username, password } = req.body;

    const userExists = await User.findOne({ username: username });

    if (userExists) {
        return res.redirect("/admin?error=User already exists");
    }

    const newUser = await User.create({ username, password });
    res.redirect("/admin");
});

app.get("/admin/delete-user/:id", async (req, res) => {
    const user = await getUserInstance(req.ip);

    if (!user || !user.isAdmin) {
        return res.render("home", { user, error: "Access restricted" });
    }

    const id = req.params.id;
    await User.deleteOne({ _id: id });

    res.redirect("/admin");
});

app.post("/admin/update-user/:id", async (req, res) => {
    const user = await getUserInstance(req.ip);

    if (!user || !user.isAdmin) {
        return res.render("home", { user, error: "Access restricted" });
    }

    const id = req.params.id;
    const { username, password } = req.body;

    await User.updateOne({ _id: id }, { username, password });

    res.redirect("/admin");
});

app.get("/login", async (req, res) => {
    const user = await getUserInstance(req.ip);

    if (user) {
        return res.render("home", { user, error: null });
    }

    res.render("login", { user: null, error: null });
});

app.get("/registration", async (req, res) => {
    const user = await getUserInstance(req.ip);

    if (user) {
        return res.render("home", { user, error: null });
    }

    res.render("registration", { user: null, error: null });
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({
        username,
        password,
    });

    if (!user || user.password !== password) {
        return res.render("login", { error: "Invalid username or password" });
    }

    const ip = req.ip;
    const userIpAuth = await UserIpAuth.create({ user: user._id, ip });

    res.render("home", { user: user });
});

app.post("/registration", async (req, res) => {
    const { username, password } = req.body;

    const userExists = await User.findOne({ username: username });
    const id = await Count.findOne();
    const new_id = id.userID;
    id.userID = id.userID + 1;

    if (userExists) {
        return res.render("registration", { user: null, error: "User already exists" });
    }

    const user = await User.create({ userID: new_id, username, password });
    await id.save();
    return res.render("login", { user, error: null });
});

app.get("/weather/:city", async (req, res) => {
    const city = req.params.city;
    const user = await getUserInstance(req.ip);

    const response = await getWeatherData(city);

    res.render("weather", { city, weatherData: response, user: user });

    WeatherLog.create({ user: user?._id, city, response: JSON.stringify(response) });
});

app.get("/history", async (req, res) => {
    const user = await getUserInstance(req.ip);

    const weatherLogs = await WeatherLog.find({ user: user?._id });

    res.render("history", { weatherLogs: weatherLogs, user, error: weatherLogs.length === 0 ? "No history found" : null });
});

function getWeatherData(city) {
    const apiKey = "09b0887cfdc2961284caf30e31c34f91";
    return axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`).then((response) => {
        const weatherData = response.data;

        const filteredData = {
            temperature: weatherData.main.temp,
            feels_like: weatherData.main.feels_like,
            pressure: weatherData.main.pressure,
            humidity: weatherData.main.humidity,
            wind: weatherData.wind.speed,
            main: weatherData.weather[0].main,
            icon: weatherData.weather[0].icon,
        };

        return filteredData;
    });
}

async function getUserInstance(ip) {
    const userIpAuth = await UserIpAuth.findOne({ ip });
    if (!userIpAuth) {
        return null;
    }

    const user = await User.findById(userIpAuth.user);
    return user;
}

mongoose
    .connect("mongodb+srv://DeKarLo:0FzMsKxA7HxdKa1Y@cluster1.enhb9xt.mongodb.net/")
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });

const User = mongoose.model("User", {
    userID: Number,
    username: String,
    password: String,
    creationDate: { type: Date, default: Date.now },
    updateDate: { type: Date, default: Date.now },
    deletionDate: { type: Date, default: null },
    isAdmin: { type: Boolean, default: false },
});

const Count = mongoose.model("Count", {
    userID: Number,
});

const UserIpAuth = mongoose.model("UserIpAuth", {
    user: mongoose.Schema.Types.ObjectId,
    ip: String,
});

const WeatherLog = mongoose.model("WeatherLog", {
    user: mongoose.Schema.Types.ObjectId,
    city: String,
    response: String,
    date: { type: Date, default: Date.now },
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
});
