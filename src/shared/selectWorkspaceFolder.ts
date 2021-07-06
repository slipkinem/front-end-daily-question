import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { IQuickItemEx } from "../shared";
import { getWorkspaceConfiguration, getWorkspaceFolder } from "./settingUtils";

export async function selectWorkspaceFolder(): Promise<string> {
	let workspaceFolderSetting: string = getWorkspaceFolder();
	if (workspaceFolderSetting.trim() === "") {
		workspaceFolderSetting = await determineFEInterviewFolder();
		if (workspaceFolderSetting === "") {
			// User cancelled
			return workspaceFolderSetting;
		}
	}
	const workspaceFolders = vscode.workspace.workspaceFolders || [];
	let needAsk: boolean = true;
	for (const folder of workspaceFolders) {
		if (isSubFolder(folder.uri.fsPath, workspaceFolderSetting)) {
			needAsk = false;
		}
	}

	if (needAsk) {
		const choice: string | undefined = await vscode.window.showQuickPick(
			[
				OpenOption.justOpenFile,
				OpenOption.openInCurrentWindow,
				OpenOption.openInNewWindow,
				OpenOption.addToWorkspace,
			],
			{
				placeHolder:
					"当前窗口没有打开练习题的工作目录，请选择你的打开方式？（如果在对应目录里将不会提醒）",
			}
		);

		switch (choice) {
			case OpenOption.justOpenFile:
				return workspaceFolderSetting;
			case OpenOption.openInCurrentWindow:
				await vscode.commands.executeCommand(
					"vscode.openFolder",
					vscode.Uri.file(workspaceFolderSetting),
					false
				);
				return "";
			case OpenOption.openInNewWindow:
				await vscode.commands.executeCommand(
					"vscode.openFolder",
					vscode.Uri.file(workspaceFolderSetting),
					true
				);
				return "";
			case OpenOption.addToWorkspace:
				vscode.workspace.updateWorkspaceFolders(workspaceFolders.length, 0, {
					uri: vscode.Uri.file(workspaceFolderSetting),
				});
				break;
			default:
				return "";
		}
	}

	return workspaceFolderSetting;
}

export async function getActiveFilePath(
	uri?: vscode.Uri
): Promise<string | undefined> {
	let textEditor: vscode.TextEditor | undefined;
	if (uri) {
		textEditor = await vscode.window.showTextDocument(uri, { preview: false });
	} else {
		textEditor = vscode.window.activeTextEditor;
	}

	if (!textEditor) {
		return undefined;
	}
	if (textEditor.document.isDirty && !(await textEditor.document.save())) {
		vscode.window.showWarningMessage("Please save the solution file first.");
		return undefined;
	}
	return textEditor.document.uri.fsPath;
}

function isSubFolder(from: string, to: string): boolean {
	const relative: string = path.relative(from, to);
	if (relative === "") {
		return true;
	}
	return !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function determineFEInterviewFolder(): Promise<string> {
	let result: string;
	const picks: Array<IQuickItemEx<string>> = [];
	picks.push(
		{
			label: `Default location`,
			detail: `${path.join(os.homedir(), ".FEInterview")}`,
			value: `${path.join(os.homedir(), ".FEInterview")}`,
		},
		{
			label: "$(file-directory) Browse...",
			value: ":browse",
		}
	);
	const choice: IQuickItemEx<string> | undefined =
		await vscode.window.showQuickPick(picks, {
			placeHolder: "选择存放习题的工作目录",
		});
	if (!choice) {
		result = "";
	} else if (choice.value === ":browse") {
		const directory: vscode.Uri[] | undefined =
			await showDirectorySelectDialog();
		if (!directory || directory.length < 1) {
			result = "";
		} else {
			result = directory[0].fsPath;
		}
	} else {
		result = choice.value;
	}

	getWorkspaceConfiguration().update(
		"workspaceFolder",
		result,
		vscode.ConfigurationTarget.Global
	);

	return result;
}

function getBelongingWorkspaceFolderUri(
	fsPath: string | undefined
): vscode.Uri | undefined {
	let defaultUri: vscode.Uri | undefined;
	if (fsPath) {
		const workspaceFolder: vscode.WorkspaceFolder | undefined =
			vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fsPath));
		if (workspaceFolder) {
			defaultUri = workspaceFolder.uri;
		}
	}
	return defaultUri;
}

export async function showDirectorySelectDialog(
	fsPath?: string
): Promise<vscode.Uri[] | undefined> {
	const defaultUri: vscode.Uri | undefined =
		getBelongingWorkspaceFolderUri(fsPath);
	const options: vscode.OpenDialogOptions = {
		defaultUri,
		canSelectFiles: false,
		canSelectFolders: true,
		canSelectMany: false,
		openLabel: "Select",
	};
	return await vscode.window.showOpenDialog(options);
}

enum OpenOption {
	justOpenFile = "只打开习题文件不替换工作目录",
	openInCurrentWindow = "在当前窗口打开工作目录",
	openInNewWindow = "在新窗口打开工作目录",
	addToWorkspace = "添加新的习题目录",
}
