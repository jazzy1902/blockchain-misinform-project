const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const PORT = 3001;

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