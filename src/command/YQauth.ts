import axios from "axios";
import * as vscode from "vscode";
import { instance } from "../service";
import { uuid } from "../utils/uuid";
const crypto = require("crypto");

export async function YQauth(context: vscode.ExtensionContext): Promise<void> {
	if (!context.globalState.get("yuqueToken")) {
		const code = uuid();
		// const code = "LO9QK8yJ0RXzeZLAbolrp6BjIew0BxbV7WeHUXUF";

		const client_id = "kDwJenQd9Kwj6n4FnKZG";

		// const response_type = "code";

		// const scope = "doc%2Crepo";

		const timestamp = `${+new Date()}`;

		const signString = `client_id=${client_id}&code=${code}&response_type=code&scope=doc%2Crepo&timestamp=${timestamp}`;

		const sign = encodeURI(
			crypto
				.createHmac("sha1", "J19ota3jsqZYNU8R8XfuW4so1ZptGbS2WUiBnn9H")
				.update(signString)
				.digest()
				.toString("base64")
		);

		vscode.env.openExternal(
			vscode.Uri.parse(
				`https://www.yuque.com/oauth2/authorize?${signString}&sign=${sign}`
			)
		);

		let interval: NodeJS.Timeout;

		const searchYQ = async () => {
			const res = await axios({
				method: "post",
				url: `https://www.yuque.com/oauth2/token`,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				params: {
					client_id,
					code,
					grant_type: "client_code",
				},
			});

			const data = res && res.data;
			const access_token = data.access_token;
			if (access_token) {
				clearInterval(interval);
				context.globalState.update("yuqueToken", access_token);
				vscode.window.showInformationMessage(
					"您已通过语雀的授权，可以一键保存了"
				);
				const userRes = await axios({
					method: "get",
					url: `https://www.yuque.com/api/v2/user`,
					headers: {
						"X-Auth-Token": access_token,
					},
				});
				let userId = userRes?.data?.id;
				!userId ? (userId = userRes?.data?.data?.id) : null;
				const repoRes = await axios({
					method: "post",
					url: `https://www.yuque.com/api/v2/users/${userId}/repos`,
					headers: {
						"X-Auth-Token": access_token,
						"Content-Type": "application/x-www-form-urlencoded",
					},
					params: {
						name: "题库",
						slug: "zftk",
						public: 0,
					},
				});
				let repoId = repoRes?.data?.id;
				!repoId ? (repoId = repoRes?.data?.data?.id) : null;
				repoId ? context.globalState.update("yuqueRepoId", repoId) : null;
			}
		};
		interval = setInterval(searchYQ, 1500);

		setTimeout(() => {
			clearInterval(interval);
		}, 90000);
	} else {
		vscode.window
			.showInformationMessage("您已通过语雀的授权", "好的", "删除授权")
			.then((result) => {
				if (result === "删除授权") {
					vscode.window
						.showWarningMessage(
							"确定要删除授权么",
							{
								modal: true,
							},
							"否",
							"是"
						)
						.then((result) => {
							if (result === "是") {
								context.globalState.update("yuqueToken", undefined);
							}
						});
				}
			});
	}

	return;
}
