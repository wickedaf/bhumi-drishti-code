import io
import math
import struct
from typing import Optional

def generate_simple_tone_wav(duration_s: float = 2.0, freq: float = 440.0) -> bytes:
    """Generates a small valid WAV byte stream as fallback audio."""
    sample_rate = 16000
    num_samples = int(duration_s * sample_rate)
    buffer = io.BytesIO()

    # 44 byte WAV header
    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF',
        36 + num_samples * 2,
        b'WAVE',
        b'fmt ',
        16,  # Subchunk1Size
        1,   # AudioFormat (PCM)
        1,   # NumChannels (Mono)
        sample_rate,
        sample_rate * 2,  # ByteRate
        2,   # BlockAlign
        16,  # BitsPerSample
        b'data',
        num_samples * 2
    )
    buffer.write(header)

    for i in range(num_samples):
        # gentle envelope
        t = float(i) / sample_rate
        envelope = min(1.0, 5.0 * t) * min(1.0, 5.0 * (duration_s - t))
        val = int(12000 * envelope * math.sin(2.0 * math.pi * freq * t))
        buffer.write(struct.pack('<h', val))

    buffer.seek(0)
    return buffer.read()
