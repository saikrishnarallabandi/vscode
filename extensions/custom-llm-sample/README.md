# Custom LLM Sample

This sample extension demonstrates how to register a custom language model in VS Code's proposed `languageModelChat` API.

The extension exposes a provider that streams completions from OpenAI's Chat Completion API. Set the `OPENAI_API_KEY` environment variable before activating the extension.

```
export OPENAI_API_KEY=sk-...
```

Run `npm install` and `npm run compile` inside the extension folder to build it.
Then launch the extension using the VS Code Extension Host.
