# A · 苹果星球新语音来源

15 条中文提示，2026-10-27 生成，已打包进 `planet-a-assets.js`。

- **声音**：和其余中文提示同一个，用上一轮选定的 q-letter 合成参考音克隆。
- **模型**：MLX Audio 0.6.1 + Qwen3-TTS 12Hz 0.6B Base（Apache-2.0），本地 revision `1eccf1cb2519b5a4e8a95b5f0544f3303568164f`。
- **参数**：沿用 A-02 的设置：temperature 0.5、top_p 0.8、top_k 20、repetition_penalty 1.5、seed 11053。
- **后期**：沿用 A-02 的处理：atempo 0.92；句中超过 360 ms 的停顿缩成 260 ms；首尾各 8 ms 淡入淡出；有声部分统一到约 -17 dBFS，峰值不超过 -3 dBFS；输出 AAC 56 kbps、24 kHz、单声道。

生成脚本、原始 WAV、编码记录和语音识别核对都在 `../../yaya-planet-a-voices-2026-10-27/`。
