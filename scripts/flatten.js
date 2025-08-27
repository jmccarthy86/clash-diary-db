import fs from "node:fs";
import path from "node:path";
import ignore from "ignore";
import { fileURLToPath } from "node:url";

// Define __dirname in an ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Since the script is in lifeos/scripts/ and your content is in lifeos/,
// set inputDir and configFilePath to one level up.
const inputDir = path.join(__dirname, "../");
const configFilePath = path.join(__dirname, "../flatten.config");
const configContent = fs.readFileSync(configFilePath).toString();
// Similarly, place the output in a "dist" folder at the project root.
const outputDir = path.join(__dirname, "dist");
const outputFile = path.join(outputDir, "combined.txt");

// Ensure the output directory exists
//if (!fs.existsSync(outputDir)) {

fs.mkdirSync(outputDir, { recursive: true });
//}

// Load and configure ign
const ig = ignore().add(configContent);

// A recursive function to collect all files under a directory
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            results.push(fullPath);
        }
    });
    return results;
}

// Get all files (with absolute paths) recursively from the input directory
const allFiles = walk(inputDir);

// Convert absolute file paths to paths relative to the input directory
const relativePaths = allFiles.map((file) => path.relative(inputDir, file));

// Filter the files using the ignore rules
const filteredRelativePaths = ig.filter(relativePaths);

// Map the relative paths back to absolute paths
const filteredFiles = filteredRelativePaths.map((relPath) =>
    path.join(inputDir, relPath),
);

// Concatenate the content of each filtered file
let combinedContent = "";
filteredFiles.forEach((filePath) => {
    const fileContent = fs.readFileSync(filePath, "utf8");
    combinedContent += fileContent + "\n";
});

// Write the flattened content to the output file
fs.writeFileSync(outputFile, combinedContent);
console.log(`Files have been flattened into: ${outputFile}`);
