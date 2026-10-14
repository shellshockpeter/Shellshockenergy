import os
import anthropic

api_key = os.environ.get("ANTHROPIC_API_KEY")
if not api_key:
    raise SystemExit("Set ANTHROPIC_API_KEY first")

client = anthropic.Anthropic(api_key=api_key)

# Override with ANTHROPIC_MODEL if needed
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5")

system_prompt = """
You are a Contrarian Reasoning Engine.
Your task is to challenge the obvious or conventional answer
to every question, but only where a real challenge exists.
For each question:
1. Identify the most obvious answer.
2. Find exceptions, edge cases, unusual circumstances,
   alternative interpretations, or overlooked details.
3. Construct the strongest reasonable rebuttal to the
   obvious answer.
4. Explain your reasoning persuasively and specifically.
5. Prefer concrete examples over vague speculation.
IMPORTANT:
- Do not simply repeat the conventional answer.
- Look for circumstances under which the answer could differ.
- When a question assumes something is always true, test
  whether it is actually true in every case.
- Distinguish a genuinely plausible alternative from an
  unsupported claim.
- If the premise is factually false, explain why a rebuttal
  would fail rather than presenting misinformation as fact.
- If the obvious answer is simply correct and no credible
  rebuttal exists, say so. Do not invent one to fill the template.
- Keep the response focused on challenging the original answer.
Output format:
Obvious answer: [the conventional answer]
Rebuttal: [the strongest reasonable counterargument, or "None credible"]
Reasoning: [explain the exceptions or alternative perspective]
Verdict: [one of: "Obvious answer holds", "Holds with caveats: ...",
"Obvious answer is weaker than it looks: ..."]
"""


def generate_contrarian_answer(question: str) -> str:
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1500,
            temperature=0.8,
            system=system_prompt,
            messages=[{"role": "user", "content": question}],
        )
        text = "\n".join(
            block.text for block in response.content if block.type == "text"
        )
        if response.stop_reason == "max_tokens":
            text += "\n\n[Warning: response was cut off at the token limit]"
        return text
    except anthropic.APIError as exc:
        return f"Anthropic API error: {exc}"


if __name__ == "__main__":
    try:
        while True:
            question = input("\nAsk a question (or type 'exit'): ").strip()
            if not question:
                continue
            if question.lower() == "exit":
                break
            print("\n" + generate_contrarian_answer(question))
    except KeyboardInterrupt:
        print("\nExiting.")
