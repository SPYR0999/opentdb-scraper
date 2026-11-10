import fetch from "node-fetch";
import fs from "fs";
import readline from "readline";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Setup keyboard listening for "q" event
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}

let keepRunning = true;

process.stdin.on('keypress', (str, key) => {
    // Allow normal exit via Ctrl+C
    if (key.ctrl && key.name === 'c') {
        process.exit();
    }
    // Check for 'q' to gracefully stop
    if (str === 'q') {
        console.log('\n[Stop signal caught. Finishing current operation...]');
        keepRunning = false;
    }
});

async function run() {
    console.log("\x1b[34mopentdb-scraper\x1b[0m");
    console.log("Press Q to stop at any time.");

    const tokenRes = await fetch(
        "https://opentdb.com/api_token.php?command=request"
    );

    const tokenJson = await tokenRes.json();

    if (tokenJson.response_code !== 0) {
        console.error("Failed to create token.");
        process.exit(-1);
    }

    const token = tokenJson.token;

    const url = `https://opentdb.com/api.php?token=${token}`;

    let output = {
        results: []
    };

    let totalFetched = 0;

    console.log();

    while (keepRunning) {

        const response = await fetch(`${url}&amount=50`);
        const data = await response.json();

        if (data.response_code !== 0) {
            console.log("OpenTDB response:", data);

            if (data.response_code === 1) {
                console.log("No more full batches available.");

                const remaining = await fetch(
                    "https://opentdb.com/api_count_global.php"
                );

                const remainingJson = await remaining.json();

                const amount =
                    remainingJson.overall.total_num_of_verified_questions % 50;

                if (amount > 0) {
                    console.log(`Fetching final ${amount} questions...`);

                    await sleep(6000);

                    const finalResponse = await fetch(
                        `${url}&amount=${amount}`
                    );

                    const finalData = await finalResponse.json();

                    if (finalData.results) {
                        output.results.push(...finalData.results);
                        totalFetched += finalData.results.length;
                    }
                }

                break;
            }

            console.error(
                `OpenTDB error code: ${data.response_code}`
            );
            break;
        }

        output.results.push(...data.results);
        totalFetched += data.results.length;

        // OpenTDB rate limit is ~5 seconds
        console.log(`Fetched ${totalFetched} questions`);
        console.log("Waiting for rate limit...");
        await sleep(6000);
    }

    console.log(`Finished, fetched ${totalFetched} questions`);

    // Filter results for uniqueness
    const uniqueMap = new Map(output.results.map(obj => [obj.question, obj]));
    output.results = Array.from(uniqueMap.values());
    console.log(`Result, ${output.results.length} unique questions`);

    fs.writeFileSync(
        "./results/opentdb.json",
        JSON.stringify(output, null, "\t")
    );

    console.log("Saved opentdb.json");

    process.exit();
}

run();