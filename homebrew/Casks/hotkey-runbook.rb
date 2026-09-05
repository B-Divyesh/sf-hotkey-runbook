cask "hotkey-runbook" do
  arch arm: "arm64", intel: "x86_64"

  version "0.1.15"
  sha256 arm:   "2ad189d192e6f961a40790428e836e972c00064a22b0f4cf3d925ccda224e1c4",
         intel: "3fd156d76291a0ed43ea21d6fdcb41347fdac391894b45501cec081f445bc0c2"

  url "https://github.com/B-Divyesh/sf-hotkey-runbook/releases/download/v#{version}/Hotkey-Runbook_#{version}_macos-#{arch}.dmg"
  name "Hotkey Runbook"
  desc "Keyboard-first local launcher for reviewed YAML runbooks"
  homepage "https://hotkey-runbook.sociobot.in"

  app "Hotkey Runbook.app"
end
