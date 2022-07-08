"use strict";

(async function chart() {
	const div = document.createElement("div");
	div.innerHTML = CHART_DATA;
	const times = JSON.parse(div.innerText);
	await new Promise((resolve) => {
		setInterval(
			() =>
				typeof Chart !== "undefined" && Chart._adapters && Chart._adapters._date
					? resolve()
					: undefined,
			50,
		);
	});
	const colors = {};
	const datasets = [];
	for (const stroke in times) {
		if (Object.hasOwnProperty.call(times, stroke) && times[stroke].length) {
			const color = Math.floor(Math.random() * 1000000) % 360;
			colors[stroke] = {
				background: `hsl(${color} 100% 45%)`,
				border: `hsl(${color} 100% 20%)`,
			};
			datasets.push({
				label: stroke,
				data: times[stroke],
				borderColor: colors[stroke].border,
				backgroundColor: times[stroke].map(() => colors[stroke].background),
			});
		}
	}

	const chart = new Chart(document.querySelector("#graph").getContext("2d"), {
		type: "line",
		data: {
			datasets,
		},
		options: {
			maintainAspectRatio: false,
			tension: 0.055,
			parsing: { xAxisKey: "_date", yAxisKey: "_time" },
			scales: {
				x: {
					type: "timeseries",
					time: {
						tooltipFormat: "day",
						minUnit: "day",
						unit: "day",
						displayFormats: { day: "DD MMM YY" },
					},
					suggestedMax: new Date().valueOf(),
					title: { display: true, text: "Date" },
					grid: { display: false },
					ticks: {
						autoSkip: true,
						maxTicksLimit: 11,
					},
				},
				y: {
					min: 0,
					title: {
						display: true,
						text: "Seconds per 25 yards", // TODO
					},
				},
			},
			transitions: {
				show: { animations: { x: { from: 0 }, y: { from: 0 } } },
				hide: { animations: { x: { to: 0 }, y: { to: 0 } } },
			},
			plugins: {
				tooltip: {
					callbacks: {
						beforeTitle([data]) {
							return data.raw.Meet;
						},
						title([data]) {
							return data.raw.Event;
						},
						beforeBody([data]) {
							console.log(data.raw);
							return data.raw.Time + " seconds" + (data.raw.PB ? " ⭐" : "");
						},
						label() {},
						afterBody([data]) {
							return data.raw.Place;
						},
						footer([data]) {
							return data.raw._time;
						},
					},
				},
			},
			elements: {
				point: {
					pointStyle({ raw }) {
						return raw.PB ? "star" : "circle";
					},
					radius({ raw }) {
						return raw.PB ? 6 : 3;
					},
				},
			},
		},
	});
	window.chart = chart; // TODO: ROP
})();
(async function tabs() {
	window.location.hash = window.location.hash || "##table-page";
	const scrolls = {
		"#table-page": { x: 0, y: 0 },
	};
	function ontabswap(tab = document.querySelector('.tab[data-tab="#table-page"]')) {
		const clickedTab =
			document.querySelector((tab && tab.dataset && tab.dataset.tab) || "#table-page") ||
			document.querySelector("#table-page");
		document.querySelectorAll(".tab.active-tab").forEach((activeTab) => {
			activeTab.classList.remove("active-tab");
			scrolls[activeTab.dataset.tab] = {
				x: window.scrollX,
				y: window.scrollY,
			};
		});
		tab.classList.add("active-tab");

		document
			.querySelectorAll(".tab-content.active-content")
			.forEach((activeContent) => activeContent.classList.remove("active-content"));
		clickedTab.classList.add("active-content");

		window.location.hash = "#" + ((tab && tab.dataset && tab.dataset.tab) || "#table-page");

		scroll(
			scrolls[(tab && tab.dataset && tab.dataset.tab) || "#table-page"].x,
			scrolls[(tab && tab.dataset && tab.dataset.tab) || "#table-page"].y,
		);
	}
	scrolls[window.location.hash.substring(1)] = { x: 0, y: 0 };
	ontabswap(
		document.querySelector('.tab[data-tab="' + window.location.hash.substring(1) + '"]') ||
			document.querySelector('.tab[data-tab="#table-page"]'),
	);
	document.querySelectorAll(".tab").forEach((tab) => {
		scrolls[tab.dataset.tab] = { x: 0, y: 0 };
		tab.addEventListener("click", () => ontabswap(tab));
	});
})();
(async function header() {
	let lastScroll = 0,
		ticking = false,
		/**
		 * -1 = has not scrolled yet.
		 *
		 * 0 = scrolling down.
		 *
		 * 1 = scrolling up.
		 */
		lastDir = -1;
	window.addEventListener("scroll", function onscroll() {
		const scroll =
			window.pageYOffset || document.compatMode === "CSS1Compat"
				? document.documentElement.scrollTop
				: document.body.scrollTop;
		/**
		 * 0 = scrolling down.
		 *
		 * 1 = scrolling up.
		 */
		let dir =
			// hide when scrolled to bottom because you have to be scrolling down to reach the bottom, plus there's bugs without this
			(document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight >=
				(document.documentElement.scrollHeight || document.body.scrollHeight) ||
			// hide untill scrolled 150px down
			(scroll > 150 &&
				// determine actual scroll direction
				scroll > lastScroll);

		if (!ticking) {
			window.requestAnimationFrame(function () {
				if (dir !== lastDir) {
					document.body.classList[dir == 1 ? "add" : "remove"]("no-head");
				}
				lastScroll = scroll;
				lastDir = dir;
				ticking = false;
			});

			ticking = true;
		}
	});
})();
