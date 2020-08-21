import * as crypto from "crypto";
import { ExtensionContext, QuickPickItem, commands, window } from "vscode";
import { unlink, writeFile } from "fs";
import { ACCOUNT_FILE } from "../../constant";
import { AccountManager } from "../../manager";
import { LoggedIn } from "../../state";
import { MultiStepInput } from "../../util";
import { WebView } from "../../page";
import { i18n } from "../../i18n";

export function account(context: ExtensionContext): void {
  const webview = WebView.getInstance(context.extensionPath);

  context.subscriptions.push(
    commands.registerCommand("cloudmusic.account", async () => {
      enum Type {
        user,
        fm,
        search,
        userMusicRankingListWeekly,
        userMusicRankingListAllTime,
        signOut,
      }

      interface T extends QuickPickItem {
        type: Type;
      }

      const pick = await window.showQuickPick<T>([
        {
          label: AccountManager.nickname,
          description: i18n.word.user,
          type: Type.user,
        },
        {
          label: i18n.word.personalFm,
          type: Type.fm,
        },
        {
          label: i18n.word.search,
          type: Type.search,
        },
        {
          label: i18n.word.userRankingList,
          description: i18n.word.weekly,
          type: Type.userMusicRankingListWeekly,
        },
        {
          label: i18n.word.userRankingList,
          description: i18n.word.allTime,
          type: Type.userMusicRankingListAllTime,
        },
        {
          label: i18n.word.signOut,
          type: Type.signOut,
        },
      ]);
      if (!pick) {
        return;
      }
      if (pick.type === Type.user) {
        commands.executeCommand("cloudmusic.account");
      } else if (pick.type === Type.fm) {
        commands.executeCommand("cloudmusic.personalFM");
      } else if (pick.type === Type.search) {
        commands.executeCommand("cloudmusic.search");
      } else if (pick.type === Type.userMusicRankingListWeekly) {
        webview.userMusicRanking(
          "userMusicRankingListWeekly",
          `${pick.label} (${pick.description})`,
          1
        );
      } else if (pick.type === Type.userMusicRankingListAllTime) {
        webview.userMusicRanking(
          "userMusicRankingListAllTime",
          `${pick.label} (${pick.description})`,
          0
        );
      } else if (pick.type === Type.signOut) {
        commands.executeCommand("cloudmusic.signout");
      }
    })
  );

  context.subscriptions.push(
    commands.registerCommand("cloudmusic.signin", async () => {
      if (LoggedIn.get()) {
        return;
      }

      const title = i18n.word.signIn;
      const totalSteps = 3;

      type State = {
        phone: boolean;
        account: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        md5_password: string;
      };

      const state = {} as State;
      await MultiStepInput.run((input) => pickMethod(input));
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { phone, account, md5_password } = state;
      if (
        md5_password &&
        (await AccountManager.login(phone, account, md5_password))
      ) {
        writeFile(ACCOUNT_FILE, JSON.stringify(state), () => {
          //
        });
        window.showInformationMessage(i18n.sentence.success.signIn);
      } else {
        window.showErrorMessage(i18n.sentence.fail.signIn);
      }

      async function pickMethod(input: MultiStepInput) {
        const pick = await input.showQuickPick({
          title,
          step: 1,
          totalSteps,
          items: [
            {
              label: `✉ ${i18n.word.email}`,
              description: i18n.sentence.label.email,
              phone: false,
            },
            {
              label: `📱 ${i18n.word.cellphone}`,
              description: i18n.sentence.label.cellphone,
              phone: true,
            },
          ],
          placeholder: i18n.sentence.hint.signIn,
        });
        state.phone = pick.phone;
        return (input: MultiStepInput) => inputAccount(input);
      }

      async function inputAccount(input: MultiStepInput) {
        state.account = await input.showInputBox({
          title,
          step: 2,
          totalSteps,
          value: state.account,
          prompt: i18n.sentence.hint.account,
        });
        return (input: MultiStepInput) => inputPassword(input);
      }

      async function inputPassword(input: MultiStepInput) {
        const password = await input.showInputBox({
          title,
          step: 3,
          totalSteps,
          prompt: i18n.sentence.hint.password,
          password: true,
        });

        state.md5_password = crypto
          .createHash("md5")
          .update(password)
          .digest("hex");
      }
    })
  );

  context.subscriptions.push(
    commands.registerCommand("cloudmusic.dailyCheck", () => {
      AccountManager.dailySignin();
    })
  );

  context.subscriptions.push(
    commands.registerCommand("cloudmusic.signout", () => {
      if (AccountManager.logout()) {
        try {
          unlink(ACCOUNT_FILE, () => {
            //
          });
        } catch {}
      }
    })
  );
}