import fs from "fs";
import * as he from "he";
import * as clack from "@clack/prompts";

const filePath = "./results/opentdb.json";

export default async function combine(newData = []) {
	if (!Array.isArray(newData)) {
		throw new Error("New data must be supplied in array format.");
	}

	try {
		// Read existing dataset
		let existingData = [];
		if (fs.existsSync(filePath)) {
			const fileContent = fs.readFileSync(filePath);
			existingData = JSON.parse(fileContent).results;
		} else {
			clack.log.warn("File not found. It will be created.");
		}

		// Combine datasets
		const combinedData = [...existingData, ...newData];

		// Clean up HTML entities
		const cleanedData = combinedData.map(el => {
			// Create a shallow copy of the object
			const newObj = {...el};

			// Clean all string keys
			Object.keys(el).forEach(key => {
				if (typeof el[key] === "string") {
					newObj[key] = he.decode(el[key]);
				}
			});

			return newObj;
		});

		// Filter duplicates
		const uniqueMap = new Map(cleanedData.map(obj => [obj.question, obj]));
		const uniqueContent = Array.from(uniqueMap.values());

		fs.writeFileSync(
			filePath,
			JSON.stringify({results: uniqueContent}, null, "\t")
		);

		clack.log.message(`Existing data: ${existingData.length} questions`);
		clack.log.success(`New total: ${uniqueContent.length} questions`);
	} catch (e) {
		clack.log.error("An error occurred while updating the JSON file:", e);
	}
}
