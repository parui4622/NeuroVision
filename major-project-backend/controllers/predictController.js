const { spawn } = require('child_process');
const path = require('path');

exports.predict = (req, res) => {
    const inputData = req.body;

    if (!inputData.image) {
        return res.status(400).json({ error: 'No image data provided' });
    }

    // Use 'python' on Windows or 'python3' on Unix
    const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
    const python = spawn(pythonExecutable, [
        path.join(__dirname, '../python/predict.py'),
        JSON.stringify(inputData)
    ]);
    
    let outputData = '';
    let errorData = '';

    python.stdout.on('data', (data) => outputData += data.toString());
    python.stderr.on('data', (data) => errorData += data.toString());
    
    python.on('close', (code) => {
        if (code !== 0) {
            console.error('Python Error:', errorData);
            return res.status(500).json({ 
                error: 'Prediction failed',
                details: errorData
            });
        }

        try {
            const result = JSON.parse(outputData);
            if (result.error) {
                return res.status(500).json({ error: result.error });
            }
            res.json(result);
        } catch (error) {
            console.error('JSON Parse Error:', error);
            res.status(500).json({ 
                error: 'Failed to parse prediction result',
                details: outputData
            });
        }
    });
};
