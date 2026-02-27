# DiabetesSense — Flask Dashboard

## Project Structure
```
diabetes_app/
├── app.py                  ← Flask backend
├── requirements.txt
├── templates/
│   └── index.html          ← Dashboard UI
└── static/
    ├── css/style.css
    └── js/main.js
```

## Setup & Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the app
python app.py

# 3. Open in browser
http://127.0.0.1:5000
```

## Connect Your Real Model

In `app.py`, replace the `mock_predict()` function with your trained model:

```python
import joblib

model  = joblib.load('voting_classifier.joblib')
scaler = joblib.load('scaler.joblib')

def mock_predict(data):
    features = [[
        float(data['pregnancies']),
        float(data['glucose']),
        float(data['blood_pressure']),
        float(data['skin_thickness']),
        float(data['insulin']),
        float(data['bmi']),
        float(data['diabetes_pedigree']),
        float(data['age']),
    ]]
    scaled = scaler.transform(features)
    prediction = model.predict(scaled)[0]
    probability = model.predict_proba(scaled)[0]
    # ... rest of logic
```
