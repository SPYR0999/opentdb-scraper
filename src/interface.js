import * as clack from "@clack/prompts";
import color from "picocolors"; // This package comes with clack
import search from "./search.js";
import scrape from "./scraper.js";
import combine from "./combine.js";

async function main() {
	clack.intro(color.bgCyan(color.black(" OPENTDB SCRAPER CLI ")));

	while (true) {
		// Render a clack menu
		const action = await clack.select({
			message: "Main menu",
			options: [
				{value: "search", label: "1. Search"},
				{value: "scrape", label: "2. Scrape new questions"},
				{value: "combine", label: "3. Clean up database"},
				{value: "exit", label: "4. Exit application"}
			]
		});

		// Check if user canccelled using CTRL+C
		if (clack.isCancel(action) || action === "exit") {
			clack.outro("Goodbye!");
			process.exit(0);
		}

		switch (action) {
			case "search": {
				await search();
				break;
			}
			case "scrape": {
				const results = await scrape();
				await combine(results);
				break;
			}
			case "combine": {
				await combine();
				break;
			}
			default: {}
		}
	}
}

main();
