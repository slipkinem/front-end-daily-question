import axios from "axios";
import * as vscode from "vscode";
import { YQauth } from "./YQauth";
import * as path from "path";
const leftPad = require("left-pad");

export async function saveAnswer(
	document: vscode.TextDocument,
	content: string,
	context: vscode.ExtensionContext
) {
	if (!context.globalState.get("yuqueToken")) {
		vscode.window
			.showErrorMessage("请先获得语雀授权", "是", "否")
			.then((result) => {
				if (result === "是") {
					YQauth(context);
				}
			});
	} else {
		const yuqueToken = context.globalState.get("yuqueToken");
		const yuqueRepoId = context.globalState.get("yuqueRepoId");
		const { fileName } = document;
		const basename = path.basename(fileName);
		const dayId = basename.slice(0, basename.indexOf("."));

		try {
			await axios({
				method: "post",
				url: `https://www.yuque.com/api/v2/repos/${yuqueRepoId}/docs`,
				headers: {
					"X-Auth-Token": yuqueToken,
					"Content-Type": "application/x-www-form-urlencoded",
				},
				params: {
					title: basename.replace(".md", ""),
					slug: leftPad(dayId, 5, "0"),
					public: 0,
					body: content,
				},
			});
			vscode.window.showInformationMessage("保存成功");
		} catch (e) {
			vscode.window.showErrorMessage("保存失败");
		}
	}
}
