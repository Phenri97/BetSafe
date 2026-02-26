import streamlit as st
import google.generativeai as genai
import os

# Configuração da Interface
st.set_page_config(page_title="BetSafe AI - Sharp Analysis", page_icon="🛡️", layout="centered")

st.markdown("""
    <style>
    .main { background-color: #0e1117; color: white; }
    .stButton>button { width: 100%; border-radius: 5px; height: 3em; background-color: #ff4b4b; color: white; }
    </style>
    """, unsafe_allow_html=True)

st.title("🛡️ BetSafe AI")
st.subheader("Análise Profissional de Apostas")

# Sidebar para Configurações
st.sidebar.header("Configurações")
api_key = st.sidebar.text_input("Introduza sua Gemini API Key", type="password")

# Instruções do Sistema (O "Cérebro" do seu App)
SYSTEM_INSTRUCTION = """
Você é o BetSafe AI, um analista de apostas esportivas nível 'Sharp'. 
Sua especialidade é análise estatística (escanteios, gols, cartões) e identificação de valor.
Você deve SEMPRE validar datas e confrontos antes de sugerir bilhetes.
Priorize mercados auxiliares com assertividade superior a 90%.
"""

if api_key:
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            system_instruction=SYSTEM_INSTRUCTION
        )

        # Área de Input
        user_query = st.text_area("O que deseja analisar hoje?", 
                                placeholder="Ex: Analise escanteios para os jogos da Europa League agora às 14:45...")

        col1, col2 = st.columns(2)
        with col1:
            btn_seguro = st.button("🚀 Gerar Bilhete Seguro")
        with col2:
            btn_zebra = st.button("🦓 Buscar Zebra de Valor")

        if btn_seguro or btn_zebra:
            if user_query:
                prefixo = "FOCO: Bilhete de Segurança Máxima (>90%). " if btn_seguro else "FOCO: Análise de Valor/Zebra. "
                with st.spinner('Consultando dados em tempo real...'):
                    response = model.generate_content(prefixo + user_query)
                    st.markdown("---")
                    st.markdown(response.text)
            else:
                st.warning("Por favor, descreva os jogos ou a rodada que deseja analisar.")

    except Exception as e:
        st.error(f"Erro na conexão com a API: {e}")
else:
    st.info("👋 Bem-vindo! Por favor, insira sua API Key do Google AI Studio na barra lateral para começar.")

st.markdown("---")
st.caption("BetSafe AI v1.0 - Use com responsabilidade. Gestão de banca é fundamental.")
