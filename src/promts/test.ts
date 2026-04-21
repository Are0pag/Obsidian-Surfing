
export function createTestPromt(webContents: any) {
	const message = "Привет! Это сообщение из плагина Obsidian.";
	webContents.executeJavaScript(`
			(function() {
				// Пытаемся найти поле ввода (селекторы зависят от сайта)
				const input = document.querySelector('textarea') || document.querySelector('input[type="text"]');
				const sendButton = document.querySelector('button[type="submit"]') || document.querySelector('.send-button-class');
		
				if (input) {
					// Вставляем текст
					input.value = "${message}";
					input.dispatchEvent(new Event('input', { bubbles: true })); // Уведомляем React/Vue об изменениях
		
					// Вариант А: Нажимаем кнопку отправки
					if (sendButton) {
						sendButton.click();
					} 
					// Вариант Б: Имитируем нажатие Enter, если кнопки нет
					else {
						const enterEvent = new KeyboardEvent('keydown', {
							bubbles: true, cancelable: true, keyCode: 13, key: 'Enter'
						});
						input.dispatchEvent(enterEvent);
					}
				}
			})();
		`);
}
