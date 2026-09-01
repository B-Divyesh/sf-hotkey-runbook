cask "hotkey-runbook" do
  arch arm: "arm64", intel: "x86_64"

  version "0.1.7"
  sha256 arm:   "ac095bf22e520da4864f12b8aed4d1537d9a867d24b88436ed90c6bd6d52a1ca",
         intel: "19161af2a193155e10419cd0b1c15a0a9c24f99b3759ebce552287878b7fd185"

  url "https://github.com/B-Divyesh/sf-hotkey-runbook/releases/download/v#{version}/Hotkey-Runbook_#{version}_macos-#{arch}.dmg"
  name "Hotkey Runbook"
  desc "Keyboard-first local launcher for reviewed YAML runbooks"
  homepage "https://hotkey-runbook.sociobot.in"

  app "Hotkey Runbook.app"
end
