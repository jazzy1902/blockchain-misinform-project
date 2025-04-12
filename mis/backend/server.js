const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const PORT = 3001;

const fs = require('fs').promises;
const path = require('path');

async function appendToJsonFile(data, filePath = 'responses.json') {
    try {
        const absolutePath = path.resolve(filePath);
        let allResponses = [];

        // Check if file exists and read existing data
        try {
            const fileContent = await fs.readFile(absolutePath, 'utf8');
            allResponses = JSON.parse(fileContent);
            
            // Ensure allResponses is an array
            if (!Array.isArray(allResponses)) {
                allResponses = [allResponses];
            }
        } catch (error) {
            // File doesn't exist or is empty/corrupted
            allResponses = [];
        }

        // Append new data
        allResponses.push(data);

        // Write updated data back to file
        await fs.writeFile(absolutePath, JSON.stringify(allResponses, null, 2));
        
        return true;
    } catch (error) {
        console.error('Error appending to JSON file:', error);
        throw error;
    }
}



// Middleware
app.use(cors());
app.use(express.json());

// IMPORTANT: Replace with your actual Pinata JWT
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIyZDBiYjlmMS05NzdiLTRjMGUtYWY0Ni1kZjU3Yjc4Y2RlYjYiLCJlbWFpbCI6InByaXZhdGV1bHRyYUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNGNkOWExZjJiNThjZDJkNGUzNGYiLCJzY29wZWRLZXlTZWNyZXQiOiI5MDU3N2RkNTRmMDQwYmQ3Yjc4NzcwYTYxNjJiOGFkYjUwZjlkYjI5YzQzM2ZiNThmOTY3ZTUzYzdjOWE3YjI0IiwiZXhwIjoxNzc1OTkwMjkyfQ.MoUIEhy2qf6eqph6JdQz4Xe7EDT3kr7QcPcdRrEQew0"; 

// Handle file submission to Pinata
app.post('/api/submit', async (req, res) => {
  try {
    const { content, userId } = req.body;

    if (!content || !userId) {
      return res.status(400).json({ error: 'Content and userId are required' });
    }

    // 1. Create form data
    const formData = new FormData();
    formData.append('file', Buffer.from(content), {
      filename: `submission_${Date.now()}.txt`,
      contentType: 'text/plain'
    });

    // 2. Add metadata
    formData.append('pinataMetadata', JSON.stringify({
      name: `user_${userId}_submission`,
      keyvalues: {
        userId: userId,
        source: 'your_application_name'
      }
    }));

    // 3. Get headers including the boundary
    const headers = {
      ...formData.getHeaders(),
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Length': formData.getLengthSync()
    };

    // 4. Upload to Pinata
    const pinataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: headers,
        maxBodyLength: Infinity
      }
    );

    // console.log('Pinata response:', pinataResponse.data);
    await appendToJsonFile({
      cid: pinataResponse.data.IpfsHash,
      userId: userId,
    }, 'responses.json');

    res.json({
      success: true,
      cid: pinataResponse.data.IpfsHash
    });

  } catch (error) {
    console.error('Pinata upload error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to upload to Pinata',
      details: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));