from flask import Flask, render_template, request, jsonify
import os
import pickle
import pandas as pd

app = Flask(__name__)

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "diabetes_prediction_model.pkl")

with open(MODEL_PATH, "rb") as f:
    model_package = pickle.load(f)

model           = model_package["voting_classifier"]
scaler          = model_package["scaler"]
feature_columns = model_package["feature_columns"]

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    pregnancies       = float(data['pregnancies'])
    glucose           = float(data['glucose'])
    blood_pressure    = float(data['blood_pressure'])
    skin_thickness    = float(data['skin_thickness'])
    insulin           = float(data['insulin'])
    bmi               = float(data['bmi'])
    diabetes_pedigree = float(data['diabetes_pedigree'])
    age               = float(data['age'])

    bmi_normal     = 1 if 18.5 <= bmi < 25 else 0
    bmi_overweight = 1 if 25   <= bmi < 30 else 0
    bmi_obese      = 1 if bmi  >= 30       else 0
    age_middle     = 1 if 30 < age <= 40 else 0
    age_senior     = 1 if 40 < age <= 50 else 0
    age_elderly    = 1 if age > 50        else 0

    row = {
        'Pregnancies':               pregnancies,
        'Glucose':                   glucose,
        'BloodPressure':             blood_pressure,
        'SkinThickness':             skin_thickness,
        'Insulin':                   insulin,
        'BMI':                       bmi,
        'DiabetesPedigreeFunction':  diabetes_pedigree,
        'Age':                       age,
        'BMI_Category_Normal':       bmi_normal,
        'BMI_Category_Overweight':   bmi_overweight,
        'BMI_Category_Obese':        bmi_obese,
        'Age_Category_Middle':       age_middle,
        'Age_Category_Senior':       age_senior,
        'Age_Category_Elderly':      age_elderly,
    }

    df     = pd.DataFrame([row]).reindex(columns=feature_columns, fill_value=0)
    scaled = scaler.transform(df)

    prediction  = model.predict(scaled)[0]
    probability = model.predict_proba(scaled)[0]

    prob_diabetic     = round(probability[1] * 100, 1)
    prob_non_diabetic = round(probability[0] * 100, 1)
    risk_label        = "High" if prob_diabetic > 70 else "Medium" if prob_diabetic > 40 else "Low"

    label_map    = {'svm': 'SVM', 'rf': 'Random Forest', 'knn': 'KNN'}
    model_scores = {}
    for (name, _), estimator in zip(model.estimators, model.estimators_):
        p = estimator.predict_proba(scaled)[0]
        model_scores[label_map.get(name, name.upper())] = round(p[1] * 100, 1)
    model_scores['Voting Classifier'] = prob_diabetic

    return jsonify({
        "prediction":               "Diabetic" if prediction == 1 else "Non-Diabetic",
        "probability_diabetic":     prob_diabetic,
        "probability_non_diabetic": prob_non_diabetic,
        "risk_score":               prob_diabetic,
        "risk_label":               risk_label,
        "model_scores":             model_scores,
        "recommendation":           "Consult a doctor immediately." if prob_diabetic > 70 else
                                    "Improve diet and exercise."    if prob_diabetic > 40 else
                                    "Maintain healthy lifestyle."
    })

if __name__ == "__main__":
    app.run(debug=True)
