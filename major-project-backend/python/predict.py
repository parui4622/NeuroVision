import sys
import json
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import base64
import io
import logging
import warnings
import gc  # Added for aggressive memory cleanup

# Configure logging to stderr
logging.basicConfig(stream=sys.stderr, level=logging.INFO)

# Suppress specific warnings from torchvision
warnings.filterwarnings("ignore", category=UserWarning)

def create_model(num_classes):
    # CRUCIAL MEMORY FIX: Set pretrained=False. 
    # This prevents loading a 100MB unused model into RAM before loading your custom weights.
    model = models.resnet50(pretrained=False)
    
    # Modify final layer
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, num_classes)
    
    return model

def process_image(image_data):
    try:
        if ',' in image_data:
            image_data = image_data.split(',', 1)[1]
            
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        return transform(image).unsqueeze(0)
    except Exception as e:
        logging.error(f"Error processing image: {str(e)}")
        sys.exit(1)

def main():
    try:
        # Parse input JSON
        input_data = json.loads(sys.argv[1])
        image_data = input_data['image']

        # 1. Process image
        processed_image = process_image(image_data)

        # 2. Load Model directly to CPU
        import os
        model = create_model(num_classes=3)
        model_path = os.path.join(os.path.dirname(__file__), 'resnet50_alzheimer_model.pth')
        
        model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
        model.eval()

        # 3. Perform prediction (no_grad prevents memory usage from tracking gradients)
        with torch.no_grad():
            outputs = model(processed_image)
            probabilities = outputs.softmax(dim=1)[0]
            _, predicted = torch.max(outputs, 1)

        # Map prediction to class labels
        class_labels = ['AD', 'CN', 'MCI']
        result = {
            'prediction': class_labels[predicted.item()],
            'confidence': probabilities.tolist()
        }

        # 4. AGGRESSIVE MEMORY CLEANUP 
        # Delete heavy variables and force RAM to clear before returning to Node.js
        del model
        del processed_image
        del outputs
        gc.collect()

        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        logging.error(f"Error during prediction: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()