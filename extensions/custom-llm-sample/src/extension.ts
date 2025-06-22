import * as vscode from 'vscode';
import { OpenAI } from 'openai';

class OpenAIBasedLLM {
    private client: OpenAI;

    constructor(apiKey: string, baseUrl?: string) {
        this.client = new OpenAI({ apiKey, baseURL: baseUrl });
    }

    async *send(messages: vscode.LanguageModelChatMessage[]): AsyncIterable<vscode.ChatResponseFragment2> {
        const res = await this.client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages.map(m => ({
                role: m.role === vscode.LanguageModelChatMessageRole.User ? 'user' : 'assistant',
                content: m.content.map(part => (part as any).value || '').join('')
            })),
            stream: true
        });
        for await (const chunk of res) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                yield { index: 0, part: new vscode.LanguageModelTextPart(content) };
            }
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
        console.warn('OPENAI_API_KEY not set');
        return;
    }
    const llm = new OpenAIBasedLLM(apiKey);
    const provider: vscode.LanguageModelChatProvider = {
        async provideLanguageModelResponse(messages, _options, _id, progress) {
            for await (const part of llm.send(messages)) {
                progress.report(part);
            }
            return undefined;
        },
        async provideTokenCount(text) {
            return text.toString().length / 4; // naive token count
        }
    };

    context.subscriptions.push(
        vscode.lm.registerChatModelProvider('custom-llm', provider, {
            name: 'Custom OpenAI LLM',
            vendor: 'custom',
            family: 'gpt-3.5-turbo',
            version: '1',
            maxInputTokens: 16000,
            maxOutputTokens: 4000,
            isUserSelectable: true,
            isDefault: false
        })
    );
}

export function deactivate() {}
