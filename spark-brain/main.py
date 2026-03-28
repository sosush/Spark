import os
import random
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
    is_regen = req.get("is_regeneration", False)
    
    pivot_instruction = ""
    if is_regen:
        pivot_instruction = "CRITICAL: This is a REGENERATION. You MUST PIVOT. Do not refine the previous idea. Invent a completely different technical product that uses a different intersection of these domains. If the previous was a SaaS, make this a low-level CLI tool, an Edge-computing layer, or a decentralized protocol."

    system = f"""You are a visionary Silicon Valley Founder and elite Systems Architect. Your objective is not merely to mix the provided domains together, but to invent ONE revolutionary, technically-dense product that solves ONE hyper-specific market failure.
    {pivot_instruction}
    
    Your response MUST be architecturally credible. Mention specific data structures, specific API patterns (gRPC, Webhooks, CDC), and deployment strategies. No fluff. 

    Your response MUST follow this EXACT structure in clean plain text (NO markdown symbols, NO asterisks, NO hashtags, NO backticks):

    PROJECT NAME: [A punchy, memorable name]

    THE PROBLEM: [Identify ONE highly specific, painful industrial or developer problem, explained in 2 sentences]

    THE SOLUTION: [The radical technical mechanism you've invented to solve it, explained in 2-3 sentences]

    PROPRIETARY ARCHITECTURE: [Explain the lower-level technical logic. How does the data move? What is the core algorithm or infrastructure choice that makes this superior?]

    TECH STACK: [List exact modern frameworks, libraries, and infrastructure]

    MVP CRITICAL PATH:
    1. [Feature: Technical execution detail]
    2. [Feature: Technical execution detail]
    3. [Feature: Technical execution detail]
    4. [Feature: Technical execution detail]

    CREATION ROADMAP:
    Week 1: [Core engine & data model setup]
    Week 2: [Functional logic & integration]
    Week 3: [Security & production hardening]

    Be brutally technical. A senior engineer should find this inspiring. """
    
    salts = [
        "Include a decentralized or peer-to-peer element.",
        "Target the enterprise B2B sector with strict compliance (HIPAA/GDPR) needs.",
        "Architect for massive real-time concurrency using WebSockets or Change Data Capture (CDC).",
        "Make it an edge-first tool using WASM or Cloudflare Workers.",
        "Primary interface must be an AI Agent or CLI, not a standard UI.",
    ]
    chaos_salt = random.choice(salts)
    
    user = f"Domains: {req['domains']}\nProjects for Context: {req['project_names']}\n\nCHAOS CONSTRAINT: {chaos_salt}"
    
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        model=MODEL,
        temperature=1.2,
    )
    result = chat_completion.choices[0].message.content
    return {"idea": result}

@app.post("/synergy")
async def synergy(req: dict):
    system = """You are 'The Genesis Engine', an elite AI Product Strategist and Systems Architect. 
Your goal is to extract the structural DNA of two codebases and physically lock them together to solve a hyper-specific market pain point.
Invent a completely novel tool that could ONLY exist by merging these two specific architectures.

You MUST respond strictly in valid JSON format with exactly these points:
1. "name": A sleek, punchy 1-3 word name.
2. "pitch": A brilliant 2-sentence elevator pitch focus on the 'Unfair Advantage'.
3. "architecture": A dense, technical 3-paragraph blueprint. Paragraph 1: The 'Data Core' (how state is managed). Paragraph 2: The 'Mechanism' (how stack A and B interact). Paragraph 3: The 'Production Shield' (security and scalability). MUST BE A SINGLE FLAT STRING. DO NOT USE NESTED JSON OBJECTS.

DO NOT output any markdown blocks (No ```json), just raw JSON data."""
    
    pA = req.get("project_a", {})
    pB = req.get("project_b", {})
    
    salts = [
        "Include local-first sync or CRDT architectures.",
        "The architecture must feature a graph database for hyper-relational querying.",
        "Focus on extreme low-level security (Kernel-level or TEE / Enclave logic).",
        "Target solo creators needing an insanely fast, automated backend generation.",
    ]
    chaos_salt = random.choice(salts)
    
    user = f"Project A ({pA.get('name')}): {pA.get('domains')}\nProject B ({pB.get('name')}): {pB.get('domains')}\n\nCHAOS CONSTRAINT: {chaos_salt}"
    
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        model=MODEL,
        temperature=1.2,
        response_format={"type": "json_object"}
    )
    
    import json
    try:
        data = json.loads(chat_completion.choices[0].message.content)
        return data
    except Exception as e:
        return {"name": "Synthesis Error", "pitch": "The engine failed to harmonize the domains.", "architecture": str(e)}

if __name__ == "__main__":
    # Change 8000 to 7860
    uvicorn.run(app, host="0.0.0.0", port=7860)