import { App } from "obsidian";

export async function processAiRequest(app: App, webContents: any, fileContent: string) {
	const fullPrompt = `Ниже предоставлен текст для анализа. Найди в нем блоки кода и проанализируй их. Результат верни СТРОГО в одном единственном блоке кода (markdown). Текст: \n ${fileContent}`.replace(/`/g, '\\`');

	// 1. Ввод текста и отправка (улучшенная имитация пользователя)
	await webContents.executeJavaScript(`
        (async function() {
            const input = document.querySelector('textarea') || document.querySelector('input[type="text"]') || document.querySelector('[contenteditable="true"]');
            
            if (input) {
                // Фокусируемся
                input.focus();
                
                // Вставляем текст через execCommand (это самый надежный способ "обмануть" React/Vue)
                document.execCommand('insertText', false, \`${fullPrompt}\`);
                
                // Генерируем события ввода вручную на случай, если execCommand не сработал
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));

                // Даем сайту 500мс "осознать" ввод перед кликом
                await new Promise(r => setTimeout(r, 500));

                const sendBtn = document.querySelector('button[data-testid*="send"]') || 
                                document.querySelector('button[aria-label*="Send"]') || 
                                document.querySelector('button[type="submit"]') ||
                                document.querySelector('svg[viewBox="0 0 24 24"]')?.closest('button'); // Часто кнопка - это просто иконка

                if (sendBtn && !sendBtn.disabled) {
                    sendBtn.click();
                } else {
                    // Если кнопку не нашли, жмем Enter
                    const enter = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: 13, key: 'Enter' });
                    input.dispatchEvent(enter);
                }
            }
        })();
    `);

	// 2. Ждем ответа (увеличим до 15 сек для сложных запросов)
	await new Promise(resolve => setTimeout(resolve, 15000));

	// 3. Извлекаем результат
	const result = await webContents.executeJavaScript(`
        (function() {
            const codeBlocks = document.querySelectorAll('pre');
            if (codeBlocks.length > 0) {
                // Берем последний блок и чистим его от лишних элементов (кнопок копирования внутри)
                const lastBlock = codeBlocks[codeBlocks.length - 1];
                const code = lastBlock.querySelector('code') || lastBlock;
                return code.innerText;
            }
            return null;
        })();
    `);

	if (result) {
		const fileName = `AI_Response_${Date.now()}.md`;
		await app.vault.create(fileName, result);
		console.log("Заметка создана: " + fileName);
	} else {
		console.error("Не удалось вытащить код. Возможно, AI еще не закончил или селектор 'pre' не подошел.");
	}
}
