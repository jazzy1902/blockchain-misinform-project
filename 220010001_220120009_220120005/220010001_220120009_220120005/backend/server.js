// Import necessary packages
const express = require('express');         // For creating the server and handling routes
const axios = require('axios');             // For making HTTP requests (used for Pinata API)
const FormData = require('form-data');      // For sending multipart/form-data (used for file uploads)
const cors = require('cors');               // For enabling Cross-Origin Resource Sharing

const app = express();                      // Create an Express application
const PORT = 3001;                          // Define the server port

const fs = require('fs').promises;          // File system module for async operations
const path = require('path');               // Module to work with file paths

// Function to append a data object to a JSON file
async function appendToJsonFile(data, filePath = 'responses.json') {
    try {
        const absolutePath = path.resolve(filePath);  // Get absolute file path
        let allResponses = [];

        // Try reading the file content if it exists
        try {
            const fileContent = await fs.readFile(absolutePath, 'utf8');
            allResponses = JSON.parse(fileContent);   // Parse existing content

            // Ensure the data is in array format
            if (!Array.isArray(allResponses)) {
                allResponses = [allResponses];
            }
        } catch (error) {
            // If file doesn't exist or is unreadable, start with an empty array
            allResponses = [];
        }

        // Add new data to the array
        allResponses.push(data);

        // Write updated array back to the file
        await fs.writeFile(absolutePath, JSON.stringify(allResponses, null, 2));
        return true;
    } catch (error) {
        console.error('Error appending to JSON file:', error);
        throw error;
    }
}

// Middleware setup
app.use(cors());              // Enable CORS for all routes
app.use(express.json());      // Parse incoming JSON request bodies

// Pinata JWT token for authentication
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIyZDBiYjlmMS05NzdiLTRjMGUtYWY0Ni1kZjU3Yjc4Y2RlYjYiLCJlbWFpbCI6InByaXZhdGV1bHRyYUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNGNkOWExZjJiNThjZDJkNGUzNGYiLCJzY29wZWRLZXlTZWNyZXQiOiI5MDU3N2RkNTRmMDQwYmQ3Yjc4NzcwYTYxNjJiOGFkYjUwZjlkYjI5YzQzM2ZiNThmOTY3ZTUzYzdjOWE3YjI0IiwiZXhwIjoxNzc1OTkwMjkyfQ.MoUIEhy2qf6eqph6JdQz4Xe7EDT3kr7QcPcdRrEQew0";

// Route to handle file submission and upload to Pinata
app.post('/api/submit', async (req, res) => {
  try {
    const { content, userId } = req.body; // Extract content and userId from request body

    // Check if required fields are present
    if (!content || !userId) {
      return res.status(400).json({ error: 'Content and userId are required' });
    }

    // 1. Create a FormData object and add the content as a text file
    const formData = new FormData();
    formData.append('file', Buffer.from(content), {
      filename: `submission_${Date.now()}.txt`,   // Unique filename
      contentType: 'text/plain'
    });

    // 2. Add metadata for Pinata
    formData.append('pinataMetadata', JSON.stringify({
      name: `user_${userId}_submission`,
      keyvalues: {
        userId: userId,
        source: 'your_application_name'           // Optional custom metadata
      }
    }));

    // 3. Prepare headers with authorization and content type
    const headers = {
      ...formData.getHeaders(),
      Authorization: `Bearer ${PINATA_JWT}`,      // Bearer token for Pinata
      'Content-Length': formData.getLengthSync()  // Required for large files
    };

    // 4. Send the request to Pinata to upload the file to IPFS
    const pinataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: headers,
        maxBodyLength: Infinity                   // Prevents limit on file size
      }
    );

    // Save the resulting IPFS CID and userId to a local JSON file
    await appendToJsonFile({
      cid: pinataResponse.data.IpfsHash,
      userId: userId,
    }, 'responses.json');

    // Respond with success and the IPFS CID
    res.json({
      success: true,
      cid: pinataResponse.data.IpfsHash
    });

  } catch (error) {
    // Handle any error during the upload process
    console.error('Pinata upload error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to upload to Pinata',
      details: error.response?.data || error.message
    });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
