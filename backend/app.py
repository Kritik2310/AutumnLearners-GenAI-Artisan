import os
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS  
import json
import torch
import whisper
from transformers import pipeline
import soundfile as sf
import numpy as np
import noisereduce as nr
from keybert import KeyBERT


print("Initializing Flask app and loading AI models...")
app = Flask(__name__)
CORS(app) 


UPLOAD_FOLDER = 'uploads'
AUDIO_FOLDER = os.path.join(UPLOAD_FOLDER, 'audio')
DATA_FOLDER = os.path.join(UPLOAD_FOLDER, 'data')
os.makedirs(AUDIO_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)
app.config['AUDIO_FOLDER'] = AUDIO_FOLDER
app.config['DATA_FOLDER'] = DATA_FOLDER


device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")
torch_device = 0 if device == "cuda" else -1

#Models Loading
whisper_model = whisper.load_model("medium", device=device)
summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6", device=torch_device)
generator = pipeline("text2text-generation", model="google/flan-t5-large", device=torch_device)


print("All models loaded successfully!")


def dedupe_starting_name(text, name):
    words = text.split()
    if len(words) >= 2 and words[0].strip(",.?!") == words[1].strip(",.?!") and words[0].lower().strip() == name.lower().strip():
        return " ".join(words[1:])
    return text


def generate_structured_content(transcript):
    print("-> Generating structured content from transcript...")
    if len(transcript.split()) < 30:
        about_text = transcript
    else:
        summary_result = summarizer(transcript, max_length=100, min_length=25, do_sample=False)
        about_text = summary_result[0]['summary_text']
    print("   - 'About Text' generated.")


    name_prompt = f"From the following text, extract the artisan's first name. If a name is not mentioned, respond with 'Artisan'. Text: \"{transcript}\""
    artisan_name = generator(name_prompt, max_new_tokens=20)[0]['generated_text'].strip()
    print(f"   - Artisan Name extracted: {artisan_name}")


    about_text = dedupe_starting_name(about_text, artisan_name)


    description_prompt = f"""Act as a creative copywriter. Rewrite the artisan's transcript in a professional, first-person tone. Transcript: \"{transcript}\" """
    generation_params = {
        "max_new_tokens": 250,
        "num_beams": 4,
        "no_repeat_ngram_size": 2,
        "early_stopping": True
    }
    description = generator(description_prompt, **generation_params)[0]['generated_text']
    print("   - Creative 'Description' generated.")


    keywords_prompt = f"""Based on the following text, generate a list of 7 to 10 marketplace keywords (product type, material, style, uses). Comma separated. Text: \"{transcript + ' ' + description}\" """
    keywords_raw = generator(keywords_prompt, **generation_params)[0]['generated_text']
    keyword_list = [kw.strip() for kw in keywords_raw.split(',')]
    print("   - Marketplace 'Keywords' generated.")


    return {
        "artisan_name": artisan_name,
        "about_text": about_text,
        "description": description,
        "keywords": keyword_list
    }


@app.route('/process-audio-upload', methods=['POST'])
def process_audio_upload():
    if 'audio_file' not in request.files:
        return jsonify({"error": "Missing audio file", "success": False}), 400


    audio_file = request.files['audio_file']
    if audio_file.filename == '':
        return jsonify({"error": "No selected audio file", "success": False}), 400


    try:
        unique_id = str(uuid.uuid4())
        audio_filename = f"{unique_id}.wav"
        audio_filepath = os.path.join(app.config['AUDIO_FOLDER'], audio_filename)
        
        audio_file.save(audio_filepath)
        print(f"Saved uploaded audio as {audio_filepath}")
        
        file_data, samplerate = sf.read(audio_filepath)
        if isinstance(file_data, np.ndarray) and file_data.ndim > 1:
            file_data = np.mean(file_data, axis=1)
        if samplerate != 16000:
            import librosa
            file_data = librosa.resample(file_data, orig_sr=samplerate, target_sr=16000)
            samplerate = 16000
        sf.write(audio_filepath, file_data, samplerate)
        print("Normalized audio written to file")


        reduced_noise_audio = nr.reduce_noise(y=file_data, sr=samplerate)
        cleaned_filepath = os.path.join(app.config['AUDIO_FOLDER'], f"cleaned_{audio_filename}")
        sf.write(cleaned_filepath, reduced_noise_audio, samplerate)


        transcription_result = whisper_model.transcribe(cleaned_filepath, task="translate")
        transcript = transcription_result['text'].strip()
        detected_lang = transcription_result.get('language', '')
        os.remove(cleaned_filepath)
        print("Transcription complete")


        structured_content = generate_structured_content(transcript)
        
        final_data = {
            "id": unique_id,
            "transcript": transcript,
            "content": structured_content,
            "audio_path": audio_filepath
        }
        data_filepath = os.path.join(app.config['DATA_FOLDER'], f"{unique_id}.json")
        with open(data_filepath, 'w') as f:
            json.dump(final_data, f, indent=4)
        print("Data saved!")
        #Response to the frontend data
        response_data = {
            "success": True,
            "message": "Audio processed successfully",
            "id": unique_id,
            "artisanName": structured_content["artisan_name"],
            "aboutTxt": structured_content["about_text"],
            "storyTxt": structured_content["description"], 
            "description": structured_content["description"],
            "keywords": structured_content["keywords"],
            "tagline": "HANDMADE | ECO-FRIENDLY | HERITAGE",  
            "transcript": transcript
        }
        
        print("Response prepared for frontend")
        return jsonify(response_data), 200
        
    except Exception as e:
        import traceback
        print(" Exception in processing:", e)
        traceback.print_exc()
        return jsonify({
            "error": str(e), 
            "trace": traceback.format_exc(),
            "success": False
        }), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
