# A-02 新增语音来源与验证

制作日期：2026-10-26（America/New_York）。新增 8 条中文提示与 CAP、MAP 两个英语全词；DOG、6 个字母音、6 个词卡例词及通用流程提示直接复用游戏现有资源。

## 声音一致性

中文沿用上一轮用户选定的合成 q-letter 参考声音。使用本地 MLX Audio 0.6.1、[Qwen3-TTS 0.6B Base](https://huggingface.co/mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16)（Apache-2.0），固定 revision `1eccf1cb2519b5a4e8a95b5f0544f3303568164f`。参考为原 Vivian 合成语音，不是新的真人声源。

参考 M4A SHA-256：`bea94b11ae121a53914840c3970bac0663427178f74171d4b096690d07e8dc66`；转换的 24 kHz 单声道 WAV SHA-256：`27d7d4bd2ff61e18af43d888fc4e604ea8b90f6ceb4e40715650d5d781e413a3`。参考原文：哪个是这个声音？先点一下听，再点一下选。

参数沿用 language=Chinese、temperature=0.5、top_p=0.8、top_k=20、repetition_penalty=1.5、max_tokens=260、seed=11053。保留 atempo=0.92；内部大于 360 ms 的静音缩为 260 ms，首尾 8 ms 淡入淡出。

英语全词沿用 [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)（Apache-2.0）的 af_heart 美式女声，speed=1.03。输入音素分别为 `kˈæp` 与 `mˈæp`。没有重生成或修改字母音。

## 交付与验证

AAC/M4A、24 kHz、单声道、目标 56 kbps；有声 RMS 约 -17 dBFS。每条最终 AAC 解码复测，采样峰值与 4 倍过采样峰值低于 -3 dBFS，首尾静音均不超过 150 ms。嵌入资源合并检查通过：157 条原有资产保持相同原值，仅增加 10 条；8 条中文文案仅增加新键。

TTS、英语 TTS、ASR 模型顺序运行。Whisper large-v3-turbo 无原文提示逐条识别最终 AAC，识别记录绑定文件 SHA-256。6 条逐字归一匹配、1 条只有“它们/他们”同音替换、3 条存在“啦/了”语气词差异；Whisper small 复核也保留了正确的关卡名称与教学内容。CAP、MAP 均识别正确。语气词差异不影响指令含义；这些是机器转写验证，不代表人工逐字验听。

| key | 文案 | 秒 | 有声 RMS | 采样峰值 | 4× 峰值 |
|---|---|---:|---:|---:|---:|
| cap | cap | 0.467 | -17.05 | -3.99 | -3.95 |
| map | map | 0.509 | -17.02 | -5.07 | -5.07 |
| arrive-l02 | 欢迎来到寻宝星球！ | 1.533 | -17.09 | -5.72 | -5.64 |
| done-l01-next | 太棒啦！字母星球完成啦！寻宝星球亮起来了，点它就能飞过去。 | 5.843 | -17.03 | -3.83 | -3.83 |
| done-l02 | 太棒啦！寻宝星球完成啦！猫星球亮起来了，点它就能飞过去。 | 5.373 | -17.05 | -3.86 | -3.77 |
| l02-intro | 六个新字母藏在这里。跟着金色光点，找到它们，一起去寻宝吧！ | 5.672 | -17.11 | -3.94 | -3.92 |
| l02-review | 上一颗星球学过的两个字母，也会来帮你拼词哦！ | 3.837 | -17.11 | -4.04 | -4.03 |
| reward-cap | 一顶棒球帽！戴上它，继续探险吧。 | 3.027 | -16.99 | -4.91 | -4.88 |
| reward-dog | 一只小狗跑出来啦！它会陪你一起探险。 | 3.283 | -17.08 | -3.74 | -3.42 |
| reward-map | 一张藏宝地图！展开它，看看上面的路线吧。 | 3.539 | -17.05 | -4.84 | -4.74 |

逐句编码参数与校验值在 `manifest.json`，识别记录在 `asr-all.json` 与 `asr-small-recheck.json`。

原始 WAV、生成脚本、参数、编码脚本、参考和完整日志：`/Users/mac/Documents/ChatGPT/星球/outputs/yaya-second-planet-voices-2026-10-26`。
