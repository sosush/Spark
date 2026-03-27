import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from groq import Groq # Run: pip install groq
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Clients
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Intelligence Engine Model
MODEL = "llama-3.3-70b-versatile"

def ask_spark_ai(system_prompt, user_content):
    """The central intelligence function for Spark."""
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        model=MODEL,
        temperature=0.5, # Lower temp for more technical accuracy
    )
    return chat_completion.choices[0].message.content

@app.get("/improve/{project_id}")
async def improve(project_id: str):
    p = supabase.table("projects").select("*").eq("id", project_id).single().execute().data
    
    system = "You are a Principal Software Architect. Provide a BRUTAL and ELITE technical critique of this project. Focus on architecture, potential bottlenecks, and production-grade improvements. No fluff. CRITICAL: Do NOT use any markdown formatting symbols whatsoever. No asterisks, no hashtags, no backticks, no dashes for lists. Write in clean plain text paragraphs with numbered points like '1.' for structure."
    user = f"Project Name: {p['name']}\nDocumentation: {p['readme']}"
    
    result = ask_spark_ai(system, user)
    return {"result": result}

@app.get("/roadmap/{project_id}")
async def get_roadmap(project_id: str):
    p = supabase.table("projects").select("*").eq("id", project_id).single().execute().data
    
    system = """You are a Lead Project Mentor. Create a comprehensive, realistic execution roadmap.
    Structure your response as follows:
    1. STACK: Recommend exact, modern libraries (e.g., Shadcn/UI over Bootstrap, FastAPI over Flask).
    2. PHASE 1 (The Foundation): Core logic and Database structure.
    3. PHASE 2 (Logic & Security): Feature implementation and Auth.
    4. PHASE 3 (Deployment): Where to host and CI/CD strategy.
    Tone: Mentorship-oriented, highly specific, and professional.
    CRITICAL: Do NOT use any markdown formatting symbols whatsoever. No asterisks, no hashtags, no backticks, no dashes for lists. Write in clean plain text paragraphs with numbered points like '1.' for structure."""
    
    user = f"Goal: {p['name']}\nConcept: {p['readme']}"
    
    result = ask_spark_ai(system, user)
    return {"result": result}

@app.get("/readme/{project_id}")
async def gen_readme(project_id: str):
    p = supabase.table("projects").select("*").eq("id", project_id).single().execute().data
    
    system = "You are a Technical Writer. Write a stunning, highly detailed GitHub README in proper Markdown. Include badges, a professional 'Key Features' table, and an 'Installation' guide based on the languages detected. This endpoint IS allowed to use Markdown since it will be rendered by a Markdown parser."
    user = f"Project: {p['name']}\nLanguages: {p['languages']}\nContext: {p['readme']}"
    
    result = ask_spark_ai(system, user)
    return {"result": result}

@app.post("/brainstorm")
async def brainstorm(req: dict):
    system = """You are a Venture Capital CTO and Senior Architect. Combine the provided project ideas and domains to invent ONE revolutionary, highly specific hybrid project.

    Your response MUST follow this EXACT structure in clean plain text (NO markdown symbols, NO asterisks, NO hashtags, NO backticks):

    PROJECT NAME: [A punchy, memorable name]

    PURPOSE: A clear 2-sentence explanation of what this project does and the exact problem it solves.

    TECH STACK: List the exact frameworks, libraries, databases, and APIs to use (e.g. Next.js 14, FastAPI, Supabase, Stripe, Tailwind CSS).

    MVP FEATURES (list 5-7 specific features):
    1. [Feature with one-line description]
    2. [Feature with one-line description]
    ...

    CREATION ROADMAP:
    Week 1: [Exact tasks]
    Week 2: [Exact tasks]
    Week 3: [Exact tasks]
    Week 4: [Exact tasks]

    Be extremely specific and actionable. No vague ideas. A developer should be able to start building immediately from your output."""
    user = f"Domains to combine: {req['domains']}\nExisting Projects for inspiration: {req['project_names']}"
    
    result = ask_spark_ai(system, user)
    return {"idea": result}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)