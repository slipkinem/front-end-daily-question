import * as vscode from "vscode";
import { AnswersWebview } from "../webview/AnswersWebview";
import { getDayId } from "../utils/getDayId";
import { instance } from "../service";
import { login } from "./login";

export async function openAnswer(
	document: vscode.TextDocument,
	context: vscode.ExtensionContext
): Promise<void> {
	if (!context.globalState.get("login")) {
		vscode.window
			.showWarningMessage("请先点击此处登录", "登录")
			.then((result) => {
				if (result === "登录") {
					login(context);
				}
			});
		return;
	}

	const dayId = getDayId(document.fileName);
	if (!+dayId) {
		vscode.window.showErrorMessage("问题id不存在");
		return;
	}

	const { account } = await vscode.authentication.getSession(
		"github",
		["user:email"],
		{ createIfNone: true }
	);
	const gitLabel = account.label;
	const gitId = Number(account.id);
	const { hasSelfAnswer }: { hasSelfAnswer: boolean } = await instance.get(
		`/api/searchHasSelfAnswer`,
		{ params: { gitId, dayId } }
	);
	if (!hasSelfAnswer) {
		vscode.window.showWarningMessage("提交自己的回答后才可以查看题解", {
			modal: true,
		});
		return;
	}

	const answersWebview: AnswersWebview = new AnswersWebview(dayId);
	await answersWebview.init(gitId);
	answersWebview.show();
	return;
}
