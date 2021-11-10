"use strict";

const fetch = require("node-fetch");
const path = require("path");

const express = require("express");
const app = express();
const mustacheExpress = require("mustache-express")(path.resolve(__dirname, "partials"), ".html");
app.engine("html", mustacheExpress);
app.use(express.static("public"));
const PORT = 3000;

// https://stackoverflow.com/a/39466341/11866686
const nth = (n) => n + ([, "st", "nd", "rd"][(n / 10) % 10 ^ 1 && n % 10] || "th");

const randomLetter = () => String.fromCharCode(65 + (Math.floor(Math.random() * 100) % 26));

const generateID = (len = 1, blacklist = []) => {
	let id = "";
	for (let index = 0; index < len; index++) {
		id += randomLetter();
	}
	return blacklist.includes(id) ? generateID(len + 1, blacklist) : id;
};

app.get("/", async (req, res) => {
	if (!req.query.member) {
		return res.sendFile(path.resolve(__dirname, "index.html"));
	}
	const results = await fetch("https://www.teamunify.com/api/amaService/getBestTimesForSwimmer", {
		body: JSON.stringify({ memberId: +req.query.member }),
		method: "POST",
	}).then((resp) => resp.json());
	if (!results?.result?.cache_dt_modified || !results?.result?.splashes) {
		return res.status(400).send("Error. Please make sure the swimmer ID is correct.");
	}
	const parsed_results = {};
	parsed_results.lastUpdated = new Date(results.result.cache_dt_modified).toString();
	parsed_results.times = [];
	const IDS = [];
	results.result.splashes.forEach((res, index) => {
		let id = generateID(1, IDS);

		IDS.push(id);
		parsed_results.times.push({
			id: "bestTime_" + id,
			meet: /^(.+) \(\d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4}\)$/.exec(
				results.meetNames[res.meetID],
			)[1],

			// TODO: should only show the date, not time. But needs to be expressed as a number to be sorted
			date: new Date(res.swimDate),

			place: res.place ? nth(+res.place) + ` place (${+res.points} points)` : "N/A",
			distance: +res.distance,
			course: { 1: "Yard", 2: "Meters", 4: "Meters" }[res.course] || "",
			poolLength: { 1: "25", 2: "25", 4: "50" }[res.course] || "",
			stroke:
				{
					1: "Freestyle",
					2: "Backstroke",
					4: "Breaststroke",
					8: "Butterfly",
					16: "Individual Medley",
				}[res.stroke] || "",
			time:
				+`${res.time}`.substring(0, `${res.time}`.length - 2) +
				`${res.time}`.substring(`${res.time}`.length - 2) / 100,
			best: false,
		});
	});
	parsed_results.times.sort((a, b) => (a.date > b.date ? 1 : -1));
	parsed_results.best = [];
	parsed_results.times.forEach((time, index) => {
		if (
			parsed_results.times.filter((compareTo) => {
				return (
					compareTo.distance === time.distance &&
					compareTo.course === time.course &&
					compareTo.stroke === time.stroke &&
					compareTo.time < time.time
				);
			}).length === 0
		)
			time.best = true;
		if (
			parsed_results.times.filter((compareTo, compareIndex) => {
				return (
					compareTo.distance === time.distance &&
					compareTo.course === time.course &&
					compareTo.stroke === time.stroke &&
					compareTo.time < time.time &&
					compareIndex < index
				);
			}).length === 0
		)
			parsed_results.best.push(time.id);
	});
	parsed_results.bestCSS = "#" + parsed_results.best.join(",#");
	parsed_results.byStroke = {
		"Butterfly": [],
		"Backstroke": [],
		"Breaststroke": [],
		"Freestyle": [],
		"Individual Medley": [],
	};
	parsed_results.times.forEach((time) =>
		parsed_results.byStroke[time.stroke].push({
			Meet: time.meet + " (" + time.date.toDateString() + ")",
			PB: time.best,
			Place: time.place,
			Event: time.distance + " " + time.course + " " + time.stroke,
			Time: time.time,
			_date: time.date.valueOf(),
			_time:
				(50 / // todo: this is xx in the title
					(time.distance * (time.course == "Meters" ? 1.09361 : 1))) *
				time.time,
		}),
	);
	parsed_results.byStroke = JSON.stringify(parsed_results.byStroke);

	res.render(path.resolve(__dirname, "stats.html"), parsed_results);
});

app.listen(PORT, () => console.log(`App listening on port ${PORT}!`));
