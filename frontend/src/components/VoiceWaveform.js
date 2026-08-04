import React, { useEffect, useRef } from 'react';
import './VoiceWaveform.css';

const VoiceWaveform = ({ isListening, volume }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Generate random waveform bars
        const bars = 40;
        const barWidth = (width - 20) / bars;

        const drawWaveform = (time) => {
            ctx.clearRect(0, 0, width, height);
            
            if (!isListening) {
                // Draw idle state
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                for (let i = 0; i < bars; i++) {
                    const x = 10 + i * (barWidth + 2);
                    const barHeight = 10 + Math.sin(time / 1000 + i * 0.5) * 5;
                    const y = (height - barHeight) / 2;
                    ctx.fillRect(x, y, barWidth, barHeight);
                }
                return;
            }

            // Active listening - draw animated waveform
            const baseVolume = volume || 0.5;
            ctx.fillStyle = '#764ba2';
            
            for (let i = 0; i < bars; i++) {
                const x = 10 + i * (barWidth + 2);
                // Create wave effect with random variation
                const wave = Math.sin(time / 200 + i * 0.3) * 0.3 + 0.7;
                const randomVariation = Math.sin(time / 300 + i * 0.7) * 0.2;
                const normalizedVolume = baseVolume * wave + randomVariation;
                const barHeight = 10 + (height - 20) * Math.max(0.1, normalizedVolume);
                const y = (height - barHeight) / 2;
                
                // Gradient color based on volume
                const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
                const hue = 260 + (1 - normalizedVolume) * 40;
                gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
                gradient.addColorStop(1, `hsl(${hue + 20}, 80%, 40%)`);
                ctx.fillStyle = gradient;
                
                ctx.fillRect(x, y, barWidth, barHeight);
            }
        };

        const animate = (timestamp) => {
            drawWaveform(timestamp);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate(0);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isListening, volume]);

    return (
        <canvas
            ref={canvasRef}
            className="voice-waveform"
            width={300}
            height={60}
        />
    );
};

export default VoiceWaveform;