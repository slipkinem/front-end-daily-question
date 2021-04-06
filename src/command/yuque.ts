import * as vscode from "vscode";
/**
 * 同步语雀 https://www.yuque.com/yuque/developer/api
 * TODO:
 * 1. 登陆流程：判断是否有语雀 token 或者语雀 token 是否过期，提示前往语雀文档获取 token。
 * 2. 创建知识库，判断 workplace 里是否有对应知识库的参数，如果有通过知识库 id 判断，没有则创建。
 * 3. 单文件的时候完全覆盖旧文档or创建新文档。
 * 4. 一键全量同步，不对重复文件进行重复修改。
 * 后续：提供语雀同步到本地的能力
 * */
export async function yuque(
	document: vscode.TextDocument,
	content: string,
	context: vscode.ExtensionContext
): Promise<void> {
	return;
}
