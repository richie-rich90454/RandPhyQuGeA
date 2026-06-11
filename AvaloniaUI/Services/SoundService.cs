using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;

namespace AvaloniaUI.Services;

/// <summary>
/// Plays simple sound effects for answer feedback using programmatic tone generation.
/// Uses the Windows winmm.dll PlaySound API for playback.
/// </summary>
public class SoundService
{
    private bool _isSoundEnabled;
    private GCHandle _pinnedHandle;
    private Timer? _unpinTimer;

    private static class Win32Native
    {
        [DllImport("winmm.dll")]
        public static extern bool PlaySound(byte[] pszSound, IntPtr hmod, uint fdwSound);
    }

    private const uint SND_MEMORY = 0x04;
    private const uint SND_ASYNC = 0x01;

    public SoundService(bool isSoundEnabled)
    {
        _isSoundEnabled = isSoundEnabled;
    }

    public bool IsSoundEnabled
    {
        get => _isSoundEnabled;
        set => _isSoundEnabled = value;
    }

    public void PlayCorrect()
    {
        if (!_isSoundEnabled) return;
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) return;

        var wavData = GenerateTone(880, 120, 0.4);
        PlayPinned(wavData);
    }

    public void PlayIncorrect()
    {
        if (!_isSoundEnabled) return;
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) return;

        var wavData = GenerateTone(330, 200, 0.35);
        PlayPinned(wavData);
    }

    private void PlayPinned(byte[] wavData)
    {
        // Free any previously pinned handle before pinning new data
        FreePinnedHandle();

        _pinnedHandle = GCHandle.Alloc(wavData, GCHandleType.Pinned);

        Win32Native.PlaySound(wavData, IntPtr.Zero, SND_MEMORY | SND_ASYNC);

        // Schedule cleanup after playback should be finished
        _unpinTimer = new Timer(_ => FreePinnedHandle(), null, 2000, Timeout.Infinite);
    }

    private void FreePinnedHandle()
    {
        _unpinTimer?.Dispose();
        _unpinTimer = null;

        if (_pinnedHandle.IsAllocated)
        {
            _pinnedHandle.Free();
        }
    }

    private static byte[] GenerateTone(int frequency, int durationMs, double volume)
    {
        const int sampleRate = 22050;
        const int bitsPerSample = 16;
        const int channels = 1;

        int numSamples = sampleRate * durationMs / 1000;
        int dataSize = numSamples * channels * (bitsPerSample / 8);

        using var ms = new MemoryStream(44 + dataSize);
        using var writer = new BinaryWriter(ms);

        // RIFF header
        writer.Write(new byte[] { (byte)'R', (byte)'I', (byte)'F', (byte)'F' });
        writer.Write(36 + dataSize);
        writer.Write(new byte[] { (byte)'W', (byte)'A', (byte)'V', (byte)'E' });

        // fmt chunk
        writer.Write(new byte[] { (byte)'f', (byte)'m', (byte)'t', (byte)' ' });
        writer.Write(16);
        writer.Write((short)1); // PCM
        writer.Write((short)channels);
        writer.Write(sampleRate);
        writer.Write(sampleRate * channels * (bitsPerSample / 8));
        writer.Write((short)(channels * (bitsPerSample / 8)));
        writer.Write((short)bitsPerSample);

        // data chunk
        writer.Write(new byte[] { (byte)'d', (byte)'a', (byte)'t', (byte)'a' });
        writer.Write(dataSize);

        for (int i = 0; i < numSamples; i++)
        {
            double t = (double)i / sampleRate;
            double fade = 1.0;
            if (i < numSamples * 0.1) fade = i / (numSamples * 0.1);
            if (i > numSamples * 0.7) fade = (numSamples - i) / (numSamples * 0.3);

            double sample = Math.Sin(2 * Math.PI * frequency * t) * fade * volume;
            short pcm = (short)(sample * short.MaxValue);
            writer.Write(pcm);
        }

        writer.Flush();
        return ms.ToArray();
    }
}
