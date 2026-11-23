import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_percentage_error, accuracy_score

from backend.app.data.geo_features import generate_historical_dataset

MODEL_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLS_NUM = [
    "ndvi_mean", "ndvi_max", "total_rainfall_mm", "rain_anomaly_pct",
    "mean_temp_c", "max_temp_c", "consecutive_dry_days",
    "soil_organic_carbon", "soil_ph", "soil_clay_pct", "soil_sand_pct"
]

FEATURE_COLS_CAT = ["district_id", "crop_id"]

def train_and_evaluate():
    print("Generating agricultural training data (2018-2025)...")
    df = generate_historical_dataset()

    # Temporal Holdout: Train on 2018-2024, Test on 2025
    train_mask = df["year"] < 2025
    test_mask = df["year"] == 2025

    train_df = df[train_mask]
    test_df = df[test_mask]

    print(f"Train samples: {len(train_df)}, Test samples: {len(test_df)}")

    X_train = train_df[FEATURE_COLS_NUM + FEATURE_COLS_CAT]
    y_train_yield = train_df["actual_yield_tha"]
    y_train_drought = train_df["drought_risk"]
    y_train_waterlog = train_df["waterlog_risk"]

    X_test = test_df[FEATURE_COLS_NUM + FEATURE_COLS_CAT]
    y_test_yield = test_df["actual_yield_tha"]
    y_test_drought = test_df["drought_risk"]
    y_test_waterlog = test_df["waterlog_risk"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", "passthrough", FEATURE_COLS_NUM),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), FEATURE_COLS_CAT)
        ]
    )

    # 1. Yield Regressor
    print("Training Gradient Boosting Yield Regressor...")
    yield_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", GradientBoostingRegressor(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42))
    ])
    yield_pipeline.fit(X_train, y_train_yield)

    pred_yield = yield_pipeline.predict(X_test)
    mape = mean_absolute_percentage_error(y_test_yield, pred_yield) * 100.0
    print(f"--> Test Set (Season 2025) Yield MAPE: {mape:.2f}%")

    # 2. Drought Risk Classifier
    print("Training Drought Risk Classifier...")
    drought_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", GradientBoostingClassifier(n_estimators=75, learning_rate=0.1, max_depth=3, random_state=42))
    ])
    drought_pipeline.fit(X_train, y_train_drought)
    pred_drought = drought_pipeline.predict(X_test)
    drought_acc = accuracy_score(y_test_drought, pred_drought) * 100.0
    print(f"--> Drought Risk Accuracy: {drought_acc:.2f}%")

    # 3. Waterlogging Risk Classifier
    print("Training Waterlogging Risk Classifier...")
    waterlog_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", GradientBoostingClassifier(n_estimators=75, learning_rate=0.1, max_depth=3, random_state=42))
    ])
    waterlog_pipeline.fit(X_train, y_train_waterlog)
    pred_waterlog = waterlog_pipeline.predict(X_test)
    waterlog_acc = accuracy_score(y_test_waterlog, pred_waterlog) * 100.0
    print(f"--> Waterlogging Risk Accuracy: {waterlog_acc:.2f}%")

    # Feature Importances extraction
    ohe = yield_pipeline.named_steps["preprocessor"].named_transformers_["cat"]
    cat_feature_names = ohe.get_feature_names_out(FEATURE_COLS_CAT).tolist()
    all_feature_names = FEATURE_COLS_NUM + cat_feature_names
    importances = yield_pipeline.named_steps["regressor"].feature_importances_

    top_indices = np.argsort(importances)[::-1][:6]
    top_features = [{"feature": all_feature_names[i], "importance": round(float(importances[i]), 4)} for i in top_indices]

    metrics = {
        "model_type": "GradientBoosting",
        "validation_strategy": "Temporal Holdout (2018-2024 train, 2025 test)",
        "test_season": 2025,
        "yield_mape_pct": round(mape, 2),
        "drought_risk_accuracy_pct": round(drought_acc, 2),
        "waterlog_risk_accuracy_pct": round(waterlog_acc, 2),
        "top_features": top_features
    }

    print("Saving model artifacts...")
    joblib.dump(yield_pipeline, MODEL_DIR / "yield_pipeline.joblib")
    joblib.dump(drought_pipeline, MODEL_DIR / "drought_pipeline.joblib")
    joblib.dump(waterlog_pipeline, MODEL_DIR / "waterlog_pipeline.joblib")

    with open(MODEL_DIR / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print("Training complete. Artifacts saved successfully.")
    return metrics

if __name__ == "__main__":
    train_and_evaluate()
