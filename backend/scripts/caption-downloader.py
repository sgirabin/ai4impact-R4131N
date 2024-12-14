from pytube import YouTube

# YouTube video URL
video_url = "https://www.youtube.com/watch?v=Ok-xpKjKp2g"

# Create a YouTube object
yt = YouTube(video_url)

# Check if captions are available
if not yt.captions:
    print("No captions available for this video.")
else:
    # List available captions
    print("Available captions:")
    for caption in yt.captions:
        print(f"Language: {caption.code}")

    # Specify the desired caption language (e.g., 'en' for English)
    language_code = 'en'

    try:
        # Get the caption object
        caption = yt.captions[language_code]
        # Download the caption as an SRT file
        srt_text = caption.generate_srt_captions()
        with open("captions.srt", "w", encoding="utf-8") as file:
            file.write(srt_text)
        print("Captions downloaded successfully as 'captions.srt'")
    except KeyError:
        print(f"No captions available in the specified language: {language_code}")
