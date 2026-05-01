from fpdf import FPDF
import uuid

def generate_pdf(data):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    pdf.cell(200, 10, txt="📊 Rapport de Prédiction", ln=True, align="C")
    pdf.ln(10)
    for key, value in data.items():
        pdf.cell(200, 10, txt=f"{key} : {value}", ln=True)

    filename = f"rapport_{uuid.uuid4().hex[:8]}.pdf"
    path = f"./{filename}"
    pdf.output(path)
    return path
