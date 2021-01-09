import * as vscode from "vscode";
import { AbstractWebview, IWebviewOption } from "./AbstractWebview";
import { getAnswers, IGetAnswersRes } from "../service";
import * as MarkdownIt from "markdown-it";
export class AnswersWebview extends AbstractWebview {
	protected readonly viewType: string = "answers.preview";
	private answersRes: IGetAnswersRes | undefined;
	public md: MarkdownIt;
	constructor(private dayId: string) {
		super();
		this.md = new MarkdownIt({
			html: true,
			linkify: true,
			typographer: true,
		});
	}

	public async init(gitId: number) {
		this.answersRes = await getAnswers(this.dayId, gitId);
	}

	public show(): void {
		this.showWebviewInternal();
	}

	protected getWebviewOption(): IWebviewOption {
		return {
			title: `题目${this.dayId}答案`,
			viewColumn: vscode.ViewColumn.One,
			preserveFocus: true,
		};
	}

	protected getWebviewContent(): string {
		const defaultErrorMsg = "资源加载失败";
		if (!this.answersRes) return `<h2>${defaultErrorMsg}</h2>`;
		const {
			success,
			errorMsg = defaultErrorMsg,
			subject_name,
			subject_content,
			refer_answer,
			data,
		} = this.answersRes;
		if (!success) return `<h2>${errorMsg}</h2>`;
		let prefix = "";
		if (refer_answer === "仅限VIP查看") {
			prefix = `
            <h2>${subject_name}</h2>
            <blockquote>${subject_content}</blockquote>
            <h2>大家的答案：</h2>`;
		} else {
			prefix = `
            <h2>${subject_name}</h2>
            <blockquote>${subject_content}</blockquote>
            <h2>参考答案：</h2>
            <pre>${this.md.render(refer_answer)}</pre>
            <h2>大家的答案：</h2>`;
		}

		const list = data.map((it) => {
			return `<li><pre>${this.md.render(it.answer_content)}</pre></li>`;
		});

		const html = `<html>
            <head>
			<style>
				* {
					padding: 0;
					margin: 0;
				}
				h1, h2, h3, h4, h5, h6 {
					font-weight: 600;
					line-height: 1.7;
				}
				p {
					line-height: 1.7;
				}
                pre {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: flex-start;
					word-wrap: normal;
					padding: 16px;
                    overflow: auto;
					font-size: 16px;
					font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif;
                    background-color: #f6f8fa;
                    color: #2c3e50;
					border-radius: 3px; 
					margin-bottom: 16px;
                }
                blockquote {
                    padding: 10px;
                    color: #777;
                    border-left: 4px solid #ddd;
					margin-left: 0;
					margin-bottom: 16px;
                }
                ul { padding-left: 0; }
                li { list-style: none; }
            </style>
            </head>
                <body>
                    ${prefix}
                    <ul>${list.join("")}</ul>
                </body>
            </html>`;
		return html;
	}

	protected onDidDisposeWebview(): void {
		super.onDidDisposeWebview();
	}
}
