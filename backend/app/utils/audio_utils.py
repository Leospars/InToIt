"""
Audio utilities for Gemini Live API integration
"""
import struct
from typing import Tuple

def validate_audio_format(audio_data: bytes, sample_rate: int = 16000, channels: int = 1, bit_depth: int = 16) -> Tuple[bool, str]:
    """
    Validate that audio data matches the expected format for Gemini Live API
    
    Args:
        audio_data: Raw audio bytes
        sample_rate: Expected sample rate (default: 16000 Hz for Gemini)
        channels: Expected number of channels (default: 1 for mono)
        bit_depth: Expected bit depth (default: 16 for PCM16)
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not audio_data:
        return False, "No audio data provided"
    
    # Check if audio data length is reasonable
    bytes_per_sample = bit_depth // 8
    expected_frame_size = channels * bytes_per_sample
    
    if len(audio_data) % expected_frame_size != 0:
        return False, f"Audio data length ({len(audio_data)}) is not a multiple of frame size ({expected_frame_size})"
    
    return True, "Audio format is valid"

def convert_to_pcm16(audio_data: bytes, source_format: str = "unknown") -> bytes:
    """
    Convert audio data to PCM16 format if needed
    
    Args:
        audio_data: Input audio bytes
        source_format: Source format description
    
    Returns:
        PCM16 formatted audio bytes
    """
    # For now, assume input is already PCM16
    # In a real implementation, you might need to handle different formats
    # like converting from float32, 24-bit, or different endianness
    
    if source_format == "pcm16_le":
        return audio_data
    elif source_format == "pcm16_be":
        # Convert big-endian to little-endian
        return audio_data[::-1]
    else:
        # Return as-is for unknown formats (might need conversion)
        return audio_data

def get_audio_metadata(audio_data: bytes) -> dict:
    """
    Extract basic metadata from audio data
    
    Args:
        audio_data: Raw audio bytes
    
    Returns:
        Dictionary with audio metadata
    """
    bytes_per_sample = 2  # 16-bit = 2 bytes
    channels = 1  # Mono
    sample_rate = 16000  # Default for Gemini
    
    duration_seconds = len(audio_data) / (sample_rate * channels * bytes_per_sample)
    
    return {
        "size_bytes": len(audio_data),
        "duration_seconds": duration_seconds,
        "sample_rate": sample_rate,
        "channels": channels,
        "bit_depth": 16,
        "format": "PCM16"
    }
