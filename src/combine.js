import fs from "fs";
import * as he from "he";

const filePath = "./results/opentdb.json";

export default function combine(newData = []) {
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
			console.log("File not found. It will be created.");
		}

		// Combine datasets
		const combinedData = [...existingData, ...newData];
		const uniqueMap = new Map(combinedData.map(obj => [obj.question, obj]));
		const uniqueContent = Array.from(uniqueMap.values());

		// Clean up HTML entities
		const cleanedContent = uniqueContent.map(el => {
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

		fs.writeFileSync(
			filePath,
			JSON.stringify({results: cleanedContent}, null, "\t")
		);

		console.log(`Incoming data: ${newData.length} questions`);
		console.log(`Existing data: ${existingData.length} questions`);
		console.log(`New total: ${cleanedContent.length} questions`);
	} catch (e) {
		console.error("An error occurred while updating the JSON file:", e);
	}
}

combine();
