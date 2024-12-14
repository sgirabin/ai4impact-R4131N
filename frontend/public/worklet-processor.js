class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    if (input) {
      const channelData = input[0];
      this.port.postMessage(channelData); // Send audio data to main thread
    }
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
