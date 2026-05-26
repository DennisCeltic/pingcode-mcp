import { createInterface } from 'readline';
let rl = null;
function getReadline() {
    if (!rl) {
        rl = createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }
    return rl;
}
export function closePrompts() {
    if (rl) {
        rl.close();
        rl = null;
    }
}
export async function askQuestion(question) {
    const readline = getReadline();
    return new Promise((resolve) => {
        readline.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}
export async function askYesNo(question, description) {
    const fullQuestion = description
        ? `${question}\n${description}\n(y/n): `
        : `${question} (y/n): `;
    const answer = await askQuestion(fullQuestion);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}
export async function askSelect(question, options) {
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
export async function askInput(question, options) {
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
export async function askPassword(question) {
    const readline = getReadline();
    return new Promise((resolve) => {
        readline.question(question, (answer) => {
            resolve(answer.trim());
        });
        readline.write('');
    });
}
//# sourceMappingURL=prompts.js.map