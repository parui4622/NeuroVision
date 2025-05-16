import sys
import json
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import base64
import io

# Define the same CNN architecture that was used for training
class AlzheimersCNN(nn.Module):
    def __init__(self):
        super(AlzheimersCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 16, 3)
        self.conv2 = nn.Conv2d(16, 32, 3)
        self.conv3 = nn.Conv2d(32, 64, 3)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(64 * 26 * 26, 512)
        self.fc2 = nn.Linear(512, 4)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x)))
        x = self.pool(self.relu(self.conv2(x)))
        x = self.pool(self.relu(self.conv3(x)))
        x = x.view(-1, 64 * 26 * 26)
        x = self.dropout(self.relu(self.fc1(x)))
        x = self.fc2(x)
        return x

def process_image(image_data):
    # Convert base64 to PIL Image
    image_bytes = base64.b64decode(image_data)
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    
    # Define the same transforms used during training
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    return transform(image).unsqueeze(0)

def load_model():
    model = AlzheimersCNN()
    model.load_state_dict(torch.load('python/alzheimers_cnn_model.pth', map_location=torch.device('cpu')))
    model.eval()
    return model

def predict(image_tensor):
    model = load_model()
    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
        _, predicted = torch.max(outputs, 1)
        
    classes = ['AD', 'CN', 'EMCI', 'LMCI']
    
    # Get probabilities for each class
    class_probabilities = {}
    for i, cls in enumerate(classes):
        class_probabilities[cls] = float(probabilities[i])
        
    return {
        'prediction': classes[predicted.item()],
        'probabilities': class_probabilities
    }

if __name__ == "__main__":
    try:
        # Read input data
        data = json.loads(sys.argv[1])
        image_data = data.get('image')
        
        if not image_data:
            print(json.dumps({'error': 'No image data provided'}))
            sys.exit(1)
            
        # Process image and make prediction
        image_tensor = process_image(image_data)
        result = predict(image_tensor)
        
        # Return prediction with probabilities
        print(json.dumps({
            'prediction': result['prediction'],
            'probabilities': result['probabilities'],
            'success': True
        }))
        
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'success': False
        }))
        sys.exit(1)
