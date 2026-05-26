import { createInterface, type Interface } from 'readline';

let rl: Interface | null = null;

function getReadline(): Interface {
  if (!rl) {
    rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return rl;
}

export function closePrompts(): void {
  if (rl) {
    rl.close();
    rl = null;
  }
}

export async function askQuestion(question: string): Promise<string> {
  const readline = getReadline();
  return new Promise((resolve) => {
    readline.question(question, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

export async function askYesNo(question: string, description?: string): Promise<boolean> {
  const fullQuestion = description
    ? `${question}\n${description}\n(y/n): `
    : `${question} (y/n): `;

  const answer = await askQuestion(fullQuestion);
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

export async function askSelect<T extends string>(
  question: string,
  options: { value: T; label: string; description?: string }[]
): Promise<T> {
  console.log(`\n${question}`);
  options.forEach((opt, index) => {
    const desc = opt.description ? ` - ${opt.description}` : '';
    console.log(`  ${index + 1}. ${opt.label}${desc}`);
  });

  const answer = await askQuestion('请选择 (输入序号): ');
  const index = parseInt(answer, 10) - 1;

  if (index >= 0 && index < options.length) {
    return options[index].value;
  }

  console.log('无效选择，默认选择第一个选项');
  return options[0].value;
}

export async function askInput(question: string, options?: { default?: string; validate?: (value: string) => boolean }): Promise<string> {
  const defaultHint = options?.default ? ` (默认: ${options.default})` : '';
  const answer = await askQuestion(`${question}${defaultHint}: `);

  if (!answer && options?.default) {
    return options.default;
  }

  if (options?.validate && !options.validate(answer)) {
    console.log('输入无效，请重新输入');
    return askInput(question, options);
  }

  return answer;
}

export async function askPassword(question: string): Promise<string> {
  const readline = getReadline();
  return new Promise((resolve) => {
    readline.question(question, (answer: string) => {
      resolve(answer.trim());
    });
    readline.write('');
  });
}
