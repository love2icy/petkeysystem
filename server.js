// Save this as server.js


const express = require("express");
const { Octokit } = require("@octokit/rest");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const GITHUB_TOKEN = "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";
const OWNER = "love2icy"; // Your GitHub username
const REPO = "keysys"; // Your repo name
const FILE_PATH = "ksys.txt"; // The file in repo to store keys

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function getFileData() {
  try {
    const response = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: FILE_PATH,
    });
    return response.data;
  } catch (error) {
    if (error.status === 404) {
      // File doesn't exist yet
      return null;
    }
    throw error;
  }
}

async function updateKeysFile(newKey) {
  const fileData = await getFileData();

  let content = "";
  let sha = undefined;

  if (fileData) {
    content = Buffer.from(fileData.content, "base64").toString("utf-8");
    sha = fileData.sha;
  }

  // Append new key with newline
  content += (content.length > 0 ? "\n" : "") + newKey;

  const encodedContent = Buffer.from(content, "utf-8").toString("base64");

  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: FILE_PATH,
    message: `Add new key: ${newKey}`,
    content: encodedContent,
    sha: sha,
  });
}

function generateRandomKey(length = 16) {
  return crypto.randomBytes(length).toString("hex"); // 32 chars hex string
}

app.post("/generate-key", async (req, res) => {
  try {
    const newKey = generateRandomKey();
    await updateKeysFile(newKey);
    res.json({ success: true, key: newKey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to generate key" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Key generator API running on port ${PORT}`);
});
