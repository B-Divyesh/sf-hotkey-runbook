cask "hotkey-runbook" do
  arch arm: "arm64", intel: "x86_64"

  version "0.1.13"
  sha256 arm:   "298eda635fbedf45583c6f1f77bd61a16304d13e8ab65cd68d7eed015bb40837",
         intel: "8a21fe81cbae5b7e1ebaae35e51d97a3ab467a4880fe5d708f67499bdc5f5c7f"

  url "https://github.com/B-Divyesh/sf-hotkey-runbook/releases/download/v#{version}/Hotkey-Runbook_#{version}_macos-#{arch}.dmg"
  name "Hotkey Runbook"
  desc "Keyboard-first local launcher for reviewed YAML runbooks"
  homepage "https://hotkey-runbook.sociobot.in"

  app "Hotkey Runbook.app"
end
