const predict = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // 1. Convert the image to base64
        const imageData = req.file.buffer.toString('base64');
        console.log('Image data received. Forwarding to Hugging Face AI Server...');

        // 2. The direct API URL to my new 16GB RAM Hugging Face Server
        const hfApiUrl = 'https://saurav4622-neurovision-ai.hf.space/predict';

        // 3. Send the image to Hugging Face via standard HTTP POST
        const response = await fetch(hfApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        });

        // 4. Handle any errors from Hugging Face
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Hugging Face AI Server Error:', errorText);
            return res.status(response.status).json({ 
                error: 'AI Server Error', 
                details: errorText 
            });
        }

        // 5. Get the prediction result and send it back to the frontend
        const result = await response.json();
        console.log('SUCCESS! Prediction received from Hugging Face:', result);
        
        res.status(200).json(result);

    } catch (error) {
        console.error('Error during prediction routing:', error);
        res.status(500).json({ 
            error: 'Internal server error while contacting AI',
            details: error.message
        });
    }
};

module.exports = {
    predict
};