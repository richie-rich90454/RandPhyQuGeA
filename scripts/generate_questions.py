#!/usr/bin/env python3
import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

def generate_kinematics_question():
    a = round(random.uniform(1.0, 10.0), 1)
    t = random.randint(1, 5)
    answer = 0.5 * a * t * t
    return {
        "topic": "kinematics",
        "question": f"An object accelerates from rest at {a} m/s² for {t} seconds. How far does it travel (in meters)?",
        "answer": round(answer, 2),
        "explanation": f"Using s = ½at² = 0.5 × {a} × {t}² = {round(answer, 2)} m."
    }

def generate_dynamics_question():
    mass = round(random.uniform(1.0, 10.0), 1)
    force = round(random.uniform(5.0, 20.0), 1)
    answer = force / mass
    return {
        "topic": "dynamics",
        "question": f"A {mass} kg object is pushed with a force of {force} N. What is its acceleration (m/s²)?",
        "answer": round(answer, 2),
        "explanation": f"Using F = ma, a = F/m = {force} / {mass} = {round(answer, 2)} m/s²."
    }

def generate_all_questions(count_per_topic=5):
    topics = {
        "kinematics": generate_kinematics_question,
        "dynamics": generate_dynamics_question,
    }
    questions = []
    for topic, func in topics.items():
        for _ in range(count_per_topic):
            questions.append(func())
    return questions

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate a static question bank.")
    parser.add_argument("--output", "-o", default="web/questions.json",
                        help="Output JSON file (default: web/questions.json)")
    parser.add_argument("--count", "-c", type=int, default=5,
                        help="Number of questions per topic (default: 5)")
    args = parser.parse_args()
    questions = generate_all_questions(args.count)
    output_path = Path(__file__).parent.parent / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(questions, f, indent=2)
    print(f"Generated {len(questions)} questions and saved to {output_path}")

if __name__ == '__main__':
    main()