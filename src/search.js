import fs from 'fs';
import * as clack from "@clack/prompts";

// Path to your downloaded JSON file
const FILE_PATH = './results/opentdb.json'; 

// Load and parse the JSON file safely
let triviaData = [];
try {
	const rawData = fs.readFileSync(FILE_PATH, 'utf8');
	// Adjust this depending on your JSON structure (e.g., rawData if it's a direct array, or data.results)
	const parsed = JSON.parse(rawData);
	triviaData = Array.isArray(parsed) ? parsed : (parsed.results || []);
	clack.log.success(`Successfully loaded ${triviaData.length} questions.`);
} catch (error) {
	console.error(`Error reading ${FILE_PATH}:`, error.message);
	process.exit(1);
}

export default async function promptSearch() {
	while (true) {
		const query = await clack.text({
			message: "Enter a query to search (or type \"exit\" to quit):"
		});

		if (clack.isCancel(query) || query.toLowerCase() === 'exit' || query.toLowerCase() === 'q') {
			return;
		}

		if (!query.trim()) {
			clack.log.warn('Please enter a valid query.');
			continue;
		}

		// Perform case-insensitive search on the question text
		const matches = triviaData.filter(item => {
			const questionText = item.question || item.Question || '';
			return questionText.toLowerCase().includes(query.toLowerCase());
		});

		clack.log.message(`\nFound ${matches.length} matching result(s):`);

		matches.forEach((item, index) => {
			// Map common OpenTDB JSON naming variants (handle both lowercase and uppercase variations)
			const question = item.question || item.Question;
			const correct = item.correct_answer || item.Correct_Answer || item['Correct Answer'];
			const incorrect = item.incorrect_answers || [item.Choice_2, item.Choice_3, item.Choice_4].filter(Boolean);

			const result = [
				`\n[${index + 1}] Question: ${question}`,
				`  🟢 Correct Answer: ${correct}`,
			];
			if (incorrect && incorrect.length > 0) {
				result.push(`  ❌ Wrong Choices:  ${incorrect.join(', ')}`);
			}

			clack.log.success(result.join("\n"));
		});
	}
}
