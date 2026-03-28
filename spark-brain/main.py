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
    system = """You are a visionary Silicon Valley Founder and elite Systems Architect. Your objective is not merely to mix the provided domains/projects together, but to invent ONE revolutionary, razor-sharp technical product that solves ONE extremely specific, devastating market failure or developer pain point within those intersected domains.
    Do NOT output generic productivity tools or vague amalgamations. Find the bleeding edge where these fields overlap and build a weaponized startup concept there.

    Your response MUST follow this EXACT structure in clean plain text (NO markdown symbols, NO asterisks, NO hashtags, NO backticks):

    PROJECT NAME: [A punchy, memorable name]

    THE PROBLEM: [Identify ONE highly specific, painful problem in the industry today, explained in 1-2 sentences]

    THE SOLUTION: [How this new product elegantly solves that exact problem using the provided domains, explained in 1-2 sentences]

    TECH STACK: [List the exact modern frameworks, libraries, databases, and APIs to use]

    MVP CRITICAL PATH (the absolute minimum subset of 4-5 features required to demonstrate radical value):
    1. [Feature: Technical execution detail]
    2. [Feature: Technical execution detail]
    ...

    CREATION ROADMAP:
    Week 1: [Exact low-level architectural tasks]
    Week 2: [Exact core logic tasks]
    Week 3: [Exact integration & polish tasks]

    Be brutally specific. A senior engineer should read this and involuntarily say "I need to build this immediately." """
    
    salts = [
        "Include a decentralized or peer-to-peer element.",
        "Make it an exact command-line interface tool first.",
        "Assume the data volume is massively real-time with websockets.",
        "Target the enterprise B2B sector with highly strict compliance features.",
        "Target solo creators needing an insanely fast drag-and-drop UX.",
        "Use edge computing to make the latency unthinkably low.",
        "Assume the primary interface is Voice or an AI agent, not a dashboard."
    ]
    chaos_salt = random.choice(salts)
    
    user = f"Domains to combine: {req['domains']}\nExisting Projects for inspiration: {req['project_names']}\n\nCHAOS CONSTRAINT: {chaos_salt}"
    
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
Your goal is not just to naively merge two distinct GitHub repositories, but to extract their underlying conceptual DNA to solve ONE devastatingly specific, highly painful problem in the developer or consumer market. 
Invent a completely novel, world-class tool or SaaS startup that could ONLY exist because these two specific architectures were smashed together.

You MUST respond strictly in valid JSON format with exactly these three keys:
1. "name": A sleek, punchy 1-3 word name for this revolutionary new project.
2. "pitch": A brilliant 2-sentence elevator pitch. Sentence 1 defines the exact, hyper-specific problem. Sentence 2 defines the radical solution derived from the input repos.
3. "architecture": A dense, technical 3-paragraph blueprint explaining how the two tech stacks and codebases physically lock together to form the MVP. Focus on data flow, APIs, and the "magic" underlying mechanism. MUST BE A SINGLE FLAT STRING. DO NOT USE NESTED JSON OBJECTS.

DO NOT output any markdown blocks (No ```json), just raw JSON data."""
    
    pA = req.get("project_a", {})
    pB = req.get("project_b", {})
    
    salts = [
        "Integrate a gamification mechanic or reputation system into the core loop.",
        "Assume the application must run entirely offline first via local-first sync protocols.",
        "The architecture must explicitly feature a graph database for hyper-relational querying.",
        "Target extreme security researchers as the primary audience.",
        "Build this as an SDK that other developers implement, rather than a standalone app.",
        "The tool should actively destroy or prune bad/legacy data rather than just store it."
    ]
    chaos_salt = random.choice(salts)
    
    user = f"Project A Name: {pA.get('name')}\nProject A Domains: {pA.get('domains')}\nProject A README snippet: {pA.get('readme')[:500]}\n\nProject B Name: {pB.get('name')}\nProject B Domains: {pB.get('domains')}\nProject B README snippet: {pB.get('readme')[:500]}\n\nCHAOS CONSTRAINT: {chaos_salt}"
    
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
    uvicorn.run(app, host="0.0.0.0", port=8000)