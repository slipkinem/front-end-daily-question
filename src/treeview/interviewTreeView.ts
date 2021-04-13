import {
	ProviderResult,
	Command,
	TreeItem,
	TreeDataProvider,
	Event,
	EventEmitter,
	window,
} from "vscode";
import * as vscode from "vscode";
import * as path from "path";
import { getProblemList } from "../service";
import { login } from "../command/login";
import { filterInvalidPath } from "../shared";

export class Interview implements TreeDataProvider<Question> {
	constructor(private context: vscode.ExtensionContext) {}

	private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();

	readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;
	getTreeItem(element: Question): TreeItem {
		return element;
	}
	getChildren(element?: Question): ProviderResult<Question[]> {
		return this.getQuestions();
	}

	refresh() {
		this._onDidChangeTreeData.fire(undefined);
	}

	async getQuestions() {
		// const a = new Question(`111`, '111', {
		//   command: "interview.openQuestion",
		//   title: "",
		//   arguments: [{ name: '1', type: 'md', content: '123', day_id: 1 }],
		// })
		try {
			let result = await getProblemList();
			let arr = result.data.map((ele, index) => {
				filterInvalidPath;
				return new Question(
					`${ele.day_id}.${filterInvalidPath(ele.name)}`,
					ele.publish_date,
					{
						command: "interview.openQuestion",
						title: "",
						arguments: [ele],
					},
					this.context,
					index === 0 ? true : false,
					ele.answered
				);
			});
			if (!this.context.globalState.get("login")) {
				vscode.window
					.showWarningMessage("请先点击此处登录", "登录")
					.then((result) => {
						if (result === "登录") {
							login(this.context);
						}
					});
			}
			return arr;
		} catch (e) {
			window.showErrorMessage("获取数据失败，请稍后刷新！");
			console.log(e);
		}
	}
}

export class Question extends TreeItem {
	constructor(
		public readonly label: string,
		public readonly date: string,
		public readonly command?: Command,
		public readonly context?: vscode.ExtensionContext,
		public readonly isNew: boolean = false,
		public readonly hasComplete: boolean = true
	) {
		super(label);
		this.tooltip = `${this.label}`;
		this.description = `${this.date}`;
	}

	public iconPath? = this.hasComplete
		? this.context?.asAbsolutePath(path.join("media", "checkcircle.svg"))
		: this.isNew
		? this.context?.asAbsolutePath(path.join("media", "new.svg"))
		: "";
}
