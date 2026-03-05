const { spawn } = require('child_process');
const path = require('path');

const predict = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const imageData = req.file.buffer.toString('base64');

        console.log('Image data received, processing...');
        console.log('Preparing to run prediction Python script...');
        
        const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
        const pythonScript = path.join(__dirname, '../python/predict.py');

        // Create JSON input for Python script
        const inputData = JSON.stringify({ image: imageData });
        const pythonProcess = spawn(pythonExecutable, [pythonScript, inputData]);

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            console.log('Python script finished with code:', code);
            console.log('Python script stderr:', errorData);

            try {
                // Extract the last JSON object from stdout
                const jsonObjects = outputData.split('\n').filter(line => {
                    try {
                        JSON.parse(line);
                        return true;
                    } catch {
                        return false;
                    }
                });

                const result = JSON.parse(jsonObjects.pop());
                res.status(200).json(result);
            } catch (err) {
                console.error('Error parsing Python script output:', err);
                res.status(500).json({ error: 'Failed to parse prediction result', details: err.message });
            }
        });

        pythonProcess.on('error', (error) => {
            console.error('Failed to start Python process:', error);
            res.status(500).json({ 
                error: 'Failed to start prediction process',
                details: error.message
            });
        });

    } catch (error) {
        console.error('Error during prediction:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
};

module.exports = {
    predict
};
