import fs from 'fs';
import readline from 'readline';

// Path to your downloaded JSON file
const FILE_PATH = './results/opentdb.json'; 

// Load and parse the JSON file safely
let triviaData = [];
try {
    const rawData = fs.readFileSync(FILE_PATH, 'utf8');
    // Adjust this depending on your JSON structure (e.g., rawData if it's a direct array, or data.results)
    const parsed = JSON.parse(rawData);
    triviaData = Array.isArray(parsed) ? parsed : (parsed.results || []);
    console.log(`Successfully loaded ${triviaData.length} questions.`);
} catch (error) {
    console.error(`Error reading ${FILE_PATH}:`, error.message);
    process.exit(1);
}

// Set up the terminal search prompt interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptSearch() {
    rl.question('\nEnter a keyword to search (or type "exit" to quit): ', (keyword) => {
        if (keyword.toLowerCase() === 'exit') {
            rl.close();
            return;
        }

        if (!keyword.trim()) {
            console.log('Please enter a valid keyword.');
            return promptSearch();
        }

        // Perform case-insensitive search on the question text
        const matches = triviaData.filter(item => {
            const questionText = item.question || item.Question || '';
            return questionText.toLowerCase().includes(keyword.toLowerCase());
        });

        console.clear();
        console.log(`\nFound ${matches.length} matching result(s):`);
        console.log('========================================');

        matches.forEach((item, index) => {
            // Map common OpenTDB JSON naming variants (handle both lowercase and uppercase variations)
            const question = item.question || item.Question;
            const correct = item.correct_answer || item.Correct_Answer || item['Correct Answer'];
            const incorrect = item.incorrect_answers || [item.Choice_2, item.Choice_3, item.Choice_4].filter(Boolean);

            console.log(`\n[${index + 1}] Question: ${question}`);
            console.log(`    🟢 Correct Answer: ${correct}`);
            if (incorrect && incorrect.length > 0) {
                console.log(`    ❌ Wrong Choices:  ${incorrect.join(', ')}`);
            }
        });

        // Loop the search prompt so you can search again
        promptSearch();
    });
}

// Start the search interface
promptSearch();
