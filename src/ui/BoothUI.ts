export function showBoothUI(promptHandler: (prompt: string) => void) {
  const input = document.createElement('input');
  input.placeholder = 'Enter song prompt';
  const button = document.createElement('button');
  button.textContent = 'Generate';
  button.onclick = () => {
    promptHandler(input.value);
  };
  document.body.appendChild(input);
  document.body.appendChild(button);
}
