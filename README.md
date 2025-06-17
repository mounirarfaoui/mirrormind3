# MirrorMind - Voice Emotion Analysis

MirrorMind is a web application that analyzes emotions from voice recordings using OpenAI's GPT-3.5 model. It provides real-time speech-to-text conversion and emotional analysis with actionable insights.

## Features

- Real-time voice recording
- Speech-to-text conversion
- Emotion analysis with intensity levels
- Actionable insights based on emotional content
- Modern and responsive UI

## Prerequisites

- Python 3.8 or higher
- OpenAI API key
- Modern web browser with microphone access

## Installation

1. Clone the repository:
```bash
git clone https://github.com/mounirarfaoui/mirrormind.git
cd mirrormind
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

## Usage

1. Start the Flask application:
```bash
python app.py
```

2. Open your web browser and navigate to `http://localhost:5000`

3. Click the microphone button to start recording
4. Speak your thoughts
5. Click the microphone again to stop recording
6. Click "Analyze Emotions" to get the emotional analysis

## Project Structure

```
mirrormind/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── static/
│   └── style.css      # CSS styles
└── templates/
    └── index.html     # Main HTML template
```

## Technologies Used

- Flask (Backend)
- OpenAI GPT-3.5 (Emotion Analysis)
- Web Speech API (Voice Recognition)
- HTML5/CSS3 (Frontend)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

# MirrorMind Frontend

This project is a responsive, emotionally safe self-awareness interface for MirrorMind, designed to help users explore their emotional state through voice or text.

## Features
- Soothing animated gradient background
- Elegant, rounded typography (Inter, Nunito, or Poppins)
- Microphone input with animated pulse
- Text input for thoughts/feelings
- Animated, accessible CTA button
- Emotional feedback card with icons and insights
- Animated transitions (Framer Motion)
- Light/dark mode toggle
- Mobile-friendly, calm, and safe UX

## Stack
- React
- Tailwind CSS
- Framer Motion
- lucide-react (icons)

## Getting Started

1. **Create the React app:**
   ```sh
   npx create-react-app mirrormind-frontend --template cra-template-pwa
   cd mirrormind-frontend
   ```
2. **Install dependencies:**
   ```sh
   npm install tailwindcss framer-motion lucide-react @headlessui/react @heroicons/react
   npx tailwindcss init -p
   ```
3. **Configure Tailwind:**
   - Replace the content of `tailwind.config.js` and add Tailwind to your CSS as per the [Tailwind docs](https://tailwindcss.com/docs/guides/create-react-app).
4. **Replace `src/App.js` and `src/App.css`** with the new UI code (to be provided).
5. **Run the app:**
   ```sh
   npm start
   ```

---

The next step is to generate the main React component and supporting files for the MirrorMind interface as described in your brief. 