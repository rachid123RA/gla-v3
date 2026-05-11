# gollasense-api/app.py
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import math
import pandas as pd
import joblib
from datetime import datetime
from pathlib import Path
from utils.pdf_generator import generate_pdf
import warnings
import os

# Toujours résoudre modèle / CSV par rapport à ce fichier (évite l’échec si python est lancé depuis un autre cwd)
API_ROOT = Path(__file__).resolve().parent
MODEL_PATH = API_ROOT / "model" / "modele_xgboost_pipeline.pkl"
DATASET_PATH = API_ROOT / "golla_dataset_100k_no_accents.csv"

# Supprimer les avertissements de version sklearn/xgboost
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', category=RuntimeWarning)

app = Flask(__name__)
CORS(app)

# Charger le modèle et les données de référence
print("Chargement du modèle...")
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    model = joblib.load(MODEL_PATH)
print("Modèle chargé avec succès!")

print("Chargement du dataset...")
df_ref = pd.read_csv(DATASET_PATH)
print(f"Dataset chargé: {len(df_ref)} lignes")

# Fonctions utiles
def get_saison_from_date(date_str):
    mois = datetime.strptime(date_str, "%Y-%m-%d").month
    if mois in [3, 4, 5]:
        return 'printemps'
    elif mois in [6, 7, 8]:
        return 'ete'
    elif mois in [9, 10, 11]:
        return 'automne'
    else:
        return 'hiver'

def get_meteo_moyenne(plante, saison, type_sol):
    filtre = (df_ref["nom_plante"] == plante) & (df_ref["saison"] == saison) & (df_ref["type_sol"] == type_sol)
    sub = df_ref.loc[filtre]
    if sub.empty:
        filtre = (df_ref["nom_plante"] == plante) & (df_ref["saison"] == saison)
        sub = df_ref.loc[filtre]
    if sub.empty:
        sub = df_ref
    temp = sub["temperature"].mean()
    hum = sub["humidite"].mean()
    ens = sub["ensoleillement_h"].mean()
    vent = sub["vent_kmh"].mean()
    pluv = sub["pluviometrie_mm"].mean()
    return temp, hum, ens, vent, pluv

def get_type_plante(nom):
    mapping = {
        "amandier": "arbre_fruitier", "figuier": "arbre_fruitier", "cerisier": "arbre_fruitier",
        "oranger": "arbre_fruitier", "citronnier": "arbre_fruitier",
        "menthe": "aromatique", "basilic": "aromatique",
        "mais": "cereale", "ble": "cereale",
        "melon": "fruit", "pasteque": "fruit", "fraise": "fruit", "banane": "fruit",
        "pomme_de_terre": "legume", "carotte": "legume", "aubergine": "legume",
        "courgette": "legume", "poivron": "legume", "laitue": "legume", "tomate": "legume"
    }
    return mapping.get(nom, "autre")

conseils_par_plante = {
    "tomate": "🍅 Préfère un arrosage le matin. Évitez d’arroser les feuilles.",
    "menthe": "🌿 Aime l’humidité constante. Arrosez en soirée.",
    "banane": "🍌 Consomme beaucoup d’eau. Privilégiez un arrosage profond.",
    "carotte": "🥕 Redoute l’excès d’humidité. Irrigation modérée le matin.",
    "melon": "🍈 Besoin de paillage. Irriguez tôt le matin.",
    "figuier": "🌳 Résiste à la sécheresse. Arrosez seulement quand le sol est sec.",
}

@app.route('/get-options', methods=['GET'])
def get_options():
    return jsonify({
        "plantes": sorted(df_ref["nom_plante"].unique().tolist()),
        "types_sol": sorted(df_ref["type_sol"].unique().tolist()),
        "etats_sante": sorted(df_ref["etat_sante"].unique().tolist())
    })

SAISONS_VALIDES = frozenset({"printemps", "ete", "automne", "hiver"})


@app.route('/health', methods=['GET'])
def health():
    """Vérifie que l’API et le modèle sont prêts (utile pour déboguer les erreurs réseau côté app)."""
    return jsonify({"ok": True, "model_loaded": model is not None})


@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    # Saison choisie dans l'app (cohérente avec les moyennes météo) ; sinon dérivée de la date
    saison = data.get("saison")
    if not saison or saison not in SAISONS_VALIDES:
        saison = get_saison_from_date(data["date"])
    temp, hum, ens, vent, pluv = get_meteo_moyenne(data["nom_plante"], saison, data["type_sol"])
    type_plante = get_type_plante(data["nom_plante"])
    surface = float(data["surface"])
    age = int(data["age_plante_jours"])

    input_df = pd.DataFrame([{
        "nom_plante": data["nom_plante"],
        "type_plante": type_plante,
        "type_sol": data["type_sol"],
        "temperature": temp,
        "humidite": hum,
        "ensoleillement_h": ens,
        "vent_kmh": vent,
        "pluviometrie_mm": pluv,
        "saison": saison,
        "surface_m2": surface,
        "age_plante_jours": age,
        "etat_sante": data["etat_sante"]
    }])

    # Le modèle prédit la consommation totale (L/jour) ; surface_m2 est déjà une feature d'entrée.
    pred_litres_jour = float(model.predict(input_df)[0])
    pred_litres_jour = max(0.0, pred_litres_jour)
    total_litres = round(pred_litres_jour, 2)
    pred_m2 = round(total_litres / surface, 4) if surface > 0 else 0.0
    stress_score = (float(temp) * 1.5) - (float(hum) * 0.7) + (float(vent) * 1.2)
    if math.isnan(stress_score):
        stress_score = 50.0
    indice_stress = int(min(max(stress_score, 0), 100))
    conseil = conseils_par_plante.get(data["nom_plante"], "💧 Arrosez selon les besoins observés sur le terrain.")

    return jsonify({
        "prediction_m2": round(pred_m2, 2),
        "prediction_totale": total_litres,
        "indice_stress": indice_stress,
        "conseil": conseil
    })

@app.route('/generate-pdf', methods=['POST'])
def generate_pdf_route():
    data = request.json
    pdf_path = generate_pdf(data)
    return send_file(pdf_path, as_attachment=True)

if __name__ == '__main__':
    # Permettre les connexions depuis d'autres appareils sur le réseau local
    port = int(os.environ.get("PORT", "5001"))
    app.run(host='0.0.0.0', port=port, debug=True)
