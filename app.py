from flask import Flask, request, render_template, jsonify
import openai
import os
import requests
import json
from datetime import datetime

app = Flask(__name__)
openai.api_key = "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"

# Set ElevenLabs API key directly (for demo only; use env var in production)
ELEVENLABS_API_KEY = "sk_1b360eba672a4f8942c727dff9a1d4ee486bde38e06b4a01"

APA_REFERENCES = {
    "shame": {
        "summary": "Shame is a painful feeling of humiliation or distress caused by the consciousness of wrong or foolish behavior. Addressing shame is important for self-acceptance and growth.",
        "url": "https://www.apa.org/topics/shame"
    },
    "anger": {
        "summary": "Anger is a natural emotion that can help us identify problems, but unmanaged anger can be harmful. Learning healthy ways to express anger is important for well-being.",
        "url": "https://www.apa.org/topics/anger"
    },
    "sadness": {
        "summary": "Sadness is a normal human emotion that can result from loss, disappointment, or helplessness. It is important to acknowledge and process sadness to maintain emotional health.",
        "url": "https://www.apa.org/topics/sadness"
    },
    "anxiety": {
        "summary": "Anxiety is characterized by feelings of tension, worried thoughts, and physical changes. It can be a normal reaction to stress, but persistent anxiety may require support.",
        "url": "https://www.apa.org/topics/anxiety"
    },
    "betrayal": {
        "summary": "Betrayal involves the violation of trust and can lead to feelings of hurt, anger, and confusion. Processing betrayal is important for emotional recovery.",
        "url": "https://www.apa.org/monitor/2017/01/cover-betrayal"
    },
    "guilt": {
        "summary": "Guilt is an emotional experience that occurs when a person believes they have compromised their own standards of conduct. Healthy guilt can motivate positive change.",
        "url": "https://www.apa.org/monitor/2019/06/ce-corner-guilt"
    },
    "resentment": {
        "summary": "Resentment is a feeling of anger or displeasure about someone or something unfair. Addressing resentment can help improve relationships and emotional well-being.",
        "url": "https://www.apa.org/monitor/2017/01/cover-betrayal"
    }
}

# File to store conversations
CONVERSATIONS_FILE = 'conversations.json'

def load_conversations():
    try:
        with open(CONVERSATIONS_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_conversations(conversations):
    with open(CONVERSATIONS_FILE, 'w') as f:
        json.dump(conversations, f, indent=2)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        transcript = request.form.get("transcript", "").strip()
        if not transcript:
            return jsonify({"error": "No transcript provided. Please speak and/or edit your text before analyzing."}), 400
        text = transcript.lower()

        # Local emotion analysis using keyword matching
        emotions = {
            "anger": ["angry", "mad", "furious", "irritated", "frustrated", "rage", "hate"],
            "sadness": ["sad", "depressed", "lonely", "hopeless", "grief", "sorrow", "melancholy"],
            "anxiety": ["anxious", "worried", "nervous", "stressed", "fear", "panic", "uneasy"],
            "joy": ["happy", "excited", "joyful", "elated", "thrilled", "ecstatic", "pleased"],
            "love": ["love", "affection", "care", "fond", "adore", "cherish", "devoted"],
            "guilt": ["guilty", "ashamed", "remorse", "regret", "blame", "responsible"],
            "gratitude": ["thankful", "grateful", "appreciate", "blessed", "fortunate"],
            "hope": ["hopeful", "optimistic", "positive", "confident", "encouraged"]
        }

        detected_emotions = []
        for emotion, keywords in emotions.items():
            if any(keyword in text for keyword in keywords):
                detected_emotions.append(emotion)

        # Generate insight based on detected emotions
        if detected_emotions:
            insight = f"I notice you're experiencing {', '.join(detected_emotions)}. These are natural human emotions. "
            if "anger" in detected_emotions:
                insight += "When feeling angry, it's helpful to take deep breaths and identify what's triggering this emotion. "
            if "sadness" in detected_emotions:
                insight += "Sadness often signals a need for comfort or change. Be gentle with yourself during difficult times. "
            if "anxiety" in detected_emotions:
                insight += "Anxiety can be overwhelming. Try grounding techniques like focusing on your breath or surroundings. "
            if "joy" in detected_emotions:
                insight += "It's wonderful to feel joy! Savor these positive moments and let them fill your heart. "
            if "love" in detected_emotions:
                insight += "Love is a powerful emotion that connects us to others and ourselves. "
            if "guilt" in detected_emotions:
                insight += "Guilt can be a sign of growth and conscience. Consider what you can learn from this feeling. "
            if "gratitude" in detected_emotions:
                insight += "Gratitude is linked to greater well-being. Keep nurturing this positive perspective. "
            if "hope" in detected_emotions:
                insight += "Hope is a beautiful emotion that helps us persevere through challenges. "
        else:
            insight = "I'm here to listen. Your feelings are valid, whatever they may be. Sometimes putting words to our emotions can help us understand ourselves better."

        # Check for APA references
        detected_emotion = None
        for emotion in APA_REFERENCES:
            if emotion in text:
                detected_emotion = emotion
                break

        result_json = {"result": insight}
        if detected_emotion:
            result_json["apa_reference"] = APA_REFERENCES[detected_emotion]
        return jsonify(result_json)
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

@app.route('/transcribe', methods=['POST'])
def transcribe():
    audio = request.files['audio']
    api_key = ELEVENLABS_API_KEY
    if not api_key:
        return jsonify({'error': 'ElevenLabs API key not set.'}), 500
    audio_bytes = audio.read()
    response = requests.post(
        'https://api.elevenlabs.io/v1/speech-to-text',
        headers={'xi-api-key': api_key},
        files={'audio': (audio.filename, audio_bytes, 'audio/wav')}
    )
    if response.status_code != 200:
        return jsonify({'error': 'Transcription failed.', 'details': response.text}), 500
    transcript = response.json().get('text', '')
    return jsonify({'transcript': transcript})

@app.route('/save-conversation', methods=['POST'])
def save_conversation():
    try:
        data = request.json
        conversations = load_conversations()
        
        conversation = {
            'id': len(conversations) + 1,
            'timestamp': datetime.now().isoformat(),
            'transcript': data.get('transcript', ''),
            'analysis': data.get('analysis', ''),
            'emotions': data.get('emotions', [])
        }
        
        conversations.append(conversation)
        save_conversations(conversations)
        
        return jsonify({'success': True, 'id': conversation['id']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-conversations')
def get_conversations():
    try:
        conversations = load_conversations()
        return jsonify(conversations)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/delete-conversation/<int:conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    try:
        conversations = load_conversations()
        conversations = [conv for conv in conversations if conv['id'] != conversation_id]
        save_conversations(conversations)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
