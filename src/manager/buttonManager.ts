import { existsSync, readFileSync, writeFile } from "fs";
import { Command, StatusBarAlignment, StatusBarItem, window } from "vscode";
import { BUTTON_FILE } from "../constant/setting";
import { LoggedIn } from "../state/login";

enum ButtonLabel {
  account,
  previous,
  play,
  next,
  like,
  volume,
  song,
  lyric,
}

function getSetting(): boolean[] {
  try {
    if (existsSync(BUTTON_FILE)) {
      const { show } = JSON.parse(readFileSync(BUTTON_FILE, "utf8"));
      return show;
    }
  } catch {}
  return [true, true, true, true, true, true, true, false];
}

export class ButtonManager {
  private static buttons: StatusBarItem[] = [
    window.createStatusBarItem(StatusBarAlignment.Left, 0),
    window.createStatusBarItem(StatusBarAlignment.Left, -1),
    window.createStatusBarItem(StatusBarAlignment.Left, -2),
    window.createStatusBarItem(StatusBarAlignment.Left, -3),
    window.createStatusBarItem(StatusBarAlignment.Left, -4),
    window.createStatusBarItem(StatusBarAlignment.Left, -5),
    window.createStatusBarItem(StatusBarAlignment.Left, -6),
    window.createStatusBarItem(StatusBarAlignment.Left, -7),
  ];

  private static buttonShow = getSetting();
  private static buttonName = [
    "Account",
    "Previous",
    "Play",
    "Next",
    "Like",
    "Volume",
    "Song",
    "Lyric",
  ];

  static init(): void {
    this.updateButton(0, "$(account)", "Account", "cloudmusic.signin");
    this.updateButton(1, "$(chevron-left)", "Previous", "cloudmusic.previous");
    this.updateButton(2, "$(play)", "Play", "cloudmusic.play");
    this.updateButton(3, "$(chevron-right)", "Next", "cloudmusic.next");
    this.updateButton(4, "$(star)", "Like", "cloudmusic.like");
    this.updateButton(5, "$(unmute)", "Volume: 85", "cloudmusic.volume");
    this.updateButton(6, "Song", "", "cloudmusic.songDetail");
    this.updateButton(7, "Lyric", "", "cloudmusic.lyric");
    this.buttons[0].show();
  }

  private static updateButton(
    index: number,
    text: string,
    tooltip: string,
    command?: string | Command
  ): void {
    this.buttons[index].text = text;
    this.buttons[index].tooltip = tooltip;
    if (command) {
      this.buttons[index].command = command;
    }
  }

  static async toggle(): Promise<void> {
    const pick: { label: string; description: string; id: number }[] = [];
    for (let id = 1; id < this.buttons.length; ++id) {
      pick.push({
        label: this.buttonName[id],
        description: this.buttonShow[id] ? "show" : "hide",
        id,
      });
    }
    const button = await window.showQuickPick(pick, {
      placeHolder: "Set buton is showing or hidding",
    });
    if (!button) {
      return;
    }
    const { id } = button;
    this.buttonShow[id] = !this.buttonShow[id];
    if (LoggedIn.get()) {
      this.buttonShow[id] ? this.buttons[id].show() : this.buttons[id].hide();
    }
    writeFile(BUTTON_FILE, JSON.stringify({ show: this.buttonShow }), () => {
      //
    });
  }

  static clearButtonCommand(index: number): void {
    this.buttons[index].command = undefined;
  }

  static show(): void {
    for (let i = 1; i < this.buttons.length; ++i) {
      if (this.buttonShow[i]) {
        this.buttons[i].show();
      }
    }
  }

  static hide(): void {
    for (let i = 1; i < this.buttons.length; ++i) {
      this.buttons[i].hide();
    }
  }

  static buttonAccount(
    text: string,
    tooltip: string,
    command?: string | Command
  ): void {
    this.updateButton(ButtonLabel.account, text, tooltip, command);
  }

  static buttonPrevious(personalFm: boolean): void {
    personalFm
      ? this.updateButton(
          ButtonLabel.previous,
          "$(trash)",
          "Trash",
          "cloudmusic.fmTrash"
        )
      : this.updateButton(
          ButtonLabel.previous,
          "$(chevron-left)",
          "Previous",
          "cloudmusic.previous"
        );
  }

  static buttonPlay(playing: boolean): void {
    this.updateButton(
      ButtonLabel.play,
      playing ? "$(debug-pause)" : "$(play)",
      playing ? "Pause" : "PLay"
    );
  }

  static buttonLike(islike: boolean): void {
    this.updateButton(
      ButtonLabel.like,
      islike ? "$(star-full)" : "$(star)",
      islike ? "Unlike" : "Like"
    );
  }

  static buttonVolume(level: number): void {
    this.updateButton(ButtonLabel.volume, "$(unmute)", `Volume: ${level}`);
  }

  static buttonSong(name: string, ar: string): void {
    this.updateButton(
      ButtonLabel.song,
      name.length > 12 ? `${name.slice(0, 12)}...` : name,
      ar ? `${name} - ${ar}` : ""
    );
  }

  static buttonLyric(text: string): void {
    this.updateButton(ButtonLabel.lyric, text, "");
  }
}
