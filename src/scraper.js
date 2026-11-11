import fetch from "node-fetch";
import * as clack from "@clack/prompts";

export default async function run() {
	let keepRunning = true;
	let cancelSleep = null;

	const sleep = (ms) =>
		new Promise((resolve) => {
			const timer = setTimeout(resolve, ms);
			cancelSleep = () => {
				clearTimeout(timer);
				resolve();
			};
		});

	// Listen directly to stdin 'data' events (more reliable after clack.select)
	const onData = (chunk) => {
		const input = chunk.toString();

		// Handle Ctrl+C raw byte (\u0003)
		if (input === "\u0003") {
			if (process.stdin.isTTY) process.stdin.setRawMode(false);
			process.exit(0);
		}

		// Handle 'q' or 'Q'
		if (input.toLowerCase().includes("q") && keepRunning) {
			clack.log.warn("Stop signal caught. Finishing current operation...");
			keepRunning = false;
			if (cancelSleep) cancelSleep();
		}
	};

	if (process.stdin.isTTY) {
		process.stdin.setRawMode(true);
	}
	process.stdin.resume();
	process.stdin.setEncoding("utf8");
	process.stdin.on("data", onData);

	try {
		clack.log.info("Starting OpenTDB Scraper — Press Q to stop at any time.");

		const tokenRes = await fetch("https://opentdb.com/api_token.php?command=request");
		const tokenJson = await tokenRes.json();

		if (tokenJson.response_code !== 0) {
			clack.log.error("Failed to create token.");
			return;
		}

		const token = tokenJson.token;
		const url = `https://opentdb.com/api.php?token=${token}`;

		const output = { results: [] };
		let totalFetched = 0;

		while (keepRunning) {
			const response = await fetch(`${url}&amount=50`);
			const data = await response.json();

			if (data.response_code !== 0) {
				if (data.response_code === 1 || data.response_code === 4) {
					clack.log.message("No more full batches available.");

					const remaining = await fetch("https://opentdb.com/api_count_global.php");
					const remainingJson = await remaining.json();
					const amount =
						remainingJson.overall.total_num_of_verified_questions % 50;

					if (amount > 0 && keepRunning) {
						clack.log.message(`Fetching final ${amount} questions...`);
						await sleep(6000);
						if (!keepRunning) break;

						const finalResponse = await fetch(`${url}&amount=${amount}`);
						const finalData = await finalResponse.json();

						if (finalData.results) {
							output.results.push(...finalData.results);
							totalFetched += finalData.results.length;
						}
					}
					break;
				}

				clack.log.error(`OpenTDB error code: ${data.response_code}`);
				break;
			}

			output.results.push(...data.results);
			totalFetched += data.results.length;

			clack.log.info(
				`Fetched ${totalFetched} questions, waiting 6s for rate limit... (Press Q to stop)`
			);
			await sleep(6000);
		}

		clack.log.message(`Finished, fetched ${totalFetched} questions`);

		const uniqueMap = new Map(output.results.map((obj) => [obj.question, obj]));
		output.results = Array.from(uniqueMap.values());
		clack.log.success(`Result: ${output.results.length} unique questions`);

		if (output.results.length > 0) {
			return(output.results);
		}
	} finally {
		// Clean up listener and restore terminal state for clack.select
		process.stdin.off("data", onData);
		if (process.stdin.isTTY) {
			process.stdin.setRawMode(false);
		}
		process.stdin.pause();
	}
}
