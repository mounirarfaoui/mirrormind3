let mediaRecorder, audioChunks = [];
const recordBtn = document.getElementById('recordBtn');
const micIcon = document.getElementById('micIcon');
const liveTranscript = document.getElementById('liveTranscript');
const liveText = document.getElementById('liveText');
const conversationList = document.getElementById('conversationList');
let isRecording = false;
let audioContext, analyser, microphone, dataArray, animationId;
let recognition;

// Load conversations on page load
document.addEventListener('DOMContentLoaded', loadConversations);

// New conversation button
document.getElementById('newConversationBtn').addEventListener('click', startNewConversation);

// Toggle sidebar button
document.getElementById('toggleSidebarBtn').addEventListener('click', toggleSidebar);

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleIcon = document.getElementById('toggleIcon');
    
    sidebar.classList.toggle('hidden');
    mainContent.classList.toggle('expanded');
    
    // Change icon based on sidebar state
    if (sidebar.classList.contains('hidden')) {
        toggleIcon.className = 'bi bi-chevron-right';
    } else {
        toggleIcon.className = 'bi bi-list';
    }
}

function startNewConversation() {
    document.getElementById('transcript').value = '';
    document.getElementById('result').innerHTML = '';
    document.getElementById('liveTranscript').style.display = 'none';
    
    // Remove active class from all conversation items
    document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
}

async function deleteConversation(conversationId, event) {
    event.stopPropagation(); // Prevent loading the conversation when clicking delete
    
    if (confirm('Are you sure you want to delete this conversation?')) {
        try {
            const response = await fetch(`/delete-conversation/${conversationId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                loadConversations(); // Reload the conversation list
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    }
}

async function loadConversations() {
    try {
        const response = await fetch('/get-conversations');
        const conversations = await response.json();
        displayConversations(conversations);
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

function displayConversations(conversations) {
    conversationList.innerHTML = '';
    conversations.reverse().forEach(conv => {
        const date = new Date(conv.timestamp).toLocaleDateString();
        const time = new Date(conv.timestamp).toLocaleTimeString();
        const preview = conv.transcript.substring(0, 50) + (conv.transcript.length > 50 ? '...' : '');
        
        const div = document.createElement('div');
        div.className = 'conversation-item p-2';
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1 conversation-content">
                    <div class="small text-light">${date} ${time}</div>
                    <div class="fw-bold text-white">${preview}</div>
                    <div class="small text-success">${conv.emotions.join(', ') || 'No emotions detected'}</div>
                </div>
                <button class="btn btn-sm delete-btn ms-2" onclick="deleteConversation(${conv.id}, event)">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        div.onclick = () => loadConversation(conv);
        conversationList.appendChild(div);
    });
}

function loadConversation(conversation) {
    document.getElementById('transcript').value = conversation.transcript;
    document.getElementById('result').innerHTML = `
        <div class='alert alert-success'><strong>Insight:</strong> ${conversation.analysis}</div>
    `;
    
    // Highlight selected conversation
    document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

async function saveConversation(transcript, analysis, emotions) {
    try {
        const response = await fetch('/save-conversation', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                transcript: transcript,
                analysis: analysis,
                emotions: emotions
            })
        });
        const data = await response.json();
        if (data.success) {
            loadConversations(); // Reload the conversation list
        }
    } catch (error) {
        console.error('Error saving conversation:', error);
    }
}

// Initialize speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        liveText.textContent = finalTranscript + interimTranscript;
        if (finalTranscript) {
            document.getElementById('transcript').value += finalTranscript + ' ';
        }
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
    };
}

function startTalkingAnimation() {
    recordBtn.classList.add('talking');
}
function stopTalkingAnimation() {
    recordBtn.classList.remove('talking');
}

async function monitorMic(stream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    dataArray = new Uint8Array(analyser.fftSize);

    function checkVolume() {
        analyser.getByteTimeDomainData(dataArray);
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            let val = (dataArray[i] - 128) / 128;
            sum += val * val;
        }
        let volume = Math.sqrt(sum / dataArray.length);
        if (volume > 0.05) {
            startTalkingAnimation();
        } else {
            stopTalkingAnimation();
        }
        animationId = requestAnimationFrame(checkVolume);
    }
    checkVolume();
}

function stopMicMonitor() {
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    stopTalkingAnimation();
}

recordBtn.addEventListener('click', async () => {
    if (!isRecording) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = async () => {
            stopMicMonitor();
            liveTranscript.style.display = 'none';
            if (recognition) {
                recognition.stop();
            }
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');
            // Send to Flask
            const res = await fetch('/transcribe', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.transcript) {
                document.getElementById('transcript').value = data.transcript;
            } else if (data.error) {
                alert('Transcription error: ' + data.error);
            }
        };
        mediaRecorder.start();
        isRecording = true;
        recordBtn.classList.add('recording');
        micIcon.classList.remove('bi-mic-fill');
        micIcon.classList.add('bi-stop-fill');
        liveTranscript.style.display = 'block';
        liveText.textContent = '';
        if (recognition) {
            recognition.start();
        }
        monitorMic(stream);
    } else {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.classList.remove('recording');
        micIcon.classList.remove('bi-stop-fill');
        micIcon.classList.add('bi-mic-fill');
        liveTranscript.style.display = 'none';
        if (recognition) {
            recognition.stop();
        }
        stopMicMonitor();
    }
});

// Handle form submission
const form = document.getElementById('analyzeForm');
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const transcript = document.getElementById('transcript').value;
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<div class="text-center">Analyzing...</div>';
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({transcript})
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            resultDiv.innerHTML = `<div class='alert alert-danger'>Server error: Received non-JSON response. Check console for details.</div>`;
            return;
        }
        
        const data = await response.json();
        if (data.error) {
            resultDiv.innerHTML = `<div class='alert alert-danger'>${data.error}</div>`;
        } else {
            let html = `<div class='alert alert-success'><strong>Insight:</strong> ${data.result}</div>`;
            if (data.apa_reference) {
                html += `<div class='card mt-3'><div class='card-body'><h5>APA Reference</h5><p>${data.apa_reference.summary}</p><a href='${data.apa_reference.url}' target='_blank'>Read more</a></div></div>`;
            }
            resultDiv.innerHTML = html;
            
            // Extract emotions from the analysis for saving
            const emotions = [];
            const emotionKeywords = ['anger', 'sadness', 'anxiety', 'joy', 'love', 'guilt', 'gratitude', 'hope'];
            emotionKeywords.forEach(emotion => {
                if (data.result.toLowerCase().includes(emotion)) {
                    emotions.push(emotion);
                }
            });
            
            // Save the conversation
            await saveConversation(transcript, data.result, emotions);
        }
    } catch (err) {
        console.error('Fetch error:', err);
        resultDiv.innerHTML = `<div class='alert alert-danger'>Error: ${err.message}</div>`;
    }
}); 